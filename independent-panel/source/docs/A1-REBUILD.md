# بازسازی پیش‌نمایش مستقل A1 — وضعیت و نقشه اجرایی

این سند وضعیت انتقال مستقیم سورس A1 به پیش‌نمایش را ثبت می‌کند. مرجع همهٔ تصمیم‌ها
`reference/A1-extracted-source-temp/` و `reference/A1-source-package/` است که فقط‌خواندنی مانده‌اند.

## ۱. مرز ذخیره‌سازی (IndexedDB)

- `src/a1/lib/db.js` تنها نقطهٔ تماس با IndexedDB است. نام ۶۲ جدول مستقیماً از
  `src/data/project-transfer-schema.json` سورس A1 گرفته شده است (بدون پیشوند `public.`).
- نوشتن سند و ردیف‌های دفتر در یک تراکنش `readwrite` انجام می‌شود (`writeTx`).
  اگر هر مرحله شکست بخورد، تراکنش لغو می‌شود و سند نیمه‌کاره باقی نمی‌ماند.
- اعتبارسنجی توازن پیش از نوشتن انجام می‌شود؛ خطای «سند نامتوازن است» همان قاعدهٔ A1 است.
- ابطال سند با سند معکوس انجام می‌شود؛ ردیف‌های اصلی حذف نمی‌شوند (رفتار A1).
- مانده‌ها از ردیف‌های دفتر محاسبه می‌شوند، نه از جدول ماندهٔ جدا.
- `src/a1/lib/seed.js` فقط دادهٔ ساختگی می‌سازد؛ همهٔ رکوردها `is_demo: true` دارند.
- هیچ درخواستی به Supabase، RPC یا دامنهٔ A1 ارسال نمی‌شود؛ `@supabase/supabase-js` در این مسیر وارد نشده است.

## ۲. نشست نمایشی

- `src/a1/lib/demoAuth.jsx` قرارداد `AuthContext` سورس A1 را حفظ می‌کند
  (`user`, `isAuthenticated`, `isLoadingAuth`, `logout`) اما نشست فقط در `localStorage` محلی است.
- پنج حساب نمایشی: سازنده، مدیر صرافی، صراف، کارمند، مشتری. بدون رمز، OTP یا توکن.
- `src/a1/shell/A1Guard.jsx` معادل `ProtectedRoute` سورس A1 است (`requiredRole`, `allowedRoles`).

## ۳. درخت مسیرهای منتقل‌شده (مبنا: `src/App.jsx` سورس A1)

عمومی: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/setup-database`, `/assistant`

پنل صراف (`A1Layout`): `/dashboard`, `/v21`, `/customers`, `/customers/:id`, `/dadogereft`, `/trade`,
`/transfers/:direction`, `/cash`, `/bank`, `/currencies`, `/reports`, `/profit-loss`, `/settings`,
`/transfer-book`, `/journal`, `/general-ledger`, `/journal-entry`, `/balance-sheet`, `/reconciliation`,
`/convert`, `/online-products`, `/payment-gateway`, `/online-products/wallet`, `/online-products/recharge`,
`/online-products/games`, `/agents`, `/debtors`, `/notifications`, `/agency-network`, `/agency`, `/chat`,
`/chat/group/:id`, `/sarraaf-market`, `/sarraaf-chat`, `/backup`, `/support`, `/enterprise/:moduleKey`

سازنده: `/builder`, `/main-settings` — مشتری: `/customer` و ۱۴ مسیر زیرمجموعه —
فروشنده و رسید: `/seller`, `/receipt`

## ۴. پوسته و اجزای منتقل‌شده

| فایل پیش‌نمایش | منبع A1 | وضعیت |
|---|---|---|
| `src/a1/shell/A1Layout.jsx` | `components/sarraaf/Version21Layout.jsx` | فهرست کامل ماژول‌ها، گروه‌ها، آیکون‌ها، سایدبار، نوار موبایل و صفحهٔ «همه بخش‌ها» منتقل شده |
| `src/a1/shell/A1Guard.jsx` | `components/ProtectedRoute.jsx` + `lib/rbac.js` | منتقل شده |
| `src/a1/shell/A1CustomerLayout.jsx` | `components/CustomerLayout.jsx` | پوسته و نوار پایین مشتری منتقل شده |
| `src/a1/components/Pieces.jsx` | `components/sarraaf/Pieces.jsx` | منتقل شده (رنگ‌های success/warning به emerald/amber نگاشته شد) |
| `src/a1/components/Fields.jsx` | `components/sarraaf/Fields.jsx` | `AmountInput` و `CurrencySelect` منتقل شدند (انتخابگر ورق با `<select>` جایگزین شد) |
| `src/a1/pages/Cash.jsx` | `pages/Cash.jsx` | کاملاً منتقل شده؛ فقط مسیر واردات لایهٔ محلی تغییر کرده |
| `src/a1/pages/A1Dashboard.jsx` | میز کار | نمای میانی: چون `Version21Workspace` (۷۰۳ خط) منتقل نشده، این صفحه فقط دادهٔ دفتر را خلاصه می‌کند |

## ۵. صفحات منتقل‌نشده

هر مسیر منتقل‌نشده در `src/App.jsx` به `src/a1/pages/PendingSource.jsx` می‌رسد و مسیر دقیق فایل A1 خود را
(از `src/a1/data/a1SourceMap.js`) نشان می‌دهد. هیچ رابط ساختگی جای صفحهٔ واقعی ساخته نشده است.

اولویت انتقال بعدی:
1. `pages/Trade.jsx` + `lib/useTradeData.js` + `lib/ledger.js`
2. `pages/Customers.jsx` + `components/sarraaf/v21/Version21Customers.jsx`
3. `pages/Journal.jsx` + `pages/GeneralLedger.jsx` (+ `lib/ledger.js`)
4. `pages/Currencies.jsx`, `pages/Bank.jsx`, `pages/Agents.jsx`, `pages/Debtors.jsx`
5. `components/sarraaf/Version21Workspace.jsx` برای میز کار واقعی
6. پنل مشتری و سازنده

## ۶. محدودیت‌ها و اختلاف‌های ثبت‌شده

- اختلاف نام RPCهای `ledgerApi` با تعریف‌های SQL موجود در بستهٔ A1 هنوز حل نشده؛ رفتار مالی هر مسیر فقط پس از تطبیق ثبت می‌شود.
- جدول `users` محلی ساختگی است و با `User` پلتفرم جایگزین نشده است.
- سیاست‌های RLS سورس A1 در این نسخه اجرا نمی‌شوند؛ مجوزها فقط در سطح مسیر و نقش اعمال می‌شوند.
- موجودیت‌ها و کدهای پیش‌نمایش قبلی (`base44/entities/*`, `src/lib/accounting/*`, ۲۱ صفحهٔ قبلی) بدون تغییر باقی مانده‌اند و دیگر در مسیرها استفاده نمی‌شوند.
- هیچ فایلی در `reference/` تغییر نکرده و هیچ اتصالی به دیتابیس واقعی A1 برقرار نشده است.
