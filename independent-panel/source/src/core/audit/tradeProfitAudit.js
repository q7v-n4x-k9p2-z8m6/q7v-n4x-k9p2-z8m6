// src/core/audit/tradeProfitAudit.js — آزمون عملی محاسبات «مفاد معاملات» در محیط آزمون
// فقط خواندن و محاسبه روی دادهٔ ساختگیِ درون‌حافظه‌ای؛ هیچ سند، دادهٔ مالی، تنظیمات یا حافظه‌ای نوشته نمی‌شود.
// هر سناریو ورودی، محاسبهٔ دستی، نتیجهٔ مورد انتظار و نتیجهٔ واقعی را کنار هم می‌گذارد و PASS یا FAIL می‌دهد.
import { computeTradeProfit } from '../domain/tradeProfit.js';
import { reversalLinesOf } from '../domain/ledger.js';
import { buildConversionLines, buildFeeLines } from '../../a1/lib/v21Domain.js';

const CURRENCIES = [
  { code: 'AFN', name: 'افغانی', rate: 1 },
  { code: 'USD', name: 'دالر امریکایی', rate: 71.2 },
  { code: 'EUR', name: 'یورو', rate: 77.4 },
];

const POLICY = { baseCurrency: 'AFN', method: 'weighted_average' };
const KIND = { 'خرید': 'buy', 'فروش': 'sell', 'تبدیل': 'convert' };

const show = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return Number(value).toLocaleString('fa-IR', { maximumFractionDigits: 2 });
  return String(value);
};

const sameNumber = (expected, actual) => Number(expected) === Number(actual)
  || Math.abs(Number(expected) - Number(actual)) < 0.011;

const eqCheck = (label, expected, actual) => ({
  label,
  expected: show(expected),
  actual: show(actual),
  pass: sameNumber(expected, actual),
});

const textCheck = (label, expected, actual) => ({
  label,
  expected: show(expected),
  actual: show(actual),
  pass: String(expected) === String(actual),
});

// حساب‌های آزمایشی: همان شکل مرجعی که موتور هنگام ثبت سند می‌سازد
const SAFE_IDS = { AFN: 11, USD: 12, EUR: 13 };
const cashRef = (code) => ({
  account: 'صندوق ' + code, code: '1010', account_type: 'cash',
  account_name: 'صندوق ' + code, account_id: SAFE_IDS[code] || 19,
});
const partyRef = (code) => ({
  account: 'حساب مشتریان', code: '1030', account_type: 'customer',
  account_name: 'حساب مشتریان', account_id: 21,
});

// سند دفتر روزنامه و سطرهای دفتر کل همان معامله، با همان قاعدهٔ ثبت موتور
function documentOf(record, number, id) {
  const lines = buildConversionLines({
    kind: KIND[record.kind] || 'convert',
    party: partyRef(record.fromCurrency),
    currencyA: record.fromCurrency,
    amountA: record.fromAmount,
    accountA: cashRef(record.fromCurrency),
    currencyB: record.toCurrency,
    amountB: record.toAmount,
    accountB: cashRef(record.toCurrency),
  }).map((line) => ({ ...line, documentId: id, number }));
  return { id, number, lines };
}

// خالص همهٔ سطرهای یک ارز: سند متوازن باید صفر بدهد
const netOf = (lines, currency) => lines
  .filter((line) => String(line.currency) === currency)
  .reduce((sum, line) => sum + Number(line.debit || 0) - Number(line.credit || 0), 0);

// خالص حرکت صندوق‌ها در یک ارز: همان چیزی که از معامله به صندوق می‌رسد یا از آن می‌رود
const cashNetOf = (lines, currency) => lines
  .filter((line) => String(line.currency) === currency && String(line.account_type) === 'cash')
  .reduce((sum, line) => sum + Number(line.debit || 0) - Number(line.credit || 0), 0);

const revenueRef = { account: '4000 — درآمد کمیشن', code: '4000', account_type: 'revenue', account_name: 'درآمد کمیشن', account_id: 41 };

function feeDocumentOf(record, number, id) {
  const lines = buildFeeLines({
    amount: record.fee,
    currency: record.toCurrency,
    party: partyRef(record.toCurrency),
    revenue: revenueRef,
  }).map((line) => ({ ...line, documentId: id, number }));
  return { id, number, lines };
}

