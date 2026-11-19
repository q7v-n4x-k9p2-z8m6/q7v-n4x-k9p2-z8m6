-- Allow only the two explicitly designated QA exchange accounts through the
-- global login restriction. Maintenance mode remains a hard block for everyone.
CREATE OR REPLACE FUNCTION public.app_claims()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  h text;
  payload jsonb;
  v_role text;
  v_restriction jsonb;
  v_allowlist jsonb;
  v_uid text;
  v_allow_until timestamptz;
BEGIN
  h := current_setting('request.headers', true);
  IF h IS NULL OR h = '' THEN
    RETURN NULL;
  END IF;

  payload := public.app_verify((h::json) ->> 'x-app-token');
  IF payload IS NULL THEN RETURN NULL; END IF;

  v_uid := payload ->> 'uid';

  SELECT role INTO v_role
  FROM public.users
  WHERE id = v_uid::bigint
    AND COALESCE(status, 'active') = 'active';

  IF NOT FOUND THEN RETURN NULL; END IF;

  IF COALESCE(v_role, '') <> 'creator' THEN
    IF public.app_maintenance_active() THEN RETURN NULL; END IF;

    v_restriction := public.user_login_restriction_state();

    IF COALESCE((v_restriction ->> 'enabled')::boolean, true) THEN
      SELECT setting_value::jsonb INTO v_allowlist
      FROM public.app_settings
      WHERE setting_key = 'user_login_test_allowlist'
        AND exchange_code IS NULL
      LIMIT 1;

      IF v_allowlist IS NULL
         OR NOT COALESCE((v_allowlist ->> 'enabled')::boolean, false) THEN
        RETURN NULL;
      END IF;

      v_allow_until := NULLIF(v_allowlist ->> 'until', '')::timestamptz;

      IF v_allow_until IS NULL OR v_allow_until <= now()
         OR NOT COALESCE((v_allowlist -> 'user_ids') ? v_uid, false) THEN
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  RETURN payload;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;

DO $block$
DECLARE
  v_restriction jsonb;
  v_until timestamptz;
BEGIN
  SELECT setting_value::jsonb INTO v_restriction
  FROM public.app_settings
  WHERE setting_key = 'user_login_restriction'
    AND exchange_code IS NULL
  LIMIT 1;

  IF v_restriction IS NULL
     OR NOT COALESCE((v_restriction ->> 'enabled')::boolean, false) THEN
    RAISE EXCEPTION 'global_login_restriction_not_active';
  END IF;

  v_until := NULLIF(v_restriction ->> 'until', '')::timestamptz;
  IF v_until IS NULL OR v_until <= now() THEN
    RAISE EXCEPTION 'global_login_restriction_has_no_future_expiry';
  END IF;

  INSERT INTO public.app_settings
    (setting_key, setting_value, setting_type, description, category,
     exchange_code, updated_by_name)
  VALUES
    ('user_login_test_allowlist',
     jsonb_build_object(
       'enabled', true,
       'user_ids', jsonb_build_array('107', '114'),
       'until', v_until,
       'purpose', 'Temporary QA-only exception for the two owner-designated test exchange accounts'
     )::text,
     'json',
     'Temporary allowlist for two designated QA exchange accounts; expires with global login restriction',
     'system',
     NULL,
     'QA scoped exception')
  ON CONFLICT (setting_key) DO UPDATE
    SET setting_value = EXCLUDED.setting_value,
        setting_type = EXCLUDED.setting_type,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        exchange_code = NULL,
        updated_by_name = EXCLUDED.updated_by_name,
        updated_at = now();
END;
$block$;

COMMENT ON FUNCTION public.app_claims()
IS 'Validates app session claims. Global login restriction blocks non-creator users except the explicitly time-limited QA allowlist; maintenance mode is never bypassed.';
