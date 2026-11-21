// src/core/domain/statement.js — گردش حساب یک طرف حساب از اسناد همان موتور
// توابع خالص و بدون React. دو حالت پشتیبانی می‌شود:
//   ۱) دادهٔ موتور محلی: هر سطر بدهکار/بستانکار حساب مشتری یا نمایندگی از دفتر کل خوانده می‌شود (پیوند با شناسه).
//   ۲) دادهٔ قدیمی حافظه‌ای: تجمیع از خود مجموعه‌های اسناد با تطبیق نام.
// هیچ سندی ساخته یا تغییر داده نمی‌شود؛ فقط خواندن و جمع‌بندی.
import { num } from './posting.js';

export const STATEMENT_LABELS = {
  transactions: 'گردش صندوق',
  remittance: 'حواله',
  exchange: 'معاملهٔ اسعار',
  journal: 'روزنامچه',
  expenses: 'مصرف',
};

const emptyResult = () => ({ rows: [], totals: [], counts: {}, types: [] });

// مرتب‌سازی زمانی و محاسبهٔ ماندهٔ تجمعی به تفکیک ارز (بدهکار − بستانکار)
function summarize(entries, opening, openingCurrency) {
  // همان ترتیب لپ‌تاپ: زمان کامل سند، سپس شناسه
  const ordered = [...entries].sort((a, b) => {
    const timeA = String(a.createdAt || a.date || '');
    const timeB = String(b.createdAt || b.date || '');
    if (timeA !== timeB) return timeA < timeB ? -1 : 1;
    return String(a.number || a.id).localeCompare(String(b.number || b.id));
  });

  const totalsMap = new Map();
  const bucket = (currency) => {
    if (!totalsMap.has(currency)) {
      // ماندهٔ افتتاحیه مثبت در ستون بدهکار و منفی در ستون بستانکار، مانند جمع‌بندی لپ‌تاپ
      const start = currency === openingCurrency ? num(opening) : 0;
      totalsMap.set(currency, {
        currency, opening: start,
        debit: start > 0 ? start : 0,
        credit: start < 0 ? -start : 0,
        balance: start,
      });
    }
    return totalsMap.get(currency);
  };

  ordered.forEach((entry) => {
    const total = bucket(entry.currency);
    total.debit += entry.debit;
    total.credit += entry.credit;
    total.balance += entry.debit - entry.credit;
    entry.balance = total.balance;
  });

  const totals = [...totalsMap.values()].map((row) => ({
    ...row,
    status: row.balance > 0 ? 'بدهکار' : row.balance < 0 ? 'بستانکار' : 'تسویه',
  }));

  const rows = ordered.reverse();
  // ماندهٔ افتتاحیهٔ حساب در جمع‌بندی شمرده می‌شود؛ همان مبلغ به‌صورت سطر ابتدای دوره هم نمایش داده می‌شود
  // تا فهرست گردش با جمع‌بندی بالای صفحه ناهماهنگ نباشد. این سطر سند نیست و ویرایش یا ابطال نمی‌پذیرد.
  const openingAmount = num(opening);
  if (openingAmount) {
    rows.push({
      id: 'opening',
      opening: true,
      module: 'opening',
      record: {},
      documentId: null,
      createdAt: '',
      type: 'مانده افتتاحیه',
      date: '',
      number: '',
      description: 'ماندهٔ ابتدای دوره از تعریف حساب',
      currency: openingCurrency || 'AFN',
      debit: openingAmount > 0 ? openingAmount : 0,
      credit: openingAmount < 0 ? -openingAmount : 0,
      balance: openingAmount,
    });
  }

  const counts = entries.reduce((acc, entry) => {
    acc[entry.type] = (acc[entry.type] || 0) + 1;
    return acc;
  }, {});

  return {
    rows,
    totals,
    counts,
    types: Object.keys(counts).sort((a, b) => counts[b] - counts[a]),
  };
}

