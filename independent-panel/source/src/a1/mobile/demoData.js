// a1/mobile/demoData.js — پوستهٔ سازگاری داده و قالب‌بندی موبایل
// منابع اصلی: src/demo/seed.js (دادهٔ آزمایشی) و src/core/domain/* (قواعد و محاسبات).
// این فایل فقط نام‌های قبلی را نگه می‌دارد تا صفحه‌های موجود بدون تغییر کار کنند.
import { toPersianDigits } from '@/a1/lib/format';
import { currencyLabel } from '@/core/domain/currencies';
import { CURRENCIES } from '@/core/registry/schemas';
import { cashBalance, partyTotals, accountTypeLabel } from '@/core/domain/balances';
import { todayISO, daysAgo } from '@/core/domain/dates';
import { createDemoData, DEMO_EMPLOYEE_PERMISSIONS } from '@/demo/seed';

export {
  currencyLabel, CURRENCIES, cashBalance, partyTotals, accountTypeLabel,
  todayISO, daysAgo, createDemoData, DEMO_EMPLOYEE_PERMISSIONS,
};

export const fmt = (value) => toPersianDigits(
  new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value ?? 0) || 0)
);