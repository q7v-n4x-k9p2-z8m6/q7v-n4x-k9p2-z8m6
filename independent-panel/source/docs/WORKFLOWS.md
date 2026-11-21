# گردش‌کارها و منطق حسابداری

منبع: `src/lib/ledger.js`, `src/lib/ledgerApi.js`, `src/pages/{Trade,Cash,Bank,Transfer,CurrencyConvert,Journal}.jsx`
در ZIP سورس A1. همهٔ قواعد زیر از کد استخراج شده‌اند، نه از حافظه.

## ۱. مدل ثبت A1

هر عملیات یک **سند** (`documents`) می‌سازد و ردیف‌های دفتر (`ledger_entries`) با ستون‌های
`debit`/`credit` و `account_type`/`account_id`/`account_name` تولید می‌کند.

سازنده‌ها در `ledger.js` ابتدا ردیف‌هایی با `customer_side` و `counter_side` می‌سازند؛ در
`ledgerApi.postDocument()` به `p_lines` تبدیل و از طریق RPC `post_document_transaction` اتمیک ثبت می‌شوند.

انواع سند (`type` ردیف‌ها): `buy`, `sell`, `dadogereft`, `internal_transfer`, `transfer_send`,
`transfer_receive`, `transfer_execute`, `convert`, `open_balance`, `manual`.

## ۲. قواعد هر عملیات

### داد و گرفت — `buildDadogereft`

| حالت | طرف مشتری | طرف صندوق/بانک |
| --- | --- | --- |
| `receive` (دریافت از مشتری) | `credit` | `debit` |
| `pay` (پرداخت به مشتری) | `debit` | `credit` |

تک‌ردیفی؛ `counter_type`/`counter_id` همان صندوق یا بانک انتخاب‌شده است.

### خرید/فروش — `buildTrade`

| حالت | مشتری | صندوق | ارز تسویه |
| --- | --- | --- | --- |
| `buy` (صراف از مشتری می‌خرد) | `debit` ارز معامله | `credit` ارز معامله | `pair_currency` + `pair_amount = amount × rate` |
| `sell` (صراف به مشتری می‌فروشد) | `credit` ارز معامله | `debit` ارز معامله | همان |

کارمزد (اگر `fee > 0`) دو ردیف اضافه می‌کند:
1. `customer_side=debit` با `counter_type='none'` و مبلغ کارمزد،
2. ردیف متوازن `counter_type='fee'`, `counter_side=credit` با شرح «سود کارمزد».

**مثال فروش:** فروش ۱۰۰ دلار با نرخ ۷۱٫۲ و کارمزد ۵۰ افغانی
- ردیف ۱: مشتری `credit` ۱۰۰ USD؛ صندوق `debit` ۱۰۰ USD؛ `pair_currency=AFN`, `pair_amount=7120`, `rate=71.2`
- ردیف ۲: مشتری `debit` ۵۰ AFN
- ردیف ۳: حساب کارمزد `credit` ۵۰ AFN
- جمع بدهکار = جمع بستانکار در هر ارز.

### انتقال داخلی — `buildInternalTransfer`

- مبدأ و مقصد یکسان: **یک** ردیف `counter_side=debit` با شرح «افزایش موجودی صندوق».
- در غیر این صورت دو ردیف: مبدأ `credit` و مقصد `debit`.

### حواله ارسال — `buildTransferSend`

- ردیف اصلی: مشتری `debit`، طرف `agent` (نمایندگی) `credit`.
- کارمزد (در صورت وجود): مشتری `debit` + حساب `fee` `credit`.
- شماره حواله از `nextTransferNo('send')`، شماره سند از `nextDocumentNo('DV')`،
  `total = amount + fee`، وضعیت اولیهٔ رکورد حواله `registered`.

### حواله دریافت — `buildTransferReceive`

آینهٔ حواله ارسال: مشتری `credit`، نمایندگی `debit`، و کارمزد به‌صورت مشتری `credit` +
حساب `fee` `debit` (در A1 همین‌طور نوشته شده است).

### اجرای حواله — `buildTransferExecute`

| جهت | مشتری | صندوق پرداخت |
| --- | --- | --- |
| `send` | `credit` | `debit` |
| `receive` | `debit` | `credit` |

### تبدیل ارز — `buildConvert`

دو ردیف روی یک سند: مشتری `debit` ارز مبدأ و مشتری `credit` ارز مقصد با `pair_currency`/`pair_amount`
متقابل و همان `rate`.

