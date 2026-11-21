# معماری دیتابیس — استخراج کامل ۶۲ جدول A1

منبع: `reference/A1-source-package/02-database-structure.json`
نوع فایل مرجع: «read-only live table structure snapshot»
زمان برداشت: `2026-11-19T12:56:30.952Z`
پروژه مرجع: `tcivyztftnoodobsdxev` — شاخه: `main` — کامیت: `f7c39f0d…`
`data_included: false` و `row_counts_included: false` → هیچ ردیف داده، تعداد ردیف یا مقدار واقعی در فایل نیست.

> این سند فقط چیزی را گزارش می‌کند که در فایل JSON وجود دارد. هر ستون، کلید و رابطه‌ای که در فایل نیست اینجا
> «ثبت نشده» یا «نامعلوم» علامت خورده است. هیچ ستون فرضی به‌عنوان واقعیت A1 نوشته نشده.

## قواعد خواندن این سند

| نشانه | معنا |
| --- | --- |
| `NOT NULL` | ستون در فایل مرجع `nullable=false` دارد |
| `DEFAULT` | مقدار پیش‌فرض دقیقاً همان است که در فایل آمده |
| `CHECK` | محدودیت CHECK در فایل مرجع ثبت شده است |
| `UQ` | ستون `unique=true` است |
| `FK` | فقط از `foreign_key_constraints` فایل مرجع استخراج شده |
| `RLS` | `rls_enabled` جدول در فایل مرجع |
| «ثبت نشده» | فایل مرجع برای این مورد مقداری ندارد (ایندکس‌ها اصلاً در فایل نیستند) |

**نکتهٔ مهم دربارهٔ ایندکس‌ها و سیاست‌ها:** فایل مرجع هیچ بخش `indexes` یا `policies` ندارد؛ فقط
`rls_enabled` را برای هر جدول می‌دهد. بنابراین در این سند هیچ ایندکس یا عبارت policy نقل نشده است. کوئری‌های
SQL موجود در ZIP (مثل `public_supabase-rls-policies.sql`) منبع جداگانه‌ای هستند و در `A1_COMPATIBILITY_REPORT.md`
به‌عنوان «منبع تکمیلی، تأییدنشده در اسنپ‌شات» فهرست شده‌اند.

## فهرست کامل جدول‌ها (۶۲)

### ۱. پشتیبانی و بازخورد

| # | جدول A1 | ستون‌ها (نوع، محدودیت) | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 1 | `support_tickets` | id int8 NOT NULL DEFAULT seq؛ user_id text؛ exchange_code text؛ ticket_number text NOT NULL؛ subject text NOT NULL؛ description text؛ category text DEFAULT 'general'؛ priority text DEFAULT 'normal'؛ status text NOT NULL DEFAULT 'open'؛ assigned_to text؛ created_at timestamptz DEFAULT now()؛ updated_at timestamptz DEFAULT now() | id | ثبت نشده (هیچ FK در فایل نیست) | فعال |
| 2 | `support_messages` | id int8 NOT NULL DEFAULT seq؛ ticket_id int8 NOT NULL؛ sender_id text؛ sender_name text؛ message text NOT NULL؛ attachment_url text؛ created_at timestamptz DEFAULT now() | id | ثبت نشده | فعال |
| 3 | `error_reports` | id؛ user_id text؛ exchange_code text؛ error_type text NOT NULL؛ error_message text؛ stack_trace text؛ device text؛ app_version text؛ status text NOT NULL DEFAULT 'new'؛ created_at | id | ندارد | فعال |
| 4 | `user_feedback` | id؛ user_id text؛ exchange_code text؛ type text NOT NULL DEFAULT 'suggestion'؛ message text NOT NULL؛ rating numeric DEFAULT 0؛ status text NOT NULL DEFAULT 'new'؛ created_at | id | ندارد | فعال |

