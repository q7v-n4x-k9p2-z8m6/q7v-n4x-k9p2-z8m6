// src/core/domain/tradeProfit.js — ماژول محاسباتی «مفاد معاملات»
// فقط خواندن و محاسبه؛ هیچ سندی ساخته یا تغییر داده نمی‌شود.
//
// جهت معامله، عیناً همان قاعدهٔ ثبت سند در موتور نسخهٔ ۲۱ است (buildConversionLines):
//   خرید  : صراف ارز خارجی می‌گیرد (طرف from) و ارز پایه می‌پردازد (طرف to) → سود تحقق‌یافته ندارد
//   فروش  : صراف ارز خارجی می‌دهد (طرف from) و ارز پایه می‌گیرد (طرف to) → سود تحقق‌یافته دارد
//   تبدیل : صراف طرف from را می‌دهد و طرف to را می‌گیرد
//
// قواعد صریح (بی‌حدس):
// ۱) سود هر معامله = ارزش دریافتی به ارز مبنا − بهای تمام‌شدهٔ ارزِ داده‌شده به ارز مبنا.
// ۲) بهای تمام‌شده با روش «میانگین موزون» از خودِ معاملات ثبت‌شده ساخته می‌شود.
// ۳) تبدیل ارز به ارز مبنا فقط با نرخ تعریف‌شدهٔ همان ارز در «تعریف اسعار» انجام می‌شود.
// ۴) موجودی آغازین صندوق‌ها با نرخ تعریف‌شدهٔ همان ارز ارزش‌گذاری می‌شود و در بهای تمام‌شده
//    و میانگین موزون شرکت می‌کند؛ همان مبنایی که برای فروش بدون خرید ثبت‌شده هم به‌کار می‌رود.
// ۵) کارمزد، سند جداگانه دارد و ارز آن ارز پایهٔ همان معامله است (طبق همین قاعدهٔ ثبت)؛
//    درآمد کارمزد جدا از سود معامله گزارش می‌شود.
// ۶) نامشخص‌بودن فقط به همان معامله مربوط است: نبود نرخ یا نبود خرید ثبت‌شده برای ارزِ داده‌شده.
//    یک معاملهٔ نامشخص، معامله‌های بعدی را نامشخص نمی‌کند؛ خرید همیشه بهایش از ارز پرداخت‌شده اثبات می‌شود.
import { num } from './posting.js';

export const COST_METHODS = [
  { value: 'weighted_average', label: 'میانگین موزون' },
];

const upper = (value) => String(value || '').toUpperCase();
const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const nonNegativeValue = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const kindKey = (value) => {
  const text = String(value || '');
  if (text.includes('خرید') || text === 'buy') return 'buy';
  if (text.includes('فروش') || text === 'sell') return 'sell';
  return 'convert';
};

export function buildRateMap(currencies, baseCurrency) {
  const base = upper(baseCurrency) || 'AFN';
  const rates = new Map([[base, 1]]);
  const missing = [];
  (currencies || []).forEach((row) => {
    const code = upper(row.code);
    if (!code) return;
    const rate = num(row.rate);
    if (rate > 0) rates.set(code, rate);
    else if (code !== base) missing.push(code);
  });
  return { base, rates, missing };
}

