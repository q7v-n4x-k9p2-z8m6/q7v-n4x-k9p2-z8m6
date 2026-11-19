export const number = value => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export function validateBalancedLines(lines, label = 'سند') {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error(`${label}: حداقل دو سطر حسابداری لازم است.`);
  }
  const totals = new Map();
  for (const [index, line] of lines.entries()) {
    const currency = String(line.currency || 'AFN').trim().toUpperCase();
    const debit = number(line.debit);
    const credit = number(line.credit);
    if (!currency || !Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      throw new Error(`${label}: مبلغ یا ماهیت بدهکار/بستانکار در سطر ${index + 1} معتبر نیست.`);
    }
    if (!line.account_type || !line.account_name) {
      throw new Error(`${label}: حساب سطر ${index + 1} مشخص نشده است.`);
    }
    if (['cash', 'customer'].includes(String(line.account_type)) && !(Number(line.account_id) > 0)) {
      throw new Error(`${label}: شناسه حساب مرتبط در سطر ${index + 1} معتبر نیست.`);
    }
    const total = totals.get(currency) || { debit: 0, credit: 0 };
    total.debit += debit;
    total.credit += credit;
    totals.set(currency, total);
  }
  for (const [currency, total] of totals) {
    if (Math.abs(total.debit - total.credit) > 0.004) {
      throw new Error(`${label}: سند در ارز ${currency} تراز نیست؛ جمع بدهکار و بستانکار باید برابر باشد.`);
    }
  }
}
