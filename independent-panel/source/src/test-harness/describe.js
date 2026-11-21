// test-harness/describe.js — خلاصهٔ نمایشی هر ردیف فهرست
import { fmt, money, currencyLabel } from './format';

const pair = (label, value) => [label, value === undefined || value === null || value === '' ? '—' : value];

export function describeRow(moduleId, row) {
  switch (moduleId) {
    case 'customers':
      return {
        title: row.name,
        sub: `${row.code} · ${row.city}`,
        badge: row.status,
        pairs: [pair('تلفن', row.phone), pair('مانده', money(row.balance, row.ledgerCurrency))],
      };
    case 'branches':
      return {
        title: row.name,
        sub: `${row.code} · ${row.city}`,
        badge: row.status,
        pairs: [pair('تلفن', row.phone), pair('مانده', money(row.balance, row.ledgerCurrency))],
      };
    case 'debtors':
      return {
        title: row.name,
        sub: row.code,
        badge: row.side,
        pairs: [pair('مانده', money(row.balance, row.currency)), pair('تلفن', row.phone)],
      };
    case 'cash':
      return {
        title: row.name,
        sub: currencyLabel(row.currency),
        badge: row.status,
        pairs: [pair('افتتاحیه', fmt(row.opening)), pair('ماندهٔ گردش', money(row.balance, row.currency))],
      };
    case 'banks':
      return {
        title: row.name,
        sub: `حساب ${row.account}`,
        badge: row.status,
        pairs: [pair('ارز', currencyLabel(row.currency)), pair('افتتاحیه', money(row.opening, row.currency))],
      };
    case 'transactions':
      return {
        title: `${row.number} · ${row.kind}`,
        sub: `${row.date} · ${row.party}`,
        badge: row.direction,
        pairs: [pair('مبلغ', money(row.amount, row.currency)), pair('شرح', row.description)],
      };
    case 'remittances':
      return {
        title: `حوالهٔ ${row.number}`,
        sub: `${row.date} · ${row.direction}`,
        badge: row.status,
        pairs: [pair('فرستنده', row.sender), pair('گیرنده', row.receiver), pair('مبلغ', money(row.amount, row.currency))],
      };
    case 'expenses':
      return {
        title: row.title,
        sub: `${row.number} · ${row.date}`,
        badge: row.status,
        pairs: [pair('مبلغ', money(row.amount, row.currency)), pair('پرداخت', row.payer)],
      };
    case 'ledgers':
      return {
        title: row.name,
        sub: `${row.partyType === 'customer' ? 'مشتری' : row.partyType === 'branch' ? 'نمایندگی' : 'صندوق'} · ${currencyLabel(row.currency)}`,
        badge: row.side,
        pairs: [pair('مانده', money(row.totals.balance, row.currency)), pair('ردیف‌ها', fmt(row.lines.length))],
      };
    default:
      return { title: row.name || row.id, sub: '', badge: '', pairs: [] };
  }
}