export function computeTradeProfit({ trades = [], currencies = [], remittances = [], openings = [], policy = {} } = {}) {
  const { base, rates, missing } = buildRateMap(currencies, policy.baseCurrency || 'AFN');
  const method = policy.method || 'weighted_average';
  const inventory = new Map(); // code → { qty, costBase } — ارز مبنا موجودی نمی‌گیرد
  const rows = [];

  // موجودی آغازین صندوق‌ها پیش از پردازش معاملات وارد انبار می‌شود و بهای آن با نرخ تعریف‌شدهٔ
  // همان ارز محاسبه می‌گردد؛ تا فروشی که از این موجودی برمی‌آید بهای تمام‌شده داشته باشد.
  const openingByCode = new Map();
  (openings || []).forEach((row) => {
    const code = upper(row.currency);
    const amount = num(row.amount);
    if (!code || code === base || amount <= 0) return;
    const current = openingByCode.get(code) || { code, qty: 0, value: 0 };
    current.qty += amount;
    // ارزش پایهٔ موجودی آغازین اگر خود حساب آن را داشته باشد، مبنای بهای تمام‌شده است؛
    // وگرنه نرخ تعریف‌شدهٔ همان ارز به‌کار می‌رود.
    current.value += nonNegativeValue(row.value);
    openingByCode.set(code, current);
  });
  const openingInventory = [...openingByCode.values()].map((item) => {
    const declared = item.value > 0 ? item.value : null;
    const rate = declared !== null ? declared / item.qty : rates.get(item.code);
    if (rate === undefined || rate === null) return { code: item.code, qty: round(item.qty), rate: null, costBase: null, status: 'نامشخص' };
    const costBase = declared !== null ? round(declared) : round(item.qty * rate);
    inventory.set(item.code, { qty: item.qty, costBase });
    return {
      code: item.code, qty: round(item.qty), rate: round(rate), costBase,
      status: declared !== null ? 'ارزش ثبت‌شدهٔ صندوق' : 'ارزش‌گذاری‌شده',
    };
  });
  // ابطال‌شده‌ها هیچ سهمی در سود، کارمزد و موجودی ندارند؛ سند معکوس هم معاملهٔ تازه نیست
  const isVoided = (trade) => Boolean(trade.reversalOf)
    || ['reversed', 'ابطال شده', 'deleted', 'cancelled'].includes(String(trade.status || ''));

  const ordered = trades.filter((trade) => !isVoided(trade)).sort((a, b) => {
    const byDate = String(a.date || '').localeCompare(String(b.date || ''));
    if (byDate) return byDate;
    return String(a.number || a.id).localeCompare(String(b.number || b.id));
  });

  ordered.forEach((trade) => {
    const fromCode = upper(trade.fromCurrency);
    const toCode = upper(trade.toCurrency);
    const fromAmount = num(trade.fromAmount);
    const toAmount = num(trade.toAmount);
    const kind = kindKey(trade.kind);
    const reasons = [];
    let status = 'محاسبه‌شده';
    const markUnknown = (reason) => {
      status = 'نامشخص';
      if (!reasons.includes(reason)) reasons.push(reason);
    };

    // طرف داده‌شده و طرف گرفته‌شده بر اساس جهت معامله
    const givenCode = kind === 'buy' ? toCode : fromCode;
    const givenAmount = kind === 'buy' ? toAmount : fromAmount;
    const takenCode = kind === 'buy' ? fromCode : toCode;
    const takenAmount = kind === 'buy' ? fromAmount : toAmount;

    if (!givenCode || !takenCode || !givenAmount || !takenAmount) markUnknown('ارز یا مبلغ معامله ناقص است');

    const givenRate = rates.get(givenCode);
    const takenRate = rates.get(takenCode);
    if (givenRate === undefined) markUnknown('نرخ ' + (givenCode || 'ارز داده‌شده') + ' در تعریف اسعار نیست');
    if (takenRate === undefined) markUnknown('نرخ ' + (takenCode || 'ارز گرفته‌شده') + ' در تعریف اسعار نیست');

    const takenBase = takenRate !== undefined ? round(takenAmount * takenRate) : null;
    let costBase = null;
    let avgCost = null;
    // مبنای بهای تمام‌شدهٔ همین سطر: میانگین موزون یا نرخ تعریف‌شدهٔ همان ارز
    let basis = 'میانگین موزون';

    if (kind === 'buy') {
      // خرید: ارز پایه پرداخت می‌شود و ارز خارجی وارد می‌شود؛ سود تحقق‌یافته صفر است
      costBase = givenRate !== undefined ? round(givenAmount * givenRate) : null;
      // خرید نامشخص نباید سود صفر بگیرد؛ سود فقط برای معاملهٔ کامل و دارای نرخ ثبت می‌شود
      const profitAtBuy = status === 'محاسبه‌شده' && costBase !== null ? 0 : null;
      if (profitAtBuy !== null && takenCode !== base) {
        const stock = inventory.get(takenCode) || { qty: 0, costBase: 0 };
        stock.qty += takenAmount;
        stock.costBase += costBase;
        inventory.set(takenCode, stock);
      }
      rows.push(buildRow(trade, {
        kind, fromCode, fromAmount, toCode, toAmount,
        givenCode, givenAmount, takenCode, takenAmount,
        costBase, proceedsBase: null, profit: profitAtBuy, avgCost: null,
        basis: 'مبلغ پرداخت‌شده', status, reasons,
      }, rates));
      return;
    }

    // فروش و تبدیل: ارز داده‌شده از موجودی کم می‌شود
    if (givenCode === base) {
      costBase = round(givenAmount);
      avgCost = 1;
    } else {
      const stock = inventory.get(givenCode);
      // میانگین موزون فقط وقتی مبنا است که موجودی ثبت‌شدهٔ همین ارز برای همین مقدار کافی باشد؛
      // در غیر این صورت کل سطر با نرخ تعریف‌شدهٔ همان ارز محاسبه می‌شود (یک قاعدهٔ یکسان برای همهٔ سطرها).
      const enoughStock = Boolean(stock) && stock.qty > 0 && givenAmount <= stock.qty + 0.000001;
      if (enoughStock) {
        avgCost = stock.costBase / stock.qty;
        costBase = round(givenAmount * avgCost);
      } else if (givenRate !== undefined) {
        avgCost = givenRate;
        costBase = round(givenAmount * givenRate);
        basis = 'نرخ تعریف‌شده';
        reasons.push(!stock || stock.qty <= 0
          ? 'خرید ثبت‌شده‌ای برای ' + givenCode + ' نبود؛ بهای تمام‌شده با نرخ تعریف‌شده محاسبه شد'
          : 'موجودی ثبت‌شدهٔ ' + givenCode + ' برای این مقدار کافی نبود؛ بهای تمام‌شده با نرخ تعریف‌شده محاسبه شد');
      } else {
        markUnknown('موجودی و بهای تمام‌شدهٔ ' + (givenCode || 'ارز') + ' ثبت نشده است');
      }
    }

    const profit = status === 'محاسبه‌شده' && takenBase !== null && costBase !== null
      ? round(takenBase - costBase)
      : null;

    // فقط گردشی که بهای تمام‌شده‌اش اثبات شد موجودی را تغییر می‌دهد؛ گردش نامشخص هیچ موجودی نمی‌سازد
    if (status === 'محاسبه‌شده') {
      if (givenCode !== base) {
        const stock = inventory.get(givenCode);
        if (stock) {
          stock.qty -= givenAmount;
          stock.costBase -= costBase;
          if (stock.qty <= 0.000001) inventory.delete(givenCode);
        }
      }
      if (takenCode !== base) {
        const bought = inventory.get(takenCode) || { qty: 0, costBase: 0 };
        bought.qty += takenAmount;
        bought.costBase += takenBase;
        inventory.set(takenCode, bought);
      }
    }

    rows.push(buildRow(trade, {
      kind, fromCode, fromAmount, toCode, toAmount,
      givenCode, givenAmount, takenCode, takenAmount,
      costBase, proceedsBase: takenBase, profit, avgCost, basis,
      status, reasons,
    }, rates));
  });

  // کارمزدها: معاملات اسعار + حواله‌ها؛ ارز کارمزد معامله، ارز پایهٔ همان معامله است
  const fees = [];
  rows.forEach((row) => {
    if (!row.fee) return;
    fees.push({
      id: 'exchange-' + row.id,
      source: 'معاملهٔ اسعار',
      number: row.number,
      date: row.date,
      amount: row.fee,
      currency: row.feeCurrency,
      base: row.feeBase,
    });
  });
  (remittances || []).forEach((row) => {
    const amount = num(row.fee);
    if (!amount) return;
    const currency = upper(row.currency);
    const rate = rates.get(currency);
    fees.push({
      id: 'remittance-' + row.id,
      source: 'حواله',
      number: row.number || '',
      date: row.date || '',
      amount,
      currency,
      base: rate ? round(amount * rate) : null,
    });
  });

  const byCurrency = new Map();
  rows.forEach((row) => {
    if (!row.givenCode) return;
    const current = byCurrency.get(row.givenCode) || { code: row.givenCode, count: 0, givenQty: 0, costBase: 0, proceedsBase: 0, profit: 0 };
    current.count += 1;
    current.givenQty += row.givenAmount;
    if (row.costBase !== null) current.costBase += row.costBase;
    if (row.proceedsBase !== null) current.proceedsBase += row.proceedsBase;
    if (row.profit !== null) current.profit += row.profit;
    byCurrency.set(row.givenCode, current);
  });

  const inventoryRows = [...inventory.entries()].map(([code, stock]) => ({
    code,
    qty: round(stock.qty),
    costBase: round(stock.costBase),
    avgCost: stock.qty ? round(stock.costBase / stock.qty) : null,
  }));

  const computed = rows.filter((row) => row.profit !== null);
  const totals = {
    trades: rows.length,
    computed: computed.length,
    unknown: rows.length - computed.length,
    profitBase: round(computed.reduce((sum, row) => sum + (row.profit || 0), 0)),
    costBase: round(computed.reduce((sum, row) => sum + (row.costBase || 0), 0)),
    proceedsBase: round(computed.reduce((sum, row) => sum + (row.proceedsBase || 0), 0)),
    feeBase: round(fees.reduce((sum, row) => sum + (row.base || 0), 0)),
    withoutDocument: rows.filter((row) => !row.documentId).length,
    reversedExcluded: trades.length - ordered.length,
  };

  const definitions = [
    { key: 'base', label: 'ارز مبنا', value: base, status: 'تعریف‌شده', note: 'همهٔ سودها و کارمزدها به این ارز گزارش می‌شوند.' },
    { key: 'method', label: 'روش بهای تمام‌شده', value: (COST_METHODS.find((item) => item.value === method) || COST_METHODS[0]).label, status: 'تعریف‌شده', note: 'میانگین موزون از معاملات ثبت‌شده ساخته می‌شود؛ خرید بهای موجودی را اضافه و فروش آن را کم می‌کند.' },
    { key: 'direction', label: 'جهت معامله', value: 'خرید: ورود ارز / فروش و تبدیل: خروج ارز', status: 'تعریف‌شده', note: 'عیناً همان قاعدهٔ ثبت سند معاملهٔ اسعار در دفترها.' },
    {
      key: 'rates',
      label: 'نرخ تبدیل ارزها',
      value: missing.length ? 'نرخ تعریف نشده: ' + missing.join('، ') : 'همهٔ ارزهای تعریف‌شده نرخ دارند',
      status: missing.length ? 'نامشخص' : 'تعریف‌شده',
      note: 'منبع: تعریف اسعار (ارزش یک واحد ارز به ارز مبنا).',
    },
    { key: 'opening', label: 'بهای تمام‌شدهٔ موجودی آغازین', value: openingInventory.length ? 'با نرخ تعریف‌شدهٔ همان ارز' : 'موجودی آغازینی ثبت نشده', status: openingInventory.some((row) => row.costBase === null) ? 'نامشخص' : 'تعریف‌شده', note: 'ماندهٔ آغازین صندوق‌های ارزی، پیش از معاملات وارد میانگین موزون می‌شود؛ ارزی که نرخ تعریف‌شده ندارد ارزش‌گذاری نمی‌شود.' },
    { key: 'fee-currency', label: 'ارز کارمزد معامله', value: 'ارز پایهٔ همان معامله', status: 'تعریف‌شده', note: 'سند کارمزد در همین ارز ثبت می‌شود؛ برای حواله، ارز خود حواله.' },
    {
      key: 'documents',
      label: 'ارتباط با دفترها',
      value: totals.withoutDocument ? totals.withoutDocument + ' معامله بدون سند' : 'همهٔ معاملات سند دارند',
      status: totals.withoutDocument ? 'نامشخص' : 'تعریف‌شده',
      note: 'هر معامله با شمارهٔ سند به دفتر روزنامه و سطرهایش به دفتر کل وصل است؛ این ماژول چیزی در دفترها تغییر نمی‌دهد.',
    },
    { key: 'revaluation', label: 'تجدید ارزیابی موجودی', value: 'جزو این گزارش نیست', status: 'نامشخص', note: 'افزایش/کاهش ارزش موجودی ارزی تا زمان فروش، سود تحقق‌یافته نیست و در این ماژول محاسبه نمی‌شود.' },
  ];

  return {
    baseCurrency: base,
    method,
    rows,
    fees,
    inventory: inventoryRows,
    openingInventory,
    byCurrency: [...byCurrency.values()],
    totals,
    definitions,
    missingRates: missing,
  };
}

function buildRow(trade, values, rates) {
  const feeAmount = num(trade.fee);
  // ارز کارمزد = ارز پایهٔ همان معامله (to)، همان‌طور که سند کارمزد ثبت می‌شود
  const feeCurrency = upper(trade.feeCurrency || trade.fee_currency || trade.toCurrency);
  const feeRate = feeCurrency ? rates.get(feeCurrency) : undefined;
  return {
    id: String(trade.id || trade.number || trade.date),
    number: trade.number || '',
    tradeDate: trade.date || '',
    date: trade.date || '',
    kind: values.kind === 'buy' ? 'خرید' : values.kind === 'sell' ? 'فروش' : 'تبدیل',
    party: trade.party || '',
    ...values,
    basis: values.basis || '—',
    fee: feeAmount,
    feeCurrency,
    feeBase: feeCurrency && feeRate ? Math.round(feeAmount * feeRate * 100) / 100 : null,
    accountingStatus: trade.accountingStatus || (trade.documentId ? 'دارای سند' : 'سند ندارد'),
    documentId: trade.documentId || null,
  };
}