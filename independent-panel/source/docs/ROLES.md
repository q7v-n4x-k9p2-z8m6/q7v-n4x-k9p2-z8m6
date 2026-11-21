# نقش‌ها و دسترسی‌ها

منبع: `src/lib/rbac.js` و `src/App.jsx` در ZIP سورس A1 (خوانده‌شده، بدون تغییر).
در این نسخه نقش‌ها **شبیه‌سازی** می‌شوند؛ احراز هویت واقعی وجود ندارد و این امنیت نیست.

## ۱. نقش‌های واقعی A1

| نقش | سطح | برچسب در A1 | پنل |
| --- | --- | --- | --- |
| `creator` | 100 | سازنده سیستم | builder |
| `admin` | 80 | مدیر صرافی | sarraaf |
| `sarraaf` | 50 | صراف | sarraaf |
| `employee` | 30 | کارمند صراف | sarraaf |
| `customer` | 10 | مشتری | customer |
| `user` | 0 | کاربر عادی | public |

- `users.role` در دیتابیس مقدار پیش‌فرض `customer` دارد.
- در بک‌اند نام `exchange` به‌کار می‌رود و در فرانت با `normalizeRole()` به `sarraaf` نگاشت می‌شود.
- `seller` نقش جدول `users` نیست؛ صفحهٔ `/seller` برای هر کاربر احراز‌شده باز است و دسترسی فروشنده
  را خود کامپوننت بررسی می‌کند.
- نقش `admin` در A1 واقعی است، اما **نقش اصلی و همه‌توان نیست**: `/builder` و `/main-settings` فقط
  برای `creator` است (`rbac.js` و `AdminRoute`).

## ۲. گیت‌های مسیر در A1

| گیت | مسیرها | نقش‌های مجاز |
| --- | --- | --- |
| ProtectedRoute (پنل صراف) | `/dashboard` … `/support` | `creator, admin, sarraaf, employee` |
| ProtectedRoute تودرتو | `/enterprise/:moduleKey` | `creator, admin, sarraaf` |
| AdminRoute | `/builder`, `/main-settings` | `creator` (+ مدیران مجاز در AdminRoute) |
| ProtectedRoute requiredRole | `/customer/*` | `customer` |
| ProtectedRoute ساده | `/seller`, `/receipt`, `/assistant` | هر کاربر احراز‌شده |
| عمومی | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/setup-database`, `/` | همه |

## ۳. ماتریس مسیر↔نقش (از `ROUTE_PERMISSIONS`)

| مسیر | creator | admin | sarraaf | employee | customer |
| --- | --- | --- | --- | --- | --- |
| `/builder`, `/main-settings` | ✔ | ✘ | ✘ | ✘ | ✘ |
| `/currencies`, `/agents`, `/agency-network`, `/backup`, `/balance-sheet`, `/reconciliation`, `/journal`, `/general-ledger`, `/journal-entry`, `/profit-loss`, `/debtors` | ✔ | ✔ | ✔ | ✘ | ✘ |
| `/dashboard`, `/customers`, `/dadogereft`, `/trade`, `/transfers/send`, `/transfers/receive`, `/cash`, `/bank`, `/reports`, `/transfer-book`, `/convert`, `/support`, `/assistant`, `/notifications`, `/settings` | ✔ | ✔ | ✔ | ✔ | ✘ |
| `/sarraaf-market`, `/sarraaf-chat`, `/chat`, `/agency`, `/online-products*`, `/payment-gateway` | ✔ | ✔ | ✔ | ✘ | ✘ |
| `/receipt` | ✔ | ✔ | ✔ | ✔ | ✔ |
| `/customer/*` | ✘ | ✘ | ✘ | ✘ | ✔ |

## ۴. منوی هر نقش

| نقش | منو |
| --- | --- |
| `creator` | همهٔ ۲۸ آیتم عملیاتی + پنل سازنده + تنظیمات اصلی |
| `admin` | همان ۲۸ آیتم عملیاتی بدون builder/main-settings |
| `sarraaf` | عملیاتی + اجتماعی + ۳۱ آیتم حسابداری تکمیلی (`chart_of_accounts`, `trial_balance`, `cash_flow`, `cost_centers`, `fiscal_periods`, `period_close`, `tax`, `kyc`, …) |
| `employee` | `dashboard, customers, dadogereft, trade, transfer_send, transfer_receive, cash, reports, transfer_book, convert, support, assistant, notifications` |
| `customer` | `home, wallet, recharge, games, transfer, account, orders, messages, support, notifications, profile` |

منوی تنظیمات: creator/admin/sarraaf → ارزها، محصولات آنلاین، اعلان‌ها، بکاپ؛ employee → فقط اعلان‌ها.

## ۵. پیاده‌سازی در این نسخه

- `src/lib/rbac.js`: همان پنج نقش، همان سطوح، همان دسته‌بندی مجوزها (بدون نقش `user` عمومی).
- `src/components/auth/RequirePermission.jsx`: گیت مسیر بر اساس مجوز.
- `src/components/shell/TopBar.jsx`: انتخاب نقش برای **تست UI**.
- مجوزهای موجود: `dashboard.view, customers.view/manage, trade.post, cash.view/post, bank.view/post,
  transfers.view/post, convert.post, journal.view/post, ledger.view, reports.view, profit.view,
  debtors.view, agents.view/manage, users.view/manage, settings.view/manage, audit.view, builder.view,
  roadmap.view, customer.portal`.

### تفاوت‌ها با A1 (باید در تطبیق نهایی حل شود)

1. در A1 دسترسی «همه‌چیز» برای `admin` و `sarraaf` در منو برابر است؛ در این نسخه چند عمل نوشتن
   (`journal.post`, `agents.manage`, `settings.manage`) به مدیران محدود شده و برای `sarraaf` بسته است.
   این یک **سخت‌گیری افزوده** است، نه رفتار A1.
2. مجوزهای بخش‌به‌بخش جدول `user_permissions` (can_view/can_create/… ) در این نسخه استفاده نمی‌شوند.
3. `feature_settings` (وضعیت هر قابلیت به‌ازای هر صرافی) در این نسخه خوانده نمی‌شود؛ وضعیت‌ها در کد ثابت‌اند.
4. سطوح اشتراک `free/paid` و `level_1/2/3_enabled` در `feature_settings` هیچ معادلی در UI ندارند.

> **هشدار امنیتی:** در این نسخه RLS موجودیت‌ها باز است و هیچ کاربر واقعی وجود ندارد. برای هر
> استفادهٔ واقعی، ورود و جداسازی داده باید پیش از هر چیز اضافه شود.
