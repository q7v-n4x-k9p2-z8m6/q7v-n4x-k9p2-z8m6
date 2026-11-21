# معماری نسخهٔ مرجع مستقل

هدف این پروژه: **نقشهٔ دقیق و قابل اجرای A1** روی Base44 — نه بازطراحی سلیقه‌ای دیتابیس و نه یک نمونهٔ
حسابداری عمومی. هر تصمیم معماری یا باید در سورس A1 شاهد داشته باشد یا در `DECISIONS.md` به‌عنوان
«تصمیم آزمایشی / تعارض باز» ثبت شود.

## ۱. معماری واقعی A1 (استخراج‌شده از سورس)

```
src/App.jsx  (مسیرها + ProtectedRoute + FeatureGate)
   │
   ├── src/pages/**           ۶۵ صفحهٔ اصلی + customer(14) + sarraaf(3) + seller(1)
   ├── src/components/**      Layout، CustomerLayout، AdminRoute، FeatureGate، ProtectedRoute …
   │
   ├── src/lib/ledger.js      سازندگان ردیف دفتر برای هر عملیات (buildTrade, buildDadogereft,
   │                          buildInternalTransfer, buildTransferSend/Receive/Execute,
   │                          buildConvert, buildOpenBalance, buildManualVoucher) + محاسبهٔ
   │                          trialBalanceBase / documentBaseBalances / computeProfit(Detailed) /
   │                          groupByDocument
   ├── src/lib/ledgerApi.js   postDocument() → Supabase RPC «post_document_transaction» با
   │                          p_lines، p_client_operation_id و idempotency
   ├── src/lib/supabaseApi.js خواندن/نوشتن جدول‌ها، tenant با exchange_code
   ├── src/lib/rbac.js        نقش‌ها، ROUTE_PERMISSIONS، منوی هر نقش
   ├── src/lib/features.js    FEATURE_CATALOG (کلید قابلیت، وضعیت پیش‌فرض active/updating)
   └── src/components/FeatureGate.jsx  گیت نمایش هر قابلیت بر اساس feature_settings
```

نکات کلیدی که در بازسازی باید حفظ شوند:

1. **هر عملیات یک «سند» تولید می‌کند** که به ردیف‌های دفتر با `customer_side` و `counter_side`
   تبدیل می‌شود؛ جدول‌های `documents` و `ledger_entries` هر دو وجود دارند و **ادغام نمی‌شوند**.
2. **جدول‌های مستقل موازی** برای گردش بانک (`bank_transactions`)، خزانه (`treasury_transactions`)،
   تبدیل (`conversions`) و روزنامه (`journal_entries`) در A1 جدا هستند؛ حذف یا ادغام آن‌ها در
   `documents` جایز نیست.
3. **حذف نرم، ویرایش‌ردیابی و ابطال** روی `documents` و `ledger_entries` ستون دارند
   (`deleted/deleted_date/delete_note`, `edited/edited_date/edit_note`, `reversed/reversed_date/reverse_reason`).
4. **ضد تکرار:** `idempotency_keys.client_operation_id` یکتا و `documents.client_operation_id`.
5. **چندصرافی بودن:** تقریباً همهٔ جدول‌های عملیاتی `exchange_code` دارند و کلیدهای یکتا با آن ترکیب می‌شوند
   (`origins(agent_id, exchange_code)`, `chart_of_accounts(exchange_code, parent_id)`, `cost_centers`).
6. **profit محاسبه‌ای است، نه ستون:** سود = کارمزد + اختلاف نرخ معامله با `rates.daily_rate`.

## ۲. لایه‌بندی این پروژه

```
src/pages/**        صفحه‌ها (فقط نمایش و فرم)
src/components/**   پوسته و اجزای مشترک
src/lib/accounting/ موتور اسناد (chart, postings, posting-engine, queries)
src/lib/rbac.js     نقش و مجوز (منطبق بر A1)
src/lib/navigation.js منو (زیرمجموعهٔ منوی A1)
base44/entities/**  ۶۱ موجودیت = ۶۱ جدول A1 (users ↔ User داخلی)
```

### وضعیت لایهٔ داده

- یک موجودیت برای هر جدول A1 ساخته شده (۶۲ جدول؛ `users` با User داخلی Base44).
- هیچ جدول A1 در موجودیت دیگری ادغام نشده است. جدول‌هایی که صفحه ندارند، در مدل باقی مانده‌اند.
- سه موجودیت اختراعی نسخهٔ قبل (`Agent`, `Currency`, `Remittance`, `CashAccount`, `Transaction`)
  حذف و با معادل واقعی A1 جایگزین شدند: `Agent→Origin`, `Currency→Rate`؛ سه مورد دیگر جدول A1 نداشتند.

