-- ============================================================
-- حساب صراف — ساختار پایگاه داده (نسخهٔ نهایی مستند)
-- این فایل فقط مستندات است: هیچ اتصالی برقرار نمی‌کند و اجرا نشده است.
-- مبنا: reference/A1-source-package/02-database-structure.json
-- ستون‌های نشان‌دار «افزودهٔ بازسازی» از موجودیت‌های فعلی برنامه استخراج شده‌اند.
-- تولید: 2026-11-20T17:56:00.256Z
-- جدول‌ها: 62 · ستون‌ها: 895
-- ============================================================

-- ------------------------------------------------------------
-- support_tickets
-- موجودیت متناظر: SupportTicket · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id bigint NOT NULL DEFAULT nextval('support_tickets_id_seq'::regclass),
  user_id text,
  exchange_code text,
  ticket_number text NOT NULL,
  subject text NOT NULL,
  description text,
  category text DEFAULT 'general'::text,
  priority text DEFAULT 'normal'::text,
  status text NOT NULL DEFAULT 'open'::text,
  assigned_to text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- support_messages
-- موجودیت متناظر: SupportMessage · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id bigint NOT NULL DEFAULT nextval('support_messages_id_seq'::regclass),
  ticket_id bigint NOT NULL,
  sender_id text,
  sender_name text,
  message text NOT NULL,
  attachment_url text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- error_reports
