CREATE OR REPLACE FUNCTION public.legacy_login(p_identifier text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  idn text := public.app_norm_ident(p_identifier);
  v_id bigint;
  u public.users;
  prof jsonb;
  fails int;
  token text;
  maintenance jsonb;
  restriction jsonb;
  v_allowlist jsonb;
  v_allow_until timestamptz;
  v_is_qa_allowlisted boolean := false;
BEGIN
  IF idn = '' OR COALESCE(p_password, '') = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_fields');
  END IF;

  SELECT count(*) INTO fails
  FROM public.audit_logs
  WHERE action = 'login_failed'
    AND user_name = idn
    AND created_at > now() - interval '15 minutes';

  IF fails >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'too_many_attempts');
  END IF;

  v_id := public.app_find_user_id(idn);
  IF v_id IS NULL THEN
    PERFORM public.app_audit(NULL, idn, NULL, 'login_failed', 'user not found', 'failed');
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  SELECT * INTO u FROM public.users WHERE id = v_id;

  IF NOT public.app_verify_password(p_password, u.password) THEN
    PERFORM public.app_audit(u.id, idn, u.role, 'login_failed', 'wrong password', 'failed');
    RETURN jsonb_build_object('success', false, 'error', 'wrong_password');
  END IF;

  IF COALESCE(u.status, 'active') <> 'active' THEN
    PERFORM public.app_audit(u.id, idn, u.role, 'login_failed', 'user inactive', 'failed');
    RETURN jsonb_build_object('success', false, 'error', 'user_inactive');
  END IF;

  prof := public.app_profile(u.id);

  IF COALESCE(prof -> 'user' ->> 'role', '') <> 'creator' THEN
    maintenance := public.app_maintenance_state();

    IF COALESCE((maintenance ->> 'enabled')::boolean, true) THEN
      RETURN jsonb_build_object(
        'success', false, 'error', 'maintenance_mode',
        'maintenance_until', maintenance -> 'until',
        'maintenance_message', maintenance ->> 'message',
        'server_now', maintenance -> 'server_now'
      );
    END IF;

    restriction := public.user_login_restriction_state();

    IF COALESCE((restriction ->> 'enabled')::boolean, false) THEN
      SELECT setting_value::jsonb INTO v_allowlist
      FROM public.app_settings
      WHERE setting_key = 'user_login_test_allowlist'
        AND exchange_code IS NULL
      LIMIT 1;

      IF v_allowlist IS NOT NULL
         AND COALESCE((v_allowlist ->> 'enabled')::boolean, false) THEN
        v_allow_until := NULLIF(v_allowlist ->> 'until', '')::timestamptz;
        v_is_qa_allowlisted :=
          v_allow_until IS NOT NULL
          AND v_allow_until > now()
          AND COALESCE((v_allowlist -> 'user_ids') ? u.id::text, false);
      END IF;

      IF NOT v_is_qa_allowlisted THEN
        RETURN jsonb_build_object(
          'success', false, 'error', 'user_login_restricted',
          'restriction_until', restriction -> 'until',
          'restriction_message', restriction ->> 'message',
          'server_now', restriction -> 'server_now'
        );
      END IF;
    END IF;
  END IF;

  UPDATE public.users SET last_login = now() WHERE id = u.id;

  token := public.app_sign(jsonb_build_object(
    'uid', u.id::text,
    'r', prof -> 'user' ->> 'role',
    'ec', COALESCE(prof -> 'user' ->> 'exchange_code', ''),
    'exp', (extract(epoch from now()) * 1000)::bigint + 43200000
  ));

  PERFORM public.app_audit(u.id, u.full_name, u.role, 'login', 'User logged in (token auth)');

  RETURN jsonb_build_object(
    'success', true,
    'user', prof -> 'user',
    'exchange', prof -> 'exchange',
    'token', token
  );
END;
$function$;
