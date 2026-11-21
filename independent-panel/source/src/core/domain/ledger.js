// src/core/domain/ledger.js — ثبت دوطرفهٔ اسناد و ساخت دفتر کل، گزارش عملیات و مفاد و زیان
// بدون React و بدون مرورگر؛ همین قواعد در نسخهٔ واقعی هم استفاده می‌شوند.
//
// قاعده‌ها (مستند و آزمون‌پذیر):
//   مصرف: حساب مصرف بدهکار، صندوق/بانک پرداخت‌کننده بستانکار.
//   حوالهٔ فوری: مشتری/واسط در مقابل صندوق یا بانک؛ کمیشن به درآمد.
//   حوالهٔ واسط: بدهی/طلب حواله در جریان بدون حرکت صندوق.
//   معاملهٔ اسعار: ارز دریافتی بدهکار، ارز پرداختی بستانکار (تبادل دو ارزی، پس تراز تک‌ارزی ندارد).
//   روزنامچه: سطرهای خود سند، بدون بازنویسی.
//   گردش صندوق: صندوق در مقابل حساب طرف حساب (مشتری/نمایندگی/واسط).
// هر سند شمارهٔ یکتا می‌گیرد و هر سطر دفتر به شناسهٔ سند خودش وصل است.
import { num } from './posting.js';
import { todayISO } from './dates.js';

export const POSTING_COLLECTIONS = ['expenses', 'remittance', 'exchange', 'journal', 'transactions'];

export const DOC_PREFIX = {
  journal: 'JE',
  remittance: 'TR',
  exchange: 'EX',
  expenses: 'EXP',
  transactions: 'CF',
};

export const COLLECTION_LABELS = {
  customers: 'مشتری',
  branches: 'نمایندگی',
  cash: 'صندوق',
  banks: 'بانک',
  currencies: 'ارز',
  accounts: 'حساب',
  expenses: 'مصرف',
  remittance: 'حواله',
  exchange: 'معامله اسعار',
  journal: 'روزنامچه',
  transactions: 'گردش صندوق',
};

export const MASTER_COLLECTIONS = ['customers', 'branches', 'cash', 'banks', 'currencies', 'accounts'];

// حساب‌های پیش‌فرض کدینگ؛ اگر صراف حساب دیگری با همان کد داشته باشد، نام همان استفاده می‌شود
export const DEFAULT_ACCOUNTS = {
  cash: { code: '1010', name: 'صندوق‌ها' },
  bank: { code: '1020', name: 'بانک‌ها' },
  customer: { code: '1030', name: 'حساب مشتریان' },
  liability: { code: '2000', name: 'بدهی‌ها' },
  equity: { code: '3000', name: 'سرمایه صراف' },
  revenue: { code: '4000', name: 'درآمد کمیشن' },
  expense: { code: '5000', name: 'مصارف اداری' },
};

export const codeOf = (value) => {
  const found = String(value ?? '').trim().match(/^(\d{3,})/);
  return found ? found[1] : '';
};

export function accountLabel(accounts, code, fallback) {
  const account = (accounts || []).find((row) => String(row.code) === String(code));
  return account ? account.code + ' — ' + account.name : code + ' — ' + fallback;
}

export function accountTypeOf(accounts, code) {
  const account = (accounts || []).find((row) => String(row.code) === String(code));
  return account?.accountType || '';
}

export const maxNumberOf = (docs, prefix) => (docs || []).reduce((max, row) => {
  const text = String(row?.number || '');
  if (!text.startsWith(prefix + '-')) return max;
  const value = Number(text.slice(prefix.length + 1));
  return Number.isFinite(value) ? Math.max(max, value) : max;
}, 1000);

export function nextNumber(collection, docs) {
  const prefix = DOC_PREFIX[collection] || 'DOC';
  return prefix + '-' + (maxNumberOf(docs, prefix) + 1);
}

// شمارهٔ همهٔ اسناد را کامل می‌کند؛ سند بدون شماره، شمارهٔ بعدی همان سری را می‌گیرد
export function normalizeDocuments(state) {
  const next = { ...state };
  POSTING_COLLECTIONS.forEach((collection) => {
    const docs = Array.isArray(state[collection]) ? state[collection] : [];
    const prefix = DOC_PREFIX[collection] || 'DOC';
    let max = maxNumberOf(docs, prefix);
    next[collection] = docs.map((doc) => {
      if (doc.number) return doc;
      max += 1;
      return { ...doc, number: prefix + '-' + max };
    });
  });
  return next;
}

const cashLabel = (data, name) => {
  const safe = (data?.cash || []).find((row) => row.name === name);
  return { account: 'صندوق: ' + name, code: DEFAULT_ACCOUNTS.cash.code, currency: safe?.currency || '' };
};

