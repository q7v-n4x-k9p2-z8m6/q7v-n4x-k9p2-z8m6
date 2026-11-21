# فهرست فایل‌ها

همهٔ مسیرها نسبت به ریشهٔ پروژه هستند. ستون «وضعیت»: جدید / اصلاح‌شده / حذف‌شده.

## موجودیت‌های داده (۶۲ فایل = ۶۱ جدول A1 + User)

نگاشت کامل جدول‌به‌موجودیت در `docs/DATABASE_ARCHITECTURE.md`:

```
AgencyLink AppAuthSecret AppSetting AuditLog BackupRecord BankAccount BankGateway BankTransaction
BuilderAccess ChargeOrder ChartOfAccount ChatGroup ChatGroupMember ChatMessage Conversion CostCenter
Customer CustomerLink CustomerNotification CustomerTransferRequest DemoPreviewRecord Document EmailOtp
EmailVerificationRequest Employee ErrorReport Exchange FeatureSetting FiscalPeriod IdempotencyKey
JournalEntry Language LayoutHexReference LedgerEntry ManualVerificationRequest MessageReport
OnlineProduct OnlineRequest Origin Package PaymentRecord PaymentTransaction PlanQuota PricingPlan
Rate RechargeOrder Referral Rule Safe Seller SupportMessage SupportTicket Transfer TreasuryTransaction
User UserFeedback UserNotification UserPermission Wallet WalletTopupRequest WalletTransaction
WalletWithdrawalRequest
```

موجودیت‌های اختراعی نسخهٔ قبل که جدول A1 نداشتند حذف شدند: `Agent → Origin`، `Currency → Rate`، و
`Remittance`, `CashAccount`, `Transaction`.

## هستهٔ منطق (جدید)

| مسیر | مسئولیت | وابستگی |
| --- | --- | --- |
| `src/lib/config.js` | اطلاعات محیط، ارز پایه، کلیدهای ذخیره‌سازی | — |
| `src/lib/rbac.js` | نقش‌ها، سطوح و ماتریس مجوزها | — |
| `src/lib/navigation.js` | فهرست بخش‌ها، مسیر، آیکون و مجوز ناوبری | rbac |
| `src/lib/i18n.jsx` | Provider زبان، دیکشنری fa/en، تنظیم جهت | config |
| `src/lib/role-context.jsx` | نقش فعال شبیه‌سازی‌شده | rbac، config |
| `src/lib/format.js` | قالب‌بندی عدد، مبلغ، تاریخ شمسی، تاریخ امروز | — |
| `src/lib/roadmap.js` | نگاشت قابلیت‌های A1 و ابهام‌ها | — |
| `src/lib/accounting/chart.js` | کدینگ حساب‌ها، انواع سند، برچسب وضعیت‌ها | — |
| `src/lib/accounting/postings.js` | سازندگان سند و اعتبارسنجی توازن | chart، config |
| `src/lib/accounting/posting-engine.js` | ثبت سند، شماره‌گذاری، سند معکوس، رویداد | postings، SDK |
| `src/lib/accounting/queries.js` | مانده‌ها، تراز آزمایشی، سود و زیان | postings |

## Hooks (جدید)

| مسیر | مسئولیت |
| --- | --- |
| `src/hooks/useRecords.js` | بارگذاری موجودیت، دفتر کل و ارزها |
| `src/hooks/useCounters.js` | فهرست یکپارچهٔ صندوق و بانک به‌عنوان طرف حساب |

## اجزای رابط (جدید)

| مسیر | مسئولیت |
| --- | --- |
| `src/components/shell/AppShell.jsx` | چیدمان اصلی با `<Outlet />` |
| `src/components/shell/SideNav.jsx` | منوی دسکتاپ بر اساس مجوز نقش |
| `src/components/shell/TopBar.jsx` | هدر، نشان محیط آزمایشی، تغییر نقش و زبان |
| `src/components/shell/MobileTabs.jsx` | ناوبری پایین موبایل |
| `src/components/ui-kit/PageHeader.jsx` | سرصفحهٔ صفحات |
| `src/components/ui-kit/StatCard.jsx` | کارت آماری |
| `src/components/ui-kit/StatusBadge.jsx` | نشان وضعیت با رنگ معنایی |
| `src/components/ui-kit/EmptyState.jsx` | حالت خالی |
| `src/components/ui-kit/DataTable.jsx` | جدول واکنش‌گرا (جدول دسکتاپ، کارت موبایل) |
| `src/components/ui-kit/SectionCard.jsx` | کارت بخش با سرصفحه و اکشن |
| `src/components/forms/FormField.jsx` | فیلد فرم، ورودی، انتخاب، اکشن‌ها، اعلان |
| `src/components/forms/CounterSelect.jsx` | انتخاب صندوق/بانک با گروه‌بندی |
| `src/components/customers/CustomerDialog.jsx` | فرم ایجاد/ویرایش مشتری + سند مانده آغازین |
| `src/components/auth/RequirePermission.jsx` | محافظ مسیر بر اساس مجوز |

