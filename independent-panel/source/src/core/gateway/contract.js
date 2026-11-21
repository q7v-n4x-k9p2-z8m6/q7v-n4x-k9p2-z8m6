// src/core/gateway/contract.js — قرارداد درگاه دادهٔ حساب صراف (مستقل از پلتفرم)
// این فایل هیچ وابستگی‌ای به React، Base44 یا مرورگر ندارد و مبنای انتقال به نسخهٔ واقعی است.
// هر منبع داده (حافظه، موتور محلی، API واقعی) باید همین عملیات را پیاده کند.

export class GatewayError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.details = details;
  }
}

export const GATEWAY_METHODS = [
  'snapshot', 'subscribe', 'list', 'get', 'count',
  'create', 'update', 'deactivate', 'remove', 'reverse',
  'replaceAll', 'clearExcept', 'reset',
];

export function assertGateway(gateway, label = 'gateway') {
  if (!gateway) throw new GatewayError('NO_GATEWAY', `درگاه ${label} تعریف نشده است.`);
  const missing = GATEWAY_METHODS.filter((name) => typeof gateway[name] !== 'function');
  if (missing.length) {
    throw new GatewayError('INVALID_GATEWAY', `درگاه ${label} این عملیات را ندارد: ${missing.join(', ')}`);
  }
  return gateway;
}

export const ALL_CURRENCIES = 'همه';

// پرس‌وجوی استاندارد درگاه — همهٔ منابع باید همین شکل را بپذیرند
export function normalizeQuery(query = {}) {
  return {
    search: String(query.search ?? '').trim(),
    currency: query.currency || ALL_CURRENCIES,
    from: query.from || '',
    to: query.to || '',
    filters: query.filters || {},
  };
}

const toText = (value) => (value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));

export function matchesQuery(record, query) {
  const parsed = normalizeQuery(query);
  if (parsed.search) {
    const haystack = Object.values(record || {}).map(toText).join(' ').toLowerCase();
    if (!haystack.includes(parsed.search.toLowerCase())) return false;
  }
  if (parsed.currency !== ALL_CURRENCIES && record?.currency && record.currency !== parsed.currency) return false;
  if (parsed.from && record?.date && record.date < parsed.from) return false;
  if (parsed.to && record?.date && record.date > parsed.to) return false;
  return Object.entries(parsed.filters).every(([key, value]) => record?.[key] === value);
}

export function createId(prefix = 'g-') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}