import { ACCOUNT_TYPES, SYSTEM_ACCOUNTS } from '@/lib/accounting/chart';
import { BASE_CURRENCY } from '@/lib/config';

/** گرد کردن مبالغ برای جلوگیری از خطای اعشار در محاسبات مالی */
export function roundMoney(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function accountOfCounter(counter) {
  return {
    account_type: counter.type,
    account_id: counter.id,
    account_name: counter.name,
  };
}

function customerAccount(customer) {
  return {
    account_type: 'customer',
    account_id: customer.id,
    account_name: customer.full_name || customer.name || 'مشتری',
  };
}

function line(account, { currency, side, amount, value, rate = 1, description }) {
  return {
    account_type: account.account_type,
    account_id: account.account_id,
    account_name: account.account_name,
    currency,
    side,
    amount: roundMoney(amount),
    value: roundMoney(value),
    rate: roundMoney(rate, 6),
    description: description || '',
  };
}

/**
 * خرید/فروش ارز با مشتری.
 * خرید: ارز به صندوق می‌آید و بدهی ما به مشتری (ارز پایه) افزایش می‌یابد.
 * فروش: ارز از صندوق خارج می‌شود و طلب ما از مشتری (ارز پایه) افزایش می‌یابد.
 */
export function buildTrade({ mode, customer, currency, amount, rate, counter, fee = 0, date, description }) {
  const base = BASE_CURRENCY;
  const value = roundMoney(Number(amount) * Number(rate));
  const isBuy = mode === 'buy';
  const lines = [
    line(accountOfCounter(counter), {
      currency,
      side: isBuy ? 'debit' : 'credit',
      amount,
      value,
      rate,
      description,
    }),
    line(customerAccount(customer), {
      currency: base,
      side: isBuy ? 'credit' : 'debit',
      amount: value,
      value,
      rate: 1,
      description,
    }),
  ];

  if (Number(fee) > 0) {
    const feeValue = roundMoney(fee);
    lines.push(
      line(customerAccount(customer), {
        currency: base,
        side: 'debit',
        amount: feeValue,
        value: feeValue,
        rate: 1,
        description: 'کارمزد معامله',
      }),
      line(SYSTEM_ACCOUNTS.feeIncome, {
        currency: base,
        side: 'credit',
        amount: feeValue,
        value: feeValue,
        rate: 1,
        description: 'درآمد کارمزد',
      })
    );
  }

  const doc = {
    doc_type: isBuy ? 'trade_buy' : 'trade_sell',
    date,
    currency,
    amount: roundMoney(amount),
    rate: roundMoney(rate, 6),
    fee: roundMoney(fee),
    fee_currency: base,
    pair_currency: base,
    pair_amount: value,
    base_value: value,
    customer_id: customer.id,
    customer_name: customerAccount(customer).account_name,
    counter_type: counter.type,
    counter_id: counter.id,
    counter_name: counter.name,
    description,
  };
  return { doc, lines };
}

/** دریافت از مشتری یا پرداخت به مشتری (داد و گرفت) */
export function buildReceivePay({ type, customer, counter, currency, amount, rate, date, description }) {
  const value = roundMoney(Number(amount) * Number(rate));
  const isReceive = type === 'receive';
  const lines = [
    line(accountOfCounter(counter), {
      currency,
      side: isReceive ? 'debit' : 'credit',
      amount,
      value,
      rate,
      description,
    }),
    line(customerAccount(customer), {
      currency: BASE_CURRENCY,
      side: isReceive ? 'credit' : 'debit',
      amount: value,
      value,
      rate: 1,
      description,
    }),
  ];
  return {
    doc: {
      doc_type: isReceive ? 'receive' : 'pay',
      date,
      currency,
      amount: roundMoney(amount),
      rate: roundMoney(rate, 6),
      pair_currency: BASE_CURRENCY,
      pair_amount: value,
      base_value: value,
      customer_id: customer.id,
      customer_name: customerAccount(customer).account_name,
      counter_type: counter.type,
      counter_id: counter.id,
      counter_name: counter.name,
      description,
    },
    lines,
  };
}

/** دخل یا خرج صندوق/بانک بدون طرف حساب مشخص */
export function buildCashMovement({ direction, counter, currency, amount, rate, date, description, expense = false }) {
  const value = roundMoney(Number(amount) * Number(rate));
  const isIn = direction === 'in';
  let opposite;
  if (expense) {
    opposite = SYSTEM_ACCOUNTS.operatingExpense;
  } else {
    opposite = SYSTEM_ACCOUNTS.adjustment;
  }
  const lines = [
    line(accountOfCounter(counter), {
      currency,
      side: isIn ? 'debit' : 'credit',
      amount,
      value,
      rate,
      description,
    }),
    line(opposite, {
      currency: BASE_CURRENCY,
      side: isIn ? 'credit' : 'debit',
      amount: value,
      value,
      rate: 1,
      description,
    }),
  ];
  return {
    doc: {
      doc_type: expense ? 'expense' : isIn ? 'cash_in' : 'cash_out',
      date,
      currency,
      amount: roundMoney(amount),
      rate: roundMoney(rate, 6),
      base_value: value,
      counter_type: counter.type,
      counter_id: counter.id,
      counter_name: counter.name,
      description,
    },
    lines,
  };
}

/** ثبت اثر مالی حواله؛ مشتری اختیاری است */
export function buildTransferPosting({ direction, customer, counter, currency, amount, rate, fee = 0, date, description }) {
  const value = roundMoney(Number(amount) * Number(rate));
  const isOut = direction === 'out';
  const party = customer
    ? customerAccount(customer)
    : SYSTEM_ACCOUNTS.adjustment;
  const lines = [
    line(accountOfCounter(counter), {
      currency,
      side: isOut ? 'credit' : 'debit',
      amount,
      value,
      rate,
      description,
    }),
    line(party, {
      currency: BASE_CURRENCY,
      side: isOut ? 'debit' : 'credit',
      amount: value,
      value,
      rate: 1,
      description,
    }),
  ];
  if (Number(fee) > 0) {
    const feeValue = roundMoney(fee);
    lines.push(
      line(party, {
        currency: BASE_CURRENCY,
        side: 'debit',
        amount: feeValue,
        value: feeValue,
        rate: 1,
        description: 'کارمزد حواله',
      }),
      line(SYSTEM_ACCOUNTS.feeIncome, {
        currency: BASE_CURRENCY,
        side: 'credit',
        amount: feeValue,
        value: feeValue,
        rate: 1,
        description: 'درآمد کارمزد حواله',
      })
    );
  }
  return {
    doc: {
      doc_type: isOut ? 'transfer_out' : 'transfer_in',
      date,
      currency,
      amount: roundMoney(amount),
      rate: roundMoney(rate, 6),
      fee: roundMoney(fee),
      fee_currency: BASE_CURRENCY,
      base_value: value,
      customer_id: customer?.id,
      customer_name: customer?.full_name,
      counter_type: counter.type,
      counter_id: counter.id,
      counter_name: counter.name,
      description,
    },
    lines,
  };
}

/** تبدیل ارز بین دو صندوق/حساب */
export function buildConversion({ fromCounter, toCounter, fromCurrency, fromAmount, toCurrency, toAmount, rate, date, description }) {
  const fromValue = roundMoney(Number(fromAmount) * Number(rate));
  const targetValue = roundMoney(toAmount);
  const lines = [
    line(accountOfCounter(fromCounter), {
      currency: fromCurrency,
      side: 'credit',
      amount: fromAmount,
      value: fromValue,
      rate,
      description,
    }),
    line(accountOfCounter(toCounter), {
      currency: toCurrency,
      side: 'debit',
      amount: toAmount,
      value: targetValue,
      rate: 1,
      description,
    }),
  ];
  return {
    doc: {
      doc_type: 'conversion',
      date,
      currency: fromCurrency,
      amount: roundMoney(fromAmount),
      rate: roundMoney(rate, 6),
      pair_currency: toCurrency,
      pair_amount: targetValue,
      base_value: fromValue,
      counter_type: fromCounter.type,
      counter_id: fromCounter.id,
      counter_name: fromCounter.name,
      description,
    },
    lines,
  };
}

/** سند مانده آغازین صندوق/بانک */
export function buildOpening({ counter, currency, amount, value, date }) {
  const baseValue = roundMoney(value);
  return {
    doc: {
      doc_type: 'opening',
      date,
      currency,
      amount: roundMoney(amount),
      rate: Number(amount) > 0 ? roundMoney(baseValue / Number(amount), 6) : 1,
      base_value: baseValue,
      counter_type: counter.type,
      counter_id: counter.id,
      counter_name: counter.name,
      description: 'ثبت مانده آغازین',
    },
    lines: [
      line(accountOfCounter(counter), {
        currency,
        side: 'debit',
        amount,
        value: baseValue,
        rate: Number(amount) > 0 ? baseValue / Number(amount) : 1,
        description: 'مانده آغازین',
      }),
      line(SYSTEM_ACCOUNTS.opening, {
        currency: BASE_CURRENCY,
        side: 'credit',
        amount: baseValue,
        value: baseValue,
        rate: 1,
        description: 'مانده آغازین',
      }),
    ],
  };
}

/** مانده آغازین مشتری (مثبت = بدهکاری مشتری، منفی = بستانکاری ما) */
export function buildCustomerOpening({ customer, amount, currency, date }) {
  const baseValue = roundMoney(Math.abs(amount));
  if (!baseValue) return null;
  const isDebit = Number(amount) > 0;
  return {
    doc: {
      doc_type: 'opening',
      date,
      currency,
      amount: baseValue,
      rate: 1,
      base_value: baseValue,
      customer_id: customer.id,
      customer_name: customer.full_name,
      counter_type: 'none',
      description: 'مانده آغازین حساب مشتری',
    },
    lines: [
      line(customerAccount(customer), {
        currency,
        side: isDebit ? 'debit' : 'credit',
        amount: baseValue,
        value: baseValue,
        rate: 1,
        description: 'مانده آغازین',
      }),
      line(SYSTEM_ACCOUNTS.opening, {
        currency: BASE_CURRENCY,
        side: isDebit ? 'credit' : 'debit',
        amount: baseValue,
        value: baseValue,
        rate: 1,
        description: 'مانده آغازین مشتری',
      }),
    ],
  };
}

/** بررسی توازن سند پیش از ثبت */
export function validateBalanced(lines) {
  const debit = lines.filter((l) => l.side === 'debit').reduce((s, l) => s + l.value, 0);
  const credit = lines.filter((l) => l.side === 'credit').reduce((s, l) => s + l.value, 0);
  const diff = roundMoney(Math.abs(debit - credit));
  return { balanced: diff < 0.01, debit: roundMoney(debit), credit: roundMoney(credit), diff };
}

export const ACCOUNT_TYPE_LABELS = ACCOUNT_TYPES;