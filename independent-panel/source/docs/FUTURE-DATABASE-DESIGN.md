# طراحی دیتابیس آیندهٔ پنل صراف (مرجع تأییدشده برای پیاده‌سازی بعدی)

وضعیت سند: طراحی پیشنهادی و بازبینی‌شده. **در این مرحله هیچ جدول یا اتصالی ساخته نشده است.**
دامنه: ۲۵ بخش پنل صراف، دو پوستهٔ موبایل و لپ‌تاپ.
اصل حاکم: «سند منبع حقیقت است، دفتر مشتق است.» هر عدد مالی باید از اسناد و سطرهای دفتر قابل بازسازی باشد و هیچ سطر مالی مستقل از سند ویرایش نشود.

---

## ۰. قواعد عمومی طراحی

**انواع داده**
- مبلغ: `NUMERIC(20,4)`؛ نرخ: `NUMERIC(20,8)`؛ ارز: `CHAR(3)` (AFN, USD, EUR, PKR, IRR, TOMAN).
- تاریخ سند: `DATE`؛ زمان ثبت/ویرایش/ابطال: `TIMESTAMPTZ`.
- شناسه‌ها: `BIGSERIAL` داخلی + `UUID` عمومی برای همگام‌سازی موبایل.
- متن‌های وضعیت: کد انگلیسی ذخیره شود (`posted`, `reversed`, `inactive`) و برچسب فارسی در لایهٔ نمایش ساخته شود.

**چند‌صرافی (tenant)**
همهٔ جداول عملیاتی ستون `exchange_code CHAR(8) NOT NULL` دارند و کلیدهای یکتا در محدودهٔ همان صرافی تعریف می‌شوند.

**قواعد تغییرناپذیری**
- سند ثبت‌شده فقط با «سند معکوس» باطل می‌شود؛ حذف فیزیکی سند ممنوع است (`status='reversed'`, `reversed_by_document_id`).
- سطر دفتر کل پس از ثبت، ویرایش یا حذف نمی‌شود؛ اصلاح فقط با سند معکوس یا سند اصلاحی.
- رکوردهای پایه حذف نمی‌شوند؛ `is_active=false` می‌گیرند تا سوابق و مانده‌ها حفظ شوند.
- هر سند باید در سطح خودش تراز باشد: `SUM(debit) = SUM(credit)` به تفکیک ارز.

**شماره‌گذاری**
جدول `document_sequences` با کلید یکتا `(exchange_code, doc_type, fiscal_year, currency)` و ستون `last_number`. دریافت شماره در همان تراکنش ثبت سند و با قفل ردیف انجام می‌شود.

---

## ۱. جداول مشترک (هستهٔ سیستم)

### 1.1 `exchanges` — صرافی (tenant)
| ستون | نوع | توضیح |
|---|---|---|
| id | BIGSERIAL PK | |
| exchange_code | CHAR(8) UNIQUE | کد صرافی، کلید همهٔ جداول عملیاتی |
| exchange_name / owner_name | TEXT | نام صرافی و مسئول |
| mobile / email / city / country | TEXT | تماس و موقعیت |
| plan / status / is_active | TEXT/BOOL | وضعیت اشتراک و فعالیت |
| created_at | TIMESTAMPTZ | |

### 1.2 `users` و `exchange_members`
`users`: id, full_name, email UNIQUE, mobile, password_hash, is_active, created_at, last_login_at.
`exchange_members`: id, exchange_code FK, user_id FK, role (`creator|admin|sarraaf|employee`), permissions `JSONB` (نگاشت بخش‌ها به `view/create/edit/delete`), is_active. یکتایی `(exchange_code, user_id)`.
ارتباط: هر کاربر می‌تواند در چند صرافی عضو باشد؛ دسترسی هر بخش از `permissions` خوانده می‌شود.

### 1.3 `currencies` — ارزها
id, exchange_code FK, code CHAR(3), name, symbol, decimals SMALLINT, is_base BOOL, is_active. یکتایی `(exchange_code, code)`.

### 1.4 `chart_of_accounts` — کدینگ حساب‌ها
id, exchange_code FK, account_code TEXT, account_name TEXT, account_type (`asset|liability|equity|revenue|expense`), normal_balance (`debit|credit`), parent_id FK→chart_of_accounts, level SMALLINT, currency CHAR(3) NULL, is_system BOOL, is_active.
یکتایی `(exchange_code, account_code)`؛ محدودیت: `parent_id` هم‌صرافی و بدون حلقه باشد.

