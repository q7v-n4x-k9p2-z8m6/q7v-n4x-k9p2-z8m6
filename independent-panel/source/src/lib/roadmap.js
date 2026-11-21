/**
 * نگاشت قابلیت‌های سورس A1 به ساختار جدید.
 * status: done = پیاده‌شده | partial = نمونهٔ نمایشی/ناقص | design = فقط طراحی | pending = پیاده‌نشده
 */
export const STATUS_META = {
  done: { label: 'پیاده‌شده', tone: 'emerald' },
  partial: { label: 'نمونهٔ نمایشی', tone: 'amber' },
  design: { label: 'فقط طراحی', tone: 'sky' },
  pending: { label: 'باقی‌مانده', tone: 'slate' },
};

export const CAPABILITY_MAP = [
  { area: 'داشبورد', capability: 'میزکار و خلاصهٔ وضعیت', a1: 'Dashboard / DashboardMetrics', status: 'done', where: 'صفحهٔ داشبورد', risk: 'بدون ریسک' },
  { area: 'مشتریان', capability: 'تعریف، ویرایش، جستجو و ماندهٔ مشتری', a1: 'Customers / CustomerDetail', status: 'done', where: 'مشتریان + جزئیات مشتری', risk: 'ستون‌های اضافی A1 (balance_currency، identity_status) نگاشت شده‌اند' },
  { area: 'مشتریان', capability: 'گروه مشتری و سطح اعتبار', a1: 'customers.customer_group / credit_limit', status: 'partial', where: 'فرم مشتری (گروه)', risk: 'credit_limit در A1 ستون اختصاصی ندارد' },
  { area: 'معاملات', capability: 'خرید و فروش ارز دوطرفه', a1: 'Trade + buildTrade', status: 'done', where: 'خرید و فروش ارز', risk: 'نرخ دستی است؛ نرخ روز ایجاد نشده (خواستهٔ محصول)' },
  { area: 'معاملات', capability: 'کارمزد به‌عنوان درآمد', a1: 'ledger buildTrade fee line', status: 'done', where: 'خط کارمزد در سند', risk: 'کارمزد فقط به ارز پایه' },
  { area: 'معاملات', capability: 'تبدیل ارز', a1: 'CurrencyConvert / conversions', status: 'done', where: 'تبدیل ارز', risk: 'در A1 جدول conversions مستقل؛ اینجا سند + دفتر' },
  { area: 'دریافت و پرداخت', capability: 'داد و گرفت با مشتری', a1: 'Dadogereft', status: 'done', where: 'صندوق — تب دریافت/پرداخت', risk: 'بدون ریسک ساختاری' },
  { area: 'صندوق', capability: 'دخل، خرج و هزینه', a1: 'Cash / treasury_transactions', status: 'done', where: 'صندوق', risk: 'جدول treasury_transactions به دفتر تبدیل شده' },
  { area: 'بانک', capability: 'حساب بانکی و گردش', a1: 'Bank / bank_accounts / bank_transactions', status: 'done', where: 'بانک', risk: 'bank_transactions به ردیف‌های دفتر نگاشت شد' },
  { area: 'حواله', capability: 'حوالهٔ ارسالی و دریافتی', a1: 'Transfer + transfers', status: 'done', where: 'حواله‌ها', risk: 'وضعیت «انجام‌شده» معادل status=done در A1' },
  { area: 'حواله', capability: 'دفتر حواله', a1: 'TransferBook', status: 'partial', where: 'تب دفتر در صفحهٔ حواله‌ها', risk: 'فیلتر تاریخ و نمایندگی کامل نیست' },
  { area: 'حواله', capability: 'مسیر نمایندگی', a1: 'transfers.agent_route / origins', status: 'partial', where: 'حواله + نمایندگی‌ها', risk: 'مسیر آزاد متنی، بدون جدول مسیرها' },
  { area: 'حسابداری', capability: 'دفتر روزنامه و ابطال با سند معکوس', a1: 'Journal + documents.reversed', status: 'done', where: 'دفتر روزنامه', risk: 'حذف مستقیم حذف شده؛ منطبق با A1' },
  { area: 'حسابداری', capability: 'دفتر کل', a1: 'GeneralLedger / ledger_entries', status: 'done', where: 'دفتر کل', risk: 'مانده چندارزی جداگانه محاسبه می‌شود' },
  { area: 'حسابداری', capability: 'تراز آزمایشی', a1: 'trial_balance', status: 'done', where: 'تراز آزمایشی', risk: 'بر پایهٔ ارزش ارز پایه' },
  { area: 'حسابداری', capability: 'سود و زیان دوره‌ای', a1: 'ProfitLoss', status: 'done', where: 'سود و زیان', risk: 'بدون بستن دوره' },
  { area: 'حسابداری', capability: 'کدینگ حساب‌ها (chart of accounts)', a1: 'chart_of_accounts', status: 'design', where: 'src/lib/accounting/chart.js', risk: 'کدینگ ثابت است، نه قابل تعریف توسط کاربر' },
  { area: 'حسابداری', capability: 'دفاتر معین و تفصیلی', a1: 'subsidiary_ledger', status: 'partial', where: 'دفتر کل + حساب مشتری', risk: 'سطح تفصیلی محدود به مشتری/صندوق' },
  { area: 'حسابداری', capability: 'ترازنامه', a1: 'BalanceSheet', status: 'design', where: 'نقشهٔ راه', risk: 'نیازمند تفکیک بدهی و سرمایه' },
  { area: 'حسابداری', capability: 'مغایرت‌گیری صندوق و بانک', a1: 'Reconciliation', status: 'design', where: 'نقشهٔ راه', risk: 'بدون داده واقعی' },
  { area: 'حسابداری', capability: 'دورهٔ مالی و بستن دوره', a1: 'fiscal_periods / period_close', status: 'pending', where: '—', risk: 'وابسته به منطق تاریخ جلالی' },
  { area: 'حسابداری', capability: 'مانده حساب‌های دریافتنی', a1: 'accounts_receivable / Debtors', status: 'done', where: 'بدهکاران', risk: 'بدون سرصفحهٔ سنی بدهی' },
  { area: 'گزارش‌ها', capability: 'گزارش معاملات، صندوق، حواله و موجودی', a1: 'Reports', status: 'done', where: 'گزارش‌ها', risk: 'خروجی PDF/چاپ پیاده نشده' },
  { area: 'تعاریف', capability: 'تعریف ارزها', a1: 'Currency Rows / rates.type', status: 'partial', where: 'تنظیمات — ارزها', risk: 'نرخ خرید و فروش عمداً حذف شده (خواستهٔ محصول)' },
  { area: 'تعاریف', capability: 'نمایندگی‌ها', a1: 'Agents / origins', status: 'partial', where: 'نمایندگی‌ها', risk: 'شبکهٔ نمایندگی (agency_network) پیاده نشده' },
  { area: 'تعاریف', capability: 'شبکه و پیوند نمایندگی', a1: 'AgencyNetwork / agency_links', status: 'pending', where: '—', risk: 'بدون ریسک؛ مستقل است' },
  { area: 'نقش‌ها', capability: 'نقش‌های سازنده، مدیر، صراف، کارمند، مشتری', a1: 'rbac.js / ROUTE_PERMISSIONS', status: 'partial', where: 'کاربران و نقش‌ها', risk: 'نقش Base44 فقط admin/user دارد؛ نقش تجاری در UI شبیه‌سازی می‌شود' },
  { area: 'نقش‌ها', capability: 'ماتریس مجوز بخش‌ها', a1: 'user_permissions / permissions.js', status: 'done', where: 'ماتریس دسترسی', risk: 'مجوز در سطح عملیات، نه بخش‌به‌بخش' },
  { area: 'امنیت', capability: 'ردّ حسابرسی', a1: 'audit_logs / auditLogger', status: 'done', where: 'رویدادها', risk: 'IP و دستگاه ثبت نمی‌شود' },
  { area: 'امنیت', capability: 'بکاپ و بازیابی', a1: 'Backup / tripleBackup*', status: 'pending', where: '—', risk: 'نیازمند سرویس ذخیره‌سازی' },
  { area: 'سازنده', capability: 'پنل سازنده و مدیریت قابلیت‌ها', a1: 'BuilderPanel / feature_settings', status: 'partial', where: 'پنل سازنده', risk: 'فقط برای نقش creator' },
  { area: 'سازنده', capability: 'مدیریت مبادله‌های چندگانه', a1: 'multiExchange / MultiExchangeManager', status: 'pending', where: '—', risk: 'مدل داده تک‌صرافی است' },
  { area: 'مشتری', capability: 'پنل مشتری و صورت حساب', a1: 'customer/*', status: 'partial', where: 'پنل مشتری', risk: 'بدون احراز هویت، نمای نمونه است' },
  { area: 'مشتری', capability: 'کیف پول و برداشت', a1: 'wallets / wallet_withdrawal_requests', status: 'pending', where: '—', risk: 'نیازمند درگاه پرداخت' },
  { area: 'مشتری', capability: 'درخواست حواله توسط مشتری', a1: 'customer_transfer_requests', status: 'pending', where: '—', risk: 'بدون ریسک؛ افزودنی' },
  { area: 'پرداخت', capability: 'درگاه پرداخت و کارت به کارت', a1: 'PaymentGateway / bank_gateways', status: 'pending', where: '—', risk: 'خارج از محدودهٔ این فاز' },
  { area: 'محصولات آنلاین', capability: 'شارژ، بسته اینترنت، UC پابجی', a1: 'online_products / charge_orders', status: 'pending', where: '—', risk: 'نیازمند تأمین‌کنندهٔ بیرونی' },
  { area: 'ارتباطات', capability: 'چت صراف‌ها و گروه‌ها', a1: 'SarraafChat / ChatGroups', status: 'pending', where: '—', risk: 'نیازمند سرویس پیام' },
  { area: 'ارتباطات', capability: 'اعلان‌ها و پیام‌های مشتری', a1: 'customer_notifications / user_notifications', status: 'pending', where: '—', risk: 'نیازمند سرویس ارسال' },
  { area: 'پشتیبانی', capability: 'تیکت و پشتیبانی آنلاین', a1: 'support_tickets / SarraafSupport', status: 'pending', where: '—', risk: 'بدون ریسک' },
  { area: 'هوش مصنوعی', capability: 'دستیار هوشمند', a1: 'Assistant / aiChat', status: 'pending', where: '—', risk: 'نیازمند اتصال مدل' },
  { area: 'چندزبانه', capability: 'ساختار ترجمه و انتخاب زبان', a1: 'i18n / languages', status: 'partial', where: 'تنظیمات + پوسته', risk: 'متن صفحات هنوز فارسی است' },
  { area: 'چاپ', capability: 'رسید و چاپ سند', a1: 'Receipt', status: 'pending', where: '—', risk: 'بدون ریسک' },
];

