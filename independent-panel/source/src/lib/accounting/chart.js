/**
 * chart.js — دفتر حساب‌های مفهومی و برچسب‌ها
 * منطق مالی از UI جدا نگه داشته می‌شود؛ همهٔ اسناد از این لایه ساخته می‌شوند.
 */

export const ACCOUNT_TYPES = {
  safe: { label: 'صندوق', tone: 'emerald' },
  bank: { label: 'بانک', tone: 'sky' },
  customer: { label: 'حساب مشتری', tone: 'violet' },
  income: { label: 'درآمد', tone: 'amber' },
  expense: { label: 'هزینه', tone: 'rose' },
  equity: { label: 'سرمایه و تعدیل', tone: 'slate' },
};

export const SYSTEM_ACCOUNTS = {
  feeIncome: { account_type: 'income', account_id: 'INC-FEE', account_name: 'درآمد کارمزد' },
  fxIncome: { account_type: 'income', account_id: 'INC-FX', account_name: 'درآمد اختلاف نرخ' },
  otherIncome: { account_type: 'income', account_id: 'INC-OTHER', account_name: 'درآمد متفرقه' },
  operatingExpense: { account_type: 'expense', account_id: 'EXP-OPS', account_name: 'هزینه‌های عملیاتی' },
  adjustment: { account_type: 'equity', account_id: 'EQ-ADJ', account_name: 'تعدیل صندوق' },
  opening: { account_type: 'equity', account_id: 'EQ-OPEN', account_name: 'مانده آغازین' },
};

export const DOC_TYPES = {
  trade_buy: { label: 'خرید ارز', group: 'معاملات', tone: 'emerald' },
  trade_sell: { label: 'فروش ارز', group: 'معاملات', tone: 'rose' },
  receive: { label: 'دریافت از مشتری', group: 'دریافت و پرداخت', tone: 'sky' },
  pay: { label: 'پرداخت به مشتری', group: 'دریافت و پرداخت', tone: 'amber' },
  cash_in: { label: 'دخل صندوق', group: 'صندوق', tone: 'emerald' },
  cash_out: { label: 'خرج صندوق', group: 'صندوق', tone: 'rose' },
  expense: { label: 'هزینه', group: 'صندوق', tone: 'rose' },
  transfer_out: { label: 'حواله ارسالی', group: 'حواله', tone: 'amber' },
  transfer_in: { label: 'حواله دریافتی', group: 'حواله', tone: 'sky' },
  conversion: { label: 'تبدیل ارز', group: 'معاملات', tone: 'violet' },
  journal: { label: 'سند دستی', group: 'حسابداری', tone: 'slate' },
  opening: { label: 'مانده آغازین', group: 'حسابداری', tone: 'slate' },
};

export const TRANSFER_STATUS = {
  pending: { label: 'در انتظار', tone: 'amber' },
  processing: { label: 'در جریان', tone: 'sky' },
  done: { label: 'انجام‌شده', tone: 'emerald' },
  cancelled: { label: 'لغو‌شده', tone: 'slate' },
};

export const CUSTOMER_STATUS = {
  active: { label: 'فعال', tone: 'emerald' },
  inactive: { label: 'غیرفعال', tone: 'slate' },
  blocked: { label: 'مسدود', tone: 'rose' },
};

export function accountLabel(entry) {
  return entry.account_name || ACCOUNT_TYPES[entry.account_type]?.label || '—';
}