### 1.5 `safes` — صندوق‌ها
id, exchange_code FK, code, name, currency FK→currencies(code), opening_balance NUMERIC, opening_date DATE, is_active, display_order.

### 1.6 `bank_accounts` — بانک و چک
id, exchange_code FK, bank_name, account_number, iban/sheba, holder, branch, currency, opening_balance, opening_date, notes, is_active. یکتایی `(exchange_code, bank_name, account_number)`.

### 1.7 `customers` — مشتریان
id, exchange_code FK, code, name, kind (`حقیقی|حقوقی`), phone, national_id, country, city, address, currency, opening_balance NUMERIC, opening_date, status (`active|inactive|blocked`), notes, is_active.
یکتایی `(exchange_code, code)` و `(exchange_code, name)` (قاعدهٔ فعلی ضدتکرار).

### 1.8 `agents` — نمایندگی‌ها
id, exchange_code FK, code, name, city, phone, currency, opening_balance, commission_rate NUMERIC, manager_name, is_active. نمایندگی در جدول مشتریان ثبت نمی‌شود تا نوع طرف حساب در سند صریح باشد.

### 1.9 `documents` — سربرگ همهٔ اسناد مالی
| ستون | نوع | توضیح |
|---|---|---|
| id | BIGSERIAL PK | |
| uuid | UUID UNIQUE | همگام‌سازی موبایل |
| exchange_code | CHAR(8) FK | |
| doc_type | TEXT | `journal|remittance|exchange|expense|cash|reversal` |
| doc_number | TEXT | یکتا با (exchange_code, doc_type) |
| doc_date | DATE | تاریخ سند |
| currency | CHAR(3) FK | ارز سند |
| party_type | TEXT | `customer|agent|bank|safe|other` |
| party_id | BIGINT | شناسهٔ طرف حساب |
| party_name | TEXT | نام در زمان ثبت (برای حفظ سابقه) |
| amount | NUMERIC | مبلغ اصلی |
| fee | NUMERIC | کمیشن |
| description | TEXT | شرح |
| status | TEXT | `posted|reversed|draft` |
| reversal_of_id | BIGINT FK→documents | برای سند معکوس |
| reversed_by_id | BIGINT FK→documents | سند معکوسِ همین سند |
| reversal_reason | TEXT | علت اجباری ابطال |
| client_operation_id | TEXT UNIQUE | ضدتکرار ثبت موبایل |
| registered_by | BIGINT FK→users | |
| registered_at | TIMESTAMPTZ | |
| edited_at / edited_by / edit_note | | سابقهٔ اصلاح |
| deleted_at / deleted_by | | فقط نرم |

### 1.10 `document_lines` — سطرهای سند
id, document_id FK ON DELETE RESTRICT, line_no SMALLINT, account_type (`customer|agent|safe|bank|account`), account_id BIGINT, account_name TEXT, currency FK, debit NUMERIC, credit NUMERIC, base_value NUMERIC, rate NUMERIC, description TEXT.
یکتایی `(document_id, line_no)`؛ محدودیت: هر سطر دقیقاً یکی از debit/credit مثبت باشد.

### 1.11 `ledger_entries` — دفتر کل (مشتق، تغییرناپذیر)
id, exchange_code FK, document_id FK, line_id FK UNIQUE, entry_date DATE, account_type, account_id, account_name, currency FK, debit, credit, base_value, party_type, party_id, is_reversal BOOL, created_at.
هیچ API ویرایش مستقیم ندارد؛ فقط از `document_lines` در همان تراکنش ساخته می‌شود. حذف/ویرایش با تریگر مسدود می‌شود.

### 1.12 `document_sequences`
exchange_code, doc_type, fiscal_year, last_number; یکتایی ترکیبی.

### 1.13 `audit_logs` — سوابق فعالیت
id, exchange_code, user_id, actor_name, action (`create|update|deactivate|reverse|login|settings`), entity_type, entity_id, description, old_values JSONB, new_values JSONB, ip_address, device, status, created_at.

### 1.14 `app_settings`
id, exchange_code, setting_key, setting_value TEXT, setting_type, category, updated_by, updated_at. یکتایی `(exchange_code, setting_key)`.