const bankLabel = (data, name) => {
  const bank = (data?.banks || []).find((row) => row.name === name);
  return { account: 'بانک: ' + name, code: DEFAULT_ACCOUNTS.bank.code, currency: bank?.currency || '' };
};

const settleLabel = (data, record) => (record.settleType === 'bank' || record.payerType === 'bank'
  ? bankLabel(data, record.bank)
  : cashLabel(data, record.cash));

// سطرهای دفتر برای یک سند؛ ورودی سند، خروجی سطرهای بدهکار/بستانکار
export function ledgerLinesFor(collection, record, data) {
  const accounts = data?.accounts || [];
  const number = record.number || '';
  const date = record.date || todayISO();
  const description = record.description || record.title || record.note || '';
  const currency = record.currency || record.baseCurrency || 'AFN';
  const lines = [];

  const push = (account, code, debit, credit, extra = {}) => {
    // سطر دفتر همیشه مبلغ مثبت در یک طرف دارد؛ جهت با بدهکار/بستانکار مشخص می‌شود
    const debitValue = Math.abs(num(debit));
    const creditValue = Math.abs(num(credit));
    if (!debitValue && !creditValue) return;
    lines.push({
      documentId: record.id,
      collection,
      number,
      date,
      account,
      code,
      description,
      currency: extra.currency || currency,
      debit: debitValue,
      credit: creditValue,
      partyType: extra.partyType || '',
      party: extra.party || '',
    });
  };

  const receivable = accountLabel(accounts, DEFAULT_ACCOUNTS.customer.code, DEFAULT_ACCOUNTS.customer.name);
  const liability = accountLabel(accounts, DEFAULT_ACCOUNTS.liability.code, DEFAULT_ACCOUNTS.liability.name);
  const revenue = accountLabel(accounts, DEFAULT_ACCOUNTS.revenue.code, DEFAULT_ACCOUNTS.revenue.name);

  if (collection === 'expenses') {
    const settle = settleLabel(data, record);
    push(record.expenseAccount || accountLabel(accounts, DEFAULT_ACCOUNTS.expense.code, DEFAULT_ACCOUNTS.expense.name), codeOf(record.expenseAccount) || DEFAULT_ACCOUNTS.expense.code, record.amount, 0);
    push(settle.account, settle.code, 0, record.amount, { currency: settle.currency || currency });
  }

  if (collection === 'remittance') {
    const settle = settleLabel(data, record);
    const party = record.branch ? { partyType: 'branch', party: record.branch } : {};
    if (record.settlement === 'instant') {
      if (record.direction === 'دریافتی') {
        push(settle.account, settle.code, record.amount, 0, { currency: settle.currency || currency });
        push(receivable, DEFAULT_ACCOUNTS.customer.code, 0, record.amount, party);
      } else {
        push(receivable, DEFAULT_ACCOUNTS.customer.code, record.amount, 0, party);
        push(settle.account, settle.code, 0, record.amount, { currency: settle.currency || currency });
      }
      if (num(record.fee) > 0) {
        push(settle.account, settle.code, record.fee, 0, { currency: settle.currency || currency });
        push(revenue, DEFAULT_ACCOUNTS.revenue.code, 0, record.fee);
      }
    } else if (record.direction === 'دریافتی') {
      push(liability, DEFAULT_ACCOUNTS.liability.code, record.amount, 0, party);
      push(receivable, DEFAULT_ACCOUNTS.customer.code, 0, record.amount, party);
      if (num(record.fee) > 0) {
        push(receivable, DEFAULT_ACCOUNTS.customer.code, record.fee, 0, party);
        push(revenue, DEFAULT_ACCOUNTS.revenue.code, 0, record.fee);
      }
    } else {
      push(receivable, DEFAULT_ACCOUNTS.customer.code, record.amount, 0, party);
      push(liability, DEFAULT_ACCOUNTS.liability.code, 0, record.amount, party);
      if (num(record.fee) > 0) {
        push(receivable, DEFAULT_ACCOUNTS.customer.code, record.fee, 0, party);
        push(revenue, DEFAULT_ACCOUNTS.revenue.code, 0, record.fee);
      }
    }
  }

  if (collection === 'exchange') {
    const foreignCash = cashLabel(data, record.foreignCash);
    const baseCash = cashLabel(data, record.baseCash);
    const party = record.party ? { partyType: 'customer', party: record.party } : {};
    const foreign = record.foreignCurrency || 'USD';
    const base = record.baseCurrency || 'AFN';
    if (record.kind === 'فروش' || record.kind === 'sell') {
      push(baseCash.account, baseCash.code, record.baseAmount, 0, { currency: base, ...party });
      push(foreignCash.account, foreignCash.code, 0, record.foreignAmount, { currency: foreign, ...party });
    } else {
      push(foreignCash.account, foreignCash.code, record.foreignAmount, 0, { currency: foreign, ...party });
      push(baseCash.account, baseCash.code, 0, record.baseAmount, { currency: base, ...party });
    }
    if (num(record.fee) > 0) {
      push(baseCash.account, baseCash.code, record.fee, 0, { currency: base, ...party });
      push(revenue, DEFAULT_ACCOUNTS.revenue.code, 0, record.fee, { currency: base });
    }
  }

  if (collection === 'journal') {
    (record.rows || []).forEach((row) => {
      push(row.account, codeOf(row.account), row.debit, row.credit);
    });
  }

  if (collection === 'transactions') {
    const safe = cashLabel(data, record.cash);
    const partyType = record.partyType || 'other';
    const partyAccount = partyType === 'customer'
      ? receivable
      : partyType === 'branch'
        ? liability
        : liability;
    const partyCode = partyType === 'customer' ? DEFAULT_ACCOUNTS.customer.code : DEFAULT_ACCOUNTS.liability.code;
    const party = partyType === 'customer' || partyType === 'branch'
      ? { partyType, party: record.party || '' }
      : {};
    const amount = num(record.amount);
    if (amount >= 0) {
      push(safe.account, safe.code, amount, 0, { currency: safe.currency || currency, ...party });
      push(partyAccount, partyCode, 0, amount, party);
    } else {
      push(partyAccount, partyCode, Math.abs(amount), 0, party);
      push(safe.account, safe.code, 0, Math.abs(amount), { currency: safe.currency || currency, ...party });
    }
  }

  return lines;
}

