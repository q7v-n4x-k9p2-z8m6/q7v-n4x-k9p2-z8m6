// سیاست‌های حسابداری تأییدشده برای نسخهٔ مستقل ۲۲
// این مقادیر تنظیمات محلی نسخهٔ ۲۲ هستند؛ هیچ داده یا سیاستی به نسخهٔ ۲۱ منتقل نمی‌شود.
export const APPROVED_TRIAL_BALANCE_POLICY = Object.freeze({
  columns: 'four',
  level: 'sub',
  currency: 'split',
  closing: 'close',
  baseCurrency: 'AFN',
});

export const APPROVED_BALANCE_SHEET_POLICY = Object.freeze({
  classification: 'code',
  periodResult: 'separate',
  valuation: 'current',
  rateBasis: 'mid',
  baseCurrency: 'AFN',
});

export const APPROVED_REVENUE_POLICY = Object.freeze({
  scope: 'all',
  document: 'separate',
  // دریافت نقدی در عملیات صندوق/بانک ثبت می‌شود تا یک دریافت دوبار شمرده نشود.
  cash: 'no',
});

// نرخ گزارشگری: نرخ حسابداری صریح اولویت دارد؛ در نبود آن فقط میانگین دو نرخ معتبر پذیرفته است.
export function ratesFromCurrencyRecords(records = []) {
  const rates = {};
  for (const row of records) {
    if (row?.is_active === false) continue;
    const code = String(row?.currency || row?.code || '').trim().toUpperCase();
    if (!code) continue;
    const explicit = Number(row.accounting_rate);
    const legacy = Number(row.rate);
    const buy = Number(row.buy_rate);
    const sell = Number(row.sell_rate);
    const hasBuy = Number.isFinite(buy) && buy > 0;
    const hasSell = Number.isFinite(sell) && sell > 0;
    const rate = Number.isFinite(explicit) && explicit > 0
      ? explicit
      : hasBuy && hasSell
        ? (buy + sell) / 2
        : !hasBuy && !hasSell && Number.isFinite(legacy) && legacy > 0
          ? legacy
          : null;
    if (rate !== null) rates[code] = Math.round((rate + Number.EPSILON) * 1000000) / 1000000;
  }
  return rates;
}

const EXPECTED_CLASS_BY_TYPE = {
  asset: '1',
  liability: '2',
  equity: '3',
  revenue: '4',
  expense: '5',
};

// بازسازی سطرهای تراز از کدینگ تجمیع‌شده؛ ماندهٔ حساب مادر از گردش مستقیم و فرزندان جدا می‌شود.
export function trialBalanceLinesFromAccounts(accounts = []) {
  const rows = Array.isArray(accounts) ? accounts : [];
  const byId = new Map(rows.map((row) => [String(row.id), row]));
  const children = new Map();
  rows.forEach((row) => {
    if (!row.parentId) return;
    const key = String(row.parentId);
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(row);
  });
  const lines = [];
  const missing = [];

  rows.forEach((account) => {
    const code = String(account.code || account.account_code || '').trim();
    const expected = EXPECTED_CLASS_BY_TYPE[String(account.accountType || account.account_type || '')];
    if (!code || !expected || code.charAt(0) !== expected) {
      missing.push('کدینگ حساب «' + (account.name || account.account_name || code || 'بدون نام') + '» با نوع حساب سازگار نیست');
      return;
    }
    const descendants = children.get(String(account.id)) || [];
    const currencyRows = new Map((account.balanceByCurrency || []).map((item) => [String(item.currency || 'AFN'), item]));
    const currencies = new Set(currencyRows.keys());
    descendants.forEach((child) => (child.balanceByCurrency || []).forEach((item) => currencies.add(String(item.currency || 'AFN'))));
    currencies.forEach((currency) => {
      const own = currencyRows.get(currency) || { debit: 0, credit: 0 };
      const childDebit = descendants.reduce((total, child) => total + Number((child.balanceByCurrency || []).find((item) => String(item.currency || 'AFN') === currency)?.debit || 0), 0);
      const childCredit = descendants.reduce((total, child) => total + Number((child.balanceByCurrency || []).find((item) => String(item.currency || 'AFN') === currency)?.credit || 0), 0);
      const debit = Math.round((Number(own.debit || 0) - childDebit) * 100) / 100;
      const credit = Math.round((Number(own.credit || 0) - childCredit) * 100) / 100;
      if (debit < -0.01 || credit < -0.01) {
        missing.push('گردش مستقیم حساب مادر «' + code + '» از جمع حساب‌های فرعی کمتر است');
        return;
      }
      if (debit > 0.005 || credit > 0.005) lines.push({ code, currency, debit: Math.max(0, debit), credit: Math.max(0, credit) });
    });
  });

  return missing.length
    ? { status: 'blocked', lines: [], missing: [...new Set(missing)] }
    : { status: 'ready', lines, missing: [] };
}