### 1.15 `fiscal_periods` (پشتیبان قفل دوره)
id, exchange_code, period_code, start_date, end_date, status (`open|closed`), closed_at, closed_by. سند در دورهٔ بسته پذیرفته نمی‌شود.

### 1.16 `idempotency_keys`
key TEXT PK, exchange_code, endpoint, request_hash, response JSONB, created_at.

### 1.17 `rate_history`
id, exchange_code, currency FK, buy_rate, sell_rate, daily_rate, rate_date DATE, source TEXT, created_at. یکتایی `(exchange_code, currency, rate_date)`.

### 1.18 `error_reports`
id, exchange_code, user_id, error_type, error_message, stack_trace, device, app_version, route, status, created_at.

---

## ۲. بخش‌های ۲۵‌گانه: دادهٔ لازم و جدول‌ها

| # | بخش | نوع | جدول‌های اصلی | رابطه‌ها |
|---|---|---|---|---|
| ۱ | مرکز عملیات | نمایشی | — (خواندن از نمای خلاصه) | users, exchange_members |
| ۲ | تعریف مشتریان | پایه | customers | currencies, documents.party_id |
| ۳ | دفتر حساب مشتریان | مشتق | view روی ledger_entries + customers | documents, safes |
| ۴ | بدهکاران و بستانکاران | مشتق | view ماندهٔ مشتریان | customers, ledger_entries |
| ۵ | تعریف نمایندگی‌ها | پایه | agents | currencies, documents.party_id |
| ۶ | دفتر حساب نمایندگی‌ها | مشتق | view روی ledger_entries + agents | documents |
| ۷ | صندوق‌ها و موجودی | پایه + مشتق | safes + view موجودی | ledger_entries, documents |
| ۸ | بانک و چک | پایه + مشتق | bank_accounts + view گردش | ledger_entries |
| ۹ | خرید و فروش اسعار | سند | documents(`exchange`) + exchange_deals + document_lines | safes, currencies, customers |
| ۱۰ | دفتر حواله‌ها | سند | documents(`remittance`) + remittances + transfer_status_history | agents, customers, safes, bank_accounts |
| ۱۱ | نرخ روز | پایه | rate_history + currencies | — |
| ۱۲ | مصارف و پرداخت‌ها | سند | documents(`expense`) + expenses + document_lines | chart_of_accounts, safes, bank_accounts |
| ۱۳ | دفتر روزنامچه | سند | documents(`journal`) + journal_lines (یا document_lines) | chart_of_accounts, safes, bank_accounts |
| ۱۴ | دفتر کل | مشتق | ledger_entries + view `v_ledger` | documents |
| ۱۵ | کدینگ حساب‌ها | پایه | chart_of_accounts | ledger_entries |
| ۱۶ | تعریف اسعار | پایه | currencies + rate_history | — |
| ۱۷ | گزارش عملیات | مشتق | view روی document_lines | documents |
| ۱۸ | مفاد و زیان | مشتق | view `v_profit_loss` روی ledger_entries + chart_of_accounts | chart_of_accounts |
| ۱۹ | سوابق فعالیت | عملیاتی | audit_logs | users |
| ۲۰ | گزارش خطاها و فیلدها | عملیاتی | error_reports | users |
| ۲۱ | بیلانس عمومی | مشتق | view `v_balance_sheet` / `v_trial_balance` | chart_of_accounts, ledger_entries |
| ۲۲ | گروه و چت | تکمیلی | chat_groups, chat_group_members, chat_messages | exchange_members |
| ۲۳ | هوش مصنوعی | تکمیلی | assistant_threads, assistant_messages (اختیاری) | users |
| ۲۴ | محصولات آنلاین | تکمیلی | products, orders, order_items | customers, currencies |
| ۲۵ | زبان برنامه | تنظیمات | app_settings (language) | — |

---

## ۳. جزئیات جداول اختصاصی

### 3.1 `exchange_deals` — معاملات اسعار (پایهٔ سند نوع exchange)
id, document_id FK UNIQUE, kind (`buy|sell|convert`), foreign_currency FK, foreign_amount NUMERIC, base_currency FK, base_amount NUMERIC, foreign_safe_id FK→safes, base_safe_id FK→safes, party_type/party_id, rate NUMERIC (محاسبه‌شده و ذخیره‌شده), fee NUMERIC, note.
قاعده: `rate = base_amount / foreign_amount` و ارز صندوق‌ها باید با ارز هر طرف برابر باشد.

