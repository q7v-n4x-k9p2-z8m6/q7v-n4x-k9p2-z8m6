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
  baseCurrency: 'AFN',
});

export const APPROVED_REVENUE_POLICY = Object.freeze({
  scope: 'all',
  document: 'separate',
  // دریافت نقدی در عملیات صندوق/بانک ثبت می‌شود تا یک دریافت دوبار شمرده نشود.
  cash: 'no',
});
