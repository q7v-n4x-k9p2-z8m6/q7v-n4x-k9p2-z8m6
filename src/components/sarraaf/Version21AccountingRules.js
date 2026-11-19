export const number = value => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export function documentDateTimestamp(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const date = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error('تاریخ سند معتبر نیست؛ تاریخ را به قالب سال-ماه-روز وارد کنید.');
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error('تاریخ سند وجود ندارد؛ روز، ماه و سال را بررسی کنید.');
  }
  return date + 'T12:00:00.000Z';
}

export function validateCashTransactionParty(partyType, party, resolvedParty = null) {
  const type = String(partyType || '').trim();
  const name = String(party || '').trim();
  if (!name) throw new Error('طرف حساب گردش صندوق الزامی است.');
  if (type === 'customer' || type === 'branch') {
    if (!resolvedParty || !(Number(resolvedParty.id) > 0)) {
      throw new Error(type === 'customer'
        ? 'مشتری انتخاب‌شده در فهرست همین صراف پیدا نشد؛ گردش به حساب واسط منتقل نشد.'
        : 'نمایندگی انتخاب‌شده در فهرست همین صراف پیدا نشد؛ گردش به حساب واسط منتقل نشد.');
    }
    return type;
  }
  if (type === 'other') return type;
  throw new Error('نوع طرف حساب گردش صندوق معتبر نیست؛ مشتری، نمایندگی یا سایر را انتخاب کنید.');
}

export function validateCashTransactionPartyIdentity(document, partyType, party, resolvedParty = null) {
  const type = String(partyType || '').trim();
  const name = String(party || '').trim();
  if (!document) throw new Error('سند اصلی گردش صندوق پیدا نشد؛ ویرایش متوقف شد.');
  const expectedType = type === 'customer' || type === 'branch' ? type : type === 'other' ? 'none' : '';
  if (!expectedType) throw new Error('نوع طرف حساب گردش صندوق معتبر نیست.');
  const expectedId = type === 'customer' || type === 'branch' ? Number(resolvedParty?.id) : null;
  if ((type === 'customer' || type === 'branch') && !(expectedId > 0)) {
    throw new Error('طرف حساب انتخاب‌شده در همین صراف پیدا نشد؛ ویرایش متوقف شد.');
  }
  const currentType = String(document.related_type || 'none').trim().toLowerCase();
  const currentId = document.related_id === null || document.related_id === undefined ? null : Number(document.related_id);
  const currentName = String(document.related_name || '').trim();
  if (currentType !== expectedType || currentId !== expectedId || currentName !== name) {
    throw new Error('طرف حساب یک گردش ثبت‌شده قابل تعویض نیست؛ برای تغییر طرف حساب، گردش قبلی را از مسیر ابطال اصلاح و گردش تازه ثبت کنید.');
  }
  return true;
}

export function bankLedgerRef(bank) {
  const id = String(bank?.id ?? '').trim();
  const name = String(bank?.bank_name || bank?.name || bank?.holder || '').trim();
  if (!/^[1-9]\d*$/.test(id) || !name) {
    throw new Error('حساب بانکی برای اتصال به دفتر کل معتبر نیست.');
  }
  return { account_type: 'bank', account_id: id, account_name: name };
}

export function isChartAccountLedgerLine(line, account) {
  if (!line || !account) return false;
  return String(line.account_type || '').toLowerCase() === 'suspense' &&
    String(line.account_id || '') === String(account.id || '') &&
    String(line.account_name || '').trim() === String(account.account_name || '').trim();
}

export function sumBankLedgerMovement(transactions, accountId, currency, side) {
  if (!Array.isArray(transactions) || !['debit', 'credit'].includes(side) || !(Number(accountId) > 0)) return 0;
  return transactions
    .filter(row => row && String(row.accountType || '').toLowerCase() === 'bank' &&
      String(row.accountId || '') === String(accountId) &&
      String(row.currency || 'AFN') === String(currency || 'AFN') && !row.deleted)
    .reduce((total, row) => total + number(row[side]), 0);
}

export function sumCashLedgerSide(transactions, accountId, currency, side) {
  if (!Array.isArray(transactions) || !['debit', 'credit'].includes(side) || !(Number(accountId) > 0)) return 0;
  return transactions
    .filter(row => row && String(row.accountType || '').toLowerCase() === 'cash' &&
      String(row.accountId || '') === String(accountId) &&
      String(row.currency || 'AFN') === String(currency || 'AFN') && !row.deleted)
    .reduce((total, row) => total + number(row[side]), 0);
}

export function sumCashLedgerMovement(transactions, currency) {
  if (!Array.isArray(transactions)) return 0;
  return transactions
    .filter(row => row && row.cash && String(row.currency || 'AFN') === String(currency || 'AFN'))
    .reduce((total, row) => total + number(row.amount), 0);
}

export function validateBalancedLines(lines, label = 'سند') {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error(`${label}: حداقل دو سطر حسابداری لازم است.`);
  }
  const totals = new Map();
  for (const [index, line] of lines.entries()) {
    const currency = String(line.currency || 'AFN').trim().toUpperCase();
    const debit = number(line.debit);
    const credit = number(line.credit);
    if (!currency || !Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      throw new Error(`${label}: مبلغ یا ماهیت بدهکار/بستانکار در سطر ${index + 1} معتبر نیست.`);
    }
    if (!line.account_type || !line.account_name) {
      throw new Error(`${label}: حساب سطر ${index + 1} مشخص نشده است.`);
    }
    if (['cash', 'customer', 'bank'].includes(String(line.account_type)) && !(Number(line.account_id) > 0)) {
      throw new Error(`${label}: شناسه حساب مرتبط در سطر ${index + 1} معتبر نیست.`);
    }
    const total = totals.get(currency) || { debit: 0, credit: 0 };
    total.debit += debit;
    total.credit += credit;
    totals.set(currency, total);
  }
  for (const [currency, total] of totals) {
    if (Math.abs(total.debit - total.credit) > 0.004) {
      throw new Error(`${label}: سند در ارز ${currency} تراز نیست؛ جمع بدهکار و بستانکار باید برابر باشد.`);
    }
  }
}