### ۲. هستهٔ صرافی و کاربران

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 5 | `safes` | id؛ name text NOT NULL؛ currency text NOT NULL؛ opening_balance numeric NOT NULL DEFAULT 0؛ active bool NOT NULL DEFAULT true؛ display_order int4 NOT NULL DEFAULT 0؛ created_at NOT NULL DEFAULT now()؛ updated_at؛ exchange_code text؛ registered_by text؛ registered_by_user_id int8 | id | ثبت نشده | فعال |
| 6 | `users` | id؛ full_name text NOT NULL؛ mobile text UQ؛ username text UQ؛ email text؛ password text NOT NULL؛ role text NOT NULL DEFAULT 'customer'؛ status text NOT NULL DEFAULT 'active'؛ created_at؛ updated_at؛ last_login timestamptz | id | ثبت نشده | فعال |
| 7 | `exchanges` | id؛ exchange_code text NOT NULL UQ؛ exchange_name text NOT NULL؛ owner_user_id int8؛ name؛ mobile؛ email؛ country؛ city؛ status text NOT NULL DEFAULT 'active'؛ password text؛ created_at؛ updated_at؛ referral_enabled bool DEFAULT false؛ referral_code text؛ referral_count int4 DEFAULT 0؛ paid_referral_count int4 DEFAULT 0؛ referral_bonus_quota int4 DEFAULT 0؛ trial_start_date date؛ plan varchar DEFAULT 'free'؛ payment_status varchar DEFAULT 'none'؛ paid_start_date date؛ paid_end_date date؛ quota_limit int4 DEFAULT 100؛ quota_used int4 DEFAULT 0 | id | ثبت نشده (ستون‌های جدول بدون constraint ثبت شده‌اند) | فعال |
| 8 | `customers` | id؛ code text؛ **name text NOT NULL**؛ mobile؛ email؛ country؛ exchange_code؛ account_details؛ description؛ opening_balance numeric DEFAULT 0؛ balance_currency text DEFAULT 'AFN'؛ status text NOT NULL DEFAULT 'active'؛ created_at؛ updated_at؛ customer_type text DEFAULT 'permanent'؛ tazkira_id text؛ phone text؛ customer_group text؛ notes text؛ locked bool DEFAULT false؛ identity_status text NOT NULL DEFAULT 'not_verified' CHECK (مقادیر مجاز در فایل بریده شده و کامل ثبت نشده)؛ identity_verified_at timestamptz | id | ثبت نشده (۳ constraint نام‌دار بدون ستون هدف) | فعال |
| 9 | `documents` | id؛ doc_number text NOT NULL؛ exchange_code text NOT NULL؛ doc_type text NOT NULL؛ amount numeric DEFAULT 0 CHECK(amount>=0)؛ currency text NOT NULL؛ fee numeric DEFAULT 0 CHECK(fee>=0)؛ related_type text NOT NULL DEFAULT 'none'؛ related_id int8؛ related_name text؛ description؛ registered_by؛ registered_by_user_id int8؛ created_at؛ updated_at؛ deleted bool DEFAULT false؛ deleted_date؛ deleted_by_name؛ delete_note؛ edited bool DEFAULT false؛ edited_date؛ edit_note؛ edited_by_name؛ transfer_id int8؛ reversed bool DEFAULT false؛ reversed_date؛ reversed_by؛ reverse_reason؛ customer_phone text؛ customer_side text؛ counter_type text؛ counter_id text؛ counter_side text؛ pair_currency text؛ pair_amount numeric؛ rate numeric؛ fee_currency text؛ pair_tx_id int8؛ client_operation_id text | id | `registered_by_user_id→users.id`، `exchange_code→exchanges.exchange_code`، و رابطهٔ `ledger_entries_document_id_fkey` که در همین بخش فایل ثبت شده است | فعال |
| 10 | `transfers` | id؛ exchange_code NOT NULL؛ transfer_number NOT NULL؛ sender_name NOT NULL؛ sender_phone؛ sender_country؛ receiver_name NOT NULL؛ receiver_phone؛ receiver_country؛ account_owner؛ amount numeric NOT NULL CHECK(amount>0)؛ currency NOT NULL؛ origin text؛ status NOT NULL DEFAULT 'done'؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at؛ fee numeric DEFAULT 0؛ fee_currency؛ direction text؛ destination؛ customer_id int8؛ rate numeric؛ total numeric؛ agent_id int8؛ agent_route text؛ executed_date timestamptz؛ paid_amount numeric؛ paid_currency؛ pay_counter text؛ tx_ids text | id | `customer_id→customers.id`، `agent_id→origins.id`، `registered_by_user_id→users.id`، `exchange_code→exchanges`، و ۲ رابطهٔ دیگر که ستون مبدأ آن‌ها در فایل ثبت نشده | فعال |
| 11 | `conversions` | id؛ exchange_code NOT NULL؛ customer_id int8؛ customer_name NOT NULL؛ customer_mobile؛ from_currency NOT NULL؛ from_amount numeric NOT NULL CHECK(>0)؛ rate numeric NOT NULL CHECK(>0)؛ to_currency NOT NULL؛ to_amount numeric NOT NULL CHECK(>0)؛ description؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at | id | customer_id→customers.id و ۲ رابطهٔ دیگر | فعال |
| 12 | `treasury_transactions` | id؛ exchange_code NOT NULL؛ currency NOT NULL؛ amount numeric NOT NULL CHECK(>0)؛ type text NOT NULL؛ description؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at | id | ثبت نشده | فعال |
| 13 | `bank_accounts` | id؛ exchange_code NOT NULL؛ bank_name NOT NULL؛ account_number NOT NULL؛ currency NOT NULL؛ balance numeric DEFAULT 0؛ created_at؛ updated_at؛ holder؛ branch؛ card_number؛ sheba؛ notes؛ active bool DEFAULT true؛ display_order int4 DEFAULT 0 | id | ثبت نشده | فعال |
| 14 | `bank_transactions` | id؛ exchange_code NOT NULL؛ bank_id int8 NOT NULL؛ bank_name؛ account_number؛ currency؛ amount numeric NOT NULL CHECK(>0)؛ type text NOT NULL؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at | id | bank_id→bank_accounts.id و ۲ رابطهٔ دیگر | فعال |
| 15 | `journal_entries` | id؛ exchange_code NOT NULL؛ type text NOT NULL؛ description NOT NULL؛ amount numeric DEFAULT 0 CHECK(>=0)؛ currency؛ related_type؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at | id | ثبت نشده | فعال |
| 16 | `ledger_entries` | id؛ exchange_code NOT NULL؛ type text؛ description؛ debit numeric DEFAULT 0 CHECK(>=0)؛ credit numeric DEFAULT 0 CHECK(>=0)؛ currency؛ related_type؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at؛ document_id int8؛ transfer_id int8؛ account_type text NOT NULL DEFAULT 'suspense'؛ account_id text؛ account_name text؛ rate numeric؛ pair_entry_id int8؛ doc_line_no int4 DEFAULT 0؛ deleted bool DEFAULT false؛ deleted_date؛ deleted_by_name؛ edited bool DEFAULT false؛ edited_date؛ edit_note | id | `document_id→documents.id` و ۴ رابطهٔ دیگر | فعال |
| 17 | `rates` | id؛ exchange_code NOT NULL؛ currency NOT NULL؛ buy_rate numeric NOT NULL CHECK(>0)؛ sell_rate numeric NOT NULL CHECK(>0)؛ description؛ mobile؛ show_to_customer bool DEFAULT true؛ show_to_anonymous bool DEFAULT false؛ show_mobile bool DEFAULT false؛ created_at؛ updated_at؛ sort_order int4 DEFAULT 0؛ daily_rate numeric؛ decimals int4 DEFAULT 2؛ symbol؛ type text DEFAULT 'fiat'؛ is_system bool DEFAULT false؛ is_active bool DEFAULT true؛ rate_date date؛ source text | id | exchange_code→exchanges | فعال |
| 18 | `employees` | id؛ exchange_code NOT NULL؛ name NOT NULL؛ show_profit_loss bool DEFAULT true؛ created_at؛ updated_at | id | exchange_code→exchanges | فعال |
| 19 | `origins` | id؛ exchange_code NOT NULL؛ name NOT NULL؛ type text NOT NULL DEFAULT 'origin'؛ is_active bool DEFAULT true؛ created_at؛ updated_at؛ phone؛ city؛ code؛ notes؛ agent_id int8 | id | `(agent_id, exchange_code)→origins(id, exchange_code)` (خودارجاع)، exchange_code→exchanges | فعال |

