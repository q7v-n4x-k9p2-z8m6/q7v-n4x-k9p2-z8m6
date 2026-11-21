// a1/lib/fiscalPeriods.js — منطق خالص دوره‌های مالی
// این ماژول فقط محاسبه و اعتبارسنجی می‌کند؛ خواندن و نوشتن در لایهٔ v21Write انجام می‌شود.
// بازهٔ هر دوره دو سر inclusive است: سندِ روز شروع و روز پایان هم داخل همان دوره است.

const day = value => String(value ?? '').slice(0, 10);

export const PERIOD_STATUS_LABELS = { open: 'باز', closed: 'بسته' };

export const periodIsClosed = row => String(row?.status || '') === 'closed';

export function dateInPeriod(row, date) {
  const value = day(date);
  if (!value) return false;
  const start = day(row?.start_date ?? row?.start);
  const end = day(row?.end_date ?? row?.end);
  if (start && value < start) return false;
  if (end && value > end) return false;
  return Boolean(start || end);
}

// نخستین دورهٔ بسته‌ای که تاریخ داده‌شده در آن می‌افتد (برای توقف ثبت و ویرایش)
export const findClosedPeriod = (rows, date) => (rows || []).find(row => periodIsClosed(row) && dateInPeriod(row, date)) || null;

export function periodsOverlap(first, second) {
  const firstStart = day(first.start_date);
  const firstEnd = day(first.end_date);
  const secondStart = day(second.start_date);
  const secondEnd = day(second.end_date);
  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return false;
  return !(firstEnd < secondStart || firstStart > secondEnd);
}

// اعتبارسنجی پیش از ذخیره؛ پیام‌ها مستقیماً به کاربر نشان داده می‌شوند.
export function validatePeriodDraft(draft, periods = [], editingId = '') {
  const code = String(draft?.code || '').trim();
  const name = String(draft?.name || '').trim();
  const startDate = day(draft?.start_date);
  const endDate = day(draft?.end_date);
  if (!code) throw new Error('کد دورهٔ مالی الزامی است.');
  if (!name) throw new Error('نام دورهٔ مالی الزامی است.');
  if (!startDate || !endDate) throw new Error('تاریخ شروع و پایان دورهٔ مالی الزامی است.');
  if (endDate < startDate) throw new Error('تاریخ پایان دوره نمی‌تواند پیش از تاریخ شروع آن باشد.');
  const duplicateCode = (periods || []).find(row => String(row.id) !== String(editingId)
    && String(row.period_code || '').trim() === code);
  if (duplicateCode) throw new Error('این کد دورهٔ مالی قبلاً استفاده شده است.');
  const clash = (periods || []).find(row => String(row.id) !== String(editingId) && periodsOverlap(row, { start_date: startDate, end_date: endDate }));
  if (clash) {
    throw new Error(`این بازه با دورهٔ «${clash.period_name || clash.period_code}» هم‌پوشانی دارد؛ تاریخ‌ها را جدا کنید.`);
  }
  return { code, name, startDate, endDate, description: String(draft?.description || '').trim() };
}

// پیام توقف ثبت برای تاریخ داخل دورهٔ بسته
export const closedPeriodMessage = (period, date) => {
  const label = period?.period_name || period?.period_code || 'بدون نام';
  return `دورهٔ مالی «${label}» بسته شده است؛ ثبت یا ویرایش سند به تاریخ ${day(date)} در این دوره مجاز نیست.`;
};