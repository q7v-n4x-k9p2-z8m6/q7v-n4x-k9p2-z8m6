# نگاشت قابلیت‌به‌قابلیت A1 → نسخهٔ مرجع Base44

منبع بررسی: `reference/A1-source-package/01-full-source-main.zip` (استخراج‌شده و جستجوی سراسری روی
`src/App.jsx`, `src/pages`, `src/components`, `src/lib`)، `02-database-structure.json`، `03-project-transfer-center.jsx`.

ستون «وضعیت در A1» فقط از خود سورس: مسیر ثبت‌شده در `App.jsx` + تعریف `FEATURE_CATALOG` در
`src/lib/features.js`. جای‌هایی که `default_status: 'updating'` دارند، در A1 هم «در حال تکمیل» هستند.

ستون «وضعیت در Base44» فقط بر اساس کد واقعی این پروژه. نبود صفحه یعنی «بدون صفحه»، نه «انجام‌شده».

## ۱. احراز هویت و ورود

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| ورود usuario/password | `pages/Login.jsx`, `lib/directAuth.js`, `lib/supabaseAuth.js` | فعال | صفحهٔ Login پیش‌فرض Base44 | بدون تغییر (ورود واقعی) | مدل احراز A1 (Supabase + JWT + app_auth_secret) در Base44 بازتولید نشده |
| ثبت‌نام + OTP ایمیل | `Register.jsx`, `lib/emailVerification.js`, جدول `email_otps` / `email_verification_requests` | فعال | Register پیش‌فرض + موجودیت `EmailOtp`, `EmailVerificationRequest` | فقط مدل داده | جریان OTP اختصاصی A1 پیاده نشده |
| بازیابی رمز | `ForgotPassword.jsx`, `ResetPassword.jsx` | فعال | همان صفحه‌های Base44 | بدون تغییر | — |
| تأیید دستی ثبت‌نام | `lib/manualVerification.js`, جدول `manual_verification_requests` | فعال | `ManualVerificationRequest` | فقط مدل داده | بدون صفحه |
| قفل PIN/AppLock | `components/PinLockGate.jsx`, `AppLock.jsx`, `lib/pinLock.js` | فعال | — | پیاده نشده | قابلیت امنیتی موبایل A1 |
| نگه‌داری نشست/توکن محلی | `lib/authContext`, `portableAuth`, `offlineAuth` | فعال | AuthProvider بستر | بدون تغییر | رفتار آفلاین A1 ندارد |

## ۲. پنل صراف — عملیات روزانه

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| داشبورد | `pages/Dashboard.jsx` (مسیر `/dashboard`, FeatureGate) | فعال | `pages/Dashboard.jsx` `/` | پیاده‌شده | کارت‌های A1 کامل پوشش داده نشده |
| مشتریان | `pages/Customers.jsx` | فعال | `pages/Customers.jsx` | پیاده‌شده | `name` A1 با alias `full_name` |
| جزئیات مشتری | `pages/CustomerDetail.jsx` | فعال | `pages/CustomerDetail.jsx` | پیاده‌شده | گردش بر اساس `LedgerEntry` است نه `documents` A1 |
| داد و گرفت | `pages/Dadogereft.jsx`, `buildDadogereft` | فعال | بخشی از `pages/Cash.jsx` (دریافت/پرداخت) | جزئی | صفحهٔ مستقل `dadogereft` ندارد |
| خرید/فروش ارز | `pages/Trade.jsx`, `buildTrade` | فعال | `pages/Trade.jsx` | پیاده‌شده | نوع سند متفاوت (`trade_buy` در برابر `buy`) |
| حواله ارسال | `pages/Transfer.jsx` (مسیر `/transfers/:direction`), `buildTransferSend` | فعال | `pages/Transfers.jsx` | پیاده‌شده | مسیر A1 پارامتری است؛ در اینجا یک صفحه با دو تب |
| حواله دریافت | `buildTransferReceive` | فعال | همان صفحه | پیاده‌شده | کارمزد حواله دریافت در موتور A1 معکوس ثبت می‌شود |
| اجرای حواله | `buildTransferExecute`, وضعیت‌های transfers | فعال | تغییر وضعیت در `Transfers.jsx` بدون سند اجرا | جزئی | سند `transfer_execute` ساخته نمی‌شود |
| صندوق (دریافت/پرداخت/هزینه) | `pages/Cash.jsx`, `buildInternalTransfer`, `buildOpenBalance` | فعال | `pages/Cash.jsx` | پیاده‌شده | — |
| بانک | `pages/Bank.jsx`, جدول `bank_transactions` | فعال | `pages/Bank.jsx` | جزئی | گردش بانک از `Document` خوانده می‌شود؛ `BankTransaction` بدون استفاده |
| تبدیل ارز | `pages/CurrencyConvert.jsx`, `buildConvert`, جدول `conversions` | فعال | `pages/Convert.jsx` | پیاده‌شده | `Conversion` پر نمی‌شود |
| ارزها و نرخ | `pages/Currencies.jsx`, جدول `rates` | فعال | بخش «ارزها و نرخ» در `Settings.jsx` | جزئی | صفحهٔ مستقل `/currencies` ندارد؛ نمایش نرخ به مشتری/ناشناس ندارد |
| دفتر حواله | `pages/TransferBook.jsx` | فعال | — | بدون صفحه | — |
| بدهکاران | `pages/Debtors.jsx` | فعال | `pages/Debtors.jsx` | پیاده‌شده | — |
| نمایندگی‌ها | `pages/Agents.jsx`, جدول `origins` | فعال | `pages/Agents.jsx` روی `Origin` | پیاده‌شده | — |
| شبکهٔ نمایندگی و انتخابگر | `AgencyNetwork.jsx`, `AgencyChooser.jsx`, جدول `agency_links` | فعال | — | فقط مدل داده | صفحه ندارد |
| گزارش‌ها | `pages/Reports.jsx` | فعال | `pages/Reports.jsx` | پیاده‌شده | گزارش‌های A1 (کاردکس، ریز تراکنش‌ها) کامل نیست |
| سود و زیان | `pages/ProfitLoss.jsx`, `computeProfitDetailed` | فعال | `pages/ProfitLoss.jsx` | جزئی | فرمول A1 (کارمزد + اختلاف نرخ روز) پیاده نشده |
| رسید/چاپ | `pages/Receipt.jsx` | فعال | — | بدون صفحه | چاپ و PDF ندارد |

