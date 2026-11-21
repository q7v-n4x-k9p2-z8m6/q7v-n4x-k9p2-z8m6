// a1/lib/documentSeries.js — سری شمارهٔ اسناد، یک منبع برای نوشتن و ترمیم
// هر نوع سند در سری خودش شماره می‌گیرد تا فهرست هر بخش (مثلاً خرید و فروش اسعار)
// پیوسته و بی‌شکاف خوانده شود؛ پیشوند یکتا هم از شمارهٔ تکراری میان بخش‌ها جلوگیری می‌کند.
export const DOC_SERIES = {
  // معاملات اسعار: خرید، فروش و تبدیل یک سری مشترک و پیوسته دارند تا فهرست بخش بی‌شکاف بماند.
  // سند کارمزد سری جدا دارد و سند تجاری قدیمی («trade») هم سری خودش را می‌گیرد تا شمارهٔ
  // معاملات اسعار را نخورد و بین شماره‌های معاملات شکاف نیندازد.
  exchange: 'EX', convert: 'EX', trade: 'TRD', exchange_fee: 'EXF',
  transfer: 'TD', transfer_fee: 'TDF',
  journal: 'JV',
  expense: 'XP',
  cash_in: 'CI', cash: 'CO', cash_out: 'CO',
  deposit: 'DP', income: 'IN',
  reversal: 'RV',
};

export const seriesPrefix = (docType) => DOC_SERIES[String(docType || '').toLowerCase()] || 'DV';

export const seriesNumber = (prefix, sequence) => `${prefix}-${String(sequence).padStart(5, '0')}`;