// حالت موتور: هر سطر دفتر حساب همان طرف حساب، با شمارهٔ سند و تاریخ خودش
// مرجع مشترک موبایل و لپ‌تاپ: سطرهای دفتر کلِ پیوندخورده با شناسهٔ همین طرف حساب.
export function partyLedgerLines(data, party, kind = 'customer') {
  const name = String(party?.name || '');
  const id = String(party?.id ?? '');
  const entries = [];

  (data?.transactions || []).forEach((line) => {
    const accountType = String(line.accountType || '').toLowerCase();
    if (kind === 'customer') {
      if (accountType !== 'customer') return;
    } else if (String(line.partyType || '') !== 'branch') {
      return;
    }
    // پیوند ثابت با شناسهٔ حساب؛ در نبود شناسه، تطبیق نام برای سوابق قدیمی
    if (id ? String(line.accountId ?? '') !== id : String(line.party || '') !== name) return;
    const debit = num(line.debit);
    const credit = num(line.credit);
    if (!debit && !credit) return;
    entries.push({
      id: 'led-' + line.id,
      module: 'transactions',
      record: line,
      documentId: line.documentId || null,
      createdAt: line.created_at || '',
      type: line.type || 'سند',
      date: line.date || '',
      number: line.number || '',
      description: line.description || '',
      currency: line.currency || 'AFN',
      debit,
      credit,
    });
  });

  // نمایندگی: حواله‌هایی که مبدأ یا مقصدشان همین نمایندگی است (با نام یا شهر) در دفتر همان نمایندگی دیده می‌شوند.
  // قاعدهٔ بدهکار/بستانکار عیناً همان قاعدهٔ جمع‌بندی دفتر حواله‌ها است: دریافتی بدهکار، ارسالی بستانکار.
  if (kind === 'branch' && name) {
    const city = String(party?.city || '');
    (data?.remittance || []).forEach((record) => {
      const recordBranch = String(record.branch || record.origin || record.destination || '');
      if (recordBranch !== name && (!city || recordBranch !== city)) return;
      const amount = num(record.amount);
      if (!amount) return;
      const incoming = record.direction === 'دریافتی';
      entries.push({
        id: 'remit-' + record.id,
        module: 'remittance',
        record,
        documentId: record.documentId || null,
        createdAt: record.created_at || record.date || '',
        type: STATEMENT_LABELS.remittance,
        date: record.date || '',
        number: record.number || '',
        description: [record.direction, record.customer_name].filter(Boolean).join(' · '),
        currency: record.currency || 'AFN',
        debit: incoming ? amount : 0,
        credit: incoming ? 0 : amount,
      });
    });
  }

  return entries;
}

// حالت قدیمی: تجمیع از مجموعه‌های اسناد با تطبیق نام (برای آزمون‌های حافظه‌ای)
function fromCollections(data, party, kind) {
  const name = String(party?.name || '');
  const entries = [];
  const add = (module, record, impact, currency, description) => {
    const amount = num(impact);
    entries.push({
      id: module + '-' + record.id,
      module,
      record,
      documentId: record.documentId || null,
      type: STATEMENT_LABELS[module] || module,
      date: record.date || '',
      number: record.number || '',
      description: description || record.note || '',
      currency: currency || 'AFN',
      debit: amount > 0 ? amount : 0,
      credit: amount < 0 ? -amount : 0,
    });
  };

  (data?.transactions || []).forEach((record) => {
    if (record.partyType !== kind || record.party !== name) return;
    add('transactions', record, record.amount, record.currency, record.description);
  });

  (data?.remittance || []).forEach((record) => {
    const outgoing = record.sender === name;
    const incoming = record.receiver === name;
    if (!outgoing && !incoming) return;
    if (kind === 'branch' && record.branch !== name) return;
    const amount = num(record.amount);
    add('remittance', record, outgoing ? amount + num(record.fee) : -amount, record.currency, record.direction);
  });

  (data?.exchange || []).forEach((record) => {
    if (record.party !== name) return;
    const amount = num(record.baseAmount ?? record.toAmount);
    add('exchange', record, record.kind === 'فروش' || record.kind === 'sell' ? amount : -amount, record.baseCurrency || record.toCurrency, record.kind);
  });

  (data?.journal || []).forEach((record) => {
    const impact = (record.rows || []).reduce(
      (sum, row) => (row.party === name ? sum + num(row.debit) - num(row.credit) : sum),
      0
    );
    if (!impact) return;
    add('journal', record, impact, record.currency, record.description);
  });

  return entries;
}