const uniqueOf = (lines, key) => [...new Set(lines.map((line) => line[key]))].join('، ');

const inventoryOf = (result, code) => result.inventory.find((row) => row.code === code) || {};

const buyUsd = {
  id: 'T1', date: '2026-11-10', number: 'EX-1001', kind: 'خرید', party: 'مشتری آزمون',
  fromCurrency: 'USD', fromAmount: 5000, toCurrency: 'AFN', toAmount: 354500,
  fee: 0, documentId: 'd1001', accountingStatus: 'متوازن',
};

const sellUsd = {
  id: 'T2', date: '2026-11-11', number: 'EX-1002', kind: 'فروش', party: 'مشتری آزمون',
  fromCurrency: 'USD', fromAmount: 1000, toCurrency: 'AFN', toAmount: 72000,
  fee: 450, feeDocumentId: 'd1002-fee', documentId: 'd1002', accountingStatus: 'متوازن',
};

function scenarioBuy() {
  const result = computeTradeProfit({ trades: [buyUsd], currencies: CURRENCIES, policy: POLICY });
  const row = result.rows[0];
  const usd = inventoryOf(result, 'USD');
  const doc = documentOf(buyUsd, 'EX-1001', 'd1001');
  return {
    id: 'buy',
    title: '۱) خرید ارز',
    goal: 'ورود دالر به موجودی، ساخت بهای تمام‌شده و ثبت سند در روزنامه و دفتر کل',
    inputs: [
      ['شمارهٔ سند', 'EX-1001'],
      ['نوع', 'خرید'],
      ['دریافتی', '۵٬۰۰۰ دالر'],
      ['پرداختی', '۳۵۴٬۵۰۰ افغانی'],
      ['کارمزد', '۰'],
    ],
    manual: 'بهای تمام‌شده: ۳۵۴٬۵۰۰ ÷ ۵٬۰۰۰ = ۷۰٫۹۰ افغانی برای هر دالر. خرید سود تحقق‌یافته ندارد؛ کل مبلغ پرداختی به موجودی دالر منتقل می‌شود.',
    checks: [
      textCheck('وضعیت محاسبه', 'محاسبه‌شده', row.status),
      eqCheck('سود تحقق‌یافته', 0, row.profit),
      eqCheck('بهای تمام‌شدهٔ معامله', 354500, row.costBase),
      eqCheck('موجودی دالر پس از معامله', 5000, usd.qty),
      eqCheck('بهای موجودی دالر', 354500, usd.costBase),
      eqCheck('میانگین بهای هر دالر', 70.9, usd.avgCost),
      eqCheck('کارمزد مستقل', 0, row.feeBase),
      textCheck('شمارهٔ سند در گزارش', 'EX-1001', row.number),
      eqCheck('تعداد سطرهای دفتر کل سند', 4, doc.lines.length),
      textCheck('شمارهٔ سند روی سطرهای دفتر کل', 'EX-1001', uniqueOf(doc.lines, 'number')),
      textCheck('اتصال سطرها به شناسهٔ سند', 'd1001', uniqueOf(doc.lines, 'documentId')),
      eqCheck('خالص حرکت صندوق دالر در دفتر کل', 5000, cashNetOf(doc.lines, 'USD')),
      eqCheck('خالص حرکت صندوق افغانی در دفتر کل', -354500, cashNetOf(doc.lines, 'AFN')),
      eqCheck('تراز سند در ارز دالر', 0, netOf(doc.lines, 'USD')),
      eqCheck('تراز سند در ارز افغانی', 0, netOf(doc.lines, 'AFN')),
    ],
  };
}

