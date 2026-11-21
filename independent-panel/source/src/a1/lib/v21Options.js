// a1/lib/v21Options.js — گزینه‌های مشترک فرم‌های حسابداری میز کار
export const CURRENCY_CODES = ['AFN', 'USD', 'EUR', 'IRR', 'TRY', 'PKR', 'AED', 'SAR', 'GBP', 'CNY'];

export const currencyOptions = (codes = CURRENCY_CODES) => codes.map(code => ({ value: code, label: code }));

export function customerOptions(data) {
  return (data?.customers || [])
    .filter(customer => customer.status !== 'غیرفعال')
    .map(customer => ({ value: customer.name, label: customer.code ? `${customer.code} · ${customer.name}` : customer.name }));
}

export function branchOptions(data) {
  return (data?.branches || [])
    .filter(branch => branch.status !== 'غیرفعال')
    .map(branch => ({ value: branch.name, label: branch.code ? `${branch.code} · ${branch.name}` : branch.name }));
}

export function safeOptions(data, currency) {
  return (data?.cash || [])
    .filter(safe => safe.status !== 'غیرفعال' && (!currency || safe.currency === currency))
    .map(safe => ({ value: safe.name, label: `${safe.name} (${safe.currency})` }));
}

export function bankOptions(data, currency) {
  return (data?.banks || [])
    .filter(bank => bank.status !== 'غیرفعال' && (!currency || bank.currency === currency))
    .map(bank => ({ value: String(bank.id), label: `${bank.name} (${bank.currency})` }));
}

export function expenseAccountOptions(data) {
  return (data?.accounts || [])
    .filter(account => account.accountType === 'expense' && account.status !== 'غیرفعال')
    .map(account => ({ value: `${account.code} — ${account.name}`, label: `${account.code} — ${account.name}` }));
}

// همان قرارداد resolveLedgerAccount در لایهٔ نوشتن:
// «کد — نام» برای کدینگ، «صندوق: نام» و «بانک: شناسه» برای حساب‌های عملیاتی
export function ledgerAccountOptions(data, currency) {
  return [
    ...(data?.accounts || [])
      .filter(account => account.status !== 'غیرفعال')
      .map(account => ({ value: `${account.code} — ${account.name}`, label: `${account.code} — ${account.name}` })),
    ...(data?.cash || [])
      .filter(safe => safe.status !== 'غیرفعال' && (!currency || safe.currency === currency))
      .map(safe => ({ value: `صندوق: ${safe.name}`, label: `صندوق: ${safe.name} (${safe.currency})` })),
    ...(data?.banks || [])
      .filter(bank => bank.status !== 'غیرفعال' && (!currency || bank.currency === currency))
      .map(bank => ({ value: `بانک: ${bank.id}`, label: `بانک: ${bank.name} (${bank.currency})` })),
  ];
}