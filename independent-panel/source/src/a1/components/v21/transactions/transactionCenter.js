// a1/components/v21/transactions/transactionCenter.js
// لایهٔ تجمیع مرکز معاملات: فقط خواندن و نگاشت.
// هیچ سند، سطر دفترکل یا گردش مالی جدیدی نمی‌سازد و هیچ داده‌ای ذخیره نمی‌کند.
import { formatDate, formatNumber, currencyLabel, toPersianDigits } from '@/a1/lib/format';

const num = value => Number(value ?? 0) || 0;
export const BASE_CURRENCY = 'AFN';

export const SOURCE_META = {
  exchange: { label: 'خرید و فروش اسعار', module: 'exchange' },
  remittance: { label: 'دفتر حواله‌ها', module: 'remittance' },
  expense: { label: 'مصارف و پرداخت‌ها', module: 'expenses' },
  document: { label: 'دریافت و پرداخت', module: 'reports' },
  journal: { label: 'دفتر روزنامچه', module: 'journal' },
};

// نه وضعیت مرکزی برای نمایش و پیگیری؛ وضعیت اصلی هر ماژول جداگانه حفظ می‌شود.
export const STATUS_META = {
  draft: { label: 'پیش‌نویس', tone: 'border-slate-200 bg-slate-50 text-slate-700' },
  pending: { label: 'در انتظار بررسی', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  approved: { label: 'تأییدشده', tone: 'border-blue-200 bg-blue-50 text-blue-800' },
  in_progress: { label: 'در حال انجام', tone: 'border-sky-200 bg-sky-50 text-sky-800' },
  completed: { label: 'تکمیل‌شده', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  rejected: { label: 'ردشده', tone: 'border-orange-200 bg-orange-50 text-orange-800' },
  cancelled: { label: 'لغوشده', tone: 'border-rose-200 bg-rose-50 text-rose-800' },
  reversed: { label: 'برگشت‌خورده', tone: 'border-purple-200 bg-purple-50 text-purple-800' },
  review: { label: 'نیازمند بررسی', tone: 'border-amber-300 bg-amber-100 text-amber-900' },
};

export const STATUS_ORDER = ['draft', 'pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled', 'reversed', 'review'];

const decimalsFor = value => (Number.isInteger(num(value)) ? 0 : 2);

export const formatMoney = (value, currency) =>
  `${formatNumber(num(value), decimalsFor(value))} ${currencyLabel(currency || '')}`.trim();

export const formatRateText = (rate, fromCurrency, toCurrency) => {
  if (!num(rate) || !fromCurrency || !toCurrency) return '';
  return `${toPersianDigits('1')} ${fromCurrency} = ${formatNumber(num(rate), 2)} ${toCurrency}`;
};

export const displayDate = value => (value ? formatDate(value) : '—');

const compact = fields => fields.filter(item =>
  item.value !== undefined && item.value !== null && String(item.value).trim() !== '' && String(item.value) !== '0');

const buildRateMap = data => {
  const map = new Map();
  (data?.currencies || []).forEach(row => {
    if (row.code && num(row.rate) > 0) map.set(row.code, num(row.rate));
  });
  return map;
};

// معادل ارز پایه فقط نمایشی و تقریبی است؛ هرگز جای مبلغ اصلی را نمی‌گیرد.
const toBase = (amount, currency, rates) => {
  if (!num(amount)) return null;
  if (currency === BASE_CURRENCY) return { amount: num(amount), currency: BASE_CURRENCY, approximate: false };
  const rate = rates.get(currency);
  if (!rate) return null;
  return { amount: Math.round(num(amount) * rate * 100) / 100, currency: BASE_CURRENCY, approximate: true };
};

const exchangeStatus = row => {
  const accounting = String(row.accountingStatus || '');
  if (accounting === 'ابطال شده') return 'cancelled';
  if (accounting === 'نیازمند بررسی') return 'review';
  if (!accounting || accounting === 'سند ندارد') return 'draft';
  return 'completed';
};

const remittanceStatus = row => {
  const accounting = String(row.accountingStatus || '');
  if (['ابطال شده', 'ابطال ناقص'].includes(accounting)) return accounting === 'ابطال ناقص' ? 'reversed' : 'cancelled';
  if (['نیازمند بررسی', 'سند کمیشن ندارد'].includes(accounting)) return 'review';
  if (accounting === 'سند ندارد') return 'draft';
  if (row.status === 'در انتظار') return 'pending';
  return 'completed';
};

const expenseStatus = row => {
  if (row.status === 'ابطال شده') return 'cancelled';
  if (row.status === 'نیازمند بررسی') return 'review';
  return 'completed';
};

const documentStatus = row => {
  if (row.status === 'ابطال شده') return 'cancelled';
  if (row.status === 'سند معکوس') return 'reversed';
  if (row.status === 'نیازمند بررسی') return 'review';
  return 'completed';
};

// فقط اسنادی که عملیات تخصصی جداگانه‌ای ندارند در مرکز می‌آیند؛
// اسناد ارز، حواله، کمیشن و مصرف از رکورد عملیاتی خودشان نمایش داده می‌شوند تا تکراری نشوند.
const DOCUMENT_KINDS = {
  dadogereft: { kind: 'دریافت', source: 'document' },
  pardakht: { kind: 'پرداخت', source: 'document' },
  deposit: { kind: 'واریز', source: 'document' },
  income: { kind: 'درآمد', source: 'document' },
  cash: { kind: 'گردش صندوق', source: 'document' },
  cash_in: { kind: 'دخل صندوق', source: 'document' },
  cash_out: { kind: 'خرج صندوق', source: 'document' },
  trade: { kind: 'معامله اسعار', source: 'document' },
  journal: { kind: 'سند روزنامچه', source: 'journal' },
};

function fromExchange(row, rates) {
  const mainCurrency = row.fromCurrency || row.currency || BASE_CURRENCY;
  const secondCurrency = row.toCurrency || BASE_CURRENCY;
  const rate = num(row.rate) || (num(row.fromAmount) > 0 ? num(row.toAmount) / num(row.fromAmount) : 0);
  const base = toBase(row.fromAmount, mainCurrency, rates);
  return {
    key: `exchange:${row.id}`,
    uniqueId: `EXC-${row.id}`,
    id: String(row.id),
    source: 'exchange',
    sourceLabel: SOURCE_META.exchange.label,
    module: SOURCE_META.exchange.module,
    number: row.number || '',
    date: row.date || '',
    kind: row.kind === 'خرید' ? 'خرید ارز' : row.kind === 'فروش' ? 'فروش ارز' : 'تبدیل ارز',
    partyLabel: 'طرف حساب',
    party: row.party || '—',
    customer: row.customer_name || '',
    branch: '',
    registrar: row.registered_by || '',
    mainAmount: num(row.fromAmount),
    mainCurrency,
    secondAmount: num(row.toAmount),
    secondCurrency,
    rate,
    fee: num(row.fee),
    feeCurrency: secondCurrency,
    base,
    status: exchangeStatus(row),
    documentStatus: row.accountingStatus || '—',
    description: row.note || '',
    accounts: compact([
      { label: 'صندوق ارز اول', value: row.cashFrom },
      { label: 'صندوق ارز دوم', value: row.cashTo },
    ]),
    documents: compact([
      { label: 'سند معامله', value: row.documentId ? toPersianDigits(String(row.documentId)) : '' },
      { label: 'سند کمیشن', value: row.feeDocumentId ? toPersianDigits(String(row.feeDocumentId)) : '' },
    ]),
    extra: [],
  };
}

function fromRemittance(row, rates) {
  const currency = row.currency || BASE_CURRENCY;
  const base = toBase(row.amount, currency, rates);
  return {
    key: `remittance:${row.id}`,
    uniqueId: `TRF-${row.id}`,
    id: String(row.id),
    source: 'remittance',
    sourceLabel: SOURCE_META.remittance.label,
    module: SOURCE_META.remittance.module,
    number: row.number || '',
    date: row.date || '',
    kind: row.direction === 'دریافتی' ? 'حواله دریافتی' : row.direction === 'ارسالی' ? 'حواله ارسالی' : 'حواله',
    partyLabel: 'فرستنده / گیرنده',
    party: [row.sender, row.receiver].filter(Boolean).join(' ← ') || '—',
    customer: row.customer_name || '',
    branch: row.origin || '',
    registrar: row.registered_by || '',
    mainAmount: num(row.amount),
    mainCurrency: currency,
    secondAmount: null,
    secondCurrency: '',
    rate: 0,
    fee: num(row.fee),
    feeCurrency: currency,
    base,
    status: remittanceStatus(row),
    documentStatus: row.accountingStatus || '—',
    description: row.note || '',
    accounts: compact([
      { label: 'روش تسویه', value: row.settlement },
      { label: 'حساب تسویه', value: row.settleAccount },
      { label: row.direction === 'دریافتی' ? 'مبدأ' : 'مقصد', value: row.origin || row.destination },
    ]),
    documents: compact([
      { label: 'سند حواله', value: row.documentId ? toPersianDigits(String(row.documentId)) : '' },
      { label: 'سند کمیشن', value: row.feeDocumentId ? toPersianDigits(String(row.feeDocumentId)) : '' },
    ]),
    extra: compact([
      { label: 'جمع با کمیشن', value: num(row.total) ? formatMoney(row.total, currency) : '' },
      { label: 'وضعیت اجرا', value: row.status },
    ]),
  };
}

function fromExpense(row, rates) {
  const currency = row.currency || BASE_CURRENCY;
  const base = toBase(row.amount, currency, rates);
  return {
    key: `expense:${row.id}`,
    uniqueId: `EXP-${row.id}`,
    id: String(row.id),
    source: 'expense',
    sourceLabel: SOURCE_META.expense.label,
    module: SOURCE_META.expense.module,
    number: row.number || '',
    date: row.date || '',
    kind: 'مصرف',
    partyLabel: 'حساب مصرف',
    party: row.expenseAccount || '—',
    customer: '',
    branch: '',
    registrar: row.registeredBy || '',
    mainAmount: num(row.amount),
    mainCurrency: currency,
    secondAmount: null,
    secondCurrency: '',
    rate: 0,
    fee: 0,
    feeCurrency: currency,
    base,
    status: expenseStatus(row),
    documentStatus: row.status || '—',
    description: row.title || '',
    accounts: compact([{ label: row.payerType === 'bank' ? 'بانک پرداخت' : 'صندوق پرداخت', value: row.cash }]),
    documents: compact([{ label: 'سند مصرف', value: row.documentId ? toPersianDigits(String(row.documentId)) : '' }]),
    extra: [],
  };
}

function fromDocument(row, rates) {
  const meta = DOCUMENT_KINDS[String(row.docType || '')];
  if (!meta) return null;
  const currency = row.currency || BASE_CURRENCY;
  const base = toBase(row.amount, currency, rates);
  const source = SOURCE_META[meta.source];
  return {
    key: `${meta.source}:${row.id}`,
    uniqueId: `DOC-${row.id}`,
    id: String(row.id),
    source: meta.source,
    sourceLabel: source.label,
    module: source.module,
    number: row.number || '',
    date: row.date || '',
    kind: meta.kind,
    partyLabel: row.partyType === 'customer' ? 'مشتری' : row.partyType === 'branch' ? 'نمایندگی' : 'حساب',
    party: row.party || row.account || '—',
    customer: row.partyType === 'customer' ? row.party || '' : '',
    branch: row.partyType === 'branch' ? row.party || '' : '',
    registrar: row.registeredBy || '',
    mainAmount: num(row.amount),
    mainCurrency: currency,
    secondAmount: null,
    secondCurrency: '',
    rate: 0,
    fee: 0,
    feeCurrency: currency,
    base,
    status: documentStatus(row),
    documentStatus: row.status || '—',
    description: row.description || '',
    accounts: compact([
      { label: 'حساب بدهکار', value: row.debitAccount },
      { label: 'حساب بستانکار', value: row.creditAccount },
      { label: 'صندوق', value: row.cash },
    ]),
    documents: compact([{ label: 'سند حسابداری', value: row.documentId ? toPersianDigits(String(row.documentId)) : '' }]),
    extra: [],
  };
}

// همهٔ رکوردها یک شناسهٔ یکتا (source:id) دارند؛ تکراری‌ها در همین سطح حذف می‌شوند.
export function buildCenterRecords(data) {
  const rates = buildRateMap(data);
  const map = new Map();
  const add = record => {
    if (!record) return;
    if (!map.has(record.key)) map.set(record.key, record);
  };

  (data?.exchange || []).forEach(row => add(fromExchange(row, rates)));
  (data?.remittance || []).forEach(row => add(fromRemittance(row, rates)));
  (data?.expenses || []).forEach(row => add(fromExpense(row, rates)));
  (data?.reports || []).forEach(row => add(fromDocument(row, rates)));

  return [...map.values()].sort((a, b) =>
    String(b.date).localeCompare(String(a.date)) || String(b.number).localeCompare(String(a.number)));
}

// سوابق فعالیت مرتبط با یک معامله یا سند آن
export function historyFor(record, activity = []) {
  if (!record) return [];
  const ids = new Set([String(record.id)]);
  (record.documents || []).forEach(item => ids.add(String(item.value)));
  return (activity || [])
    .filter(item => ids.has(String(item.entityId || '')))
    .slice(0, 12)
    .map(item => ({
      date: displayDate(item.date),
      action: item.action || '',
      description: item.description || '',
      status: item.status || '',
    }));
}

// جمع مبلغ اصلی به تفکیک ارز — ارزهای مختلف در یک عدد جمع نمی‌شوند.
export function totalsByCurrency(records) {
  const map = new Map();
  records.forEach(record => {
    const currency = record.mainCurrency || BASE_CURRENCY;
    const item = map.get(currency) || { currency, count: 0, amount: 0 };
    item.count += 1;
    item.amount += num(record.mainAmount);
    map.set(currency, item);
  });
  return [...map.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}