// سطرهای سند معکوس: جای بدهکار و بستانکار هر سطر سند اصلی عوض می‌شود
export function reversalLinesOf(lines, counter) {
  return lines.map((line) => ({
    ...line,
    documentId: counter.id,
    number: counter.number || '',
    date: counter.date || todayISO(),
    description: 'ابطال — ' + (line.description || ''),
    debit: line.credit,
    credit: line.debit,
  }));
}

const sortByDateDesc = (rows) => [...rows].sort((a, b) => {
  const dateA = String(a.date || '');
  const dateB = String(b.date || '');
  if (dateA !== dateB) return dateA < dateB ? 1 : -1;
  return String(b.number || '').localeCompare(String(a.number || ''));
});

export function buildLedger(documents, data) {
  const rows = [];
  POSTING_COLLECTIONS.forEach((collection) => {
    const docs = documents?.[collection] || [];
    docs.forEach((record) => {
      let lines;
      if (record.reversalOf) {
        const original = docs.find((row) => row.id === record.reversalOf);
        lines = original
          ? reversalLinesOf(ledgerLinesFor(collection, original, data), record)
          : ledgerLinesFor(collection, record, data);
      } else {
        lines = ledgerLinesFor(collection, record, data);
      }
      lines.forEach((line, index) => {
        rows.push({ ...line, id: 'led-' + record.id + '-' + index });
      });
    });
  });
  return sortByDateDesc(rows);
}

// گزارش عملیات: برای هر سند و هر ارز یک ردیف، با جمع بدهکار و بستانکار همان ارز
export function buildReports(ledger) {
  const groups = new Map();
  ledger.forEach((line) => {
    const key = line.documentId + '::' + line.currency;
    const row = groups.get(key) || {
      id: 'rp-' + line.documentId + '-' + line.currency,
      documentId: line.documentId,
      number: line.number,
      date: line.date,
      type: COLLECTION_LABELS[line.collection] || line.collection,
      description: line.description || '',
      currency: line.currency,
      debit: 0,
      credit: 0,
      party: '',
    };
    row.debit += num(line.debit);
    row.credit += num(line.credit);
    if (!row.party && line.party) row.party = line.party;
    groups.set(key, row);
  });
  return sortByDateDesc([...groups.values()]);
}

// مفاد و زیان: درآمد منهای مصرف از سطرهای دفتر کل
export function buildProfitRows(ledger, accounts) {
  const totals = new Map();
  ledger.forEach((line) => {
    const type = accountTypeOf(accounts, line.code);
    if (type !== 'revenue' && type !== 'expense') return;
    const currency = line.currency || 'AFN';
    const row = totals.get(currency) || { id: 'pf-' + currency, currency, revenue: 0, expense: 0 };
    if (type === 'revenue') row.revenue += num(line.credit) - num(line.debit);
    else row.expense += num(line.debit) - num(line.credit);
    totals.set(currency, row);
  });
  return [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

// وضعیت مشتق: دفتر کل، گزارش عملیات و مفاد و زیان همیشه از اسناد ساخته می‌شوند
export function deriveState(state) {
  const normalized = normalizeDocuments(state);
  const ledger = buildLedger(normalized, normalized);
  return {
    ...normalized,
    ledger,
    reports: buildReports(ledger),
    profitRows: buildProfitRows(ledger, normalized.accounts),
  };
}