### ۳. تنظیمات، حسابرسی و کیف پول

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 20 | `rules` | id؛ title NOT NULL؛ content NOT NULL؛ role text NOT NULL DEFAULT 'all'؛ sort_order numeric DEFAULT 0؛ is_active bool DEFAULT true؛ created_at؛ updated_at؛ category؛ link_url؛ link_label؛ icon؛ accent؛ pinned bool DEFAULT false؛ start_date؛ end_date | id | ندارد | فعال |
| 21 | `feature_settings` | id؛ feature_key NOT NULL UQ؛ feature_name NOT NULL؛ category NOT NULL؛ status NOT NULL DEFAULT 'active'؛ message؛ icon_name؛ sort_order numeric DEFAULT 0؛ created_at؛ updated_at؛ exchange_code؛ enabled bool DEFAULT false؛ config jsonb DEFAULT '{}'؛ description؛ is_primary bool DEFAULT false؛ free_enabled bool DEFAULT true؛ paid_enabled bool DEFAULT true؛ level_1_enabled bool DEFAULT true؛ level_2_enabled bool DEFAULT true؛ level_3_enabled bool DEFAULT true | id | exchange_code→exchanges | فعال |
| 22 | `app_settings` | id؛ setting_key NOT NULL UQ؛ setting_value NOT NULL؛ setting_type NOT NULL DEFAULT 'text'؛ description؛ created_at؛ updated_at؛ exchange_code؛ category varchar DEFAULT 'general'؛ data jsonb؛ updated_by_name | id | ندارد | فعال |
| 23 | `audit_logs` | id؛ user_id int8؛ registered_by_user_id int8؛ user_name NOT NULL؛ user_type؛ action NOT NULL؛ entity_type؛ entity_id؛ description؛ ip_address؛ device؛ status NOT NULL DEFAULT 'success'؛ created_at؛ exchange_code؛ old_values jsonb؛ new_values jsonb؛ user_agent؛ target_name؛ before_value؛ after_value؛ reason | id | user_id→users، registered_by_user_id→users، exchange_code→exchanges | فعال |
| 24 | `wallet_transactions` | id؛ user_id NOT NULL؛ user_type NOT NULL؛ exchange_code؛ amount numeric NOT NULL CHECK(>0)؛ currency NOT NULL؛ type NOT NULL؛ description؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at؛ debit numeric DEFAULT 0؛ credit numeric DEFAULT 0 | id | registered_by_user_id→users | فعال |
| 25 | `charge_orders` | id؛ customer_id int8؛ customer_name؛ customer_mobile؛ exchange_code؛ product_type NOT NULL؛ product_name؛ amount numeric NOT NULL CHECK(>0)؛ currency؛ status NOT NULL DEFAULT 'pending'؛ registered_by؛ registered_by_user_id؛ created_at؛ updated_at | id | customer_id→customers، registered_by_user_id→users، exchange_code→exchanges | فعال |
| 26 | `online_requests` | id؛ exchange_code؛ user_name NOT NULL؛ user_mobile؛ status NOT NULL DEFAULT 'pending'؛ description؛ created_at؛ updated_at | id | exchange_code→exchanges | فعال |
| 27 | `idempotency_keys` | id int8 NOT NULL (بدون DEFAULT)؛ client_operation_id NOT NULL UQ؛ table_name NOT NULL؛ result_id int8 NOT NULL؛ created_at NOT NULL DEFAULT now()؛ updated_at NOT NULL DEFAULT now()؛ exchange_code | id | ندارد | فعال |
| 28 | `wallets` | id؛ user_id int8؛ phone؛ balance numeric DEFAULT 0؛ currency NOT NULL DEFAULT 'AFN'؛ exchange_code؛ status NOT NULL DEFAULT 'active'؛ created_at؛ updated_at؛ owner_type text DEFAULT 'customer' | id | user_id→users، exchange_code→exchanges | فعال |

