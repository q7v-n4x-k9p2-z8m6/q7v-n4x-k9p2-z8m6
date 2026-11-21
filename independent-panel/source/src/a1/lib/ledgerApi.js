// a1/lib/ledgerApi.js — سازندگان ردیف دفتر و ثبت سند
// نام‌ها و امضاها از reference/A1-extracted-source-temp/src/lib/ledgerApi.js حفظ شده‌اند؛
// اجرای نوشتن از طریق مرز ذخیره‌سازی محلی (IndexedDB) انجام می‌شود.
import { postDocument as postLocal, reverseDocument as reverseLocal } from '@/a1/lib/db';

export async function postDocument(payload) {
  return postLocal(payload);
}

export async function reverseDocument(documentId, reason, registeredBy) {
  return reverseLocal(documentId, reason, registeredBy);
}

export function buildTransferLines({ from_type, from_id, to_type, to_id, currency, amount }) {
  const fromName = from_type === 'cash' ? `صندوق ${currency}` : 'حساب بانکی';
  const toName = to_type === 'cash' ? `صندوق ${currency}` : 'حساب بانکی';
  return [
    {
      account_type: to_type === 'cash' ? 'cash' : 'bank',
      account_id: String(to_id),
      account_name: toName,
      currency,
      debit: Number(amount) || 0,
      credit: 0,
    },
    {
      account_type: from_type === 'cash' ? 'cash' : 'bank',
      account_id: String(from_id),
      account_name: fromName,
      currency,
      debit: 0,
      credit: Number(amount) || 0,
    },
  ];
}

export function buildOpeningBalanceLines({ customer_id, customer_name, currency, amount }) {
  return [
    {
      account_type: 'cash',
      account_id: String(customer_id || ''),
      account_name: customer_name,
      currency,
      debit: Number(amount) || 0,
      credit: 0,
    },
    {
      account_type: 'equity',
      account_name: 'ماندهٔ آغازین',
      currency,
      debit: 0,
      credit: Number(amount) || 0,
    },
  ];
}

export function buildTradeLines({ customer_id, customer_name, currency, amount, paid_amount, paid_currency, side = 'buy' }) {
  const debitCustomer = side === 'sell';
  return [
    {
      account_type: 'customer',
      account_id: String(customer_id || ''),
      account_name: customer_name,
      currency: debitCustomer ? currency : paid_currency,
      debit: debitCustomer ? Number(amount) || 0 : Number(paid_amount) || 0,
      credit: debitCustomer ? 0 : 0,
    },
    {
      account_type: 'cash',
      account_name: 'صندوق',
      currency: debitCustomer ? paid_currency : currency,
      debit: 0,
      credit: debitCustomer ? Number(paid_amount) || 0 : Number(amount) || 0,
    },
  ];
}

export default {
  postDocument,
  reverseDocument,
  buildTransferLines,
  buildOpeningBalanceLines,
  buildTradeLines,
};