// test-harness/detailLinks.js — ساخت جزئیات و پیوندهای هر رکورد
import { fmt, money, currencyLabel } from './format';

const field = (label, value) => [label, value === undefined || value === null || value === '' ? '—' : value];

export function buildDetail(kind, record, gateway) {
  if (!record) return null;

  if (kind === 'customer') {
    return {
      title: record.name,
      sub: `${record.code} · ${record.city}`,
      badge: `${record.balanceSide} · ${money(record.balance, record.ledgerCurrency)}`,
      fields: [
        field('کد مشتری', record.code),
        field('تلفن', record.phone),
        field('شهر', record.city),
        field('نوع حساب', record.kind),
        field('ارز حساب', currencyLabel(record.ledgerCurrency)),
        field('مانده', money(record.balance, record.ledgerCurrency)),
        field('وضعیت', record.status),
      ],
      links: [
        record.ledgerId && { key: 'ledger', kind: 'statement', id: record.ledgerId, label: 'دفتر حساب مشتری', hint: 'گردش کامل و سطرهای سند' },
        { key: 'tx', kind: 'list', moduleId: 'transactions', filter: { field: 'customerId', value: record.id }, label: 'تراکنش‌های این مشتری', hint: 'فهرست فیلترشده' },
        { key: 'tr', kind: 'list', moduleId: 'remittances', filter: { field: 'customerId', value: record.id }, label: 'حواله‌های این مشتری', hint: 'فهرست فیلترشده' },
      ].filter(Boolean),
    };
  }

  if (kind === 'branch') {
    return {
      title: record.name,
      sub: `${record.code} · ${record.city}`,
      badge: record.balanceSide,
      fields: [
        field('کد نمایندگی', record.code),
        field('تلفن', record.phone),
        field('شهر', record.city),
        field('مانده', money(record.balance, record.ledgerCurrency)),
        field('وضعیت', record.status),
      ],
      links: [
        record.ledgerId && { key: 'ledger', kind: 'statement', id: record.ledgerId, label: 'دفتر حساب نمایندگی', hint: 'گردش حساب نمایندگی' },
        { key: 'tr', kind: 'list', moduleId: 'remittances', filter: { field: 'branchId', value: record.id }, label: 'حواله‌های این نمایندگی', hint: 'فهرست فیلترشده' },
      ].filter(Boolean),
    };
  }

  if (kind === 'cash') {
    const expenses = gateway.relatedExpensesForCash(record.id);
    const transactions = gateway.relatedTransactionsForCash(record.id);
    return {
      title: record.name,
      sub: currencyLabel(record.currency),
      badge: record.status,
      fields: [
        field('ارز', currencyLabel(record.currency)),
        field('موجودی افتتاحیه', fmt(record.opening)),
        field('ماندهٔ گردش', money(record.balance, record.currency)),
        field('راستی‌آزمایی', `${fmt(expenses.length)} مصرف · ${fmt(transactions.length)} تراکنش`),
      ],
      links: [
        record.ledgerId && { key: 'ledger', kind: 'statement', id: record.ledgerId, label: 'دفتر حساب صندوق', hint: 'گردش صندوق با ماندهٔ تجمعی' },
        { key: 'tx', kind: 'list', moduleId: 'transactions', filter: { field: 'cashId', value: record.id }, label: 'تراکنش‌های صندوق', hint: 'فهرست فیلترشده' },
        { key: 'ex', kind: 'list', moduleId: 'expenses', filter: { field: 'cashId', value: record.id }, label: 'مصارف پرداخت‌شده از صندوق', hint: 'فهرست فیلترشده' },
      ].filter(Boolean),
    };
  }

  if (kind === 'bank') {
    const expenses = gateway.relatedExpensesForBank(record.id);
    return {
      title: record.name,
      sub: `حساب ${record.account}`,
      badge: record.status,
      fields: [
        field('شماره حساب', record.account),
        field('صاحب حساب', record.holder),
        field('ارز', currencyLabel(record.currency)),
        field('موجودی افتتاحیه', money(record.opening, record.currency)),
        field('مصارف مرتبط', fmt(expenses.length)),
      ],
      links: [
        { key: 'ex', kind: 'list', moduleId: 'expenses', filter: { field: 'bankId', value: record.id }, label: 'مصارف پرداخت‌شده از بانک', hint: 'فهرست فیلترشده' },
        { key: 'tx', kind: 'list', moduleId: 'transactions', filter: { field: 'bankId', value: record.id }, label: 'تراکنش‌های بانک', hint: 'فهرست فیلترشده' },
      ],
    };
  }

  if (kind === 'transaction') {
    const customer = record.customerId ? gateway.get('customers', record.customerId) : null;
    return {
      title: `${record.number} · ${record.kind}`,
      sub: `${record.date} · ${record.direction}`,
      badge: money(record.amount, record.currency),
      fields: [
        field('شمارهٔ سند', record.number),
        field('تاریخ', record.date),
        field('نوع', record.kind),
        field('شرح', record.description),
        field('طرف حساب', record.party),
        field('مبلغ', money(record.amount, record.currency)),
      ],
      links: [
        customer && { key: 'cu', kind: 'detail', moduleId: 'customers', id: customer.id, label: 'پروندهٔ مشتری', hint: customer.name },
        record.cashId && { key: 'ch', kind: 'detail', moduleId: 'cash', id: record.cashId, label: 'صندوق مرتبط', hint: gateway.get('cash', record.cashId)?.name },
        record.bankId && { key: 'bk', kind: 'detail', moduleId: 'banks', id: record.bankId, label: 'بانک مرتبط', hint: gateway.get('banks', record.bankId)?.name },
      ].filter(Boolean),
    };
  }

  if (kind === 'remittance') {
    const customer = record.customerId ? gateway.get('customers', record.customerId) : null;
    const branch = record.branchId ? gateway.get('branches', record.branchId) : null;
    return {
      title: `حوالهٔ ${record.number}`,
      sub: `${record.date} · ${record.direction}`,
      badge: record.status,
      fields: [
        field('فرستنده', record.sender),
        field('گیرنده', record.receiver),
        field('مبلغ', money(record.amount, record.currency)),
        field('کمیشن', money(record.fee, record.currency)),
        field('یادداشت', record.note),
      ],
      links: [
        customer && { key: 'cu', kind: 'detail', moduleId: 'customers', id: customer.id, label: 'پروندهٔ مشتری', hint: customer.name },
        branch && { key: 'br', kind: 'detail', moduleId: 'branches', id: branch.id, label: 'نمایندگی مرتبط', hint: branch.name },
        customer?.ledgerId && { key: 'lg', kind: 'statement', id: customer.ledgerId, label: 'دفتر حساب مشتری', hint: 'اثر حواله در دفتر' },
      ].filter(Boolean),
    };
  }

  if (kind === 'expense') {
    return {
      title: record.title,
      sub: `${record.number} · ${record.date}`,
      badge: record.status,
      fields: [
        field('شمارهٔ مصرف', record.number),
        field('تاریخ', record.date),
        field('حساب مصرف', record.account),
        field('مبلغ', money(record.amount, record.currency)),
        field('پرداخت‌کننده', record.payer),
      ],
      links: [
        record.cashId && { key: 'ch', kind: 'detail', moduleId: 'cash', id: record.cashId, label: 'صندوق پرداخت‌کننده', hint: record.payer },
        record.bankId && { key: 'bk', kind: 'detail', moduleId: 'banks', id: record.bankId, label: 'بانک پرداخت‌کننده', hint: record.payer },
      ].filter(Boolean),
    };
  }

  return null;
}