### ۴. پنل مشتری و محصولات آنلاین

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 29 | `customer_notifications` | id؛ customer_user_id int8؛ exchange_code؛ title NOT NULL؛ body؛ type NOT NULL DEFAULT 'info'؛ read bool DEFAULT false؛ action_url؛ action_label؛ created_at؛ updated_at | id | customer_user_id→users، exchange_code→exchanges | فعال |
| 30 | `customer_transfer_requests` | id؛ user_id int8؛ exchange_code؛ direction NOT NULL؛ sender_name؛ sender_phone؛ receiver_name؛ receiver_phone؛ destination؛ currency NOT NULL؛ amount numeric NOT NULL؛ rate numeric؛ fee numeric DEFAULT 0؛ fee_currency؛ total numeric؛ status NOT NULL DEFAULT 'pending'؛ transfer_no؛ description؛ created_at؛ updated_at | id | user_id→users، exchange_code→exchanges | فعال |
| 31 | `customer_links` | id؛ user_id int8؛ exchange_code؛ label NOT NULL؛ url NOT NULL؛ icon؛ sort_order int4 DEFAULT 0؛ active bool DEFAULT true؛ created_at؛ updated_at | id | user_id→users، exchange_code→exchanges | فعال |
| 32 | `online_products` | id؛ key NOT NULL؛ name NOT NULL؛ icon؛ parent_key؛ level NOT NULL DEFAULT 'product'؛ price numeric DEFAULT 0؛ original_price numeric؛ currency DEFAULT 'AFN'؛ amount text؛ image؛ badge؛ account_fields jsonb؛ enabled bool DEFAULT true؛ display_order int4 DEFAULT 0؛ description؛ created_at؛ updated_at | id | ندارد | فعال |
| 33 | `sellers` | id؛ exchange_code؛ name NOT NULL؛ phone؛ city؛ code؛ status DEFAULT 'active'؛ notes؛ created_at؛ updated_at | id | ندارد | فعال |
| 34 | `packages` | id؛ exchange_code؛ name NOT NULL؛ description؛ price numeric DEFAULT 0؛ currency DEFAULT 'AFN'؛ duration_days int4 DEFAULT 30؛ features jsonb؛ active bool DEFAULT true؛ created_at؛ updated_at | id | ندارد | فعال |
| 35 | `pricing_plans` | id؛ name NOT NULL؛ description؛ price numeric DEFAULT 0؛ currency DEFAULT 'AFN'؛ duration_days int4 DEFAULT 30؛ features jsonb؛ active bool DEFAULT true؛ display_order int4 DEFAULT 0؛ created_at؛ updated_at | id | ندارد | فعال |

### ۵. چت، اعلان و پیام‌رسانی

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 36 | `chat_groups` | id؛ name NOT NULL؛ description؛ type NOT NULL DEFAULT 'public'؛ image؛ creator_id؛ creator_name؛ exchange_code؛ rules؛ creator_managed bool DEFAULT false؛ status NOT NULL DEFAULT 'active'؛ member_count int4 DEFAULT 0؛ created_at؛ updated_at | id | در فایل دو رابطهٔ `group_id→chat_groups.id` ثبت شده که با ستون‌های این جدول هم‌خوان نیست (تناقض فایل) | فعال |
| 37 | `chat_group_members` | id؛ group_id int8 NOT NULL؛ group_name؛ user_id NOT NULL؛ user_name؛ user_role؛ role NOT NULL DEFAULT 'member'؛ status NOT NULL DEFAULT 'active'؛ joined_at؛ created_at؛ updated_at | id | group_id→chat_groups | فعال |
| 38 | `chat_messages` | id؛ group_id int8 NOT NULL؛ sender_id NOT NULL؛ sender_name؛ sender_role؛ message NOT NULL؛ sync_status NOT NULL DEFAULT 'pending'؛ status NOT NULL DEFAULT 'active'؛ expires_at؛ created_at؛ updated_at | id | group_id→chat_groups، و رابطهٔ message_id→chat_messages که ستونش در فایل نیست | فعال |
| 39 | `message_reports` | id؛ message_id int8 NOT NULL؛ group_id int8؛ reporter_id NOT NULL؛ reporter_name؛ sender_id؛ sender_name؛ reason؛ status NOT NULL DEFAULT 'pending'؛ created_at؛ updated_at | id | message_id→chat_messages | فعال |

