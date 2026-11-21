// src/core/domain/posting.js — قواعد ساخت، اعتبارسنجی و نرمال‌سازی فرم‌های مالی
// بدون React، بدون مرورگر و بدون پلتفرم؛ همان قواعدی که در تبدیل به نسخهٔ واقعی لازم است.
import { todayISO } from './dates.js';

export const num = (value) => Number(String(value ?? '').replaceAll(',', '')) || 0;
export const isNumberLike = (value) => !String(value ?? '').trim() || Number.isFinite(Number(value));

const firstSafe = (data, currency) => (data?.cash || [])
  .find((row) => row.currency === currency && row.status !== 'غیرفعال')?.name || '';

// ابزارهای یکتایی و ارتباط بین بخش‌ها (بدون React و بدون پلتفرم)
const textOf = (value) => String(value ?? '').trim();
const isOtherRecord = (row, draft) => String(row.id) !== String(draft.id ?? '');
const codeOfValue = (value) => {
  const found = textOf(value).match(/^(\d{3,})/);
  return found ? found[1] : '';
};
const findSafe = (data, name) => (data?.cash || []).find((row) => row.name === name) || null;
const findBank = (data, name) => (data?.banks || []).find((row) => row.name === name) || null;

// نام تکراری، مانده و گردش دو رکورد را در دفاتر یکی می‌کند؛ پس نام رابطه‌ای باید یکتا باشد
const duplicateName = (rows, name, draft) => (rows || []).find((row) => isOtherRecord(row, draft) && textOf(row.name) === name) || null;

export function buildDraft(module, record, defaults, data) {
  if (record) return { ...record };
  const base = { date: todayISO(), ...(defaults || {}) };
  switch (module) {
    case 'customers':
      return { ...base, code: '', name: '', kind: 'دائمی', phone: '', address: '', currency: 'AFN', opening: '', status: 'فعال' };
    case 'branches':
      return { ...base, code: '', name: '', city: '', phone: '', status: 'فعال' };
    case 'cash':
      return { ...base, name: '', currency: 'AFN', opening: '', status: 'فعال' };
    case 'banks':
      return { ...base, name: '', account: '', currency: 'AFN', opening: '', status: 'فعال', description: '' };
    case 'currencies':
      return { ...base, code: '', name: '', symbol: '', rate: '', active: 'فعال' };
    case 'accounts':
      return { ...base, code: '', name: '', accountType: 'asset', nature: 'بدهکار', parentId: '', currency: '', status: 'فعال', description: '' };
    case 'expenses':
      return { ...base, title: '', expenseAccount: '', currency: 'AFN', amount: '', payerType: 'cash', cash: firstSafe(data, 'AFN'), bank: '', note: '' };
    case 'remittance':
      return {
        ...base, direction: 'ارسالی', sender: '', receiver: '', currency: 'AFN', amount: '', fee: '',
        branch: '', settlement: 'suspense', settleType: 'cash', cash: firstSafe(data, 'AFN'), bank: '', note: '',
      };
    case 'exchange':
      return {
        ...base, kind: 'تبدیل', party: '', foreignCurrency: 'USD', foreignAmount: '',
        baseCurrency: 'AFN', baseAmount: '', foreignCash: firstSafe(data, 'USD'), baseCash: firstSafe(data, 'AFN'),
        fee: '', note: '',
      };
    case 'journal':
      // وقتی فرم از یک حساب مشخص باز می‌شود، ارز و سطرهای پیش‌فرض همان حساب پذیرفته می‌شوند
      return {
        ...base,
        currency: defaults?.currency || 'AFN',
        description: defaults?.description || '',
        journalMode: defaults?.journalMode || 'simple',
        rows: defaults?.rows || [{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }],
      };
    case 'cashFlow':
      // فرمی که از صفحهٔ یک صندوق باز می‌شود، همان صندوق و ارز را پیش‌فرض می‌گیرد
      return {
        ...base, kind: 'دخل',
        partyType: defaults?.partyType || 'customer',
        party: defaults?.party || '',
        currency: defaults?.currency || 'AFN',
        amount: '',
        cash: defaults?.cash || firstSafe(data, defaults?.currency || 'AFN'),
        description: '',
      };
    default:
      return base;
  }
}