## ۳. پنل صراف — حسابداری

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| دفتر روزنامه + جزئیات سند | `pages/Journal.jsx` | فعال | `pages/Journal.jsx` | پیاده‌شده | انواع سند A1 نگاشت نشده |
| ابطال/سند معکوس | `reversed`, `reverse_reason`, `deleted` در `documents` | فعال | «سند معکوس» در Journal | پیاده‌شده | A1 هم soft delete دارد؛ پیاده نشده |
| سند دستی | `pages/JournalEntry.jsx`, `buildManualVoucher` | فعال | — | بدون صفحه | — |
| دفتر کل | `pages/GeneralLedger.jsx` | فعال | `pages/GeneralLedger.jsx` | پیاده‌شده | — |
| تراز آزمایشی | `trialBalanceBase` در `ledger.js` | فعال | `pages/TrialBalance.jsx` | پیاده‌شده | اختلاف محاسبهٔ نرخ ارز |
| ترازنامه | `pages/BalanceSheet.jsx` | **updating** (پیام: بدهی‌ها و سرمایه ناقص) | — | بدون صفحه | در A1 هم کامل نیست |
| مغایرت‌گیری | `pages/Reconciliation.jsx` | فعال | — | بدون صفحه | — |
| کدینگ حساب‌ها | `chart_of_accounts` + کلید `chart_of_accounts` | فعال (در منوی sarraaf) | `ChartOfAccount` | فقط مدل داده | صفحه ندارد |
| دفاتر معین/تفصیلی | `subsidiary_ledger` | فعال | — | پیاده نشده | — |
| گردش صندوق و بانک | `cash_flow` | فعال | گزارش موجودی در `Reports.jsx` | جزئی | — |
| مراکز هزینه | `cost_centers` | فعال | `CostCenter` | فقط مدل داده | — |
| دوره‌های مالی | `fiscal_periods` | فعال | `FiscalPeriod` | فقط مدل داده | — |
| بستن دوره | `period_close` | **updating** | — | بدون صفحه | در A1 هم کامل نیست |
| دارایی ثابت | `fixed_assets` | **updating** | — | بدون صفحه | — |
| بودجه | `budgets` | **updating** | — | بدون صفحه | — |
| خزانه‌داری | `treasury` + جدول `treasury_transactions` | فعال | `TreasuryTransaction` | فقط مدل داده | — |
| بین‌صرافی/چندشرکتی | `intercompany`, `multi_company` | **updating** | — | بدون صفحه | — |
| KYC/انطباق/حسابرسی | `kyc`, `compliance`, `audit_log` | `kyc/compliance` = updating؛ `audit_log` فعال | `pages/Audit.jsx` (رویدادها) | جزئی | صفحهٔ KYC ندارد؛ لاگ‌ها محلی است |