### ۶. احراز هویت، دسترسی و سهمیه

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 40 | `email_otps` | id؛ email NOT NULL؛ code NOT NULL؛ purpose NOT NULL DEFAULT 'signup'؛ expires_at NOT NULL؛ verified bool DEFAULT false؛ attempts int4 DEFAULT 0؛ created_at | id | ندارد | فعال |
| 41 | `languages` | id؛ code NOT NULL UQ؛ name NOT NULL؛ native_name NOT NULL؛ direction NOT NULL DEFAULT 'rtl' CHECK(rtl/ltr)؛ sort_order int4 NOT NULL DEFAULT 0؛ is_active bool NOT NULL DEFAULT true؛ is_default bool NOT NULL DEFAULT false؛ flag_emoji؛ created_at NOT NULL DEFAULT now()؛ updated_at NOT NULL DEFAULT now() | id | ندارد | فعال |
| 42 | `email_verification_requests` | id؛ email NOT NULL؛ phone؛ username؛ code_hash؛ created_at NOT NULL DEFAULT now()؛ expires_at NOT NULL DEFAULT now()+10min؛ verified_at؛ request_ip inet | id | ندارد | فعال |
| 43 | `user_permissions` | id int8 NOT NULL؛ user_id text؛ user_name؛ role DEFAULT 'user'؛ section NOT NULL؛ can_view bool DEFAULT true؛ can_create bool DEFAULT false؛ can_edit bool DEFAULT false؛ can_delete bool DEFAULT false؛ can_print bool DEFAULT false؛ can_report bool DEFAULT false؛ can_settings bool DEFAULT false؛ created_at؛ updated_at | id | ندارد | فعال |
| 44 | `plan_quotas` | id int8 NOT NULL؛ plan NOT NULL DEFAULT 'free'؛ feature_key NOT NULL؛ max_transactions int4 DEFAULT -1؛ max_customers int4 DEFAULT -1؛ max_messages int4 DEFAULT -1؛ max_prints int4 DEFAULT -1؛ max_custom int4 DEFAULT -1؛ created_at؛ updated_at | id | ندارد | فعال |
| 45 | `builder_access` | id int8 NOT NULL؛ email؛ phone؛ name NOT NULL؛ allowed_tabs jsonb DEFAULT '[]'؛ status DEFAULT 'active'؛ notes؛ created_at؛ updated_at | id | ندارد | فعال |
| 46 | `manual_verification_requests` | id int8 NOT NULL؛ email NOT NULL؛ phone؛ username؛ exchange_name؛ reason؛ status DEFAULT 'pending'؛ reviewer_id؛ reviewer_name؛ review_date؛ review_notes؛ created_at؛ updated_at | id | ندارد | فعال |
| 47 | `app_auth_secret` | id int4 NOT NULL DEFAULT 1 CHECK(id=1)؛ secret text NOT NULL | id | ندارد | فعال |
| 48 | `agency_links` | id int8 NOT NULL؛ requester_profile_id int8؛ requester_user_id int8 NOT NULL؛ requester_code NOT NULL؛ requester_name؛ requester_exchange_name؛ requester_phone؛ target_code NOT NULL؛ target_name؛ status NOT NULL DEFAULT 'pending'؛ city؛ request_note؛ created_at NOT NULL DEFAULT now()؛ updated_at NOT NULL DEFAULT now() | id | ندارد | فعال |

