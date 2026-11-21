// src/core/domain/balances.js — محاسبات مانده و گردش (توابع خالص، بدون React و بدون پلتفرم)
// این توابع فقط روی ساختار دادهٔ درگاه کار می‌کنند تا در نسخهٔ واقعی نیز بدون تغییر قابل استفاده باشند.

// بدهکار/بستانکار یک سطر دفتر؛ سطرهای گردش قدیمی فقط مبلغ علامت‌دار دارند.
const lineDebit = (row) => {
  const amount = Number(row.amount ?? 0);
  return Number(row.debit ?? 0) || (amount > 0 ? amount : 0);
};
const lineCredit = (row) => {
  const amount = Number(row.amount ?? 0);
  return Number(row.credit ?? 0) || (amount < 0 ? -amount : 0);
};

// موجودی صندوق: مانده افتتاحیه + حرکت حساب صندوق در دفتر کل
// سطرهای دفتر کل از خود اسناد ساخته می‌شوند؛ اگر دفتری نبود، گردش صندوق (transactions) ملاک است.
export function cashBalance(data, safe) {
  const opening = Number(safe.opening || 0);
  // دادهٔ موتور محلی: حرکت صندوق از سطرهای دفتر با شناسهٔ همان صندوق
  const lines = data?.transactions || [];
  if (lines.some((row) => row.accountType)) {
    const id = String(safe.id ?? '');
    const name = String(safe.name || '');
    const movement = lines
      .filter((row) => {
        if (String(row.accountType || '').toLowerCase() !== 'cash') return false;
        if ((row.currency || 'AFN') !== (safe.currency || 'AFN')) return false;
        const accountId = String(row.accountId ?? '').trim();
        // سطرهای قدیمی بدون شناسهٔ حساب فقط با نام صندوق تطبیق داده می‌شوند؛
        // در غیر این صورت ماندهٔ صندوق از گردش دفتر کل عقب می‌ماند.
        return accountId ? accountId === id : Boolean(name) && String(row.cash || '') === name;
      })
      .reduce((sum, row) => sum + lineDebit(row) - lineCredit(row), 0);
    return opening + movement;
  }
  const ledger = data?.ledger || [];
  if (ledger.length) {
    const account = 'صندوق: ' + safe.name;
    const movement = ledger
      .filter((row) => row.account === account && row.currency === safe.currency)
      .reduce((sum, row) => sum + Number(row.debit || 0) - Number(row.credit || 0), 0);
    return opening + movement;
  }
  const movement = (data?.transactions || [])
    .filter((row) => row.cash === safe.name && row.currency === safe.currency)
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return opening + movement;
}

// سطرهای «ماندهٔ افتتاحیه» صندوق‌ها و بانک‌ها — یک منبع مشترک برای دفتر کل و جمع‌هایش.
// اگر ماندهٔ افتتاحیه پیش‌تر به‌صورت سند در دفتر ثبت شده باشد، سطر تکراری ساخته نمی‌شود.
export function openingLedgerLines(data) {
  const posted = new Set((data?.ledger || [])
    .filter((row) => /افتتاحیه/.test(String(row.description || '')))
    .map((row) => String(row.account || '')));
  return [
    ...(data?.cash || []).map((row) => ({ account: 'صندوق: ' + row.name, row })),
    ...(data?.banks || []).map((row) => ({ account: 'بانک: ' + row.name, row })),
  ]
    .filter(({ account, row }) => Number(row.opening || 0) !== 0 && !posted.has(account))
    .map(({ account, row }) => {
      const opening = Number(row.opening || 0);
      return {
        id: 'opening-' + row.id,
        date: '',
        number: '—',
        account,
        description: 'ماندهٔ افتتاحیه',
        currency: row.currency || 'AFN',
        debit: opening > 0 ? opening : 0,
        credit: opening < 0 ? -opening : 0,
        amount: Math.abs(opening),
        status: 'قطعی',
        opening: true,
      };
    });
}

// دفتر کل کامل: سطرهای اسناد + ماندهٔ افتتاحیهٔ صندوق‌ها و بانک‌ها،
// تا جمع دفتر کل و جمع به تفکیک حساب با موجودی صندوق‌ها یکی باشد.
export const ledgerWithOpenings = (data) => [...(data?.ledger || []), ...openingLedgerLines(data)];

// مانده هر طرف حساب (مشتری/نمایندگی) به تفکیک ارز
export function partyTotals(data, partyType, name, opening = 0, openingCurrency = 'AFN') {
  const totals = new Map();
  if (opening) totals.set(openingCurrency, opening);
  (data?.transactions || [])
    .filter((row) => row.partyType === partyType && row.party === name)
    .forEach((row) => {
      const currency = row.currency || 'AFN';
      totals.set(currency, (totals.get(currency) || 0) + Number(row.amount || 0));
    });
  return [...totals.entries()].map(([currency, net]) => ({ currency, net }));
}

export const accountTypeLabel = (value) => ({
  asset: 'دارایی', liability: 'بدهی', equity: 'سرمایه', revenue: 'درآمد', expense: 'مصرف',
}[value] || value || '—');