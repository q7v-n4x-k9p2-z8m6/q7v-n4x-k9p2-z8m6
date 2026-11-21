// src/core/registry/modules.js — فهرست مرجع ۲۵ بخش حساب صراف
// فقط دادهٔ دامنه‌ای و مجوزی؛ هیچ آیکون یا مؤلفهٔ React اینجا نیست تا لایهٔ نمایش جدا بماند.
// هر بخش: شناسه، برچسب، گروه ناوبری، نوع نمایش، بخش مجوز و مجموعه‌دادهٔ اصلی.

export const CORE_MODULES = [
  { id: 'home', label: 'مرکز عملیات', group: 'home', kind: 'home', section: 'dashboard', collection: null },
  { id: 'customers', label: 'تعریف مشتریان', group: 'define', kind: 'master', section: 'customers', collection: 'customers' },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', group: 'define', kind: 'ledger', section: 'accounts_receivable', collection: 'customers' },
  { id: 'debtors', label: 'بدهکاران و بستانکاران', group: 'reports', kind: 'debtors', section: 'accounts_receivable', collection: 'customers' },
  { id: 'branches', label: 'تعریف نمایندگی‌ها', group: 'define', kind: 'master', section: 'agents', collection: 'branches' },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', group: 'more', kind: 'ledger', section: 'agents', collection: 'branches' },
  { id: 'cash', label: 'صندوق‌ها و موجودی', group: 'cash', kind: 'master', section: 'cash', collection: 'cash' },
  { id: 'banks', label: 'بانک و چک', group: 'cash', kind: 'master', section: 'bank', collection: 'banks' },
  { id: 'exchange', label: 'خرید و فروش اسعار', group: 'ops', kind: 'posting', section: 'trade', collection: 'exchange' },
  { id: 'remittance', label: 'دفتر حواله‌ها', group: 'ops', kind: 'posting', section: 'transfers', collection: 'remittance' },
  { id: 'rates', label: 'نرخ روز', group: 'more', kind: 'rates', section: 'currencies', collection: 'rates' },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', group: 'ops', kind: 'posting', section: 'cash', collection: 'expenses' },
  { id: 'journal', label: 'دفتر روزنامچه', group: 'accounting', kind: 'posting', section: 'journal', collection: 'journal' },
  { id: 'ledger', label: 'دفتر کل', group: 'accounting', kind: 'ledger', section: 'general_ledger', collection: 'ledger' },
  { id: 'accounts', label: 'کدینگ حساب‌ها', group: 'accounting', kind: 'master', section: 'chart_of_accounts', collection: 'accounts' },
  { id: 'currencies', label: 'تعریف اسعار', group: 'more', kind: 'master', section: 'currencies', collection: 'currencies' },
  { id: 'reports', label: 'گزارش عملیات', group: 'reports', kind: 'ledger', section: 'reports', collection: 'reports' },
  { id: 'profit', label: 'مفاد و زیان', group: 'reports', kind: 'profit', section: 'profit_loss', collection: 'profitRows' },
  { id: 'activity', label: 'سوابق فعالیت', group: 'more', kind: 'activity', section: 'audit_log', collection: 'activity' },
  { id: 'errors', label: 'گزارش خطاها و فیلدها', group: 'more', kind: 'errors', section: 'audit_log', collection: 'errors' },
  { id: 'balance', label: 'بیلانس عمومی', group: 'more', kind: 'balance', section: 'balance_sheet', collection: 'cash' },
  { id: 'sarraafGroups', label: 'گروه و چت', group: 'extras', kind: 'linked', section: 'chat_groups', collection: 'chatGroups' },
  { id: 'assistant', label: 'هوش مصنوعی', group: 'extras', kind: 'linked', section: 'assistant', collection: null },
  { id: 'products', label: 'محصولات آنلاین', group: 'extras', kind: 'linked', section: 'online_products', collection: 'products' },
  { id: 'language', label: 'زبان برنامه', group: 'more', kind: 'linked', section: 'settings', collection: 'settings' },
];

export const moduleById = (id) => CORE_MODULES.find((item) => item.id === id) || CORE_MODULES[0];

// شمارهٔ مرجع هر بخش (۱ تا ۲۵) — همان شماره‌ای که در منو، فهرست و سرصفحهٔ صفحه دیده می‌شود
export const sectionNo = (id) => {
  const index = CORE_MODULES.findIndex((item) => item.id === id);
  return index >= 0 ? index + 1 : 0;
};