## صفحه‌ها (۲۱ فایل جدید)

| مسیر | مسئولیت |
| --- | --- |
| `src/pages/Dashboard.jsx` | میزکار: آمار، میان‌برها، آخرین اسناد، موجودی صندوق |
| `src/pages/Customers.jsx` | فهرست، جستجو، فیلتر و ثبت مشتری |
| `src/pages/CustomerDetail.jsx` | پروفایل مشتری، مانده، گردش حساب و اسناد |
| `src/pages/Trade.jsx` | ثبت خرید/فروش ارز با پیش‌نمایش سند |
| `src/pages/Cash.jsx` | دخل، خرج، هزینه، دریافت و پرداخت |
| `src/pages/Bank.jsx` | تعریف حساب بانکی و گردش |
| `src/pages/Transfers.jsx` | حواله ارسالی/دریافتی و پیگیری وضعیت |
| `src/pages/Convert.jsx` | تبدیل ارز بین صندوق‌ها |
| `src/pages/Journal.jsx` | دفتر روزنامه، جزئیات سند و ابطال |
| `src/pages/GeneralLedger.jsx` | مانده حساب‌ها و گردش تجمعی |
| `src/pages/TrialBalance.jsx` | تراز آزمایشی و کنترل توازن |
| `src/pages/Reports.jsx` | گزارش معاملات، صندوق، حواله و موجودی |
| `src/pages/ProfitLoss.jsx` | سود و زیان بازه‌ای |
| `src/pages/Debtors.jsx` | مشتریان بدهکار |
| `src/pages/Agents.jsx` | نمایندگی‌ها و مبدأها |
| `src/pages/Users.jsx` | نقش‌ها، ماتریس دسترسی و کاربران نمونه |
| `src/pages/Audit.jsx` | رویدادهای سیستم |
| `src/pages/Settings.jsx` | اطلاعات محیط، زبان، ارزها، پاک‌سازی داده نمونه |
| `src/pages/Builder.jsx` | پنل سازنده: وضعیت، حجم داده، سلامت ساختار |
| `src/pages/Roadmap.jsx` | نگاشت قابلیت‌ها، ابهام‌ها و وضعیت داده |
| `src/pages/CustomerPortal.jsx` | نمای محدود مشتری |

## اصلاح‌شده

| مسیر | تغییر |
| --- | --- |
| `src/App.jsx` | افزودن Providerهای زبان و نقش، پوستهٔ مشترک، ۲۱ مسیر محافظت‌شده |

## حذف‌شده (نمونهٔ اولیهٔ بی‌استفاده)

`src/pages/Home.jsx`، `src/pages/BlankStart.jsx`، `src/pages/home-dashboard.css`،
`src/components/workspace/*` (۶ فایل)، `src/components/shell/DesktopMenuBar.jsx`،
`DesktopRibbon.jsx`، `DesktopStatusBar.jsx`، `MobileTopBar.jsx`، `MobileBottomNav.jsx`،
`MobileActionBar.jsx`، `AllSectionsSheet.jsx`، `ConnectionPill.jsx`،
`src/components/KeyGuide.jsx`، `src/components/ModuleStructure.jsx`،
`src/lib/navConfig.js`، `src/lib/modules.js`، `src/lib/seedRecords.js`،
`src/lib/appInfo.js`، `src/lib/options.js`، `src/hooks/use-online-status.js`.

این حذف هیچ قابلیت زنده‌ای را از بین نبرد؛ همهٔ آن‌ها بخشی از نمونهٔ موقت پیشین بودند.

## مستندات (جدید)

`docs/README.md`، `docs/ARCHITECTURE.md`، `docs/ROLES.md`، `docs/WORKFLOWS.md`،
`docs/A1-MAPPING.md`، `docs/DECISIONS.md`، `docs/FILE-MANIFEST.md`، `docs/TEST-REPORT.md`.

## فایل‌های مرجع (دست‌نخورده)

`reference/A1-source-package/01-full-source-main.zip`،
`reference/A1-source-package/02-database-structure.json`،
`reference/A1-source-package/03-project-transfer-center.jsx`.

## دستور اجرا

```bash
npm install
npm run dev
npm run build
```