export function validate(module, draft, data) {
  switch (module) {
    case 'customers': {
      const name = textOf(draft.name);
      if (!name) return 'نام مشتری الزامی است.';
      if (!isNumberLike(draft.opening)) return 'مانده افتتاحیه باید عدد باشد.';
      if (textOf(draft.code) && (data?.customers || []).some((row) => isOtherRecord(row, draft) && textOf(row.code) === textOf(draft.code))) return 'کد مشتری تکراری است.';
      if (duplicateName(data?.customers, name, draft)) return 'مشتری دیگری با همین نام ثبت شده است؛ نام باید یکتا باشد تا مانده‌ها ادغام نشوند.';
      return '';
    }
    case 'branches': {
      const name = textOf(draft.name);
      if (!name) return 'نام نمایندگی الزامی است.';
      if (duplicateName(data?.branches, name, draft)) return 'نمایندگی دیگری با همین نام ثبت شده است؛ نام باید یکتا باشد.';
      return '';
    }
    case 'cash': {
      const name = textOf(draft.name);
      if (!name) return 'نام صندوق الزامی است.';
      if (!isNumberLike(draft.opening)) return 'مانده افتتاحیه باید عدد باشد.';
      if (duplicateName(data?.cash, name, draft)) return 'صندوق دیگری با همین نام ثبت شده است؛ نام صندوق باید یکتا باشد.';
      return '';
    }
    case 'banks': {
      const name = textOf(draft.name);
      if (!name) return 'نام بانک یا حساب الزامی است.';
      if (!String(draft.account || '').trim()) return 'شماره حساب الزامی است.';
      if (!isNumberLike(draft.opening)) return 'مانده افتتاحیه باید عدد باشد.';
      if (duplicateName(data?.banks, name, draft)) return 'حساب بانکی دیگری با همین نام ثبت شده است؛ نام باید یکتا باشد.';
      if ((data?.banks || []).some((row) => isOtherRecord(row, draft) && textOf(row.account) === textOf(draft.account))) return 'شماره حساب تکراری است.';
      return '';
    }
    case 'currencies': {
      const code = textOf(draft.code).toUpperCase();
      if (!code) return 'کد ارز الزامی است.';
      if (!(num(draft.rate) > 0)) return 'نرخ ارز باید عددی بزرگ‌تر از صفر باشد.';
      if ((data?.currencies || []).some((row) => isOtherRecord(row, draft) && textOf(row.code).toUpperCase() === code)) return 'این ارز قبلاً تعریف شده است.';
      return '';
    }
    case 'accounts': {
      const code = String(draft.code || '').trim();
      if (!code) return 'کد حساب الزامی است.';
      if (!String(draft.name || '').trim()) return 'نام حساب الزامی است.';
      if (!draft.accountType) return 'نوع حساب را انتخاب کنید.';
      if ((data?.accounts || []).some((row) => row.code === code && row.id !== draft.id)) return 'کد حساب تکراری است.';
      if (draft.parentId) {
        if (draft.parentId === code) return 'حساب نمی‌تواند حساب مادر خودش باشد.';
        if (!(data?.accounts || []).some((row) => row.code === draft.parentId)) return 'حساب مادر انتخاب‌شده معتبر نیست.';
      }
      return '';
    }
    case 'expenses': {
      if (!String(draft.title || '').trim()) return 'شرح مصرف الزامی است.';
      if (!draft.expenseAccount) return 'حساب مصرف را انتخاب کنید.';
      if (!(num(draft.amount) > 0)) return 'مبلغ مصرف باید بزرگ‌تر از صفر باشد.';
      if (draft.payerType === 'bank' ? !draft.bank : !draft.cash) return 'صندوق یا حساب بانکی پرداخت را انتخاب کنید.';
      const expenseAccount = (data?.accounts || []).find((row) => String(row.code) === codeOfValue(draft.expenseAccount));
      if (draft.expenseAccount && (data?.accounts || []).length && !expenseAccount) return 'حساب مصرف انتخاب‌شده در کدینگ نیست.';
      if (expenseAccount && expenseAccount.accountType !== 'expense') return 'حساب انتخاب‌شده از نوع مصرف نیست.';
      if (expenseAccount && expenseAccount.status === 'غیرفعال') return 'حساب مصرف انتخاب‌شده غیرفعال است.';
      const settle = draft.payerType === 'bank' ? findBank(data, draft.bank) : findSafe(data, draft.cash);
      if (settle && draft.currency && settle.currency !== draft.currency) return 'ارز صندوق یا بانک پرداخت‌کننده با ارز سند یکی نیست.';
      return '';
    }
    case 'remittance': {
      if (!String(draft.sender || '').trim()) return 'نام فرستنده الزامی است.';
      if (!String(draft.receiver || '').trim()) return 'نام گیرنده الزامی است.';
      if (!(num(draft.amount) > 0)) return 'مبلغ حواله باید بزرگ‌تر از صفر باشد.';
      if (num(draft.fee) < 0) return 'کمیشن نمی‌تواند منفی باشد.';
      if (draft.settlement === 'instant') {
        if (draft.settleType === 'bank' ? !draft.bank : !draft.cash) return 'حساب تسویهٔ فوری را انتخاب کنید.';
        const settle = draft.settleType === 'bank' ? findBank(data, draft.bank) : findSafe(data, draft.cash);
        if (settle && draft.currency && settle.currency !== draft.currency) return 'ارز حساب تسویه با ارز حواله یکی نیست.';
      }
      if (draft.branch && (data?.branches || []).length && !(data.branches || []).some((row) => row.name === draft.branch)) return 'نمایندگی انتخاب‌شده در فهرست نیست.';
      return '';
    }
    case 'exchange': {
      if (draft.foreignCurrency === draft.baseCurrency) return 'ارز اول و دوم باید متفاوت باشند.';
      if (!(num(draft.foreignAmount) > 0)) return 'مبلغ ارز خارجی باید بزرگ‌تر از صفر باشد.';
      if (!(num(draft.baseAmount) > 0)) return 'مبلغ ارز پایه باید بزرگ‌تر از صفر باشد.';
      if (num(draft.fee) < 0) return 'کمیشن نمی‌تواند منفی باشد.';
      if ((draft.kind === 'خرید' || draft.kind === 'فروش') && !draft.party) return 'برای خرید و فروش، طرف حساب الزامی است.';
      if (draft.party && (data?.customers || []).length && !(data.customers || []).some((row) => row.name === draft.party)) return 'طرف حساب در فهرست مشتریان نیست.';
      if (!draft.foreignCash || !draft.baseCash) return 'صندوق هر دو ارز را انتخاب کنید.';
      const foreignSafe = findSafe(data, draft.foreignCash);
      const baseSafe = findSafe(data, draft.baseCash);
      if (foreignSafe && foreignSafe.currency !== draft.foreignCurrency) return 'صندوق ارز اول با ارز اول هم‌خوان نیست.';
      if (baseSafe && baseSafe.currency !== draft.baseCurrency) return 'صندوق ارز دوم با ارز دوم هم‌خوان نیست.';
      return '';
    }
    case 'journal': {
      const rows = (draft.rows || []).filter((row) => row.account || num(row.debit) || num(row.credit));
      if (rows.length < 2) return 'سند باید حداقل دو سطر داشته باشد.';
      if (rows.some((row) => !row.account)) return 'برای هر سطر حساب را انتخاب کنید.';
      if (rows.some((row) => num(row.debit) > 0 && num(row.credit) > 0)) return 'هر سطر فقط یک طرف (بدهکار یا بستانکار) دارد.';
      const debit = rows.reduce((sum, row) => sum + num(row.debit), 0);
      const credit = rows.reduce((sum, row) => sum + num(row.credit), 0);
      if (!(debit > 0) || Math.abs(debit - credit) >= 0.005) return 'جمع بدهکار و بستانکار باید برابر باشد.';
      return '';
    }
    case 'cashFlow': {
      if (!(num(draft.amount) > 0)) return 'مبلغ باید بزرگ‌تر از صفر باشد.';
      if (!draft.cash) return 'صندوق را انتخاب کنید.';
      const safe = findSafe(data, draft.cash);
      if (safe && draft.currency && safe.currency !== draft.currency) return 'ارز صندوق با ارز گردش یکی نیست.';
      return '';
    }
    default:
      return '';
  }
}