// شش گروه صفحهٔ خانه
export const HOME_GROUPS = [
  { key: 'define', title: 'تعاریف و دفاتر طرف‌حساب', ids: ['customers', 'branches', 'customerLedger'] },
  { key: 'cash', title: 'صندوق و بانک', ids: ['cash', 'banks'] },
  { key: 'ops', title: 'عملیات صرافی', ids: ['exchange', 'remittance', 'expenses'] },
  { key: 'accounting', title: 'حسابداری', ids: ['journal', 'ledger', 'accounts'] },
  { key: 'reports', title: 'گزارشات و مطالبات', ids: ['reports', 'profit', 'debtors'] },
  { key: 'extras', title: 'امکانات تکمیلی', ids: ['products', 'sarraafGroups', 'assistant'] },
];

// هفت بخشی که فقط در «بیشتر» دیده می‌شوند
export const MORE_ONLY = ['branchLedger', 'rates', 'currencies', 'activity', 'errors', 'balance', 'language'];

// عنوان فارسی گروه‌های ناوبری — یک منبع برای دسکتاپ، موبایل و Harness
export const NAV_GROUP_TITLES = [
  { key: 'define', title: 'تعاریف و دفاتر طرف‌حساب' },
  { key: 'cash', title: 'صندوق و بانک' },
  { key: 'ops', title: 'عملیات صرافی' },
  { key: 'accounting', title: 'حسابداری' },
  { key: 'reports', title: 'گزارشات و مطالبات' },
  { key: 'extras', title: 'امکانات تکمیلی' },
  { key: 'more', title: 'بخش‌های تکمیلی (بیشتر)' },
];

// مرکزهای مکمل: صفحه‌های عملیاتی مستقل که در شماره‌گذاری ۱ تا ۲۵ نیستند
// «مرکز معاملات» فهرست معاملات ثبت‌شده است و با «مفاد معاملات» (profit) یکی نیست.
export const CENTERS = [
  {
    id: 'transactions',
    label: 'مرکز معاملات',
    group: 'ops',
    section: 'accounts_receivable',
    kind: 'center',
    path: '/transactions',
    note: 'فهرست معاملات ثبت‌شده؛ فقط‌خواندنی و جدا از «مفاد معاملات».',
  },
];

// مقصد هر بخش: صفحهٔ داخلی میزکار، صفحهٔ مستقل یا ماژول پیوندی
export const MODULE_DESTINATIONS = {
  home: { type: 'panel', path: '/dashboard' },
  customers: { type: 'panel', path: '/dashboard?module=customers' },
  customerLedger: { type: 'panel', path: '/dashboard?module=customerLedger' },
  debtors: { type: 'route', path: '/debtors' },
  branches: { type: 'panel', path: '/dashboard?module=branches' },
  branchLedger: { type: 'panel', path: '/dashboard?module=branchLedger' },
  cash: { type: 'panel', path: '/dashboard?module=cash' },
  banks: { type: 'panel', path: '/dashboard?module=banks' },
  exchange: { type: 'panel', path: '/dashboard?module=exchange' },
  remittance: { type: 'panel', path: '/dashboard?module=remittance' },
  rates: { type: 'panel', path: '/dashboard?module=rates' },
  expenses: { type: 'panel', path: '/dashboard?module=expenses' },
  journal: { type: 'panel', path: '/dashboard?module=journal' },
  ledger: { type: 'panel', path: '/dashboard?module=ledger' },
  accounts: { type: 'panel', path: '/dashboard?module=accounts' },
  currencies: { type: 'panel', path: '/dashboard?module=currencies' },
  reports: { type: 'panel', path: '/dashboard?module=reports' },
  profit: { type: 'panel', path: '/dashboard?module=profit' },
  activity: { type: 'panel', path: '/dashboard?module=activity' },
  errors: { type: 'panel', path: '/dashboard?module=errors' },
  balance: { type: 'panel', path: '/dashboard?module=balance' },
  sarraafGroups: { type: 'linked', path: '/chat' },
  assistant: { type: 'linked', path: '/assistant' },
  products: { type: 'linked', path: '/online-products' },
  language: { type: 'panel', path: '/dashboard?module=language' },
  transactions: { type: 'route', path: '/transactions' },
};

// نام‌های جایگزین در محیط‌های مختلف (Harness) → شناسهٔ مرجع
export const MODULE_ALIASES = { remittances: 'remittance', ledgers: 'ledger', cashAction: 'cash', cashFlow: 'cash' };

export const canonicalId = (id) => MODULE_ALIASES[id] || id;

// بخش مجوز هر شناسه (با پذیرش نام جایگزین)
export const moduleSection = (id) => {
  const key = canonicalId(id);
  const module = CORE_MODULES.find((item) => item.id === key) || CENTERS.find((item) => item.id === key);
  return module?.section || 'dashboard';
};

export const modulePath = (id) => (MODULE_DESTINATIONS[canonicalId(id)] || {}).path || '/dashboard';