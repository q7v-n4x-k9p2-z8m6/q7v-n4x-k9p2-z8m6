import { roundMoney } from '@/lib/accounting/postings';

function keyOf(entry) {
  return `${entry.account_type}:${entry.account_id || entry.account_name}`;
}

/** ماندهٔ ارزی هر حساب (به ارز اصلی همان حساب) */
export function nativeBalances(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = keyOf(entry);
    if (!map.has(key)) {
      map.set(key, {
        key,
        account_type: entry.account_type,
        account_id: entry.account_id,
        account_name: entry.account_name,
        balances: {},
      });
    }
    const item = map.get(key);
    const currency = entry.currency || 'AFN';
    const signed = entry.side === 'debit' ? Number(entry.amount) : -Number(entry.amount);
    item.balances[currency] = roundMoney((item.balances[currency] || 0) + signed);
  });
  return Array.from(map.values());
}

export function balanceFor(entries, accountType, accountId, currency) {
  return entries.reduce((sum, entry) => {
    if (entry.account_type !== accountType) return sum;
    if (accountId && entry.account_id !== accountId) return sum;
    if (currency && entry.currency !== currency) return sum;
    return sum + (entry.side === 'debit' ? Number(entry.amount) : -Number(entry.amount));
  }, 0);
}

export function valueBalanceFor(entries, accountType, accountId) {
  return roundMoney(
    entries.reduce((sum, entry) => {
      if (entry.account_type !== accountType) return sum;
      if (accountId && entry.account_id !== accountId) return sum;
      return sum + (entry.side === 'debit' ? Number(entry.value) : -Number(entry.value));
    }, 0)
  );
}

/** مانده مشتری: مثبت = بستانکار (ما بدهکاریم)، منفی = بدهکار (مشتری بدهکار است) */
export function customerBalances(entries) {
  const map = new Map();
  entries
    .filter((entry) => entry.account_type === 'customer')
    .forEach((entry) => {
      const id = entry.account_id;
      if (!map.has(id)) {
        map.set(id, { id, name: entry.account_name, credit: 0, debit: 0, value: 0 });
      }
      const row = map.get(id);
      const value = Number(entry.value);
      if (entry.side === 'credit') row.credit += value;
      else row.debit += value;
      row.value = roundMoney(row.credit - row.debit);
    });
  return Array.from(map.values());
}

/** تراز آزمایشی بر مبنای ارزش ارز پایه */
export function trialBalance(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = keyOf(entry);
    if (!map.has(key)) {
      map.set(key, {
        key,
        account_type: entry.account_type,
        account_id: entry.account_id,
        account_name: entry.account_name,
        debit: 0,
        credit: 0,
        currency: entry.currency,
      });
    }
    const row = map.get(key);
    if (entry.side === 'debit') row.debit += Number(entry.value);
    else row.credit += Number(entry.value);
  });
  const rows = Array.from(map.values()).map((row) => ({
    ...row,
    debit: roundMoney(row.debit),
    credit: roundMoney(row.credit),
    balance: roundMoney(row.debit - row.credit),
  }));
  return rows.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}

/** جمع درآمد و هزینه برای صورت سود و زیان */
export function profitAndLoss(entries) {
  let income = 0;
  let expense = 0;
  entries.forEach((entry) => {
    if (entry.account_type === 'income') {
      income += entry.side === 'credit' ? Number(entry.value) : -Number(entry.value);
    }
    if (entry.account_type === 'expense') {
      expense += entry.side === 'debit' ? Number(entry.value) : -Number(entry.value);
    }
  });
  return {
    income: roundMoney(income),
    expense: roundMoney(expense),
    profit: roundMoney(income - expense),
  };
}

export function sumByCurrency(entries, accountType) {
  const map = {};
  entries
    .filter((entry) => !accountType || entry.account_type === accountType)
    .forEach((entry) => {
      const currency = entry.currency || 'AFN';
      const signed = entry.side === 'debit' ? Number(entry.amount) : -Number(entry.amount);
      map[currency] = roundMoney((map[currency] || 0) + signed);
    });
  return map;
}