### 3.2 `remittances` — دفتر حواله‌ها (پایهٔ سند نوع remittance)
id, document_id FK UNIQUE, direction (`outgoing|incoming`), sender_name, sender_phone, sender_country, receiver_name, receiver_phone, receiver_country, agent_id FK→agents, amount, currency, fee, settlement (`suspense|instant`), settle_type (`cash|bank`), safe_id FK, bank_id FK, status (`posted|settled|reversed`), note.
`transfer_status_history`: id, remittance_id FK, from_status, to_status, changed_by, changed_at, note.

### 3.3 `expenses` — مصارف
id, document_id FK UNIQUE, title, expense_account_id FK→chart_of_accounts (نوع هزینه), payer_type (`cash|bank`), safe_id FK, bank_id FK, amount, currency, note.

### 3.4 `journal_lines` — سطرهای روزنامچه
اگر سند روزنامچه از `document_lines` استفاده کند این جدول لازم نیست؛ در غیر این صورت: id, document_id FK, line_no, account_type, account_id, account_name, currency, debit, credit, description. پیشنهاد: استفاده از `document_lines` برای همهٔ اسناد و حذف این جدول.

### 3.5 `chat_groups` / `chat_group_members` / `chat_messages`
- chat_groups: id, exchange_code, title, owner_id, is_private, created_at.
- chat_group_members: group_id FK, user_id FK, role, joined_at؛ یکتایی `(group_id, user_id)`.
- chat_messages: id, exchange_code, group_id FK, sender_id FK, sender_name, message TEXT, message_type (`text|system`), created_at, edited_at, deleted_at.
مانده و ارقام مالی در پیام‌ها متن‌اند، نه دادهٔ مالی.

### 3.6 `products` / `orders` / `order_items`
- products: id, exchange_code, name, category (`recharge|internet|uc|game`), provider, price NUMERIC, currency, is_active, meta JSONB.
- orders: id, exchange_code, customer_id FK, order_number UNIQUE, status (`pending|paid|delivered|failed`), total, currency, payment_ref, created_at.
- order_items: id, order_id FK, product_id FK, qty, unit_price, amount, meta JSONB (شمارهٔ شارژ و مانند آن).

### 3.7 `assistant_threads` / `assistant_messages` (اختیاری)
threads: id, exchange_code, user_id FK, title, created_at.
messages: id, thread_id FK, role (`user|assistant`), content TEXT, created_at.
اگر گفت‌وگو ذخیره نشود، این دو جدول حذف می‌شوند؛ هیچ عدد مالی از این مسیر ساخته نمی‌شود.

---

## ۴. نماها (Views) — پاسخ به بخش‌های مشتق

- `v_ledger`: از ledger_entries با پیوند به documents (شماره، نوع، وضعیت، ابطال).
- `v_customer_balances`: ماندهٔ هر مشتری به تفکیک ارز: `opening_balance + SUM(debit-credit)` با `GROUP BY (customer_id, currency)`.
- `v_agent_balances`: مانند بالا برای نمایندگی‌ها.
- `v_safe_balances` / `v_bank_balances`: ماندهٔ افتتاحیه + گردش بدهکار/بستانکار هر صندوق/بانک به تفکیک ارز.
- `v_document_register` (گزارش عملیات): سطرهای اسناد با شماره، تاریخ، نوع، طرف حساب، بدهکار، بستانکار، ارز، وضعیت.
- `v_profit_loss`: تفکیک حساب‌های `revenue` و `expense` به تفکیک ارز با جمع خالص.
- `v_trial_balance` و `v_balance_sheet`: جمع بدهکار/بستانکار و ماندهٔ هر حساب از ledger_entries.
- `v_debtors_creditors`: مشتریان با ماندهٔ مثبت (بدهکار) و منفی (بستانکار) به تفکیک ارز.

همهٔ نماها فقط‌خواندنی‌اند؛ لایهٔ API روی آن‌ها اجازهٔ نوشتن نمی‌دهد.

---

## ۵. قیدها و قواعد اصلی (Constraints/Triggers)

