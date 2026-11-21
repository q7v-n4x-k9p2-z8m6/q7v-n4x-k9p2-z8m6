// a1/lib/jalali.js — تبدیل تاریخ بین ذخیرهٔ میلادی (ISO) و نمایش شمسی
// ذخیره‌سازی همیشه ISO می‌ماند؛ این ماژول فقط لایهٔ ورود و نمایش شمسی را تأمین می‌کند.
import { toEnglishDigits, toPersianDigits } from './format';

const jalaliParts = date => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' })
  .formatToParts(date)
  .reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = Number(toEnglishDigits(part.value));
    return acc;
  }, {});

// ظهر محلی؛ تا اختلاف منطقهٔ زمانی، روز را جابه‌جا نکند.
const atNoon = (year, month, day) => new Date(year, month - 1, day, 12, 0, 0, 0);

export function isoToJalaliText(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!match) return '';
  const { year, month, day } = jalaliParts(atNoon(Number(match[1]), Number(match[2]), Number(match[3])));
  return toPersianDigits(`${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`);
}

export function jalaliToIso(text) {
  const raw = String(text || '').trim();
  const gregorian = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (gregorian) {
    return `${gregorian[1]}-${String(gregorian[2]).padStart(2, '0')}-${String(gregorian[3]).padStart(2, '0')}`;
  }
  const cleaned = toEnglishDigits(raw).replace(/[.\-\s]/g, '/');
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(cleaned);
  if (!match) return '';
  const [jy, jm, jd] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return '';
  let cursor = atNoon(jy + 621, jm - 1, jd);
  for (let step = 0; step < 400; step += 1) {
    const shown = jalaliParts(cursor);
    const diff = (jy - shown.year) * 372 + (jm - shown.month) * 31 + (jd - shown.day);
    if (diff === 0) break;
    cursor = new Date(cursor.getTime() + Math.sign(diff) * Math.min(Math.abs(diff), 30) * 86400000);
  }
  const final = jalaliParts(cursor);
  if (final.year !== jy || final.month !== jm || final.day !== jd) return '';
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
}