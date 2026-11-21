// src/core/domain/currencies.js — نام فارسی ارزها
// تنها منبع برچسب ارز؛ لایهٔ نمایش و فرم‌ها از همین‌جا می‌خوانند.

export const CURRENCY_NAMES = {
  AFN: 'افغانی', USD: 'دالر', EUR: 'یورو', IRR: 'تومان', TRY: 'لیر ترکی',
  PKR: 'کلدار', AED: 'درهم', SAR: 'ریال سعودی', GBP: 'پوند', CNY: 'یوان چین',
};

export function currencyLabel(code) {
  const key = String(code ?? '').trim().toUpperCase();
  return CURRENCY_NAMES[key] || String(code ?? '');
}