### ۷. اعلان، پرداخت، معرفی و کیف پول

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 49 | `bank_gateways` | id؛ gateway_key varchar NOT NULL UQ؛ name varchar NOT NULL؛ provider varchar NOT NULL DEFAULT 'bank_gateway'؛ currency varchar NOT NULL DEFAULT 'AFN'؛ merchant_id؛ callback_url؛ webhook_url؛ secret_ref؛ min_amount numeric DEFAULT 0؛ max_amount numeric DEFAULT 0؛ fee_percent numeric DEFAULT 0؛ fee_fixed numeric DEFAULT 0؛ display_order int4 DEFAULT 0؛ active bool DEFAULT false؛ status varchar DEFAULT 'pending'؛ test_mode bool DEFAULT false؛ notes؛ created_at؛ updated_at | id | ندارد | فعال |
| 50 | `payment_transactions` | id؛ gateway_key varchar NOT NULL؛ gateway_name؛ user_id int8؛ user_name؛ order_id؛ amount numeric NOT NULL؛ currency varchar NOT NULL DEFAULT 'AFN'؛ fee numeric DEFAULT 0؛ total numeric؛ status varchar NOT NULL DEFAULT 'pending'؛ provider_transaction_id؛ provider_reference؛ paid_at؛ failed_reason؛ metadata jsonb؛ description؛ created_at؛ updated_at | id | ندارد | فعال |
| 51 | `referrals` | id؛ inviter_id NOT NULL؛ inviter_name؛ inviter_code؛ invitee_id؛ invitee_name؛ invitee_type NOT NULL DEFAULT 'sarraaf'؛ code NOT NULL؛ status NOT NULL DEFAULT 'pending'؛ reward_type NOT NULL DEFAULT 'quota'؛ reward_amount numeric DEFAULT 0؛ reward_given bool DEFAULT false؛ reward_date؛ verified_date؛ cancelled_date؛ cancel_reason؛ notes؛ created_at؛ updated_at | id | ندارد | فعال |
| 52 | `wallet_withdrawal_requests` | id؛ user_id NOT NULL؛ user_name؛ wallet_id int8؛ amount numeric NOT NULL؛ currency NOT NULL DEFAULT 'AFN'؛ method NOT NULL DEFAULT 'bank_transfer'؛ destination؛ description؛ status NOT NULL DEFAULT 'pending'؛ reject_reason؛ reviewer_id؛ reviewer_name؛ review_date؛ notes؛ created_at؛ updated_at | id | ندارد | فعال |
| 53 | `user_notifications` | id int8 NOT NULL؛ target_user_id NOT NULL DEFAULT ''؛ target_user_name NOT NULL DEFAULT ''؛ target_role NOT NULL DEFAULT 'all'؛ title NOT NULL؛ message NOT NULL؛ kind NOT NULL DEFAULT 'custom'؛ action_url NOT NULL DEFAULT ''؛ action_label NOT NULL DEFAULT ''؛ read bool NOT NULL DEFAULT false؛ sent_by_name؛ created_at NOT NULL DEFAULT now()؛ updated_at NOT NULL DEFAULT now() | id | ندارد | فعال |
| 54 | `payment_records` | id int8 NOT NULL؛ user_id؛ user_name؛ sarraaf_profile_id int8؛ plan؛ payment_status؛ purchase_date؛ start_date؛ end_date؛ is_active bool NOT NULL DEFAULT true؛ confirmed_by_name؛ created_at؛ updated_at | id | ندارد | فعال |
| 55 | `wallet_topup_requests` | id int8 NOT NULL؛ exchange_code NOT NULL؛ user_id NOT NULL؛ user_name؛ created_by_id؛ amount numeric NOT NULL DEFAULT 0؛ currency NOT NULL DEFAULT 'AFN'؛ method NOT NULL DEFAULT 'card_to_card'؛ receipt_url NOT NULL DEFAULT ''؛ sender_name NOT NULL DEFAULT ''؛ card_last4 NOT NULL DEFAULT ''؛ transaction_time؛ description؛ status NOT NULL DEFAULT 'pending'؛ reviewer_id؛ reviewer_name؛ review_date؛ created_at؛ updated_at | id | ندارد | فعال |
| 56 | `backup_records` | id int8 NOT NULL؛ exchange_code؛ user_id NOT NULL DEFAULT ''؛ user_name NOT NULL DEFAULT ''؛ type NOT NULL DEFAULT 'manual'؛ status NOT NULL DEFAULT 'success'؛ file_name؛ size_bytes int8 NOT NULL DEFAULT 0؛ record_counts jsonb NOT NULL DEFAULT '{}'؛ entity_types jsonb NOT NULL DEFAULT '[]'؛ notes؛ restore_date؛ created_at؛ updated_at | id | ندارد | فعال |
| 57 | `recharge_orders` | id int8 NOT NULL؛ exchange_code؛ operator_key؛ operator_name؛ operator_country؛ phone_number NOT NULL؛ package_type NOT NULL DEFAULT 'credit'؛ package_name؛ amount numeric NOT NULL DEFAULT 0؛ currency NOT NULL DEFAULT 'AFN'؛ status NOT NULL DEFAULT 'pending'؛ supplier_status NOT NULL DEFAULT 'not_submitted'؛ tracking_number؛ receipt_data jsonb؛ created_at؛ updated_at | id | ندارد | فعال |

### ۸. حسابداری تکمیلی و مراجع

| # | جدول A1 | ستون‌ها | PK | FK | RLS |
| --- | --- | --- | --- | --- | --- |
| 58 | `chart_of_accounts` | id int8 NOT NULL؛ exchange_code NOT NULL؛ account_code NOT NULL؛ account_name NOT NULL؛ account_type NOT NULL CHECK(مقادیر در فایل بریده شده)؛ normal_balance NOT NULL DEFAULT 'debit' CHECK(debit/credit)؛ parent_id int8؛ currency؛ description؛ is_system bool NOT NULL DEFAULT false؛ is_active bool NOT NULL DEFAULT true؛ created_at؛ updated_at | id | `(exchange_code,parent_id)→chart_of_accounts(exchange_code,id)` | فعال |
| 59 | `fiscal_periods` | id int8 NOT NULL؛ exchange_code NOT NULL؛ period_code NOT NULL؛ period_name NOT NULL؛ start_date date NOT NULL؛ end_date date NOT NULL؛ status NOT NULL DEFAULT 'open' CHECK(مقادیر در فایل بریده شده)؛ closed_at؛ closed_by؛ description؛ created_at؛ updated_at | id | ندارد | فعال |
| 60 | `cost_centers` | id int8 NOT NULL؛ exchange_code NOT NULL؛ center_code NOT NULL؛ center_name NOT NULL؛ center_type NOT NULL DEFAULT 'department'؛ parent_id int8؛ is_active bool NOT NULL DEFAULT true؛ description؛ created_at؛ updated_at | id | `(exchange_code,parent_id)→cost_centers(exchange_code,id)` | فعال |
| 61 | `demo_preview_records` | id uuid DEFAULT gen_random_uuid()؛ exchange_code NOT NULL؛ owner_user_id int8 NOT NULL؛ module_key NOT NULL؛ record_key NOT NULL؛ record_kind NOT NULL CHECK(مقادیر در فایل بریده شده)؛ payload jsonb NOT NULL DEFAULT '{}'؛ created_by_user_id int8؛ created_at؛ updated_at؛ expires_at | id | ندارد | فعال |
| 62 | `layout_hex_references` | id uuid DEFAULT gen_random_uuid()؛ title NOT NULL؛ description؛ storage_path NOT NULL UQ؛ original_filename؛ mime_type CHECK(فهرست در فایل بریده شده)؛ file_size int8 CHECK(file_size IS NULL OR >…)؛ created_by int8 DEFAULT app_uid()؛ created_at | id | ندارد | فعال |

