// a1/lib/v21DomainTests.js — سناریوهای کنترل مالی پنج بخش هسته
// هدف: پیش از هر ثبت، توازن، جداسازی ارز، آینهٔ ابطال و رد ورودی نامعتبر بررسی شود.
import {
  buildRemittanceLines, buildFeeLines, buildExpenseLines, buildCashMovementLines,
  buildConversionLines, buildJournalLines,
} from './v21Domain';

const A = {
  customer: { account_type: 'customer', account_id: '12', account_name: 'مشتری نمونه' },
  cashAfn: { account_type: 'cash', account_id: '1', account_name: 'صندوق افغانی' },
  cashUsd: { account_type: 'cash', account_id: '2', account_name: 'صندوق دالر' },
  bankAfn: { account_type: 'bank', account_id: '3', account_name: 'بانک نمونه' },
  suspense: { account_type: 'suspense', account_id: '21', account_name: 'حواله در جریان' },
  expense: { account_type: 'suspense', account_id: '5010', account_name: 'مصارف عملیاتی' },
  revenue: { account_type: 'suspense', account_id: '4010', account_name: 'درآمد کمیشن' },
};

const TOLERANCE = 0.005;

function sums(lines) {
  return lines.reduce((totals, line) => {
    const currency = line.currency || 'AFN';
    totals[currency] = totals[currency] || { debit: 0, credit: 0 };
    totals[currency].debit += Number(line.debit) || 0;
    totals[currency].credit += Number(line.credit) || 0;
    return totals;
  }, {});
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function expectBalanced(lines, label) {
  const totals = sums(lines);
  Object.entries(totals).forEach(([currency, total]) => {
    expect(Math.abs(total.debit - total.credit) < TOLERANCE, `${label}: سند در ارز ${currency} تراز نیست.`);
  });
  return totals;
}

function expectThrows(run, label) {
  let threw = false;
  try { run(); } catch { threw = true; }
  expect(threw, `${label}: ورودی نامعتبر باید رد شود اما پذیرفته شد.`);
}

const SCENARIOS = [
  {
    name: 'حوالهٔ ارسالی از حساب واسط',
    run: () => {
      const lines = buildRemittanceLines({ direction: 'ارسالی', amount: 500, currency: 'USD', party: A.customer, counter: A.suspense });
      expectBalanced(lines, 'حوالهٔ ارسالی');
      expect(lines[0].account_type === 'customer' && Number(lines[0].debit) === 500, 'حوالهٔ ارسالی باید حساب مشتری را بدهکار کند.');
    },
  },
  {
    name: 'حوالهٔ دریافتی با تسویهٔ فوری از بانک',
    run: () => {
      const lines = buildRemittanceLines({ direction: 'دریافتی', amount: 900, currency: 'AFN', party: A.customer, counter: A.bankAfn });
      const totals = expectBalanced(lines, 'حوالهٔ دریافتی');
      expect(totals.AFN.debit === 900 && totals.AFN.credit === 900, 'حوالهٔ دریافتی باید بانک را بدهکار و مشتری را بستانکار کند.');
      expect(lines[0].account_type === 'bank', 'سطر اول باید حساب بانک باشد.');
    },
  },
  {
    name: 'کمیشن حواله به حساب درآمد',
    run: () => {
      const lines = buildFeeLines({ amount: 25, currency: 'AFN', party: A.customer, revenue: A.revenue });
      expectBalanced(lines, 'کمیشن');
      expect(lines[1].account_name === A.revenue.account_name && Number(lines[1].credit) === 25, 'کمیشن باید به حساب درآمد بستانکار شود.');
    },
  },
  {
    name: 'مصرف از صندوق',
    run: () => {
      const lines = buildExpenseLines({ amount: 120, currency: 'AFN', expense: A.expense, payer: A.cashAfn });
      expectBalanced(lines, 'مصرف صندوق');
      expect(lines[1].account_type === 'cash', 'پرداخت‌کنندهٔ مصرف باید صندوق باشد.');
    },
  },
  {
    name: 'مصرف از بانک',
    run: () => {
      const lines = buildExpenseLines({ amount: 300, currency: 'USD', expense: A.expense, payer: { account_type: 'bank', account_id: '4', account_name: 'بانک دالری' } });
      expectBalanced(lines, 'مصرف بانک');
      expect(lines[1].account_type === 'bank', 'پرداخت‌کنندهٔ مصرف باید بانک باشد.');
    },
  },
  {
    name: 'دخل و خرج صندوق',
    run: () => {
      const income = buildCashMovementLines({ kind: 'دخل', amount: 100, currency: 'AFN', cash: A.cashAfn, counter: A.customer });
      const outcome = buildCashMovementLines({ kind: 'خرج', amount: 40, currency: 'AFN', cash: A.cashAfn, counter: A.customer });
      expectBalanced(income, 'دخل صندوق');
      expectBalanced(outcome, 'خرج صندوق');
      expect(Number(income[0].debit) === 100 && Number(outcome[1].credit) === 40, 'جهت دخل و خرج صندوق اشتباه است.');
    },
  },
  {
    name: 'تبدیل دو ارز با توازن جداگانهٔ هر ارز',
    run: () => {
      const lines = buildConversionLines({
        kind: 'convert', party: A.customer,
        currencyA: 'AFN', amountA: 8500, accountA: A.cashAfn,
        currencyB: 'USD', amountB: 100, accountB: A.cashUsd,
      });
      const totals = expectBalanced(lines, 'تبدیل');
      expect(Object.keys(totals).length === 2, 'تبدیل باید دو ارز مستقل داشته باشد.');
      expect(Number(lines[1].credit) === 8500 && Number(lines[2].debit) === 100, 'جهت صندوق‌های تبدیل اشتباه است.');
    },
  },
  {
    name: 'خرید اسعار از مشتری',
    run: () => {
      const lines = buildConversionLines({
        kind: 'buy', party: A.customer,
        currencyA: 'USD', amountA: 200, accountA: A.cashUsd,
        currencyB: 'AFN', amountB: 17000, accountB: A.cashAfn,
      });
      expectBalanced(lines, 'خرید اسعار');
      expect(Number(lines[0].debit) === 200 && Number(lines[3].credit) === 17000, 'خرید اسعار باید ارز خارجی را بدهکار و ارز پایه را بستانکار کند.');
    },
  },
  {
    name: 'فروش اسعار به مشتری',
    run: () => {
      const lines = buildConversionLines({
        kind: 'sell', party: A.customer,
        currencyA: 'USD', amountA: 50, accountA: A.cashUsd,
        currencyB: 'AFN', amountB: 4300, accountB: A.cashAfn,
      });
      expectBalanced(lines, 'فروش اسعار');
      expect(Number(lines[0].credit) === 50 && Number(lines[3].debit) === 4300, 'فروش اسعار باید ارز خارجی را بستانکار و ارز پایه را بدهکار کند.');
    },
  },
  {
    name: 'سند دو سطری روزنامچه',
    run: () => {
      const lines = buildJournalLines({ currency: 'AFN', rows: [
        { ...A.expense, debit: 700, credit: 0 },
        { ...A.cashAfn, debit: 0, credit: 700 },
      ] });
      expectBalanced(lines, 'روزنامچهٔ دو سطری');
      expect(lines.length === 2, 'سند دو سطری باید دو سطر داشته باشد.');
    },
  },
  {
    name: 'سند چندسطری روزنامچه',
    run: () => {
      const lines = buildJournalLines({ currency: 'AFN', rows: [
        { ...A.customer, debit: 1000, credit: 0 },
        { ...A.cashAfn, debit: 600, credit: 0 },
        { ...A.revenue, debit: 0, credit: 1600 },
      ] });
      expectBalanced(lines, 'روزنامچهٔ چندسطری');
      expect(lines.length === 3, 'سند چندسطری باید همهٔ سطرها را نگه دارد.');
    },
  },
  {
    name: 'رد سند نامتوازن روزنامچه',
    run: () => expectThrows(() => buildJournalLines({ currency: 'AFN', rows: [
      { ...A.expense, debit: 500, credit: 0 },
      { ...A.cashAfn, debit: 0, credit: 450 },
    ] }), 'روزنامچهٔ نامتوازن'),
  },
  {
    name: 'رد سطر با بدهکار و بستانکار همزمان',
    run: () => expectThrows(() => buildJournalLines({ currency: 'AFN', rows: [
      { ...A.expense, debit: 500, credit: 500 },
      { ...A.cashAfn, debit: 0, credit: 500 },
    ] }), 'سطر دوطرفه'),
  },
  {
    name: 'رد معامله با ارز یکسان',
    run: () => expectThrows(() => buildConversionLines({
      kind: 'convert', party: A.customer,
      currencyA: 'AFN', amountA: 100, accountA: A.cashAfn,
      currencyB: 'AFN', amountB: 100, accountB: A.cashAfn,
    }), 'معاملهٔ هم‌ارز'),
  },
  {
    name: 'آینهٔ ابطال، اثر مالی را صفر می‌کند',
    run: () => {
      const lines = buildConversionLines({
        kind: 'buy', party: A.customer,
        currencyA: 'USD', amountA: 75, accountA: A.cashUsd,
        currencyB: 'AFN', amountB: 6400, accountB: A.cashAfn,
      });
      const mirrored = lines.map(line => ({ ...line, debit: line.credit, credit: line.debit }));
      expectBalanced(mirrored, 'سند معکوس');
      const original = sums(lines);
      const reversal = sums(mirrored);
      Object.keys(original).forEach(currency => {
        expect(Math.abs(original[currency].debit - reversal[currency].credit) < TOLERANCE, `ابطال در ارز ${currency} اثر اصلی را خنثی نمی‌کند.`);
        expect(Math.abs(original[currency].credit - reversal[currency].debit) < TOLERANCE, `ابطال در ارز ${currency} اثر بستانکار را خنثی نمی‌کند.`);
      });
    },
  },
  {
    name: 'رد حواله با مبلغ نامعتبر',
    run: () => expectThrows(() => buildRemittanceLines({ direction: 'ارسالی', amount: 0, currency: 'AFN', party: A.customer, counter: A.suspense }), 'حوالهٔ صفر'),
  },
];

export function runVersion21DomainChecks() {
  const results = SCENARIOS.map(scenario => {
    try {
      scenario.run();
      return { name: scenario.name, ok: true };
    } catch (error) {
      return { name: scenario.name, ok: false, message: error?.message || 'خطای نامشخص' };
    }
  });
  return {
    total: results.length,
    passed: results.filter(result => result.ok).length,
    failed: results.filter(result => !result.ok).length,
    results,
  };
}