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
