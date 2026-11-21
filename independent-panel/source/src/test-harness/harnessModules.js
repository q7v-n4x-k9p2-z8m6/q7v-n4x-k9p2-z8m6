// test-harness/harnessModules.js — بخش‌های قابل پیمایش در محیط آزمون
// این فهرست جایگزین ۲۵ بخش پنل نیست: ۹ سناریوی آزمون است که هر کدام به یک شناسهٔ مرجع
// (canonical) وصل می‌شوند تا نام، آیکون و شمارهٔ بخش با رجیستری مرکزی یکی باشد.
// `id` کلید دادهٔ سناریو است و `canonical` شناسهٔ همان بخش در src/core/registry/modules.js.
import { CORE_MODULES, canonicalId, sectionNo } from '@/core/registry/modules';
import { moduleIcon } from '@/a1/components/v21/moduleIcons';
import { SCENARIO_NOTES } from './fixtures';

const REGISTRY = new Map(CORE_MODULES.map((module) => [module.id, module]));

const DEFINITIONS = [
  { id: 'customers', detail: 'customer', group: 'طرف‌حساب‌ها', note: SCENARIO_NOTES.customers },
  { id: 'branches', detail: 'branch', group: 'طرف‌حساب‌ها', note: SCENARIO_NOTES.branches },
  { id: 'debtors', detail: 'customer', group: 'طرف‌حساب‌ها', note: SCENARIO_NOTES.debtors },
  { id: 'cash', detail: 'cash', group: 'صندوق و بانک', note: SCENARIO_NOTES.cash },
  { id: 'banks', detail: 'bank', group: 'صندوق و بانک', note: SCENARIO_NOTES.banks },
  // شناسهٔ داده «transactions» است؛ همان «مرکز معاملات» بیرون از شماره‌گذاری ۱ تا ۲۵
  { id: 'transactions', detail: 'transaction', group: 'عملیات', note: SCENARIO_NOTES.transactions },
  // در پنل «دفتر حواله‌ها» است؛ کلید دادهٔ سناریو remittances مانده تا fixtures دست‌نخورده بماند
  { id: 'remittances', canonical: 'remittance', detail: 'remittance', group: 'عملیات', note: SCENARIO_NOTES.remittances },
  { id: 'expenses', detail: 'expense', group: 'عملیات', note: SCENARIO_NOTES.expenses },
  // یک گروه آزمون برای هر سه دفتر پنل: دفتر کل، دفتر مشتری و دفتر نمایندگی
  { id: 'ledgers', canonical: 'ledger', label: 'دفاتر حساب', detail: 'statement', group: 'حسابداری', note: SCENARIO_NOTES.ledgers },
];

export const HARNESS_MODULES = DEFINITIONS.map((item) => {
  const canonical = canonicalId(item.canonical || item.id);
  const module = REGISTRY.get(canonical);
  return {
    ...item,
    canonical,
    label: item.label || module?.label || item.id,
    icon: moduleIcon(canonical),
    // شمارهٔ مرجع همان بخش در رجیستری؛ مرکز معاملات شماره ندارد
    sectionNo: module ? sectionNo(module.id) : 0,
  };
});

export const MODULE_GROUPS = ['طرف‌حساب‌ها', 'صندوق و بانک', 'عملیات', 'حسابداری'];

// شناسهٔ داده و شناسهٔ مرجع را هر دو می‌پذیرد تا پیوندهای قدیمی نشکنند
export const moduleById = (id) => HARNESS_MODULES.find((item) => item.id === id || item.canonical === id) || HARNESS_MODULES[0];

// پیوندهای آزمون: هر سناریو، فهرست، جزئیات و مقصد بازگشت
export const LINK_MATRIX = [
  { from: 'مشتریان', detail: 'مشتری → دفتر حساب مشتری', back: 'بازگشت به فهرست مشتریان' },
  { from: 'نمایندگی‌ها', detail: 'نمایندگی → دفتر حساب نمایندگی', back: 'بازگشت به فهرست نمایندگی‌ها' },
  { from: 'بدهکاران', detail: 'بدهکار → پروندهٔ مشتری → دفتر حساب', back: 'بازگشت به فهرست بدهکاران' },
  { from: 'صندوق‌ها', detail: 'صندوق → تراکنش‌ها و مصارف مرتبط', back: 'بازگشت به فهرست صندوق‌ها' },
  { from: 'بانک‌ها', detail: 'بانک → مصارف پرداخت‌شده از بانک', back: 'بازگشت به فهرست بانک‌ها' },
  { from: 'مرکز معاملات', detail: 'تراکنش → مشتری / صندوق / بانک مرتبط', back: 'بازگشت به فهرست تراکنش‌ها' },
  { from: 'دفتر حواله‌ها', detail: 'حواله → مشتری و نمایندگی مرتبط', back: 'بازگشت به فهرست حواله‌ها' },
  { from: 'مصارف', detail: 'مصرف → صندوق یا بانک پرداخت‌کننده', back: 'بازگشت به فهرست مصارف' },
  { from: 'دفاتر حساب', detail: 'دفتر → سطر گردش → سند منبع', back: 'بازگشت به فهرست دفاتر' },
];