/**
 * تنظیمات پایهٔ نسخهٔ مرجع حساب صراف
 * این فایل تنها منبع حقیقت برای اطلاعات نمایشی و ارز پایه است.
 */

export const APP_META = {
  name: 'حساب صراف',
  edition: 'نسخهٔ مرجع آزمایشی',
  version: '0.1.0',
  buildStage: 'اسکلت جامع — فاز اول',
  isDemoEnvironment: true,
};

export const EXCHANGE = {
  name: 'صرافی نمونهٔ مرجع',
  code: 'DEMO-001',
  city: 'کابل',
  country: 'افغانستان',
  phone: '—',
  email: '—',
};

export const BASE_CURRENCY = 'AFN';

export const CURRENCY_LABELS = {
  AFN: 'افغانی',
  USD: 'دلار آمریکا',
  EUR: 'یورو',
  AED: 'درهم امارات',
  TRY: 'لیر ترکیه',
  GBP: 'پوند انگلیس',
  PKR: 'کلدار پاکستان',
  IRR: 'ریال ایران',
  CNY: 'یوان چین',
  SAR: 'ریال سعودی',
};

export const STORAGE_KEYS = {
  role: 'hesab-sarraf:demo-role',
  language: 'hesab-sarraf:language',
  baseCurrency: 'hesab-sarraf:base-currency',
};