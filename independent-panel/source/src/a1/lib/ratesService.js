// a1/lib/ratesService.js — دریافت نرخ روز از سرویس جهانی نرخ ارز
// منبع اصلی: open.er-api.com (بدون کلید دسترسی، نرخ میانی روزانه)
// منبع پشتیبان: currency-api روی jsDelivr
// این ماژول فقط داده می‌خواند؛ هیچ رکورد یا سند حسابداری را تغییر نمی‌دهد.

export const RATE_SERVICE_ID = 'official-global';
export const RATE_SERVICE_LABEL = 'سرویس جهانی نرخ ارز (open.er-api.com)';

async function tryOpenErApi(base) {
  const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const json = await response.json();
  if (!json || json.result !== 'success' || !json.rates) return null;
  const updatedAt = json.time_last_update_unix
    ? new Date(json.time_last_update_unix * 1000)
    : new Date();
  return { rates: json.rates, updatedAt, source: 'open.er-api.com' };
}

async function tryCurrencyApi(base) {
  const lower = base.toLowerCase();
  const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${lower}.json`, { cache: 'no-store' });
  if (!response.ok) return null;
  const json = await response.json();
  const table = json?.[lower];
  if (!table || typeof table !== 'object') return null;
  const rates = Object.fromEntries(Object.entries(table).map(([code, value]) => [code.toUpperCase(), value]));
  return {
    rates,
    updatedAt: json.date ? new Date(json.date) : new Date(),
    source: 'currency-api (jsDelivr)',
  };
}

// خروجی: { rates: { USD: 0.012, ... }, updatedAt: Date, source: string }
export async function fetchDailyRates(baseCode) {
  const base = String(baseCode || 'USD').toUpperCase();
  let result = null;

  try {
    result = await tryOpenErApi(base);
  } catch {
    result = null;
  }
  if (result) return result;

  try {
    result = await tryCurrencyApi(base);
  } catch {
    result = null;
  }
  if (result) return result;

  throw new Error('دریافت نرخ از سرویس جهانی ناموفق بود؛ اتصال اینترنت یا دسترسی به سرویس را بررسی کنید.');
}