## نگاشت A1 ↔ Base44

قاعده: نام موجودیت = نام جدول به PascalCase. برای هر جدول یک موجودیت، بدون ادغام.

| جدول A1 | موجودیت Base44 | وضعیت UI در این نسخه |
| --- | --- | --- |
| support_tickets | SupportTicket | بدون صفحه/عملیات |
| support_messages | SupportMessage | بدون صفحه/عملیات |
| error_reports | ErrorReport | بدون صفحه/عملیات |
| user_feedback | UserFeedback | بدون صفحه/عملیات |
| safes | Safe | صفحهٔ «صندوق» (فهرست صندوق‌ها و گردش) |
| users | **User (built-in)** | نقش‌ها فقط در پنل شبیه‌سازی؛ ثبت کاربر واقعی انجام نمی‌شود |
| exchanges | Exchange | نمایش اطلاعات محیط در تنظیمات/سازنده (بدون CRUD) |
| customers | Customer | مشتریان + جزئیات مشتری + بدهکاران |
| documents | Document | ثبت معامله، صندوق، حواله، تبدیل + دفتر روزنامه |
| transfers | Transfer | صفحهٔ حواله‌ها (ارسالی/دریافتی) |
| conversions | Conversion | تکمیل نشده؛ تبدیل فعلی از موتور سند استفاده می‌کند (تعارض مستند) |
| treasury_transactions | TreasuryTransaction | بدون صفحه/عملیات |
| bank_accounts | BankAccount | صفحهٔ بانک |
| bank_transactions | BankTransaction | تکمیل نشده (گردش بانک فعلی از LedgerEntry) |
| journal_entries | JournalEntry | بدون صفحه/عملیات (دفتر روزنامه فعلی از Document) |
| ledger_entries | LedgerEntry | دفتر کل، تراز آزمایشی، گردش مشتری |
| rates | Rate | تنظیمات «ارزها و نرخ» + فهرست ارز فرم‌ها |
| employees | Employee | بدون صفحه/عملیات |
| origins | Origin | صفحهٔ نمایندگی‌ها + انتخاب نمایندگی در حواله |
| rules | Rule | بدون صفحه/عملیات |
| feature_settings | FeatureSetting | بدون صفحه/عملیات (پرچم‌ها در کد ثابت‌اند) |
| app_settings | AppSetting | بدون صفحه/عملیات |
| audit_logs | AuditLog | صفحهٔ رویدادها |
| wallet_transactions | WalletTransaction | بدون صفحه/عملیات |
| charge_orders | ChargeOrder | بدون صفحه/عملیات |
| online_requests | OnlineRequest | بدون صفحه/عملیات |
| idempotency_keys | IdempotencyKey | بدون صفحه/عملیات |
| wallets | Wallet | بدون صفحه/عملیات (پنل مشتری خلاصه است) |
| customer_notifications | CustomerNotification | بدون صفحه/عملیات |
| customer_transfer_requests | CustomerTransferRequest | بدون صفحه/عملیات |
| customer_links | CustomerLink | بدون صفحه/عملیات |
| online_products | OnlineProduct | بدون صفحه/عملیات |
| sellers | Seller | بدون صفحه/عملیات |
| packages | Package | بدون صفحه/عملیات |
| pricing_plans | PricingPlan | بدون صفحه/عملیات |
| chat_groups | ChatGroup | بدون صفحه/عملیات |
| chat_group_members | ChatGroupMember | بدون صفحه/عملیات |
| chat_messages | ChatMessage | بدون صفحه/عملیات |
| message_reports | MessageReport | بدون صفحه/عملیات |
| email_otps | EmailOtp | بدون صفحه/عملیات |
| bank_gateways | BankGateway | بدون صفحه/عملیات |
| payment_transactions | PaymentTransaction | بدون صفحه/عملیات |
| referrals | Referral | بدون صفحه/عملیات |
| wallet_withdrawal_requests | WalletWithdrawalRequest | بدون صفحه/عملیات |
| languages | Language | بدون صفحه/عملیات (فقط fa/en در کد) |
| email_verification_requests | EmailVerificationRequest | بدون صفحه/عملیات |
| user_permissions | UserPermission | بدون صفحه/عملیات (مجوزها در کد) |
| plan_quotas | PlanQuota | بدون صفحه/عملیات |
| builder_access | BuilderAccess | بدون صفحه/عملیات |
| manual_verification_requests | ManualVerificationRequest | بدون صفحه/عملیات |
| app_auth_secret | AppAuthSecret | بدون صفحه/عملیات — هرگز مقدار واقعی ذخیره نمی‌شود |
| agency_links | AgencyLink | بدون صفحه/عملیات |
| user_notifications | UserNotification | بدون صفحه/عملیات |
| payment_records | PaymentRecord | بدون صفحه/عملیات |
| wallet_topup_requests | WalletTopupRequest | بدون صفحه/عملیات |
| backup_records | BackupRecord | بدون صفحه/عملیات |
| recharge_orders | RechargeOrder | بدون صفحه/عملیات |
| chart_of_accounts | ChartOfAccount | بدون صفحه/عملیات |
| fiscal_periods | FiscalPeriod | بدون صفحه/عملیات |
| cost_centers | CostCenter | بدون صفحه/عملیات |
| demo_preview_records | DemoPreviewRecord | بدون صفحه/عملیات |
| layout_hex_references | LayoutHexReference | بدون صفحه/عملیات |

