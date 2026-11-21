// a1/lib/v21Domain.js — سازندگان خطوط حسابداری پنج بخش هستهٔ میز کار
// توابع خالص‌اند: هیچ پایگاه داده، شبکه یا وضعیت سراسری ندارند و تنها ورودی/خروجی حسابداری می‌سازند.
import { number, validateBalancedLines } from './v21Rules';

export const REMITTANCE_SETTLEMENTS = [
  { value: 'suspense', label: 'حساب واسط حواله (تسویهٔ بعدی)' },
  { value: 'instant', label: 'تسویهٔ فوری از صندوق یا بانک' },
];

export const EXCHANGE_KINDS = [
  { value: 'convert', label: 'تبدیل دو ارز' },
  { value: 'buy', label: 'خرید اسعار از مشتری' },
  { value: 'sell', label: 'فروش اسعار به مشتری' },
];

export function positive(value, message) {
  const parsed = number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(message);
  return parsed;
}

export function nonNegative(value, message) {
  const parsed = number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(message);
  return parsed;
}

export function suspenseRef(accountId, name, currency) {
  return { account_type: 'suspense', account_id: accountId != null ? String(accountId) : '', account_name: name, currency };
}

export function customerRef(customer, currency) {
  return { account_type: 'customer', account_id: String(customer.id), account_name: customer.name, currency };
}

// حواله: طرف حساب در برابر حساب واسط یا حساب تسویهٔ فوری (صندوق/بانک)
export function buildRemittanceLines({ direction, amount, currency, party, counter }) {
  const value = positive(amount, 'مبلغ حواله باید عدد معتبر و بزرگ‌تر از صفر باشد.');
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
  const value = positive(amount, 'مبلغ کمیشن باید عدد معتبر و بزرگ‌تر از صفر باشد.');
  if (!party || !revenue) throw new Error('حساب مشتری و حساب درآمد کمیشن باید مشخص باشند.');
  const lines = [
    { ...party, currency, debit: value, credit: 0 },
    { ...revenue, currency, debit: 0, credit: value },
  ];
  validateBalancedLines(lines, 'کمیشن');
  return lines;
}

// مصرف: حساب مصرف بدهکار، صندوق یا بانک پرداخت‌کننده بستانکار
export function buildExpenseLines({ amount, currency, expense, payer }) {
  const value = positive(amount, 'مبلغ مصرف باید عدد معتبر و بزرگ‌تر از صفر باشد.');
  if (!expense || !payer) throw new Error('حساب مصرف و حساب پرداخت‌کننده باید مشخص باشند.');
  const lines = [
    { ...expense, currency, debit: value, credit: 0 },
    { ...payer, currency, debit: 0, credit: value },
  ];
  validateBalancedLines(lines, 'مصرف');
  return lines;
}

// انتقال بین حساب‌های خود صراف: مقصد بدهکار و مبدأ بستانکار می‌شود؛
// هر دو سطر یک سند و یک شناسهٔ تسویهٔ مشترک دارند تا انتقال در دو حساب آینهٔ هم باشند.
export function buildSettlementLines({ amount, currency, from, to }) {
  const value = positive(amount, 'مبلغ انتقال باید معتبر و بزرگ‌تر از صفر باشد.');
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

// شناسهٔ تسویهٔ مشترک: اگر کاربر آن را خالی بگذارد، همین تابع یک شناسهٔ یکتا می‌سازد.
export function makeSettlementNumber(date) {
  const day = String(date || new Date().toISOString().slice(0, 10)).replace(/\D/g, '');
  return 'ST-' + day + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// دخل و خرج صندوق
export function buildCashMovementLines({ kind, amount, currency, cash, counter }) {
  const value = positive(amount, 'مبلغ گردش صندوق باید عدد معتبر و بزرگ‌تر از صفر باشد.');
  if (!cash || !counter) throw new Error('صندوق و حساب مقابل باید مشخص باشند.');
  const cashLine = { ...cash, currency };
  const counterLine = { ...counter, currency };
  const lines = kind === 'دخل'
    ? [{ ...cashLine, debit: value, credit: 0 }, { ...counterLine, debit: 0, credit: value }]
    : [{ ...counterLine, debit: value, credit: 0 }, { ...cashLine, debit: 0, credit: value }];
  validateBalancedLines(lines, 'گردش صندوق');
  return lines;
}

// معاملهٔ اسعار:
// - convert: طرف A ارزی که صراف می‌پردازد، طرف B ارزی که صراف دریافت می‌کند (رفتار موجود نسخهٔ ۲۱)
// - buy: طرف A ارز خارجی دریافتی از مشتری، طرف B ارز پایهٔ پرداختی به مشتری
// - sell: طرف A ارز خارجی پرداختی به مشتری، طرف B ارز پایهٔ دریافتی از مشتری
export function buildConversionLines({ kind, party, currencyA, amountA, accountA, currencyB, amountB, accountB }) {
  const a = positive(amountA, 'مبلغ طرف اول معامله باید معتبر و مثبت باشد.');
  const b = positive(amountB, 'مبلغ طرف دوم معامله باید معتبر و مثبت باشد.');
  if (!accountA || !accountB) throw new Error('حساب‌های دو طرف معامله باید مشخص باشند.');
  if (!party) throw new Error('طرف حساب معامله باید مشخص باشد.');
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

// روزنامچه: هر تعداد سطر، همه در یک ارز، با کنترل توازن
export function buildJournalLines({ rows, currency }) {
  if (!Array.isArray(rows) || rows.length < 2) throw new Error('سند روزنامچه باید حداقل دو سطر داشته باشد.');
  const lines = [];
  let debitRows = 0;
  let creditRows = 0;

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

export function journalTotals(rows) {
  const totals = {};
  (rows || []).forEach(row => {
    const currency = String(row.currency || 'AFN');
    totals[currency] = totals[currency] || { currency, debit: 0, credit: 0 };
    totals[currency].debit += number(row.debit) || 0;
    totals[currency].credit += number(row.credit) || 0;
  });
  return Object.values(totals).map(total => ({
    ...total,
    balanced: Math.abs(total.debit - total.credit) < 0.005,
    difference: total.debit - total.credit,
  }));
}