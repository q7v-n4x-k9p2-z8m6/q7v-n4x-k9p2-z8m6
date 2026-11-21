# بازسازی پیش‌نمایش مستقل A1 — وضعیت و نقشه اجرایی

این سند وضعیت انتقال مستقیم سورس A1 به پیش‌نمایش را ثبت می‌کند. مرجع همهٔ تصمیم‌ها
`reference/A1-extracted-source-temp/` و `reference/A1-source-package/` است که فقط‌خواندنی مانده‌اند.

## ۱. مرز ذخیره‌سازی (IndexedDB)

- `src/a1/lib/db.js` تنها نقطهٔ تماس با IndexedDB است. نام ۶۲ جدول مستقیماً از
  `src/data/project-transfer-schema.json` سورس A1 گرفته شده است (بدون پیشوند `public.`).
- نوشتن سند و ردیف‌های دفتر در یک تراکنش `readwrite` انجام می‌شود (`writeTx`).
- اعتبارسنجی توازن پیش از نوشتن انجام می‌شود؛ ابطال سند با سند معکوس است و ردیف اصلی حفظ می‌شود.
- مانده‌ها از ردیف‌های دفتر محاسبه می‌شوند، نه از جدول ماندهٔ جدا.
- `src/a1/lib/seed.js` فقط دادهٔ ساختگی می‌سازد؛ همهٔ رکوردها `is_demo: true` دارند.
  کدینگ حساب‌ها همان ۱۳ حساب پایهٔ `seedVersion21BaseAccounts` سورس A1 است
  (۱۰۰۰ تا ۵۰۲۰ با والد واقعی) تا سود و زیان و بیلانس میز کار محاسبه شوند.
- نام پایگاه دادهٔ محلی به `a1_local_preview_v21` ارتقا یافت تا کدینگ و اسناد نمایشی با
  ساختار واقعی A1 هم‌تراز شوند؛ هیچ دادهٔ واقعی جابه‌جا نشده است.
- هیچ درخواستی به Supabase، RPC یا دامنهٔ A1 ارسال نمی‌شود.

## ۲. میز کار واقعی نسخهٔ ۲۱ (تکمیل‌شده)

| فایل پیش‌نمایش | منبع A1 | توضیح |
|---|---|---|
| `src/a1/pages/A1Workspace.jsx` | `components/sarraaf/Version21Workspace.jsx` | نوار عنوان لپ‌تاپ، منوهای فایل/تعریف/عملیات/حسابات/گزارشات/تنظیمات/تکمیلی، نوار ابزار آیکونی دسکتاپ و موبایل، مرکز عملیات، جدول داده، فرم‌ها، مودال‌ها، نوار وضعیت، فهرست «همه امکانات» و کاشی‌های ۲۴ ماژول |
| `src/a1/components/v21/HomeCenter.jsx` | بخش home همان فایل | «مرکز عملیات صرافی» نسخهٔ دسکتاپ و موبایل با آمار، گروه‌ها و عملیات سریع |
| `src/a1/components/v21/DataTable.jsx` | `Field` / `DataTable` / `Tile` | جدول دسکتاپ و کارت‌های موبایل، فیلد فرم، کاشی ماژول |
| `src/a1/lib/v21Data.js` | `Version21DataAdapter.js` | نگاشت مشتری، نمایندگی، صندوق، بانک، ارز، کدینگ، سند، دفتر، حواله، تبدیل، گزارش، سوابق و سود/زیان از IndexedDB |
| `src/a1/lib/v21Write.js` | `Version21WriteAdapter.js` | ذخیره، ویرایش، ابطال، غیرفعال‌سازی، کدینگ پایه و ثبت خطا با همان اعتبارسنجی‌ها و سندهای دوطرفه |
| `src/a1/lib/v21Rules.js` | `Version21AccountingRules.js` | قواعد خالص: توازن، تاریخ سند، ماندهٔ گردشی طرف‌حساب، جمع گردش صندوق و بانک |
| `src/a1/lib/v21LocalStore.js` | `Version21LocalStore.js` | نگه‌داری ماژول فعال و فیلترها در حافظهٔ همین مرورگر |
| `src/a1/lib/v21Demo.js` | `Version21DemoAdapter.js` | رکورد موقت فضای نمایشی روی IndexedDB |
| `src/a1/lib/permissions.js` | `lib/permissions.js` | `hasPermission` و سلسله‌مراتب نقش |
| `src/a1/components/SarraafLogo.jsx` | `components/SarraafLogo.jsx` | لوگوی سکه و فلش رشد |
| `src/a1/components/LanguageSettings.jsx` | `components/sarraaf/LanguageSettings.jsx` | انتخاب زبان با چهار گزینهٔ A1 |