// گردش هر طرف حساب؛ kind: 'customer' یا 'branch'
export function partyStatement(data, party, kind = 'customer') {
  if (!party?.name) return emptyResult();
  const engineMode = (data?.transactions || []).some((row) => row.accountType);
  const entries = engineMode ? partyLedgerLines(data, party, kind) : fromCollections(data, party, kind);
  return summarize(entries, party?.opening, party?.currency || 'AFN');
}

// سند اصلی یک سطر گردش، بدون حدس: اگر سطر شناسهٔ سند داشته باشد در اسناد عملیاتی جستجو می‌شود.
// اگر پیوند نباشد، صریحاً اتصال‌نیافته گزارش می‌شود.
export function statementSource(data, row) {
  const documentId = row?.documentId;
  if (!documentId) return { linked: false, module: '', label: 'سطر دفتر کل بدون پیوند سند', record: row?.record || {} };
  for (const module of ['remittance', 'exchange', 'expenses', 'journal']) {
    const found = (data?.[module] || []).find(
      (item) => String(item.documentId ?? item.id) === String(documentId)
    );
    if (found) return { linked: true, module, label: STATEMENT_LABELS[module] || module, record: found };
  }
  return { linked: false, module: '', label: 'سند اصلی این سطر پیدا نشد', record: row?.record || {} };
}

// سطرهای دیگر همان سند در دفتر کل (سابقهٔ معامله در دو طرف)
export function documentSiblings(data, documentId) {
  if (!documentId) return [];
  return (data?.transactions || []).filter((line) => String(line.documentId ?? '') === String(documentId));
}

// سطرهای گردش یک حساب صندوق یا بانک از همان دفتر کل، با پیوند شناسهٔ همان حساب.
// اگر سطر شناسهٔ حساب نداشته باشد (سوابق قدیمی)، فقط تطبیق نام پذیرفته می‌شود تا سطر حساب دیگری وارد نشود.
export function accountLedgerLines(data, account, kind = 'cash') {
  const id = String(account?.id ?? '');
  const name = String(account?.name || '');
  const entries = [];

  (data?.transactions || []).forEach((line) => {
    const accountType = String(line.accountType || '').toLowerCase();
    const hasId = String(line.accountId ?? '').trim() !== '';
    const byId = accountType === kind && hasId && id && String(line.accountId) === id;
    const byName = !hasId && name && (kind === 'cash'
      ? String(line.cash || '') === name
      : String(line.account || '') === name);
    if (!byId && !byName) return;

    const debit = num(line.debit);
    const credit = num(line.credit);
    const amount = num(line.amount);
    const finalDebit = debit || (amount > 0 ? amount : 0);
    const finalCredit = credit || (amount < 0 ? -amount : 0);
    if (!finalDebit && !finalCredit) return;

    entries.push({
      id: 'acc-' + line.id,
      module: 'transactions',
      record: line,
      documentId: line.documentId || null,
      createdAt: line.created_at || '',
      type: line.type || 'سند',
      date: line.date || '',
      number: line.number || '',
      description: line.description || '',
      currency: line.currency || account?.currency || 'AFN',
      debit: finalDebit,
      credit: finalCredit,
    });
  });

  return entries;
}

// گردش کامل حساب صندوق یا بانک؛ kind: 'cash' یا 'bank'
export function accountStatement(data, account, kind = 'cash') {
  if (!account?.name) return emptyResult();
  return summarize(accountLedgerLines(data, account, kind), account?.opening, account?.currency || 'AFN');
}

export function customerStatement(data, customer) {
  return partyStatement(data, customer, 'customer');
}

export function branchStatement(data, branch) {
  return partyStatement(data, branch, 'branch');
}

// سند اصلی هر سطر گردش: با شناسهٔ سند در مجموعه‌های عملیاتی همان موتور جستجو می‌شود
export function findSourceForLine(data, row) {
  const documentId = row?.documentId;
  if (documentId) {
    for (const module of ['remittance', 'exchange', 'expenses', 'journal']) {
      const found = (data?.[module] || []).find(
        (item) => String(item.documentId ?? item.id) === String(documentId)
      );
      if (found) return { module, record: found };
    }
  }
  return { module: 'transactions', record: row?.record || row };
}