1. `CHECK (debit >= 0 AND credit >= 0)` و `CHECK (debit = 0 OR credit = 0)` در سطرها؛ هر سطر فقط یک طرف.
2. تریگر سطح سند: پس از درج سطرها، `SUM(debit)=SUM(credit)` به تفکیک ارز؛ در غیر این صورت ثبت برمی‌گردد.
3. یکتایی `(exchange_code, doc_type, doc_number)` و `client_operation_id` برای ضدتکرار.
4. ارز سطر باید با ارز حساب/صندوق/بانک/طرف حساب سازگار باشد یا تبدیل با نرخ ذخیره‌شده ثبت شود.
5. ممنوعیت `UPDATE/DELETE` روی ledger_entries و روی documents با `status='posted'` (به‌جز فیلدهای ویرایش/ابطال مجاز).
6. ابطال: تریگر سند معکوس می‌سازد، `status` اصل را `reversed` می‌کند، `reversed_by_id` دو طرف را پر می‌کند و از ابطال دوباره جلوگیری می‌کند.
7. غیرفعال‌سازی پایه‌ها فقط `is_active=false`؛ رکورد عامل سند حذف نمی‌شود.
8. `CHECK (amount > 0)` در اسناد مالی؛ کمیشن `>= 0`.
9. سند در دورهٔ مالی بسته ثبت نمی‌شود.
10. تاریخ سند نباید از تاریخ افتتاحیهٔ صندوق/حساب قدیمی‌تر باشد (قاعدهٔ قابل تنظیم).

---

## ۶. نمایه‌ها (Indexes)

- documents: `(exchange_code, doc_date)`, `(exchange_code, doc_type, doc_number)`, `(party_type, party_id)`, `(status)`, `(reversal_of_id)`.
- document_lines: `(document_id)`, `(account_type, account_id)`, `(currency)`.
- ledger_entries: `(exchange_code, entry_date)`, `(account_type, account_id, currency)`, `(party_type, party_id, currency)`, `(document_id)`.
- chat_messages: `(group_id, created_at)`.
- audit_logs: `(exchange_code, created_at)`, `(entity_type, entity_id)`.
- rate_history: `(exchange_code, rate_date)`.
- orders: `(exchange_code, status, created_at)`.

---

## ۷. امنیت و دسترسی

- همهٔ جداول عملیاتی با `exchange_code` محدود می‌شوند؛ سیاست دسترسی: کاربر فقط رکوردهای صرافی‌های خودش را می‌بیند.
- نقش‌ها: `creator/admin` دسترسی کامل صرافی؛ `sarraaf` عملیات و گزارش؛ `employee` طبق `exchange_members.permissions` (مثلاً بدون بانک/روزنامچه/دفتر کل).
- نوشتن روی جداول مشتق (`ledger_entries`, نماها) برای نقش‌های عادی ممنوع؛ فقط سرویس داخلی در همان تراکنش سند.
- هر عملیات حساس در `audit_logs` ثبت می‌شود؛ ابطال و تغییر پایه‌ها حتماً دلیل دارند.

---

## ۸. نگاشت نسخهٔ نمایشی به جداول آینده

| مجموعهٔ فعلی (حافظه) | جدول آینده |
|---|---|
| customers | customers |
| branches | agents |
| cash | safes |
| banks | bank_accounts |
| currencies | currencies |
| accounts | chart_of_accounts |
| expenses | documents + expenses + document_lines |
| remittance | documents + remittances + document_lines |
| exchange | documents + exchange_deals + document_lines |
| journal | documents + document_lines |
| transactions | documents(`cash`) + document_lines |
| ledger | ledger_entries (مشتق) |
| reports | v_document_register (مشتق) |
| profitRows | v_profit_loss (مشتق) |
| activity | audit_logs |
| errors | error_reports |
| rates | rate_history |
| chatGroups | chat_groups + chat_messages |
| products / orders | products / orders + order_items |
| settings.language | app_settings |

---

## ۹. حدود این مرحله

- هیچ جدول، مهاجرت (migration)، تابع یا اتصال خارجی ساخته نشده است.
- این سند مبناست برای مرحلهٔ بعد: ایجاد schema، نوشتن migration، ساخت درگاه دادهٔ واقعی با همان قرارداد `src/core/gateway/contract.js` و انتقال تدریجی بدون تغییر رابط کاربری.
- پیش‌نیاز مرحلهٔ بعد: تأیید مالک محصول روی سه تصمیم باز: (۱) یکسان‌سازی سند روزنامچه با `document_lines`، (۲) نگه‌داشتن یا حذف جداول گفت‌وگوی هوش مصنوعی، (۳) تعریف سیاست تبدیل ارز در سطرهای چندارزی.