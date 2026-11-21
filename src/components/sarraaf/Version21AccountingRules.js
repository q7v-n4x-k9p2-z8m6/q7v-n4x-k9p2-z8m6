export const number = value => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export function withRunningPartyBalances(rows, openingByCurrency = {}) {
  if (!Array.isArray(rows)) return [];
  const balances = new Map();
  return [...rows]
    .sort((a, b) => String(a.created_at || a.date || '').localeCompare(String(b.created_at || b.date || '')) || String(a.id || '').localeCompare(String(b.id || '')))
    .map(row => {
      const currency = String(row.currency || 'AFN');
      if (!balances.has(currency)) balances.set(currency, number(openingByCurrency[currency] ?? 0));
      // Party ledger rows are mapped as credit - debit; a positive opening balance is debit.
      const balance = balances.get(currency) - number(row.amount);
      balances.set(currency, balance);
      return { ...row, runningNet: balance, runningBalance: Math.abs(balance), runningSide: balance > 0 ? 'بدهکار' : balance < 0 ? 'بستانکار' : 'تسویه' };
    });
}

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


export function buildRemittanceLines({ direction, amount, currency, party, counter }) {
  const value = number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ حواله باید عدد معتبر و بزرگ‌تر از صفر باشد.');
  if (!party || !counter) throw new Error('طرف حساب و حساب مقابل حواله باید مشخص باشند.');
  const partyLine = { ...party, currency };
  const counterLine = { ...counter, currency };
  const lines = direction === 'دریافتی'
    ? [{ ...counterLine, debit: value, credit: 0 }, { ...partyLine, debit: 0, credit: value }]
    : [{ ...partyLine, debit: value, credit: 0 }, { ...counterLine, debit: 0, credit: value }];
  validateBalancedLines(lines, 'حواله');
  return lines;
}

export function buildFeeLines({ amount, currency, party, revenue }) {
  const value = number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ کمیشن باید عدد معتبر و بزرگ‌تر از صفر باشد.');
  if (!party || !revenue) throw new Error('حساب طرف معامله و حساب درآمد کمیشن باید مشخص باشند.');
  const lines = [
    { ...party, currency, debit: value, credit: 0 },
    { ...revenue, currency, debit: 0, credit: value },
  ];
  validateBalancedLines(lines, 'کمیشن');
  return lines;
}

export function buildExpenseLines({ amount, currency, expense, payer }) {
  const value = number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ مصرف باید عدد معتبر و بزرگ‌تر از صفر باشد.');
  if (!expense || !payer) throw new Error('حساب مصرف و حساب پرداخت‌کننده باید مشخص باشند.');
  const lines = [
    { ...expense, currency, debit: value, credit: 0 },
    { ...payer, currency, debit: 0, credit: value },
  ];
  validateBalancedLines(lines, 'مصرف');
  return lines;
}

export function buildSettlementLines({ amount, currency, from, to }) {
  const value = number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('مبلغ انتقال باید معتبر و بزرگ‌تر از صفر باشد.');
  if (!from || !to) throw new Error('حساب مبدأ و مقصد انتقال باید مشخص باشند.');
  if (String(from.account_type) === String(to.account_type) && String(from.account_id) === String(to.account_id)) {
    throw new Error('حساب مبدأ و مقصد نباید یکی باشند.');
  }
  const lines = [
    { ...to, currency, debit: value, credit: 0 },
    { ...from, currency, debit: 0, credit: value },
  ];
  validateBalancedLines(lines, 'انتقال بین حساب‌ها');
  return lines;
}

export function makeSettlementNumber(date) {
  const day = String(date || new Date().toISOString().slice(0, 10)).replace(/\D/g, '');
  return 'ST-' + day + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function buildConversionLines({ kind, party, currencyA, amountA, accountA, currencyB, amountB, accountB }) {
  const a = number(amountA), b = number(amountB);
  if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(b) || b <= 0) {
    throw new Error('مبالغ هر دو طرف معامله باید معتبر و مثبت باشند.');
  }
  if (!accountA || !accountB || !party) throw new Error('حساب‌های دو طرف و طرف حساب معامله باید مشخص باشند.');
  if (String(currencyA) === String(currencyB)) throw new Error('ارز دو طرف معامله باید متفاوت باشد.');
  const sideA = { ...accountA, currency: currencyA };
  const sideB = { ...accountB, currency: currencyB };
  const counterA = { ...party, currency: currencyA };
  const counterB = { ...party, currency: currencyB };
  const lines = kind === 'buy'
    ? [
        { ...sideA, debit: a, credit: 0 },
        { ...counterA, debit: 0, credit: a },
        { ...counterB, debit: b, credit: 0 },
        { ...sideB, debit: 0, credit: b },
      ]
    : kind === 'sell'
      ? [
          { ...sideA, debit: 0, credit: a },
          { ...counterA, debit: a, credit: 0 },
          { ...counterB, debit: 0, credit: b },
          { ...sideB, debit: b, credit: 0 },
        ]
      : [
          { ...counterA, debit: a, credit: 0 },
          { ...sideA, debit: 0, credit: a },
          { ...sideB, debit: b, credit: 0 },
          { ...counterB, debit: 0, credit: b },
        ];
  validateBalancedLines(lines, 'معاملهٔ اسعار');
  return lines;
}

export function buildJournalLines({ rows, currency }) {
  if (!Array.isArray(rows) || rows.length < 2) throw new Error('سند روزنامچه باید حداقل دو سطر داشته باشد.');
  const lines = [];
  let debitRows = 0, creditRows = 0;
  for (const row of rows) {
    const debit = number(row.debit) || 0;
    const credit = number(row.credit) || 0;
    if (debit === 0 && credit === 0) throw new Error('هر سطر سند باید مبلغ بدهکار یا بستانکار داشته باشد.');
    if (debit < 0 || credit < 0) throw new Error('مبلغ سطر نمی‌تواند منفی باشد.');
    if (debit > 0 && credit > 0) throw new Error('در هر سطر فقط یکی از بدهکار یا بستانکار مجاز است.');
    if (!row.account_name) throw new Error('حساب هر سطر باید انتخاب شود.');
    if (debit > 0) debitRows += 1; else creditRows += 1;
    lines.push({
      account_type: row.account_type,
      account_id: row.account_id,
      account_name: row.account_name,
      currency: row.currency || currency || 'AFN',
      debit,
      credit,
    });
  }
  if (!debitRows || !creditRows) throw new Error('سند باید حداقل یک سطر بدهکار و یک سطر بستانکار داشته باشد.');
  validateBalancedLines(lines, 'سند روزنامچه');
  return lines;
}
