// a1/components/v21/rates/ratesConfig.js
// تنظیمات بخش «نرخ روز»: ارزها، واحدهای مبنا، منابع اینترنتی و وضعیت اعتبار.
// در این فایل هیچ نرخی ذخیره نشده است؛ فقط ساختار و برچسب‌ها تعریف شده‌اند.

export const BASE_CURRENCIES = [
  { code: 'AFN', name: 'افغانی' },
  { code: 'USD', name: 'دالر امریکایی' },
  { code: 'EUR', name: 'یورو' },
  { code: 'IRR', name: 'ریال ایران' },
  { code: 'PKR', name: 'کلدار پاکستان' },
  { code: 'AED', name: 'درهم امارات' },
  { code: 'SAR', name: 'ریال سعودی' },
  { code: 'TRY', name: 'لیر ترکیه' },
  { code: 'GBP', name: 'پوند بریتانیا' },
  { code: 'CNY', name: 'یوان چین' },
];

// ارزهایی که در جدول‌های نرخ روز دیده می‌شوند (بدون مقدار نرخ)
export const RATE_CURRENCIES = [
  { code: 'USD', name: 'دالر امریکایی', symbol: '$' },
  { code: 'EUR', name: 'یورو', symbol: '€' },
  { code: 'GBP', name: 'پوند بریتانیا', symbol: '£' },
  { code: 'AED', name: 'درهم امارات', symbol: 'د.إ' },
  { code: 'SAR', name: 'ریال سعودی', symbol: 'ر.س' },
  { code: 'TRY', name: 'لیر ترکیه', symbol: '₺' },
  { code: 'PKR', name: 'کلدار پاکستان', symbol: '₨' },
  { code: 'IRR', name: 'ریال ایران', symbol: '﷼' },
  { code: 'CNY', name: 'یوان چین', symbol: '¥' },
];

// منابع مستقل دریافت نرخ. هر منبع جداگانه فعال یا قطع می‌شود.
// status: not_configured | connected | error
export const RATE_SOURCES = [
  { id: 'official-global', label: 'سرویس جهانی نرخ ارز (open.er-api.com)', kind: 'official', status: 'not_configured' },
  { id: 'official-banks', label: 'نرخ اعلامی بانک‌ها', kind: 'official', status: 'not_configured' },
  { id: 'market-kabul', label: 'بازار آزاد — کابل', kind: 'market', status: 'not_configured' },
  { id: 'market-herat', label: 'بازار آزاد — هرات', kind: 'market', status: 'not_configured' },
];

export const SOURCE_STATUS_META = {
  not_configured: { label: 'تنظیم نشده', badge: 'border-slate-200 bg-slate-100 text-slate-600' },
  connected: { label: 'متصل', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  error: { label: 'قطع', badge: 'border-rose-200 bg-rose-50 text-rose-700' },
};

export const VALIDITY_META = {
  missing: { label: 'بدون نرخ', badge: 'bg-slate-100 text-slate-600' },
  valid: { label: 'معتبر', badge: 'bg-emerald-50 text-emerald-700' },
  stale: { label: 'کهنه', badge: 'bg-amber-50 text-amber-800' },
  invalid: { label: 'نامعتبر', badge: 'bg-rose-50 text-rose-700' },
};

// نرخی که از این مدت بیشتر باشد «کهنه» شمرده می‌شود
export const STALE_AFTER_MINUTES = 60;

// ردیف‌های بدون مقدار: هیچ نرخ ساختگی ساخته نمی‌شود
export const emptyRateRows = (kind, baseCurrency) => RATE_CURRENCIES.map(currency => ({
  kind,
  code: currency.code,
  name: currency.name,
  symbol: currency.symbol,
  base: baseCurrency,
  buy: null,
  sell: null,
  source: '',
  updatedAt: null,
  validity: 'missing',
}));