-- موجودیت متناظر: ErrorReport · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.error_reports (
  id bigint NOT NULL DEFAULT nextval('error_reports_id_seq'::regclass),
  user_id text,
  exchange_code text,
  error_type text NOT NULL,
  error_message text,
  stack_trace text,
  device text,
  app_version text,
  status text NOT NULL DEFAULT 'new'::text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- user_feedback
-- موجودیت متناظر: UserFeedback · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id bigint NOT NULL DEFAULT nextval('user_feedback_id_seq'::regclass),
  user_id text,
  exchange_code text,
  type text NOT NULL DEFAULT 'suggestion'::text,
  message text NOT NULL,
  rating numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'new'::text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- safes  (افزوده‌های بازسازی: opening_value, note, is_demo)
-- موجودیت متناظر: Safe · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safes (
  id bigint NOT NULL DEFAULT nextval('safes_id_seq'::regclass),
  name text NOT NULL,
  currency text NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  exchange_code text,
  registered_by text,
  registered_by_user_id bigint,
  opening_value numeric DEFAULT 0,  -- افزودهٔ بازسازی
  note text,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.safes ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- users  (افزوده‌های بازسازی: exchange_id)
-- موجودیت متناظر: User
-- بدون معادل در لایهٔ اپ (حذف نشده): full_name, mobile, username, email, password, status, last_login
-- یادداشت: در نسخهٔ بازسازی، احراز هویت و مدیریت کاربران به بستر Base44 سپرده شده و موجودیت User فقط role و exchange_id را اعلام می‌کند.
-- یادداشت: ستون‌های password/username/last_login در ساختار اولیه باقی مانده‌اند و حذف نشده‌اند؛ استفادهٔ آن‌ها در بازسازی مستند نشده است.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name text NOT NULL,
  mobile text UNIQUE,
  username text UNIQUE,
  email text,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'customer'::text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  exchange_id text,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- exchanges
-- موجودیت متناظر: Exchange · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exchanges (
  id bigint NOT NULL DEFAULT nextval('exchanges_id_seq'::regclass),
  exchange_code text NOT NULL UNIQUE,
  exchange_name text NOT NULL,
  owner_user_id bigint,
  name text,
  mobile text,
  email text,
  country text,
  city text,
  status text NOT NULL DEFAULT 'active'::text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  referral_enabled boolean DEFAULT false,
  referral_code text,
  referral_count integer DEFAULT 0,
  paid_referral_count integer DEFAULT 0,
  referral_bonus_quota integer DEFAULT 0,
  trial_start_date date,
  plan character varying DEFAULT 'free'::character varying,
  payment_status character varying DEFAULT 'none'::character varying,
  paid_start_date date,
  paid_end_date date,
  quota_limit integer DEFAULT 100,
  quota_used integer DEFAULT 0,
  PRIMARY KEY (id)
);
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- customers  (افزوده‌های بازسازی: full_name, city, national_id, is_demo)
-- موجودیت متناظر: Customer · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id bigint NOT NULL DEFAULT nextval('customers_id_seq'::regclass),
  code text,
  name text NOT NULL,
  mobile text,
  email text,
  country text,
  exchange_code text,
  account_details text,
  description text,
  opening_balance numeric DEFAULT 0,
  balance_currency text DEFAULT 'AFN'::text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  customer_type text DEFAULT 'permanent'::text,
  tazkira_id text,
  phone text,
  customer_group text,
  notes text,
  locked boolean DEFAULT false,
  identity_status text NOT NULL DEFAULT 'not_verified'::text CHECK (identity_status = ANY (ARRAY['not_verified'::text, 'verified'::text])),
  identity_verified_at timestamp with time zone,
  full_name text,  -- افزودهٔ بازسازی
  city text,  -- افزودهٔ بازسازی
  national_id text,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- documents  (افزوده‌های بازسازی: date, status, customer_id, customer_name, counter_name, registered_by_name, base_value, reversed_of, is_demo)
-- موجودیت متناظر: Document · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id bigint NOT NULL DEFAULT nextval('documents_id_seq'::regclass),
  doc_number text NOT NULL,
  exchange_code text NOT NULL,
  doc_type text NOT NULL,
  amount numeric DEFAULT 0 CHECK (amount >= 0::numeric),
  currency text NOT NULL,
  fee numeric DEFAULT 0 CHECK (fee >= 0::numeric),
  related_type text NOT NULL DEFAULT 'none'::text,
  related_id bigint,
  related_name text,
  description text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted boolean DEFAULT false,
  deleted_date timestamp with time zone,
  deleted_by_name text,
  delete_note text,
  edited boolean DEFAULT false,
  edited_date timestamp with time zone,
  edit_note text,
  edited_by_name text,
  transfer_id bigint,
  reversed boolean DEFAULT false,
  reversed_date timestamp with time zone,
  reversed_by text,
  reverse_reason text,
  customer_phone text,
  customer_side text,
  counter_type text,
  counter_id text,
  counter_side text,
  pair_currency text,
  pair_amount numeric,
  rate numeric,
  fee_currency text,
  pair_tx_id bigint,
  client_operation_id text,
  date text,  -- افزودهٔ بازسازی
  status text DEFAULT "posted" CHECK (status IN ('posted', 'reversed')),  -- افزودهٔ بازسازی
  customer_id text,  -- افزودهٔ بازسازی
  customer_name text,  -- افزودهٔ بازسازی
  counter_name text,  -- افزودهٔ بازسازی
  registered_by_name text,  -- افزودهٔ بازسازی
  base_value numeric DEFAULT 0,  -- افزودهٔ بازسازی
  reversed_of text,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- transfers  (افزوده‌های بازسازی: customer_name, document_id, description, is_demo)
-- موجودیت متناظر: Transfer · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transfers (
  id bigint NOT NULL DEFAULT nextval('transfers_id_seq'::regclass),
  exchange_code text NOT NULL,
  transfer_number text NOT NULL,
  sender_name text NOT NULL,
  sender_phone text,
  sender_country text,
  receiver_name text NOT NULL,
  receiver_phone text,
  receiver_country text,
  account_owner text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL,
  origin text,
  status text NOT NULL DEFAULT 'done'::text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  fee numeric DEFAULT 0,
  fee_currency text,
  direction text,
  destination text,
  customer_id bigint,
  rate numeric,
  total numeric,
  agent_id bigint,
  agent_route text,
  executed_date timestamp with time zone,
  paid_amount numeric,
  paid_currency text,
  pay_counter text,
  tx_ids text,
  customer_name text,  -- افزودهٔ بازسازی
  document_id text,  -- افزودهٔ بازسازی
  description text,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- conversions
-- موجودیت متناظر: Conversion · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversions (
  id bigint NOT NULL DEFAULT nextval('conversions_id_seq'::regclass),
  exchange_code text NOT NULL,
  customer_id bigint,
  customer_name text NOT NULL,
  customer_mobile text,
  from_currency text NOT NULL,
  from_amount numeric NOT NULL CHECK (from_amount > 0::numeric),
  rate numeric NOT NULL CHECK (rate > 0::numeric),
  to_currency text NOT NULL,
  to_amount numeric NOT NULL CHECK (to_amount > 0::numeric),
  description text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- treasury_transactions
-- موجودیت متناظر: TreasuryTransaction · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treasury_transactions (
  id bigint NOT NULL DEFAULT nextval('treasury_transactions_id_seq'::regclass),
  exchange_code text NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  type text NOT NULL,
  description text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- bank_accounts  (افزوده‌های بازسازی: opening_balance, opening_value, note, is_demo)
-- موجودیت متناظر: BankAccount · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id bigint NOT NULL DEFAULT nextval('bank_accounts_id_seq'::regclass),
  exchange_code text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  currency text NOT NULL,
  balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  holder text,
  branch text,
  card_number text,
  sheba text,
  notes text,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  opening_balance numeric DEFAULT 0,  -- افزودهٔ بازسازی
  opening_value numeric DEFAULT 0,  -- افزودهٔ بازسازی
  note text,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- bank_transactions
-- موجودیت متناظر: BankTransaction · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id bigint NOT NULL DEFAULT nextval('bank_transactions_id_seq'::regclass),
  exchange_code text NOT NULL,
  bank_id bigint NOT NULL,
  bank_name text,
  account_number text,
  currency text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  type text NOT NULL,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- journal_entries
-- موجودیت متناظر: JournalEntry · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id bigint NOT NULL DEFAULT nextval('journal_entries_id_seq'::regclass),
  exchange_code text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  amount numeric DEFAULT 0 CHECK (amount >= 0::numeric),
  currency text,
  related_type text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- ledger_entries  (افزوده‌های بازسازی: doc_number, doc_type, date, side, amount, value, is_demo)
-- موجودیت متناظر: LedgerEntry · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id bigint NOT NULL DEFAULT nextval('ledger_entries_id_seq'::regclass),
  exchange_code text NOT NULL,
  type text,
  description text,
  debit numeric DEFAULT 0 CHECK (debit >= 0::numeric),
  credit numeric DEFAULT 0 CHECK (credit >= 0::numeric),
  currency text,
  related_type text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  document_id bigint,
  transfer_id bigint,
  account_type text NOT NULL DEFAULT 'suspense'::text,
  account_id text,
  account_name text,
  rate numeric,
  pair_entry_id bigint,
  doc_line_no integer DEFAULT 0,
  deleted boolean DEFAULT false,
  deleted_date timestamp with time zone,
  deleted_by_name text,
  edited boolean DEFAULT false,
  edited_date timestamp with time zone,
  edit_note text,
  doc_number text,  -- افزودهٔ بازسازی
  doc_type text,  -- افزودهٔ بازسازی
  date text,  -- افزودهٔ بازسازی
  side text CHECK (side IN ('debit', 'credit')),  -- افزودهٔ بازسازی
  amount numeric DEFAULT 0,  -- افزودهٔ بازسازی
  value numeric DEFAULT 0,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- rates
-- موجودیت متناظر: Rate · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rates (
  id bigint NOT NULL DEFAULT nextval('rates_id_seq'::regclass),
  exchange_code text NOT NULL,
  currency text NOT NULL,
  buy_rate numeric NOT NULL CHECK (buy_rate > 0::numeric),
  sell_rate numeric NOT NULL CHECK (sell_rate > 0::numeric),
  description text,
  mobile text,
  show_to_customer boolean DEFAULT true,
  show_to_anonymous boolean DEFAULT false,
  show_mobile boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sort_order integer DEFAULT 0,
  daily_rate numeric,
  decimals integer DEFAULT 2,
  symbol text,
  type text DEFAULT 'fiat'::text,
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  rate_date date,
  source text,
  PRIMARY KEY (id)
);
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- employees
-- موجودیت متناظر: Employee · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id bigint NOT NULL DEFAULT nextval('employees_id_seq'::regclass),
  exchange_code text NOT NULL,
  name text NOT NULL,
  show_profit_loss boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- origins  (افزوده‌های بازسازی: agent_id)
-- موجودیت متناظر: Origin · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.origins (
  id bigint NOT NULL DEFAULT nextval('origins_id_seq'::regclass),
  exchange_code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'origin'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text,
  city text,
  code text,
  notes text,
  agent_id numeric,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- rules
-- موجودیت متناظر: Rule · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rules (
  id bigint NOT NULL DEFAULT nextval('rules_id_seq'::regclass),
  title text NOT NULL,
  content text NOT NULL,
  role text NOT NULL DEFAULT 'all'::text,
  sort_order numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category text,
  link_url text,
  link_label text,
  icon text,
  accent text,
  pinned boolean DEFAULT false,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  PRIMARY KEY (id)
);
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- feature_settings
-- موجودیت متناظر: FeatureSetting · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_settings (
  id bigint NOT NULL DEFAULT nextval('feature_settings_id_seq'::regclass),
  feature_key text NOT NULL UNIQUE,
  feature_name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  message text,
  icon_name text,
  sort_order numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  exchange_code text,
  enabled boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  description text,
  is_primary boolean DEFAULT false,
  free_enabled boolean DEFAULT true,
  paid_enabled boolean DEFAULT true,
  level_1_enabled boolean NOT NULL DEFAULT true,
  level_2_enabled boolean NOT NULL DEFAULT true,
  level_3_enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (id)
);
ALTER TABLE public.feature_settings ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- app_settings
-- موجودیت متناظر: AppSetting · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  id bigint NOT NULL DEFAULT nextval('app_settings_id_seq'::regclass),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  setting_type text NOT NULL DEFAULT 'text'::text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  exchange_code text,
  category character varying DEFAULT 'general'::character varying,
  data jsonb,
  updated_by_name text,
  PRIMARY KEY (id)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- audit_logs  (افزوده‌های بازسازی: actor_name, actor_role, title, is_demo)
-- موجودیت متناظر: AuditLog · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint NOT NULL DEFAULT nextval('audit_logs_id_seq'::regclass),
  user_id bigint,
  registered_by_user_id bigint,
  user_name text NOT NULL,
  user_type text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  description text,
  ip_address text,
  device text,
  status text NOT NULL DEFAULT 'success'::text,
  created_at timestamp with time zone DEFAULT now(),
  exchange_code text,
  old_values jsonb,
  new_values jsonb,
  user_agent text,
  target_name text,
  before_value text,
  after_value text,
  reason text,
  actor_name text,  -- افزودهٔ بازسازی
  actor_role text,  -- افزودهٔ بازسازی
  title text,  -- افزودهٔ بازسازی
  is_demo boolean DEFAULT false,  -- افزودهٔ بازسازی
  PRIMARY KEY (id)
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- wallet_transactions
-- موجودیت متناظر: WalletTransaction · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id bigint NOT NULL DEFAULT nextval('wallet_transactions_id_seq'::regclass),
  user_id text NOT NULL,
  user_type text NOT NULL,
  exchange_code text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL,
  type text NOT NULL,
  description text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  PRIMARY KEY (id)
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- charge_orders
-- موجودیت متناظر: ChargeOrder · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.charge_orders (
  id bigint NOT NULL DEFAULT nextval('charge_orders_id_seq'::regclass),
  customer_id bigint,
  customer_name text,
  customer_mobile text,
  exchange_code text,
  product_type text NOT NULL,
  product_name text,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text,
  status text NOT NULL DEFAULT 'pending'::text,
  registered_by text,
  registered_by_user_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.charge_orders ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- online_requests
-- موجودیت متناظر: OnlineRequest · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_requests (
  id bigint NOT NULL DEFAULT nextval('online_requests_id_seq'::regclass),
  exchange_code text,
  user_name text NOT NULL,
  user_mobile text,
  status text NOT NULL DEFAULT 'pending'::text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.online_requests ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- idempotency_keys
-- موجودیت متناظر: IdempotencyKey · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id bigint NOT NULL,
  client_operation_id text NOT NULL UNIQUE,
  table_name text NOT NULL,
  result_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  exchange_code text,
  PRIMARY KEY (id)
);
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- wallets
-- موجودیت متناظر: Wallet · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
  id bigint NOT NULL DEFAULT nextval('wallets_id_seq'::regclass),
  user_id bigint,
  phone text,
  balance numeric DEFAULT 0,
  currency text NOT NULL DEFAULT 'AFN'::text,
  exchange_code text,
  status text NOT NULL DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  owner_type text DEFAULT 'customer'::text,
  PRIMARY KEY (id)
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- customer_notifications
-- موجودیت متناظر: CustomerNotification · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id bigint NOT NULL DEFAULT nextval('customer_notifications_id_seq'::regclass),
  customer_user_id bigint,
  exchange_code text,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info'::text,
  read boolean DEFAULT false,
  action_url text,
  action_label text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- customer_transfer_requests
-- موجودیت متناظر: CustomerTransferRequest · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_transfer_requests (
  id bigint NOT NULL DEFAULT nextval('customer_transfer_requests_id_seq'::regclass),
  user_id bigint,
  exchange_code text,
  direction text NOT NULL,
  sender_name text,
  sender_phone text,
  receiver_name text,
  receiver_phone text,
  destination text,
  currency text NOT NULL,
  amount numeric NOT NULL,
  rate numeric,
  fee numeric DEFAULT 0,
  fee_currency text,
  total numeric,
  status text NOT NULL DEFAULT 'pending'::text,
  transfer_no text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.customer_transfer_requests ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- customer_links
-- موجودیت متناظر: CustomerLink · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_links (
  id bigint NOT NULL DEFAULT nextval('customer_links_id_seq'::regclass),
  user_id bigint,
  exchange_code text,
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.customer_links ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- online_products
-- موجودیت متناظر: OnlineProduct · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_products (
  id bigint NOT NULL DEFAULT nextval('online_products_id_seq'::regclass),
  key text NOT NULL,
  name text NOT NULL,
  icon text,
  parent_key text,
  level text NOT NULL DEFAULT 'product'::text,
  price numeric DEFAULT 0,
  original_price numeric,
  currency text DEFAULT 'AFN'::text,
  amount text,
  image text,
  badge text,
  account_fields jsonb,
  enabled boolean DEFAULT true,
  display_order integer DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.online_products ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- sellers
-- موجودیت متناظر: Seller · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sellers (
  id bigint NOT NULL DEFAULT nextval('sellers_id_seq'::regclass),
  exchange_code text,
  name text NOT NULL,
  phone text,
  city text,
  code text,
  status text DEFAULT 'active'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- packages
-- موجودیت متناظر: Package · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.packages (
  id bigint NOT NULL DEFAULT nextval('packages_id_seq'::regclass),
  exchange_code text,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  currency text DEFAULT 'AFN'::text,
  duration_days integer DEFAULT 30,
  features jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- pricing_plans
-- موجودیت متناظر: PricingPlan · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id bigint NOT NULL DEFAULT nextval('pricing_plans_id_seq'::regclass),
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  currency text DEFAULT 'AFN'::text,
  duration_days integer DEFAULT 30,
  features jsonb,
  active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- chat_groups
-- موجودیت متناظر: ChatGroup · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_groups (
  id bigint NOT NULL DEFAULT nextval('chat_groups_id_seq'::regclass),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'public'::text,
  image text,
  creator_id text,
  creator_name text,
  exchange_code text,
  rules text,
  creator_managed boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active'::text,
  member_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- chat_group_members
-- موجودیت متناظر: ChatGroupMember · RLS اپ تعریف‌شده
-- بدون معادل در لایهٔ اپ (حذف نشده): joined_at
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_group_members (
  id bigint NOT NULL DEFAULT nextval('chat_group_members_id_seq'::regclass),
  group_id bigint NOT NULL,
  group_name text,
  user_id text NOT NULL,
  user_name text,
  user_role text,
  role text NOT NULL DEFAULT 'member'::text,
  status text NOT NULL DEFAULT 'active'::text,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- chat_messages
-- موجودیت متناظر: ChatMessage · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id bigint NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
  group_id bigint NOT NULL,
  sender_id text NOT NULL,
  sender_name text,
  sender_role text,
  message text NOT NULL,
  sync_status text NOT NULL DEFAULT 'pending'::text,
  status text NOT NULL DEFAULT 'active'::text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- message_reports
-- موجودیت متناظر: MessageReport · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reports (
  id bigint NOT NULL DEFAULT nextval('message_reports_id_seq'::regclass),
  message_id bigint NOT NULL,
  group_id bigint,
  reporter_id text NOT NULL,
  reporter_name text,
  sender_id text,
  sender_name text,
  reason text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- email_otps
-- موجودیت متناظر: EmailOtp · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_otps (
  id bigint NOT NULL DEFAULT nextval('email_otps_id_seq'::regclass),
  email text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL DEFAULT 'signup'::text,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- bank_gateways
-- موجودیت متناظر: BankGateway · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_gateways (
  id bigint NOT NULL DEFAULT nextval('bank_gateways_id_seq'::regclass),
  gateway_key character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  provider character varying NOT NULL DEFAULT 'bank_gateway'::character varying,
  currency character varying NOT NULL DEFAULT 'AFN'::character varying,
  merchant_id character varying,
  callback_url text,
  webhook_url text,
  secret_ref character varying,
  min_amount numeric DEFAULT 0,
  max_amount numeric DEFAULT 0,
  fee_percent numeric DEFAULT 0,
  fee_fixed numeric DEFAULT 0,
  display_order integer DEFAULT 0,
  active boolean DEFAULT false,
  status character varying DEFAULT 'pending'::character varying,
  test_mode boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.bank_gateways ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- payment_transactions
-- موجودیت متناظر: PaymentTransaction · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id bigint NOT NULL DEFAULT nextval('payment_transactions_id_seq'::regclass),
  gateway_key character varying NOT NULL,
  gateway_name character varying,
  user_id bigint,
  user_name character varying,
  order_id character varying,
  amount numeric NOT NULL,
  currency character varying NOT NULL DEFAULT 'AFN'::character varying,
  fee numeric DEFAULT 0,
  total numeric,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  provider_transaction_id character varying,
  provider_reference character varying,
  paid_at timestamp with time zone,
  failed_reason text,
  metadata jsonb,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- referrals
-- موجودیت متناظر: Referral · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id bigint NOT NULL DEFAULT nextval('referrals_id_seq'::regclass),
  inviter_id text NOT NULL,
  inviter_name text,
  inviter_code text,
  invitee_id text,
  invitee_name text,
  invitee_type text NOT NULL DEFAULT 'sarraaf'::text,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  reward_type text NOT NULL DEFAULT 'quota'::text,
  reward_amount numeric DEFAULT 0,
  reward_given boolean DEFAULT false,
  reward_date timestamp with time zone,
  verified_date timestamp with time zone,
  cancelled_date timestamp with time zone,
  cancel_reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- wallet_withdrawal_requests
-- موجودیت متناظر: WalletWithdrawalRequest · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_withdrawal_requests (
  id bigint NOT NULL DEFAULT nextval('wallet_withdrawal_requests_id_seq'::regclass),
  user_id text NOT NULL,
  user_name text,
  wallet_id bigint,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'AFN'::text,
  method text NOT NULL DEFAULT 'bank_transfer'::text,
  destination text,
  description text,
  status text NOT NULL DEFAULT 'pending'::text,
  reject_reason text,
  reviewer_id text,
  reviewer_name text,
  review_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.wallet_withdrawal_requests ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- languages
-- موجودیت متناظر: Language · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.languages (
  id bigint NOT NULL DEFAULT nextval('languages_id_seq'::regclass),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  native_name text NOT NULL,
  direction text NOT NULL DEFAULT 'rtl'::text CHECK (direction = ANY (ARRAY['rtl'::text, 'ltr'::text])),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  flag_emoji text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- email_verification_requests
-- موجودیت متناظر: EmailVerificationRequest · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_verification_requests (
  id bigint NOT NULL DEFAULT nextval('email_verification_requests_id_seq'::regclass),
  email text NOT NULL,
  phone text NOT NULL,
  username text,
  code_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '00:10:00'::interval),
  verified_at timestamp with time zone,
  request_ip inet,
  PRIMARY KEY (id)
);
ALTER TABLE public.email_verification_requests ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- user_permissions
-- موجودیت متناظر: UserPermission · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id bigint NOT NULL,
  user_id text,
  user_name text,
  role text DEFAULT 'user'::text,
  section text NOT NULL,
  can_view boolean DEFAULT true,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_print boolean DEFAULT false,
  can_report boolean DEFAULT false,
  can_settings boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- plan_quotas
-- موجودیت متناظر: PlanQuota · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_quotas (
  id bigint NOT NULL,
  plan text NOT NULL DEFAULT 'free'::text,
  feature_key text NOT NULL,
  max_transactions integer DEFAULT '-1'::integer,
  max_customers integer DEFAULT '-1'::integer,
  max_messages integer DEFAULT '-1'::integer,
  max_prints integer DEFAULT '-1'::integer,
  max_custom integer DEFAULT '-1'::integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.plan_quotas ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- builder_access
-- موجودیت متناظر: BuilderAccess · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.builder_access (
  id bigint NOT NULL,
  email text,
  phone text,
  name text NOT NULL,
  allowed_tabs jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active'::text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.builder_access ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- manual_verification_requests
-- موجودیت متناظر: ManualVerificationRequest · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.manual_verification_requests (
  id bigint NOT NULL,
  email text NOT NULL,
  phone text,
  username text,
  exchange_name text,
  reason text,
  status text DEFAULT 'pending'::text,
  reviewer_id text,
  reviewer_name text,
  review_date timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.manual_verification_requests ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- app_auth_secret
-- موجودیت متناظر: AppAuthSecret · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_auth_secret (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  secret text NOT NULL,
  PRIMARY KEY (id)
);
ALTER TABLE public.app_auth_secret ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- agency_links
-- موجودیت متناظر: AgencyLink · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_links (
  id bigint NOT NULL,
  requester_profile_id bigint,
  requester_user_id bigint NOT NULL,
  requester_code text NOT NULL,
  requester_name text,
  requester_exchange_name text,
  requester_phone text,
  target_code text NOT NULL,
  target_name text,
  status text NOT NULL DEFAULT 'pending'::text,
  city text,
  request_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.agency_links ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- user_notifications
-- موجودیت متناظر: UserNotification · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id bigint NOT NULL,
  target_user_id text NOT NULL DEFAULT ''::text,
  target_user_name text NOT NULL DEFAULT ''::text,
  target_role text NOT NULL DEFAULT 'all'::text,
  title text NOT NULL,
  message text NOT NULL,
  kind text NOT NULL DEFAULT 'custom'::text,
  action_url text NOT NULL DEFAULT ''::text,
  action_label text NOT NULL DEFAULT ''::text,
  read boolean NOT NULL DEFAULT false,
  sent_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- payment_records
-- موجودیت متناظر: PaymentRecord · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_records (
  id bigint NOT NULL,
  user_id text,
  user_name text,
  sarraaf_profile_id bigint,
  plan text,
  payment_status text,
  purchase_date timestamp with time zone,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  confirmed_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- wallet_topup_requests
-- موجودیت متناظر: WalletTopupRequest · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_topup_requests (
  id bigint NOT NULL,
  exchange_code text NOT NULL,
  user_id text NOT NULL,
  user_name text,
  created_by_id text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AFN'::text,
  method text NOT NULL DEFAULT 'card_to_card'::text,
  receipt_url text NOT NULL DEFAULT ''::text,
  sender_name text NOT NULL DEFAULT ''::text,
  card_last4 text NOT NULL DEFAULT ''::text,
  transaction_time timestamp with time zone,
  description text,
  status text NOT NULL DEFAULT 'pending'::text,
  reviewer_id text,
  reviewer_name text,
  review_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- backup_records
-- موجودیت متناظر: BackupRecord · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backup_records (
  id bigint NOT NULL,
  exchange_code text NOT NULL,
  user_id text NOT NULL DEFAULT ''::text,
  user_name text NOT NULL DEFAULT ''::text,
  type text NOT NULL DEFAULT 'manual'::text,
  status text NOT NULL DEFAULT 'success'::text,
  file_name text,
  size_bytes bigint NOT NULL DEFAULT 0,
  record_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  entity_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  restore_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- recharge_orders
-- موجودیت متناظر: RechargeOrder · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recharge_orders (
  id bigint NOT NULL,
  exchange_code text NOT NULL,
  operator_key text,
  operator_name text,
  operator_country text,
  phone_number text NOT NULL,
  package_type text NOT NULL DEFAULT 'credit'::text,
  package_name text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AFN'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  supplier_status text NOT NULL DEFAULT 'not_submitted'::text,
  tracking_number text,
  receipt_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.recharge_orders ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- chart_of_accounts
-- موجودیت متناظر: ChartOfAccount · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id bigint NOT NULL,
  exchange_code text NOT NULL,
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type = ANY (ARRAY['asset'::text, 'liability'::text, 'equity'::text, 'revenue'::text, 'expense'::text])),
  normal_balance text NOT NULL DEFAULT 'debit'::text CHECK (normal_balance = ANY (ARRAY['debit'::text, 'credit'::text])),
  parent_id bigint,
  currency text,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- fiscal_periods
-- موجودیت متناظر: FiscalPeriod · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fiscal_periods (
  id bigint NOT NULL,
  exchange_code text NOT NULL,
  period_code text NOT NULL,
  period_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'closed'::text])),
  closed_at timestamp with time zone,
  closed_by text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- cost_centers
-- موجودیت متناظر: CostCenter · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id bigint NOT NULL,
  exchange_code text NOT NULL,
  center_code text NOT NULL,
  center_name text NOT NULL,
  center_type text NOT NULL DEFAULT 'department'::text,
  parent_id bigint,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- demo_preview_records
-- موجودیت متناظر: DemoPreviewRecord · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.demo_preview_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exchange_code text NOT NULL,
  owner_user_id bigint NOT NULL,
  module_key text NOT NULL,
  record_key text NOT NULL,
  record_kind text NOT NULL CHECK (record_kind = ANY (ARRAY['sample'::text, 'temporary'::text])),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  PRIMARY KEY (id)
);
ALTER TABLE public.demo_preview_records ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ------------------------------------------------------------
-- layout_hex_references
-- موجودیت متناظر: LayoutHexReference · RLS اپ تعریف‌شده
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.layout_hex_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  storage_path text NOT NULL UNIQUE,
  original_filename text,
  mime_type text NOT NULL CHECK (mime_type = ANY (ARRAY['image/jpeg'::text, 'image/png'::text, 'image/webp'::text, 'image/gif'::text])),
  file_size bigint CHECK (file_size IS NULL OR file_size > 0 AND file_size <= 10485760),
  created_by bigint DEFAULT app_uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);
ALTER TABLE public.layout_hex_references ENABLE ROW LEVEL SECURITY;  -- متن policy در منبع اولیه موجود نیست

-- ============================================================
-- کلیدهای خارجی ثبت‌شده در ساختار اولیه
-- ============================================================
ALTER TABLE public.support_tickets ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets (id);
ALTER TABLE public.support_messages ADD CONSTRAINT support_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets (id);
ALTER TABLE public.users ADD CONSTRAINT transfers_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT exchanges_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT documents_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT conversions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT treasury_transactions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT bank_transactions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT journal_entries_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT ledger_entries_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT audit_logs_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT wallet_transactions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT charge_orders_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT customer_notifications_customer_user_id_fkey FOREIGN KEY (customer_user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT customer_transfer_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.users ADD CONSTRAINT customer_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.exchanges ADD CONSTRAINT treasury_transactions_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT audit_logs_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT bank_transactions_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT bank_accounts_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT conversions_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT transfers_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT documents_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT exchanges_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users (id);
ALTER TABLE public.exchanges ADD CONSTRAINT origins_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT employees_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT rates_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT charge_orders_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT online_requests_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT wallets_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT customer_notifications_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT customer_transfer_requests_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT customer_links_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT feature_settings_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT ledger_entries_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.exchanges ADD CONSTRAINT journal_entries_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.customers ADD CONSTRAINT conversions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers (id);
ALTER TABLE public.customers ADD CONSTRAINT charge_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers (id);
ALTER TABLE public.customers ADD CONSTRAINT transfers_customer_exchange_fkey FOREIGN KEY (customer_id, exchange_code) REFERENCES public.customers (id, exchange_code);
ALTER TABLE public.documents ADD CONSTRAINT documents_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.documents ADD CONSTRAINT documents_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.documents ADD CONSTRAINT ledger_entries_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents (id);
ALTER TABLE public.documents ADD CONSTRAINT documents_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers (id);
ALTER TABLE public.transfers ADD CONSTRAINT transfers_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.transfers ADD CONSTRAINT transfers_customer_exchange_fkey FOREIGN KEY (customer_id, exchange_code) REFERENCES public.customers (id, exchange_code);
ALTER TABLE public.transfers ADD CONSTRAINT documents_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers (id);
ALTER TABLE public.transfers ADD CONSTRAINT ledger_entries_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers (id);
ALTER TABLE public.transfers ADD CONSTRAINT transfers_agent_exchange_fkey FOREIGN KEY (agent_id, exchange_code) REFERENCES public.origins (id, exchange_code);
ALTER TABLE public.transfers ADD CONSTRAINT transfers_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.conversions ADD CONSTRAINT conversions_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.conversions ADD CONSTRAINT conversions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.conversions ADD CONSTRAINT conversions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers (id);
ALTER TABLE public.treasury_transactions ADD CONSTRAINT treasury_transactions_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.treasury_transactions ADD CONSTRAINT treasury_transactions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.bank_accounts ADD CONSTRAINT bank_accounts_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.bank_accounts ADD CONSTRAINT bank_transactions_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.bank_accounts (id);
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.bank_accounts (id);
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.bank_transactions ADD CONSTRAINT bank_transactions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_pair_entry_id_fkey FOREIGN KEY (pair_entry_id) REFERENCES public.ledger_entries (id);
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents (id);
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers (id);
ALTER TABLE public.rates ADD CONSTRAINT rates_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.employees ADD CONSTRAINT employees_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.origins ADD CONSTRAINT origins_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.origins ADD CONSTRAINT transfers_agent_exchange_fkey FOREIGN KEY (agent_id, exchange_code) REFERENCES public.origins (id, exchange_code);
ALTER TABLE public.feature_settings ADD CONSTRAINT feature_settings_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.charge_orders ADD CONSTRAINT charge_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers (id);
ALTER TABLE public.charge_orders ADD CONSTRAINT charge_orders_registered_by_user_id_fkey FOREIGN KEY (registered_by_user_id) REFERENCES public.users (id);
ALTER TABLE public.charge_orders ADD CONSTRAINT charge_orders_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.online_requests ADD CONSTRAINT online_requests_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.wallets ADD CONSTRAINT wallets_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.customer_notifications ADD CONSTRAINT customer_notifications_customer_user_id_fkey FOREIGN KEY (customer_user_id) REFERENCES public.users (id);
ALTER TABLE public.customer_notifications ADD CONSTRAINT customer_notifications_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.customer_transfer_requests ADD CONSTRAINT customer_transfer_requests_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.customer_transfer_requests ADD CONSTRAINT customer_transfer_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.customer_links ADD CONSTRAINT customer_links_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id);
ALTER TABLE public.customer_links ADD CONSTRAINT customer_links_exchange_code_fkey FOREIGN KEY (exchange_code) REFERENCES public.exchanges (exchange_code);
ALTER TABLE public.chat_groups ADD CONSTRAINT chat_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups (id);
ALTER TABLE public.chat_groups ADD CONSTRAINT chat_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups (id);
ALTER TABLE public.chat_group_members ADD CONSTRAINT chat_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups (id);
ALTER TABLE public.chat_messages ADD CONSTRAINT message_reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages (id);
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.chat_groups (id);
ALTER TABLE public.message_reports ADD CONSTRAINT message_reports_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages (id);
ALTER TABLE public.chart_of_accounts ADD CONSTRAINT chart_of_accounts_parent_same_exchange FOREIGN KEY (exchange_code, parent_id) REFERENCES public.chart_of_accounts (exchange_code, id);
ALTER TABLE public.cost_centers ADD CONSTRAINT cost_centers_parent_same_exchange FOREIGN KEY (exchange_code, parent_id) REFERENCES public.cost_centers (exchange_code, id);

-- ============================================================
-- روابط مستند افزودهٔ بازسازی (از توضیح موجودیت‌ها؛ اجرا نشده)
-- ============================================================
-- users.exchange_id → exchanges.id | توضیح موجودیت User: شناسهٔ صرافی (tenant) | رابطهٔ نرم؛ کلید خارجی سخت‌گیرانه اعمال نشود
-- documents.customer_id → customers.id | Base44 alias برای related_id؛ رابطهٔ نرم، نه کلید خارجی ثبت‌شده | رابطهٔ نرم؛ کلید خارجی سخت‌گیرانه اعمال نشود
-- transfers.document_id → documents.id | Base44-only؛ A1 از tx_ids و documents.transfer_id استفاده می‌کند | رابطهٔ نرم؛ کلید خارجی سخت‌گیرانه اعمال نشود
-- origins.agent_id → origins.id | توضیح موجودیت Origin: FK origins(id) همراه exchange_code | قابل اعمال به‌عنوان کلید خارجی

-- ============================================================
-- لایهٔ زمان اجرا (IndexedDB) — فقط مستند، در SQL ساخته نمی‌شود
-- ============================================================
-- پایگاه: a1_local_preview_v21 · کلید: id (autoIncrement) · ایندکس‌ها: exchange_code، created_at
-- جدول‌ها (62): support_tickets, support_messages, error_reports, user_feedback, safes, users, exchanges, customers, documents, transfers, conversions, treasury_transactions, bank_accounts, bank_transactions, journal_entries, ledger_entries, rates, employees, origins, rules, feature_settings, app_settings, audit_logs, wallet_transactions, charge_orders, online_requests, idempotency_keys, wallets, customer_notifications, customer_transfer_requests, customer_links, online_products, sellers, packages, pricing_plans, chat_groups, chat_group_members, chat_messages, message_reports, email_otps, bank_gateways, payment_transactions, referrals, wallet_withdrawal_requests, languages, email_verification_requests, user_permissions, plan_quotas, builder_access, manual_verification_requests, app_auth_secret, agency_links, user_notifications, payment_records, wallet_topup_requests, backup_records, recharge_orders, chart_of_accounts, fiscal_periods, cost_centers, demo_preview_records, layout_hex_references

-- پایان سند. هیچ فرمانی از این فایل اجرا نشده است.