طرح ظاهری میز کار با همان فایل‌های CSS سورس A1 بارگذاری می‌شود
(`version21-responsive-layout.css` و `version21-laptop-reference.css` مستقیماً import شده‌اند).

### ماژول‌های قابل استفاده در میز کار (با دادهٔ آزمایشی)
مرکز عملیات، تعریف مشتریان، دفتر حساب مشتریان، تعریف نمایندگی‌ها، دفتر حساب نمایندگی‌ها،
صندوق‌ها و موجودی، بانک و چک، خرید و فروش اسعار، دفتر حواله‌ها، مصارف و پرداخت‌ها،
دفتر روزنامچه، دفتر کل، کدینگ حساب‌ها، تعریف اسعار، گزارش عملیات، مفاد و زیان،
سوابق فعالیت، گزارش خطاها، بیلانس عمومی، بدهکاران (انتقال به مسیر)، گروه و چت،
هوش مصنوعی، محصولات آنلاین و زبان برنامه.

## ۳. درخت مسیرها

عمومی: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/setup-database`, `/assistant`

پنل صراف (`A1Layout`): `/dashboard` (میز کار واقعی)، `/cash` (صفحهٔ صندوق منتقل‌شده) و مسیرهای
`/customers`, `/customers/:id`, `/dadogereft`, `/trade`, `/transfers/:direction`, `/bank`,
`/currencies`, `/reports`, `/profit-loss`, `/settings`, `/transfer-book`, `/journal`,
`/general-ledger`, `/journal-entry`, `/balance-sheet`, `/reconciliation`, `/convert`,
`/online-products`, `/payment-gateway`, `/online-products/wallet`, `/online-products/recharge`,
`/online-products/games`, `/agents`, `/debtors`, `/notifications`, `/agency-network`, `/agency`,
`/chat`, `/chat/group/:id`, `/sarraaf-market`, `/sarraaf-chat`, `/backup`, `/support`,
`/enterprise/:moduleKey` که تا انتقال صفحهٔ واقعی، نام و مسیر فایل A1 خود را نشان می‌دهند.

سازنده: `/builder`, `/main-settings` — مشتری: `/customer` و ۱۴ مسیر زیرمجموعه —
فروشنده و رسید: `/seller`, `/receipt`

## ۴. مراحل بعدی

1. `pages/Trade.jsx` + `lib/useTradeData.js`
2. `pages/Customers.jsx` + `components/sarraaf/v21/Version21Customers.jsx`
3. `pages/Journal.jsx`, `pages/GeneralLedger.jsx`, `pages/TransferBook.jsx`
4. `pages/Bank.jsx`, `pages/Currencies.jsx`, `pages/Agents.jsx`, `pages/Debtors.jsx`
5. اتصال مسیرهای سایدبار به ماژول‌های میز کار (`/dashboard?module=…`) مطابق سورس A1
6. پنل مشتری، سازنده و فروشنده

## ۵. محدودیت‌های ثبت‌شده

- جدول `users` محلی ساختگی است و با `User` پلتفرم جایگزین نشده است.
- سیاست‌های RLS سورس A1 در این نسخه اجرا نمی‌شوند؛ مجوزها فقط در سطح مسیر، نقش و جدول
  `user_permissions` کارمند اعمال می‌شوند.
- اختلاف نام RPCهای `ledgerApi` با تعریف‌های SQL موجود در بستهٔ A1 هنوز حل نشده است.
- فایل‌های مرجع تغییر نکرده‌اند و هیچ اتصالی به دیتابیس واقعی A1 برقرار نشده است.