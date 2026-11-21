// src/a1/mobile/statementBack.js — مقصد بازگشت از صفحهٔ اختصاصی حساب
// همان منبعی که صفحهٔ حساب از آن برچسب و پاک‌سازی هدف را می‌خواند؛ برای آزمون بدون مرورگر جدا شده است.
export const STATEMENT_BACK = {
  debtors: { label: 'بازگشت به فهرست بدهکاران', clear: 'customer', module: 'customers', kind: 'customer' },
  customers: { label: 'بازگشت به فهرست مشتریان', clear: 'customer', module: 'customers', kind: 'customer' },
  customerLedger: { label: 'بازگشت به فهرست مشتریان', clear: 'customer', module: 'customers', kind: 'customer' },
  branches: { label: 'بازگشت به فهرست نمایندگی‌ها', clear: 'branch', module: 'branches', kind: 'branch' },
  branchLedger: { label: 'بازگشت به فهرست نمایندگی‌ها', clear: 'branch', module: 'branches', kind: 'branch' },
  banks: { label: 'بازگشت به فهرست بانک‌ها', clear: 'bank', module: 'banks', kind: 'bank' },
  cash: { label: 'بازگشت به فهرست صندوق‌ها', clear: 'cash', module: 'cash', kind: 'cash' },
};

export const DEFAULT_STATEMENT_BACK = STATEMENT_BACK.customers;

export const statementBack = (moduleId) => STATEMENT_BACK[moduleId] || DEFAULT_STATEMENT_BACK;