function scenarioSell() {
  const result = computeTradeProfit({ trades: [buyUsd, sellUsd], currencies: CURRENCIES, policy: POLICY });
  const row = result.rows.find((item) => item.id === 'T2');
  const usd = inventoryOf(result, 'USD');
  const doc = documentOf(sellUsd, 'EX-1002', 'd1002');
  const feeDoc = feeDocumentOf(sellUsd, 'EX-1002-F', 'd1002-fee');
  return {
    id: 'sell',
    title: '۲) فروش ارز با کارمزد',
    goal: 'محاسبهٔ سود فروش از میانگین موزون، جدا نگه‌داشتن کارمزد و کاهش موجودی',
    inputs: [
      ['موجودی قبلی', '۵٬۰۰۰ دالر به بهای ۳۵۴٬۵۰۰ افغانی'],
      ['شمارهٔ سند', 'EX-1002'],
      ['فروش', '۱٬۰۰۰ دالر'],
      ['دریافتی', '۷۲٬۰۰۰ افغانی'],
      ['کارمزد', '۴۵۰ افغانی (سند جداگانه d1002-fee)'],
    ],
    manual: 'بهای تمام‌شدهٔ ۱٬۰۰۰ دالر: ۱٬۰۰۰ × ۷۰٫۹۰ = ۷۰٬۹۰۰. سود: ۷۲٬۰۰۰ − ۷۰٬۹۰۰ = ۱٬۱۰۰. کارمزد ۴۵۰ افغانی درآمد جداست و به سود معامله اضافه نمی‌شود. موجودی: ۴٬۰۰۰ دالر به بهای ۲۸۳٬۶۰۰.',
    checks: [
      textCheck('وضعیت محاسبه', 'محاسبه‌شده', row.status),
      eqCheck('بهای تمام‌شدهٔ ۱٬۰۰۰ دالر', 70900, row.costBase),
      eqCheck('ارزش دریافتی به ارز مبنا', 72000, row.proceedsBase),
      eqCheck('سود معامله', 1100, row.profit),
      eqCheck('سود بدون کارمزد (کارمزد داخل سود نیامده)', 1100, row.profit),
      eqCheck('کارمزد مستقل به ارز مبنا', 450, row.feeBase),
      eqCheck('جمع کارمزدهای گزارش', 450, result.totals.feeBase),
      eqCheck('موجودی دالر پس از فروش', 4000, usd.qty),
      eqCheck('بهای موجودی دالر پس از فروش', 283600, usd.costBase),
      eqCheck('میانگین بهای هر دالر پس از فروش', 70.9, usd.avgCost),
      textCheck('کارمزد سند جداگانه دارد', 'true', String(sellUsd.feeDocumentId !== sellUsd.documentId)),
      eqCheck('تعداد سطرهای دفتر کل سند', 4, doc.lines.length),
      textCheck('شمارهٔ سند روی سطرهای دفتر کل', 'EX-1002', uniqueOf(doc.lines, 'number')),
      eqCheck('خالص حرکت صندوق دالر در دفتر کل', -1000, cashNetOf(doc.lines, 'USD')),
      eqCheck('خالص حرکت صندوق افغانی در دفتر کل', 72000, cashNetOf(doc.lines, 'AFN')),
      eqCheck('تراز سند معامله', 0, netOf(doc.lines, 'AFN')),
      eqCheck('تعداد سطرهای سند کارمزد', 2, feeDoc.lines.length),
      textCheck('شمارهٔ سند کارمزد جداست', 'EX-1002-F', uniqueOf(feeDoc.lines, 'number')),
      eqCheck('کارمزد در دفتر کل (بدهکار مشتری)', 450, feeDoc.lines.find((line) => String(line.account_type) === 'customer')?.debit),
      eqCheck('درآمد کارمزد در دفتر کل (بستانکار)', 450, feeDoc.lines.find((line) => String(line.account_type) === 'revenue')?.credit),
      eqCheck('تراز سند کارمزد', 0, netOf(feeDoc.lines, 'AFN')),
    ],
  };
}

