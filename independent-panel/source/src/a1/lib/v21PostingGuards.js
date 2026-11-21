// a1/lib/v21PostingGuards.js — قواعد خالص و قابل‌آزمون برای ثبت مالی
// این ماژول نه به IndexedDB وابسته است و نه به شبکه یا وضعیت نشست.

export function isReversalDocument(document) {
  return Boolean(
    document
    && (
      String(document.doc_type || '').toLowerCase() === 'reversal'
      || (document.reverses_document_id !== null
        && document.reverses_document_id !== undefined
        && document.reverses_document_id !== '')
    )
  );
}

// سند اصلیِ مرتبط را نگه می‌داریم حتی اگر قبلاً reversed شده باشد؛
 // تابع فراخواننده با پرچم reversed تصمیم می‌گیرد که عملیات جدید مجاز است یا خیر.
export function isOriginalLinkedDocument(document) {
  return Boolean(document && !document.deleted && !isReversalDocument(document));
}

// خالص خروجی هر صندوق/بانک در تمام سطرهای یک سند را جمع می‌کند.
// خروجی مثبت یعنی سند از آن حساب پول خارج می‌کند؛ ورودی‌ها با خروجی همان حساب تهاتر می‌شوند.
export function cashBankOutflows(lines) {
  const grouped = new Map();
  for (const line of Array.isArray(lines) ? lines : []) {
    const accountType = String(line?.account_type || '');
    if (accountType !== 'cash' && accountType !== 'bank') continue;

    const accountId = String(line.account_id ?? '');
    const currency = String(line.currency || 'AFN').trim().toUpperCase();
    const key = JSON.stringify([accountType, accountId, currency]);
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    const row = grouped.get(key) || {
      account_type: accountType,
      account_id: accountId,
      account_name: String(line.account_name || 'حساب نقدی'),
      currency,
      debit: 0,
      credit: 0,
    };
    row.debit += Number.isFinite(debit) ? debit : 0;
    row.credit += Number.isFinite(credit) ? credit : 0;
    grouped.set(key, row);
  }

  return [...grouped.values()]
    .map((row) => ({ ...row, required: row.credit - row.debit }))
    .filter((row) => row.required > 0.005);
}

export function assertAvailableBalance({ available, required, accountName = 'حساب نقدی', currency = '' }) {
  const current = Number(available);
  const amount = Number(required);
  if (!Number.isFinite(current) || !Number.isFinite(amount) || amount < 0) {
    throw new Error('مانده یا مبلغ خروجی حساب معتبر نیست؛ ثبت متوقف شد.');
  }
  if (amount > current + 0.005) {
    throw new Error(
      `موجودی ${accountName} کافی نیست؛ ماندهٔ در دسترس ${current} ${currency} و مبلغ خروجی ${amount} ${currency} است.`
    );
  }
  return true;
}