export const AMBIGUITIES = [
  {
    title: 'نقش‌ها در برابر نقش‌های پلتفرم',
    detail: 'A1 پنج نقش تجاری دارد اما نسخهٔ پلتفرم تنها admin و user را پشتیبانی می‌کند. در این نسخه نقش‌ها در رابط کاربری شبیه‌سازی شده‌اند. پیشنهاد: نگه‌داشتن نقش تجاری در فیلد جداگانه و اعمال آن در لایهٔ دسترسی سرور.',
  },
  {
    title: 'مالی چندارزی',
    detail: 'در A1 اسناد و ردیف‌ها به ارز اصلی ثبت می‌شوند. در این نسخه هر ردیف هم مبلغ ارزی و هم ارزش ارز پایه دارد تا تراز متوازن بماند. تصمیم نهایی دربارهٔ حساب موجودی هر ارز باید در فاز ادغام گرفته شود.',
  },
  {
    title: 'مانده آغازین',
    detail: 'موجودی آغازین صندوق و مشتری به‌صورت سند حسابداری ثبت می‌شود، نه فیلد آزاد. این با A1 که فیلد opening_balance دارد تفاوت رفتاری دارد.',
  },
  {
    title: 'نرخ ارز',
    detail: 'طبق خواستهٔ محصول، صفحه و سرویس نرخ روز ساخته نشده است. اگر در آینده لازم شد، باید به‌صورت اتصال رسمی و کنترل‌شده اضافه شود.',
  },
  {
    title: 'حذف داده',
    detail: 'حذف مستقیم سند وجود ندارد و فقط سند معکوس صادر می‌شود. حذف مشتری/نمایندگی در این فاز اضافه نشده تا رکوردهای دفتری بی‌صاحب نمانند.',
  },
];