function scenarioConvert() {
  const buyEur = {
    id: 'T3', date: '2026-11-09', number: 'EX-1003', kind: 'خرید', party: 'مشتری آزمون',
    fromCurrency: 'EUR', fromAmount: 500, toCurrency: 'AFN', toAmount: 38700,
    fee: 0, documentId: 'd1003', accountingStatus: 'متوازن',
  };
  const convert = {
    id: 'T4', date: '2026-11-12', number: 'EX-1004', kind: 'تبدیل', party: '',
    fromCurrency: 'EUR', fromAmount: 100, toCurrency: 'USD', toAmount: 108,
    fee: 0, documentId: 'd1004', accountingStatus: 'متوازن',
  };
  const result = computeTradeProfit({ trades: [buyEur, convert], currencies: CURRENCIES, policy: POLICY });
  const row = result.rows.find((item) => item.id === 'T4');
  const eur = inventoryOf(result, 'EUR');
  const usd = inventoryOf(result, 'USD');
  const doc = documentOf(convert, 'EX-1004', 'd1004');
  return {
    id: 'convert',
    title: '۳) تبدیل ارز',
    goal: 'تبدیل یورو به دالر، محاسبهٔ سود با نرخ تعریف‌شدهٔ ارز دریافتی و جابه‌جایی موجودی دو ارز',
    inputs: [
      ['موجودی قبلی', '۵۰۰ یورو به بهای ۳۸٬۷۰۰ افغانی (میانگین ۷۷٫۴۰)'],
      ['شمارهٔ سند', 'EX-1004'],
      ['داده‌شده', '۱۰۰ یورو'],
      ['گرفته‌شده', '۱۰۸ دالر'],
      ['نرخ دالر در تعریف اسعار', '۷۱٫۲۰'],
    ],
    manual: 'ارزش دریافتی: ۱۰۸ × ۷۱٫۲۰ = ۷٬۶۸۹٫۶۰. بهای ۱۰۰ یورو: ۱۰۰ × ۷۷٫۴۰ = ۷٬۷۴۰. سود: ۷٬۶۸۹٫۶۰ − ۷٬۷۴۰ = −۵۰٫۴۰ (زیان). موجودی: ۴۰۰ یورو به بهای ۳۰٬۹۶۰ و ۱۰۸ دالر به بهای ۷٬۶۸۹٫۶۰.',
    checks: [
      textCheck('وضعیت محاسبه', 'محاسبه‌شده', row.status),
      eqCheck('ارزش دریافتی به ارز مبنا', 7689.6, row.proceedsBase),
      eqCheck('بهای تمام‌شدهٔ ۱۰۰ یورو', 7740, row.costBase),
      eqCheck('سود (زیان) معامله', -50.4, row.profit),
      eqCheck('موجودی یورو پس از تبدیل', 400, eur.qty),
      eqCheck('بهای موجودی یورو', 30960, eur.costBase),
      eqCheck('موجودی دالر پس از تبدیل', 108, usd.qty),
      eqCheck('بهای موجودی دالر', 7689.6, usd.costBase),
      eqCheck('تعداد سطرهای دفتر کل سند', 4, doc.lines.length),
      textCheck('شمارهٔ سند روی سطرهای دفتر کل', 'EX-1004', uniqueOf(doc.lines, 'number')),
      eqCheck('خالص حرکت صندوق یورو در دفتر کل', -100, cashNetOf(doc.lines, 'EUR')),
      eqCheck('خالص حرکت صندوق دالر در دفتر کل', 108, cashNetOf(doc.lines, 'USD')),
      eqCheck('تراز سند در ارز یورو', 0, netOf(doc.lines, 'EUR')),
      eqCheck('تراز سند در ارز دالر', 0, netOf(doc.lines, 'USD')),
    ],
  };
}