export const NUMERIC_KEYS = {
  customers: ['opening'], cash: ['opening'], banks: ['opening'], currencies: ['rate'],
  expenses: ['amount'], remittance: ['amount', 'fee'], exchange: ['foreignAmount', 'baseAmount', 'fee'],
  cashFlow: ['amount'],
};

export function normalize(module, draft) {
  if (module === 'journal') {
    const rows = (draft.rows || []).map((row) => ({
      account: row.account, debit: num(row.debit) || '', credit: num(row.credit) || '',
    }));
    const debitTotal = rows.reduce((sum, row) => sum + num(row.debit), 0);
    const creditTotal = rows.reduce((sum, row) => sum + num(row.credit), 0);
    return { ...draft, rows, debitTotal, creditTotal, status: 'قطعی' };
  }
  if (module === 'cashFlow') {
    // شناسهٔ رکورد و سند اصلی حفظ می‌شود تا ویرایش همان سند انجام شود، نه ساخت سند تازه
    return {
      ...draft,
      type: draft.kind === 'خرج' ? 'خرج صندوق' : 'دخل صندوق',
      partyType: draft.partyType,
      party: draft.party,
      currency: draft.currency,
      amount: (draft.kind === 'خرج' ? -1 : 1) * num(draft.amount),
      cash: draft.cash,
      description: draft.description,
      status: 'قطعی',
    };
  }
  const keys = NUMERIC_KEYS[module] || [];
  const next = { ...draft };
  keys.forEach((key) => { next[key] = num(next[key]); });
  return next;
}

// تبدیل فرم به رکورد درگاه: گردش صندوق در مجموعهٔ تراکنش‌ها ذخیره می‌شود
export const collectionFor = (module) => (module === 'cashFlow' ? 'transactions' : module);

// سند گردش صندوق (دفتر/گزارش) به پیش‌نویس فرم قابل ویرایش برمی‌گردد
// مبلغ منفی = خرج؛ همین نگاشت در «ویرایش از سند اصلی» استفاده می‌شود.
export function cashFlowDraft(record) {
  const amount = num(record?.amount);
  return {
    id: record?.id,
    documentId: record?.documentId || null,
    number: record?.number || '',
    date: record?.date || todayISO(),
    kind: amount < 0 ? 'خرج' : 'دخل',
    partyType: record?.partyType || 'other',
    party: record?.party || '',
    currency: record?.currency || 'AFN',
    amount: Math.abs(amount),
    cash: record?.cash || '',
    description: record?.description || '',
  };
}