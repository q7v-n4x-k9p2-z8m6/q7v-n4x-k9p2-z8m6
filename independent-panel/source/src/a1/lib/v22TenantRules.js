// قواعد خالص جداسازی داده‌ها در نسخهٔ ۲۲
// نبود شناسهٔ صرافی هرگز به معنی دادهٔ عمومی نیست.
export function belongsToExchange(record, exchangeCode) {
  const expected = String(exchangeCode || '').trim();
  const actual = String(record?.exchange_code || '').trim();
  return Boolean(expected && actual && actual === expected);
}