function scenarioReversal() {
  const buy = {
    id: 'T5', date: '2026-11-13', number: 'EX-1005', kind: 'خرید', party: 'مشتری آزمون',
    fromCurrency: 'USD', fromAmount: 1000, toCurrency: 'AFN', toAmount: 71000,
    fee: 0, documentId: 'd1005', accountingStatus: 'متوازن',
  };
  const sell = {
    id: 'T6', date: '2026-11-14', number: 'EX-1006', kind: 'فروش', party: 'مشتری آزمون',
    fromCurrency: 'USD', fromAmount: 400, toCurrency: 'AFN', toAmount: 28800,
    fee: 0, documentId: 'd1006', accountingStatus: 'متوازن',
  };
  const reversedEngine = { ...sell, status: 'reversed', accountingStatus: 'ابطال شده' };
  const reversedMobile = { ...sell, status: 'ابطال شده', accountingStatus: 'ابطال شده' };
  const corrected = { ...sell, fromAmount: 300, toAmount: 21600 };

  const withSale = computeTradeProfit({ trades: [buy, sell], currencies: CURRENCIES, policy: POLICY });
  const afterEngine = computeTradeProfit({ trades: [buy, reversedEngine], currencies: CURRENCIES, policy: POLICY });
  const afterMobile = computeTradeProfit({ trades: [buy, reversedMobile], currencies: CURRENCIES, policy: POLICY });
  const afterCorrection = computeTradeProfit({ trades: [buy, corrected], currencies: CURRENCIES, policy: POLICY });

  const sellRow = withSale.rows.find((item) => item.id === 'T6');
  const doc = documentOf(sell, 'EX-1006', 'd1006');
  const counter = { id: 'd1006-rv', number: 'RV-EX-1006', date: '2026-11-15' };
  const reversalLines = reversalLinesOf(doc.lines, counter);
  const bookNet = (currency) => netOf(doc.lines, currency) + netOf(reversalLines, currency);

  return {
    id: 'reversal',
    title: '۴) برگشت و اصلاح معامله',
    goal: 'برگشت سند فروش با سند معکوس و اصلاح مبلغ معامله؛ اثر آن بر سود، موجودی و دفترها',
    inputs: [
      ['معاملهٔ پایه', 'خرید ۱٬۰۰۰ دالر به ۷۱٬۰۰۰ افغانی'],
      ['فروش', '۴۰۰ دالر به ۲۸٬۸۰۰ افغانی — سند EX-1006'],
      ['برگشت', 'ابطال EX-1006 با سند معکوس RV-EX-1006'],
      ['اصلاح', 'تغییر مبلغ فروش از ۴۰۰ به ۳۰۰ دالر و از ۲۸٬۸۰۰ به ۲۱٬۶۰۰'],
    ],
    manual: 'پیش از برگشت: بهای ۴۰۰ دالر ۲۸٬۴۰۰ و سود ۴۰۰. پس از برگشت، معامله باطل است: سود باید صفر و موجودی دالر باید دوباره ۱٬۰۰۰ به بهای ۷۱٬۰۰۰ شود؛ در دفترها سطر اصلی و سطر معکوس روی هم صفر می‌شوند. پس از اصلاح: ۳۰۰ × ۷۱ = ۲۱٬۳۰۰ بهای تمام‌شده، سود ۲۱٬۶۰۰ − ۲۱٬۳۰۰ = ۳۰۰ و موجودی ۷۰۰ دالر به بهای ۴۹٬۷۰۰.',
    checks: [
      eqCheck('سود پیش از برگشت', 400, sellRow.profit),
      eqCheck('سود پس از برگشت (وضعیت موتور: reversed)', 0, afterEngine.totals.profitBase),
      eqCheck('سود پس از برگشت (وضعیت موبایل: ابطال شده)', 0, afterMobile.totals.profitBase),
      eqCheck('موجودی دالر پس از برگشت', 1000, (inventoryOf(afterEngine, 'USD').qty || 0)),
      eqCheck('بهای موجودی دالر پس از برگشت', 71000, (inventoryOf(afterEngine, 'USD').costBase || 0)),
      textCheck('شمارهٔ سند معکوس', 'RV-EX-1006', uniqueOf(reversalLines, 'number')),
      eqCheck('تعداد سطرهای سند معکوس', 4, reversalLines.length),
      eqCheck('خالص دالر در دفتر پس از برگشت', 0, bookNet('USD')),
      eqCheck('خالص افغانی در دفتر پس از برگشت', 0, bookNet('AFN')),
      eqCheck('تعداد معاملات ابطال‌شدهٔ کنارگذاشته‌شده', 1, afterEngine.totals.reversedExcluded),
      eqCheck('تعداد نامشخص پس از برگشت', 0, afterEngine.totals.unknown),
      eqCheck('سود پس از اصلاح مبلغ', 300, afterCorrection.totals.profitBase),
      eqCheck('موجودی دالر پس از اصلاح', 700, (inventoryOf(afterCorrection, 'USD').qty || 0)),
      textCheck('شمارهٔ سند اصلاح‌شده حفظ شده', 'EX-1006', afterCorrection.rows.find((item) => item.id === 'T6')?.number),
    ],
  };
}