## ۴. محصولات آنلاین، کیف پول و پرداخت

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| محصولات آنلاین | `pages/OnlineProducts.jsx`, جدول `online_products` | فعال | `OnlineProduct` | فقط مدل داده | بدون صفحه |
| کیف پول صراف | `pages/sarraaf/SarraafWallet.jsx`, `wallets`, `wallet_transactions` | فعال | `Wallet`, `WalletTransaction` | فقط مدل داده | بدون صفحه |
| شارژ موبایل | `SarraafRecharge.jsx`, `recharge_orders` | **updating** | `RechargeOrder` | فقط مدل داده | در A1 هم تأیید نشده |
| UC پابجی | `SarraafGames.jsx`, `pubg_uc` | **updating** | — | بدون صفحه | — |
| درگاه پرداخت صراف | `pages/PaymentGateway.jsx`, `bank_gateways`, `payment_transactions` | **updating** | `BankGateway`, `PaymentTransaction` | فقط مدل داده | در A1 فعال نیست |
| پرداخت کارت‌به‌کارت/بانکی/پی‌پل/کریپتو | `FEATURE_CATALOG`: `payment_card`, `payment_bank`, `payment_paypal`, `payment_crypto` | **updating** | — | بدون صفحه | هیچ درگاه واقعی وصل نشده |
| درخواست شارژ کیف پول | `wallet_topup_requests` | فعال | `WalletTopupRequest` | فقط مدل داده | بدون صفحه |
| برداشت از کیف پول | `wallet_withdrawal.js`, `wallet_withdrawal_requests` | فعال | `WalletWithdrawalRequest` | فقط مدل داده | بدون صفحه |
| سفارش‌های مشتری | `customer/orders`, `charge_orders` | فعال | `ChargeOrder` | فقط مدل داده | بدون صفحه |

## ۵. اجتماعی، پیام و پشتیبانی

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| بازار نرخ صراف‌ها | `pages/SarraafMarket.jsx` (`sarraaf_market`) | فعال | — | بدون صفحه | — |
| چت صراف‌ها | `pages/SarraafChat.jsx` (`sarraaf_chat`) | فعال | — | بدون صفحه | — |
| گروه‌های چت | `ChatGroups.jsx`, `ChatGroupDetail.jsx`, `chat_*` | فعال | `ChatGroup`, `ChatGroupMember`, `ChatMessage` | فقط مدل داده | بدون صفحه |
| گزارش پیام | `message_reports` | فعال | `MessageReport` | فقط مدل داده | بدون صفحه |
| اعلان کاربران | `pages/Notifications.jsx`, `user_notifications` | فعال | `UserNotification` | فقط مدل داده | منوی A1 دارد؛ صفحه ندارد |
| اعلان مشتری | `customer_notifications` | فعال | `CustomerNotification` | فقط مدل داده | — |
| پشتیبانی آنلاین | `pages/SarraafSupport.jsx`, `support_*`, `lib/supportSystem.js` | فعال | `SupportTicket`, `SupportMessage` | فقط مدل داده | بدون صفحه |
| دستیار هوشمند | `pages/Assistant.jsx`, `lib/aiChat.js` (`assistant`) | فعال | — | بدون صفحه | نیاز به تصمیم اتصال مدل |
| گزارش خطا/بازخورد | `error_reports`, `user_feedback` | فعال | `ErrorReport`, `UserFeedback` | فقط مدل داده | — |

## ۶. مدیریت، اشتراک و پنل سازنده

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| پنل سازنده | `pages/BuilderPanel.jsx` (`/builder`, AdminRoute) | فعال | `pages/Builder.jsx` | جزئی | فقط وضعیت و نگاشت؛ تب‌های A1 (اشتراک، مجوزها، امکانات) نیست |
| تنظیمات اصلی | `pages/MainSettings.jsx` (`/main-settings`) | فعال | بخشی از `Settings.jsx` | جزئی | — |
| مدیریت قابلیت‌ها | `components/FeaturesManagement.jsx`, `feature_settings` | فعال | `FeatureSetting` | فقط مدل داده | پرچم‌ها از جدول خوانده نمی‌شوند |
| بکاپ و بازیابی | `pages/Backup.jsx`, `backupService.js`, `backup_records` | فعال | `BackupRecord` | فقط مدل داده | بدون صفحه |
| اشتراک/سهمیه | `pricingService.js`, `usePaidSystem`, `packages`, `pricing_plans`, `plan_quotas`, `payment_records`, `exchanges.quota_*` | فعال | `Package`, `PricingPlan`, `PlanQuota`, `PaymentRecord`, `Exchange` | فقط مدل داده | هیچ منطق سهمیه‌ای اجرا نمی‌شود |
| معرفی دوستان | `referralSystem.js`, `referrals`, `exchanges.referral_*` | فعال | `Referral` | فقط مدل داده | — |
| دسترسی سازنده | `builderAccess.js`, `builder_access`, `builder_access.allowed_tabs` | فعال | `BuilderAccess` | فقط مدل داده | — |
| زبان‌ها | `useLanguages.js`, جدول `languages` | فعال | `Language` + i18n کد (fa/en) | جزئی | مدیریت زبان از جدول نیست |
| تنظیمات کلید/مقدار | `app_settings` (`usd_afn`, `afn_toman` …) | فعال | `AppSetting` | فقط مدل داده | فرمول سود به این کلیدها وابسته است |
| قوانین/اطلاعیه | `rules` | فعال | `Rule` | فقط مدل داده | — |
| کارمندان | `employees` | فعال | `Employee` | فقط مدل داده | — |

