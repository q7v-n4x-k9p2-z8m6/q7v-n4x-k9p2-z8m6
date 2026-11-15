ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'not_verified';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_identity_status_check'
      AND conrelid = 'public.customers'::regclass
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_identity_status_check
      CHECK (identity_status IN ('not_verified', 'verified')) NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.customers
  VALIDATE CONSTRAINT customers_identity_status_check;

COMMENT ON COLUMN public.customers.identity_status IS
  'Simple customer identity review status for accounting records; not a banking KYC workflow.';

COMMENT ON COLUMN public.customers.identity_verified_at IS
  'Timestamp when the exchanger marked the customer identity details as reviewed.';
