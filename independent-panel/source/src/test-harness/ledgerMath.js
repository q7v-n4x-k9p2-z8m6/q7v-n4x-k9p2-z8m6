// test-harness/ledgerMath.js — محاسبهٔ خالص مانده و گردش (بدون وابستگی به رابط کاربری)
const num = (value) => Number(value) || 0;

export function totalsOf(lines) {
  const debit = lines.reduce((sum, line) => sum + num(line.debit), 0);
  const credit = lines.reduce((sum, line) => sum + num(line.credit), 0);
  return { debit, credit, balance: debit - credit };
}

export function withRunning(lines) {
  let running = 0;
  return lines.map((line) => {
    running += num(line.debit) - num(line.credit);
    return { ...line, running };
  });
}

export function sideOf(balance) {
  if (Math.abs(balance) < 0.005) return 'تسویه';
  return balance > 0 ? 'بدهکار' : 'بستانکار';
}