## ۷. پنل مشتری و فروشنده

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| خانهٔ مشتری | `customer/CustomerHome.jsx` `/customer` | فعال | `pages/CustomerPortal.jsx` `/portal` | جزئی | یک صفحهٔ خلاصه در برابر ۱۴ صفحهٔ A1 |
| کیف پول مشتری | `customer/CustomerWallet.jsx` | فعال | — | فقط مدل داده | — |
| شارژ مشتری | `CustomerRecharge.jsx` | **updating** | — | بدون صفحه | — |
| فروشگاه مشتری | `CustomerShop.jsx` | فعال | — | بدون صفحه | — |
| بازی/UC مشتری | `CustomerGames.jsx` | **updating** | — | بدون صفحه | — |
| درخواست حواله | `CustomerTransfer.jsx`, `customer_transfer_requests` | فعال | `CustomerTransferRequest` | فقط مدل داده | — |
| برداشت | `CustomerWithdraw.jsx` | فعال | — | بدون صفحه | — |
| پشتیبانی/پیام/اعلان مشتری | `CustomerSupport/Messages/Notifications` | فعال | — | بدون صفحه | — |
| حساب/پروفایل/سفارش‌ها | `CustomerAccount/Profile/Orders` | فعال | — | بدون صفحه | — |
| چت مشتری | `CustomerChat.jsx` | فعال | — | بدون صفحه | — |
| افغان۵ | `CustomerAfghan5.jsx` | فعال | — | بدون صفحه | وابسته به سرویس بیرونی |
| پنل فروشنده | `seller/SellerPanel.jsx` `/seller` | فعال | `Seller` | فقط مدل داده | صفحه ندارد |

## ۸. زیرساخت

| قابلیت | منبع A1 | وضعیت در A1 | معادل Base44 | وضعیت پیاده‌سازی | اختلاف/ریسک |
| --- | --- | --- | --- | --- | --- |
| ضد تکرار عملیات | `idempotency_keys` + `post_document_transaction` | فعال | `IdempotencyKey` | فقط مدل داده | ثبت دوباره ممکن است سند تکراری بسازد |
| چندصرافی (tenant) | `exchange_code` در ۴۰+ جدول + RLS | فعال | فیلد در موجودیت‌ها | فقط مدل داده | هیچ فیلتری اجرا نمی‌شود |
| وضعیت اتصال | `ConnectionStatus.jsx`, `SyncIndicator.jsx`, صف آفلاین | فعال | — | پیاده نشده | — |
| به‌روزرسانی نسخه | `ForceUpdateGate.jsx`, `versionManager.js` | فعال | — | پیاده نشده | — |
| مرجع فایل‌های طراحی | `layout_hex_references` | فعال | `LayoutHexReference` | فقط مدل داده | — |
| پیش‌نمایش دمو ماژول‌ها | `demo_preview_records` | فعال | `DemoPreviewRecord` | فقط مدل داده | — |

## جمع‌بندی عددی

| وضعیت | تعداد |
| --- | --- |
| پیاده‌شده (صفحه + عملیات واقعی) | ۱۲ قابلیت |
| جزئی (صفحه هست، رفتار A1 ناقص) | ۱۰ قابلیت |
| فقط مدل داده (بدون صفحه) | ۲۸ قابلیت |
| بدون هیچ پیاده‌سازی | ۱۵ قابلیت (چت گروهی، بازار، دستیار، بکاپ، پشتیبانی، پنل کامل مشتری، فروشنده، رسید، ترازنامه، دفتر حواله، مغایرت‌گیری، سند دستی، درگاه، شارژ، بازی) |

**هیچ‌کدام از ردیف‌های «فقط مدل داده» نباید در گزارش یا UI «انجام‌شده» نامیده شوند.**