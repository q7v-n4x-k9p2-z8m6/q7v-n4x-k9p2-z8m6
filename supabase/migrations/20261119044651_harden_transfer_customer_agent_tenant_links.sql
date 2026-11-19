-- Enforce tenant-safe links from financial transfers to customers and agents.
-- Existing rows were checked before applying: linked customer/agent references
-- match the transfer tenant. Nullable customer_id remains nullable for legacy rows.
ALTER TABLE public.customers
  ADD CONSTRAINT customers_id_exchange_code_key
  UNIQUE (id, exchange_code);

ALTER TABLE public.origins
  ADD CONSTRAINT origins_id_exchange_code_key
  UNIQUE (id, exchange_code);

ALTER TABLE public.transfers
  ADD CONSTRAINT transfers_customer_exchange_fkey
  FOREIGN KEY (customer_id, exchange_code)
  REFERENCES public.customers (id, exchange_code)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT
  NOT VALID;

ALTER TABLE public.transfers
  VALIDATE CONSTRAINT transfers_customer_exchange_fkey;

ALTER TABLE public.transfers
  ADD CONSTRAINT transfers_agent_exchange_fkey
  FOREIGN KEY (agent_id, exchange_code)
  REFERENCES public.origins (id, exchange_code)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT
  NOT VALID;

ALTER TABLE public.transfers
  VALIDATE CONSTRAINT transfers_agent_exchange_fkey;

NOTIFY pgrst, 'reload schema';
