// src/core/domain/dates.js — تاریخ‌های پایهٔ دامنه (بدون وابستگی به مرورگر یا پلتفرم)
// قالب تاریخ کاری برنامه ISO است (YYYY-MM-DD) تا مقایسه و ذخیره‌سازی یکسان بماند.

export const todayISO = () => new Date().toLocaleDateString('en-CA');

export const daysAgo = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return date.toLocaleDateString('en-CA');
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toPersian = (value) => String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);

// نمایش تاریخ در همهٔ فهرست‌ها و سرصفحه‌ها یکسان و شمسی است؛ ذخیره‌سازی همان ISO می‌ماند.
// تاریخِ نامعتبر یا خالی «—» نمی‌شود تا ردیف بدون تاریخ، ستون تاریخ را خالی نشان دهد.
export function displayDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!iso) return toPersian(raw);
  const [, year, month, day] = iso.map(Number);
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(year, month - 1, day, 12));
  const pick = (type) => (parts.find((part) => part.type === type) || {}).value || '';
  return toPersian(`${pick('year')}/${pick('month')}/${pick('day')}`);
}