-- Harden all currently flagged public functions against mutable search_path.
-- The existing functions continue to use their current behavior; only name
-- resolution is pinned to trusted schemas.
ALTER FUNCTION public.app_b64url(bytea) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_ec() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_guard_exchanges() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_guard_users() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_is_admin() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_norm_ident(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_uid() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.app_unb64url(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_doc_number() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_exchange_code() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_order_number() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_ticket_number() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.auto_transfer_number() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.confirm_email_verification(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.edit_document_transaction(text, bigint, text, numeric, text, text, jsonb, text, bigint) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.enrich_audit_log() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_account_balance(text, text, text, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_next_doc_number(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.get_next_transfer_number(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.guard_demo_preview_record_update() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.mark_email_verified(text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.request_email_verification(text, text, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.reverse_document_transaction(text, bigint, text, text) SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.set_demo_preview_record_expiry() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.set_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.touch_wallet_on_transaction() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.update_group_member_count() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.update_updated_at() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.validate_idempotency_key() SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.validate_ledger_balance() SET search_path = public, extensions, pg_temp;

-- These legacy email-verification RPCs are not used by the current app.
-- The app uses Supabase Auth OTP directly. Keep them available only to trusted
-- server-side service_role calls, not to public or signed-in API clients.
REVOKE EXECUTE ON FUNCTION public.request_email_verification(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_email_verified(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_email_verification(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_email_verification(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_email_verified(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_email_verification(text) TO service_role;