### افتتاح/مانده آغازین — `buildOpenBalance`

یک ردیف با `customer_side` انتخابی و `counter_type='none'`؛ **در A1 این هم به‌صورت سند ثبت می‌شود**.
صندوق و بانک جدول خود را دارند و موجودی آغازین در `opening_balance` نگه داشته می‌شود.

### سند دستی — `buildManualVoucher`

هر ردیف ورودی با `type='manual'`؛ `customer_side`/`counter_side` از ورودی یا از `account_type`.

## ۳. محاسبات

### تراز آزمایشی — `trialBalanceBase`

جمع بدهکار/بستانکار هر ارز جدا محاسبه و سپس به ارز پایه تبدیل می‌شود:

| ارز | نرخ تبدیل به AFN |
| --- | --- |
| AFN | ۱ |
| USD | `app_settings.usd_afn` |
| IRT | `۱ ÷ app_settings.afn_toman` |
| سایر | `rates.daily_rate`، در نبود آن `rates.sell_rate` |

توازن وقتی برقرار است که `|بدهکار − بستانکار| < 1`.

### سود — `computeProfit` و `computeProfitDetailed`

```
سود کارمزد = مجموع fee تبدیل‌شده به AFN
اختلاف نرخ (فقط buy/sell) =
    buy  : (daily_rate − rate) × amount
    sell : (rate − daily_rate) × amount
سود کل = کارمزد + اختلاف نرخ
```

مرتب‌سازی `lineItems` نزولی بر اساس سود؛ گروه‌بندی بر اساس `type` و `currency`.

### تفکیک سند — `documentBaseBalances` و `groupByDocument`

`groupByDocument` ردیف‌ها را با `document_no` (و در نبود آن `id`) گروه می‌کند؛ همین کلید در صفحهٔ
دفتر روزنامه برای نمایش سند و ابطال استفاده می‌شود.

## ۴. چرخهٔ حیات سند در A1

| رویداد | ستون‌ها | نتیجه |
| --- | --- | --- |
| ثبت | `created_at`, `registered_by`, `doc_number`, `client_operation_id` | سند `posted` |
| ویرایش | `edited`, `edited_date`, `edit_note`, `edited_by_name` | سند می‌ماند، اثر ویرایش ثبت می‌شود |
| حذف نرم | `deleted=true`, `deleted_date`, `deleted_by_name`, `delete_note` | ردیف دفتر حفظ می‌شود |
| ابطال | `reversed=true`, `reversed_date`, `reversed_by`, `reverse_reason` | سند معکوس |
| ضد تکرار | `idempotency_keys.client_operation_id` یکتا + `exchange_code` در کلید | تکرار عملیات، سند دوم نمی‌سازد |

## ۵. وضعیت فعلی در این پروژه (بدون ادعای انطباق کامل)

| عملیات A1 | معادل فعلی | انطباق |
| --- | --- | --- |
| `buildDadogereft` | `buildCashMovement` (دریافت/پرداخت) | توازن درست، نام نوع سند متفاوت |
| `buildTrade` | `buildTradePosting` | کارمزد به‌صورت درآمد ثبت می‌شود؛ اختلاف نرخ روز محاسبه نمی‌شود |
| `buildInternalTransfer` | `buildCashMovement` + حالت انتقال | معادل تقریبی |
| `buildTransferSend/Receive` | `buildTransferPosting` | کارمزد دریافت طبق A1 معکوس نیست |
| `buildTransferExecute` | فقط تغییر وضعیت | **سند اجرا ساخته نمی‌شود** |
| `buildConvert` | `buildConvertPosting` | `Conversion` پر نمی‌شود |
| `buildOpenBalance` | سند نوع `opening` در `Cash.jsx` | معادل تقریبی |
| `buildManualVoucher` | ندارد | — |
| `trialBalanceBase` | `trialBalance()` در `queries.js` | تبدیل ارز با `rate` سند، نه `app_settings` |
| `computeProfit` | `profitAndLoss()` | فقط کارمزد؛ اختلاف نرخ ندارد |
| `idempotency` | ندارد | ثبت تکراری ممکن است |

این تفاوت‌ها در `A1_COMPATIBILITY_REPORT.md` به‌عنوان «تعارض باز» ثبت شده‌اند و **تصمیم نهایی
برای جایگزینی موتور A1 گرفته نشده است**.