### تفاوت‌های ساختاری با A1 که باید حل شوند

| موضوع | A1 | این نسخه | وضعیت |
| --- | --- | --- | --- |
| ثبت اتمیک سند | RPC دیتابیس | چند فراخوانی SDK + حذف جبرانی در صورت خطا | تعارض باز |
| جداسازی صرافی‌ها | RLS با `x-app-token` و `exchange_code` | بدون احراز هویت؛ دسترسی باز | تعارض بحرانی |
| ضد تکرار | `idempotency_keys` + RPC | پیاده نشده | تعارض باز |
| انواع سند | `buy/sell/dadogereft/internal_transfer/transfer_send/transfer_receive/transfer_execute/convert/open_balance/manual` | `trade_buy/trade_sell/cash_in/cash_out/expense/transfer_out/...` | تعارض نام‌گذاری |
| گردش بانک/خزانه | جدول مستقل | فقط `documents` + `ledger_entries` | تعارض مدل |
| تبدیل ارز | جدول `conversions` + ردیف‌های convert | فقط `documents` | تعارض مدل |
| حذف | soft delete + reverse | ابطال با سند معکوس (بدون soft delete) | تفاوت |
| نرخ روز | `rates.daily_rate` و `app_settings.usd_afn/afn_toman` برای سود | `rate` در سند + `base_value` | تفاوت محاسبه |

## ۳. جریان دادهٔ فعلی (همان که در کد اجرا می‌شود)

```
فرم صفحه (Trade/Cash/Transfers/Convert)
  → buildXPosting() در src/lib/accounting/postings.js   (سند + ردیف‌های متوازن، مبلغ/ارزش پایه)
  → postDocument() در src/lib/accounting/posting-engine.js
       ├─ validateBalanced()  (بدهکار = بستانکار)
       ├─ Document.create()  (شماره سند از پیشوند + شمارهٔ روز)
       └─ LedgerEntry.create() برای هر ردیف
  → queries.js  (مانده صندوق/بانک/مشتری، تراز آزمایشی، سود و زیان)
  → صفحه‌ها و گزارش‌ها
```

این جریان از نظر توازن درست است (جمع بدهکار = جمع بستانکار در داده‌های نمونه) اما **از نظر مدل A1
هنوز جایگزین اثبات‌شده نیست**؛ در `A1_COMPATIBILITY_REPORT.md` بند «منطق ثبت» به‌تفصیل آمده است.

## ۴. امنیت

- **در این نسخه هیچ احراز هویت واقعی وجود ندارد.** انتخاب نقش، صرفاً یک وضعیت UI برای دیدن
  مجوزهاست (`src/lib/role-context.jsx`). این «امنیت اجراشده» نیست و نباید چنین معرفی شود.
- RLS موجودیت‌ها باز است (بدون ورود کاربر). هیچ داده واقعی A1 در پروژه وارد نشده؛ همهٔ داده‌ها ساختگی
  و با برچسب نمونه‌اند.
- نقش‌ها و ماتریس مسیرها از `src/lib/rbac.js` سورس A1 کپی شده‌اند (نگاه کنید به `ROLES.md`).
- هر پیشنهاد تغییر RLS/ساختار امنیتی A1 فقط در `A1_COMPATIBILITY_REPORT.md` پیشنهاد شده و اجرا نشده است.

## ۵. مرزهای ماژول

| ماژول | مسئولیت | وابستگی |
| --- | --- | --- |
| `lib/config.js` | اطلاعات محیط، ارز پایه، کلید ذخیره‌سازی | — |
| `lib/rbac.js` | نقش، سطح، مجوز | — |
| `lib/navigation.js` | منو | rbac |
| `lib/accounting/chart.js` | برچسب انواع، انواع سند | — |
| `lib/accounting/postings.js` | ساخت ردیف و سند هر عملیات | chart |
| `lib/accounting/posting-engine.js` | ثبت/ابطال سند، حسابرسی | postings, SDK |
| `lib/accounting/queries.js` | مانده و گزارش | postings |
| `hooks/useRecords.js` | بارگذاری موجودیت | SDK |
| `hooks/useCounters.js` | صندوق + بانک به‌عنوان طرف حساب | useRecords |

## ۶. آنچه این پروژه عمداً ندارد

- نرخ‌گیری خودکار، API نرخ ارز، صفحهٔ نرخ روز
- اتصال به Supabase/GitHub پروژه A1
- انتشار production
- CRUD واقعی کاربران و احراز هویت
- ادعای تکمیل قابلیت‌هایی که صفحه/عملیات ندارند (نگاه کنید به `A1-MAPPING.md`)