function scenarioUnknown() {
  const noCostSell = {
    id: 'U1', date: '2026-11-15', number: 'EX-1007', kind: 'فروش', party: 'مشتری آزمون',
    fromCurrency: 'EUR', fromAmount: 50, toCurrency: 'AFN', toAmount: 3800,
    fee: 0, documentId: 'd1007', accountingStatus: 'متوازن',
  };
  const noRateBuy = {
    id: 'U2', date: '2026-11-16', number: 'EX-1008', kind: 'خرید', party: 'مشتری آزمون',
    fromCurrency: 'PKR', fromAmount: 100000, toCurrency: 'AFN', toAmount: 25000,
    fee: 0, documentId: 'd1008', accountingStatus: 'متوازن',
  };
  const noDocumentBuy = {
    id: 'U3', date: '2026-11-17', number: '', kind: 'خرید', party: 'مشتری آزمون',
    fromCurrency: 'USD', fromAmount: 100, toCurrency: 'AFN', toAmount: 7100,
    fee: 0, documentId: null, accountingStatus: 'سند ندارد',
  };
  const halfTrade = {
    id: 'U4', date: '2026-11-18', number: 'EX-1009', kind: 'فروش', party: 'مشتری آزمون',
    fromCurrency: 'USD', fromAmount: 0, toCurrency: 'AFN', toAmount: 720,
    fee: 0, documentId: 'd1009', accountingStatus: 'متوازن',
  };
  const result = computeTradeProfit({ trades: [noCostSell, noRateBuy, noDocumentBuy, halfTrade], currencies: CURRENCIES, policy: POLICY });
  const rowOf = (id) => result.rows.find((item) => item.id === id) || {};
  return {
    id: 'unknown',
    title: '۵) موارد نامشخص',
    goal: 'بررسی اینکه نبود بهای تمام‌شده، نرخ، سند و مبلغ، به‌جای سود حدسی، «نامشخص» گزارش شود',
    inputs: [
      ['فروش ۵۰ یورو', 'بدون هیچ خرید یورو'],
      ['خرید ۱۰۰٬۰۰۰ کلدار', 'کلدار در تعریف اسعار نیست'],
      ['خرید ۱۰۰ دالر', 'بدون شماره و شناسهٔ سند'],
      ['فروش دالر', 'مبلغ ارز داده‌شده خالی است'],
    ],
    manual: 'هیچ‌کدام از این چهار معامله نباید سود یا زیان حدسی تولید کند: اولی بهای تمام‌شده ندارد، دومی نرخ ندارد، سومی سند ندارد (ولی چون خرید است و بهایش از ارز پایه می‌آید سود صفر دارد) و چهارمی مبلغ ناقص دارد.',
    checks: [
      textCheck('فروش بدون بهای تمام‌شده', 'نامشخص', rowOf('U1').status),
      textCheck('دلیل نامشخص بودن فروش', 'موجودی و بهای تمام‌شدهٔ EUR ثبت نشده است', (rowOf('U1').reasons || []).join('؛ ')),
      textCheck('خرید ارز بدون نرخ', 'نامشخص', rowOf('U2').status),
      textCheck('دلیل نامشخص بودن خرید کلدار', 'نرخ PKR در تعریف اسعار نیست', (rowOf('U2').reasons || []).join('؛ ')),
      textCheck('معاملهٔ بدون سند', 'محاسبه‌شده', rowOf('U3').status),
      textCheck('وضعیت حسابداری معاملهٔ بدون سند', 'سند ندارد', rowOf('U3').accountingStatus),
      eqCheck('تعداد معاملات بدون سند', 1, result.totals.withoutDocument),
      textCheck('معاملهٔ با مبلغ ناقص', 'نامشخص', rowOf('U4').status),
      eqCheck('تعداد نامشخص‌ها', 3, result.totals.unknown),
      eqCheck('تعداد محاسبه‌شده‌ها', 1, result.totals.computed),
    ],
  };
}

const withStatus = (scenario) => ({
  ...scenario,
  status: scenario.checks.every((check) => check.pass) ? 'PASS' : 'FAIL',
});

export function runTradeProfitAudit() {
  const scenarios = [scenarioBuy(), scenarioSell(), scenarioConvert(), scenarioReversal(), scenarioUnknown()].map(withStatus);
  const checks = scenarios.flatMap((scenario) => scenario.checks);
  const passed = checks.filter((check) => check.pass).length;
  return {
    generatedAt: new Date().toISOString(),
    scenarios,
    summary: {
      scenarios: scenarios.length,
      passedScenarios: scenarios.filter((scenario) => scenario.status === 'PASS').length,
      failedScenarios: scenarios.filter((scenario) => scenario.status === 'FAIL').length,
      checks: checks.length,
      passed,
      failed: checks.length - passed,
      status: passed === checks.length ? 'PASS' : 'FAIL',
    },
  };
}