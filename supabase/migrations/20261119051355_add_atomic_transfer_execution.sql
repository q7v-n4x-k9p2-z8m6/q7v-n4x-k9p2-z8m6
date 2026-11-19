CREATE OR REPLACE FUNCTION public.execute_transfer_transaction(
  p_exchange_code text,
  p_transfer_id bigint,
  p_pay_currency text,
  p_pay_amount numeric,
  p_pay_counter text,
  p_bank_account_id bigint DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_transfer public.transfers%ROWTYPE;
  v_user_id bigint;
  v_user_role text;
  v_user_name text;
  v_operation_id text;
  v_existing_doc_id bigint;
  v_doc_id bigint;
  v_doc_number text;
  v_bank_name text;
  v_account_id text;
  v_account_name text;
  v_lines jsonb;
  v_result json;
  v_ledger_count integer;
BEGIN
  v_user_id := public.app_uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_app_session';
  END IF;

  IF p_exchange_code IS NULL OR
     (NOT COALESCE(public.app_is_admin(), false)
      AND p_exchange_code IS DISTINCT FROM public.app_ec()) THEN
    RAISE EXCEPTION 'invalid_exchange_scope';
  END IF;

  SELECT role, full_name
    INTO v_user_role, v_user_name
  FROM public.users
  WHERE id = v_user_id
    AND COALESCE(status, 'active') = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'active_user_not_found';
  END IF;

  IF NOT COALESCE(public.app_is_admin(), false)
     AND v_user_role <> 'exchange' THEN
    RAISE EXCEPTION 'exchange_role_required';
  END IF;

  IF p_transfer_id IS NULL THEN
    RAISE EXCEPTION 'transfer_id_required';
  END IF;

  v_operation_id := 'transfer-execute:' || p_exchange_code || ':' || p_transfer_id::text;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_operation_id, 0));

  SELECT *
    INTO v_transfer
  FROM public.transfers
  WHERE id = p_transfer_id
    AND exchange_code = p_exchange_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer_not_found_in_exchange';
  END IF;

  IF v_transfer.status = 'cancelled' THEN
    RAISE EXCEPTION 'transfer_cancelled';
  END IF;

  IF p_pay_currency IS DISTINCT FROM v_transfer.currency THEN
    RAISE EXCEPTION 'payment_currency_must_match_transfer_currency';
  END IF;

  IF p_pay_amount IS NULL OR p_pay_amount <= 0
     OR p_pay_amount IS DISTINCT FROM v_transfer.amount THEN
    RAISE EXCEPTION 'payment_amount_must_match_full_transfer_amount';
  END IF;

  IF p_pay_counter NOT IN ('cash', 'bank') THEN
    RAISE EXCEPTION 'invalid_payment_counter';
  END IF;

  SELECT result_id
    INTO v_existing_doc_id
  FROM public.idempotency_keys
  WHERE client_operation_id = v_operation_id
    AND exchange_code = p_exchange_code
    AND table_name = 'documents'
  LIMIT 1;

  IF v_existing_doc_id IS NOT NULL THEN
    SELECT doc_number
      INTO v_doc_number
    FROM public.documents
    WHERE id = v_existing_doc_id
      AND exchange_code = p_exchange_code
      AND doc_type = 'transfer_execute'
      AND deleted = false;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'execution_idempotency_record_invalid';
    END IF;

    SELECT count(*)
      INTO v_ledger_count
    FROM public.ledger_entries
    WHERE document_id = v_existing_doc_id
      AND exchange_code = p_exchange_code
      AND transfer_id = p_transfer_id
      AND deleted = false;

    IF v_ledger_count <> 2 THEN
      RAISE EXCEPTION 'execution_ledger_incomplete';
    END IF;

    IF v_transfer.status = 'paid' AND
       (v_transfer.paid_amount IS DISTINCT FROM p_pay_amount OR
        v_transfer.paid_currency IS DISTINCT FROM p_pay_currency OR
        v_transfer.pay_counter IS DISTINCT FROM p_pay_counter) THEN
      RAISE EXCEPTION 'idempotency_payload_mismatch';
    END IF;

    UPDATE public.transfers
    SET status = 'paid',
        executed_date = COALESCE(executed_date, now()),
        paid_amount = COALESCE(paid_amount, p_pay_amount),
        paid_currency = COALESCE(paid_currency, p_pay_currency),
        pay_counter = COALESCE(pay_counter, p_pay_counter),
        updated_at = now()
    WHERE id = p_transfer_id
      AND exchange_code = p_exchange_code;

    RETURN json_build_object(
      'transfer_id', p_transfer_id,
      'document_id', v_existing_doc_id,
      'doc_number', v_doc_number,
      'idempotent', true
    );
  END IF;

  IF v_transfer.status = 'paid' THEN
    RAISE EXCEPTION 'transfer_already_paid_without_execution_document';
  END IF;

  IF p_pay_counter = 'bank' THEN
    IF p_bank_account_id IS NULL THEN
      RAISE EXCEPTION 'bank_account_required';
    END IF;

    SELECT bank_name
      INTO v_bank_name
    FROM public.bank_accounts
    WHERE id = p_bank_account_id
      AND exchange_code = p_exchange_code
      AND currency = p_pay_currency
      AND COALESCE(active, true) = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'bank_account_not_found_or_currency_mismatch';
    END IF;

    v_account_id := p_bank_account_id::text;
    v_account_name := v_bank_name;
  ELSE
    IF p_bank_account_id IS NOT NULL THEN
      RAISE EXCEPTION 'bank_account_not_allowed_for_cash_payment';
    END IF;

    v_account_id := p_pay_currency;
    v_account_name := 'صندوق';
  END IF;

  IF v_transfer.direction = 'send' THEN
    v_lines := jsonb_build_array(
      jsonb_build_object(
        'account_type', 'suspense',
        'account_id', p_transfer_id::text,
        'account_name', 'حواله در مسیر',
        'currency', p_pay_currency,
        'debit', p_pay_amount,
        'credit', 0,
        'description', 'تسویه بدهی حواله ارسالی',
        'line_no', 1
      ),
      jsonb_build_object(
        'account_type', p_pay_counter,
        'account_id', v_account_id,
        'account_name', v_account_name,
        'currency', p_pay_currency,
        'debit', 0,
        'credit', p_pay_amount,
        'description', 'پرداخت حواله از حساب پرداخت',
        'line_no', 2
      )
    );
  ELSIF v_transfer.direction = 'receive' THEN
    v_lines := jsonb_build_array(
      jsonb_build_object(
        'account_type', p_pay_counter,
        'account_id', v_account_id,
        'account_name', v_account_name,
        'currency', p_pay_currency,
        'debit', p_pay_amount,
        'credit', 0,
        'description', 'دریافت وجه حواله',
        'line_no', 1
      ),
      jsonb_build_object(
        'account_type', 'suspense',
        'account_id', p_transfer_id::text,
        'account_name', 'حواله در مسیر',
        'currency', p_pay_currency,
        'debit', 0,
        'credit', p_pay_amount,
        'description', 'تسویه طلب حواله دریافتی',
        'line_no', 2
      )
    );
  ELSE
    RAISE EXCEPTION 'invalid_transfer_direction';
  END IF;

  v_result := public.post_document_transaction(
    p_exchange_code,
    'transfer_execute',
    p_pay_currency,
    p_pay_amount,
    0,
    'transfer',
    p_transfer_id,
    v_transfer.transfer_number,
    'اجرای حواله ' || v_transfer.transfer_number,
    COALESCE(v_user_name, 'صراف'),
    v_lines,
    p_transfer_id,
    v_user_id,
    v_operation_id
  );

  v_doc_id := NULLIF(v_result->>'document_id', '')::bigint;

  IF v_doc_id IS NULL THEN
    RAISE EXCEPTION 'execution_document_not_created';
  END IF;

  UPDATE public.documents
  SET transfer_id = p_transfer_id
  WHERE id = v_doc_id
    AND exchange_code = p_exchange_code;

  UPDATE public.transfers
  SET status = 'paid',
      executed_date = now(),
      paid_amount = p_pay_amount,
      paid_currency = p_pay_currency,
      pay_counter = p_pay_counter,
      updated_at = now()
  WHERE id = p_transfer_id
    AND exchange_code = p_exchange_code
    AND status <> 'cancelled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transfer_status_update_failed';
  END IF;

  SELECT doc_number
    INTO v_doc_number
  FROM public.documents
  WHERE id = v_doc_id
    AND exchange_code = p_exchange_code;

  RETURN json_build_object(
    'transfer_id', p_transfer_id,
    'document_id', v_doc_id,
    'doc_number', v_doc_number,
    'idempotent', COALESCE((v_result->>'idempotent')::boolean, false)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.execute_transfer_transaction(text, bigint, text, numeric, text, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_transfer_transaction(text, bigint, text, numeric, text, bigint) TO anon, authenticated;
COMMENT ON FUNCTION public.execute_transfer_transaction(text, bigint, text, numeric, text, bigint)
IS 'Atomically executes a tenant transfer: validates payment, posts ledger lines, updates paid status, and enforces per-transfer idempotency.';
