// src/core/domain/reversal.js — قاعدهٔ ابطال اسناد مالی با ثبت سند معکوس
// بدون React و بدون مرورگر: همین قاعده در نسخهٔ واقعی هم استفاده می‌شود.
// هیچ سندی حذف نمی‌شود: سند اصلی «ابطال شده» می‌شود، سند معکوس ثبت می‌گردد و علت ابطال اجباری است.
import { num } from './posting.js';
import { todayISO } from './dates.js';

export const REVERSED_STATUS = 'ابطال شده';
export const COUNTER_STATUS = 'سند معکوس';
export const REVERSIBLE_COLLECTIONS = ['expenses', 'remittance', 'exchange', 'journal', 'transactions'];

export const isReversed = (record) => record?.status === REVERSED_STATUS;
export const isCounterDocument = (record) => Boolean(record?.reversalOf);
export const isLocked = (record) => isReversed(record) || isCounterDocument(record);

export function reversalError(collection, record, reason) {
  if (!record) return 'ابتدا یک ردیف را انتخاب کنید.';
  if (!REVERSIBLE_COLLECTIONS.includes(collection)) {
    return 'این نوع رکورد ابطال‌شدنی نیست؛ رکوردهای پایه فقط غیرفعال می‌شوند.';
  }
  if (isReversed(record)) return 'این سند قبلاً ابطال شده است.';
  if (isCounterDocument(record)) return 'سند معکوس خودش قابل ابطال نیست.';
  if (String(reason ?? '').trim().length < 3) return 'علت ابطال باید حداقل سه نویسه باشد.';
  return '';
}

// خروجی: سند معکوس + تغییرات سند اصلی
export function buildReversal(collection, record, reason, options = {}) {
  const error = reversalError(collection, record, reason);
  if (error) throw new Error(error);

  const date = options.date || todayISO();
  const note = String(reason).trim();
  const base = {
    ...record,
    id: undefined,
    date,
    number: 'RV-' + (record.number || record.id),
    status: COUNTER_STATUS,
    reversalOf: record.id,
    reversalReason: note,
    reversalDate: date,
  };

  let counter;
  switch (collection) {
    case 'expenses':
      counter = { ...base, amount: -num(record.amount) };
      break;
    case 'remittance':
      counter = {
        ...base,
        amount: -num(record.amount),
        fee: -num(record.fee),
        direction: record.direction === 'ارسالی' ? 'دریافتی' : 'ارسالی',
      };
      break;
    case 'exchange':
      counter = {
        ...base,
        foreignAmount: -num(record.foreignAmount),
        baseAmount: -num(record.baseAmount),
        fee: -num(record.fee),
      };
      break;
    case 'journal': {
      const rows = (record.rows || []).map((row) => ({
        account: row.account,
        debit: num(row.credit) || '',
        credit: num(row.debit) || '',
      }));
      counter = { ...base, rows, debitTotal: num(record.creditTotal), creditTotal: num(record.debitTotal) };
      break;
    }
    case 'transactions':
      counter = { ...base, amount: -num(record.amount) };
      break;
    default:
      counter = base;
  }

  return {
    counter,
    originalPatch: { status: REVERSED_STATUS, reversalReason: note, reversalDate: date },
  };
}