## فیلدهای افزوده یا تغییرنام‌یافته در Base44 (صریح)

| موجودیت | فیلد Base44 | معادل A1 | دلیل |
| --- | --- | --- | --- |
| Customer | `full_name` | `name` | نام فیلد در UI؛ هنگام ایجاد، هر دو مقدار نوشته می‌شوند |
| Customer | `national_id` | `tazkira_id` | برچسب فارسی UI |
| Customer | `is_demo` | ندارد | نشانهٔ دادهٔ ساختگی |
| Document | `date` | `created_at` | تاریخ سند در رابط |
| Document | `status` | `reversed` / `deleted` | نمایش وضعیت در UI |
| Document | `customer_id`, `customer_name` | `related_id`, `related_name` | نمایش مستقیم مشتری |
| Document | `counter_name`, `base_value`, `reversed_of` | ندارد | کمک‌نمایشی |
| LedgerEntry | `side`, `amount`, `value` | `debit`/`credit` | کمک به موتور فعلی؛ ستون‌های A1 هم پر می‌شوند |
| LedgerEntry | `doc_number`, `doc_type`, `date` | از `documents` | خواندن ساده‌تر |
| Transfer | `customer_name`, `document_id`, `description`, `is_demo` | ندارد | کمک‌نمایشی |
| BankAccount | `opening_balance`, `opening_value`, `note` | `balance`, `notes` | سازگاری با فرم فعلی |
| Safe | `opening_value`, `note`, `is_demo` | ندارد | کمک‌نمایشی |
| AuditLog | `actor_name`, `actor_role`, `title`, `is_demo` | `user_name` | نمایش ساده |
| همه | `created_date`, `updated_date`, `created_by_id` | `created_at`, `updated_at` | فیلدهای خودکار Base44 |

## نامعلوم‌ها و تناقض‌های فایل مرجع

1. **ایندکس‌ها:** فایل مرجع هیچ ایندکسی ندارد. نمی‌توان گفت کدام ستون‌ها ایندکس دارند.
2. **سیاست‌های امنیتی:** فقط `rls_enabled=true` برای هر ۶۲ جدول ثبت شده؛ متن policyها در فایل نیست.
3. **کلیدهای خارجی ناقص:** برای جدول‌های `safes`, `treasury_transactions`, `journal_entries`, `employees`, `rules`, `app_settings`, `idempotency_keys`, `user_permissions`, `plan_quotas`, `builder_access`, `manual_verification_requests`, `app_auth_secret`, `agency_links`, `user_notifications`, `payment_records`, `wallet_topup_requests`, `backup_records`, `recharge_orders` هیچ FK‌ای ثبت نشده؛ نبود FK به معنی نبود رابطه در A1 نیست.
4. **ستون‌های مبدأ خالی:** در `users`, `exchanges`, `customers`, `documents`, `transfers`, `conversions`, `bank_transactions`, `ledger_entries`, `chat_groups`, `chat_messages` نام ستون بعضی FKها در فایل `undefined` است (۱۶ رابطه در `users` و `exchanges`). فقط «وجود رابطه» قابل استناد است، نه ستون دقیق آن.
5. **CHECKهای بریده‌شده:** مقادیر کامل CHECK برای `customers.identity_status`, `chart_of_accounts.account_type`, `fiscal_periods.status`, `languages.direction`, `demo_preview_records.record_kind`, `layout_hex_references.mime_type` در فایل با «…» بریده شده است.
6. **قدیمی/غیرفعال بودن جدول:** بدون ردیف داده نمی‌توان گفت کدام جدول فعال است. وضعیت فعال/غیرفعال قابلیت‌ها باید از `feature_settings` و کد سورس خوانده شود، نه از این فایل.
7. **تکرار رابطه در `chat_groups`:** دو FK با نام `group_id→chat_groups(id)` ثبت شده که با ستون‌های این جدول سازگار نیست؛ احتمالاً خطای اسنپ‌شات است.
