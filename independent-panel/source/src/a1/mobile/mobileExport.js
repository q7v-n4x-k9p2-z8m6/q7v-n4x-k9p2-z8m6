// a1/mobile/mobileExport.js — ستون‌های گزارش، خروجی CSV و یافتن سند اصلی هر سطر دفتر کل
// فقط لایهٔ نمایش است؛ هیچ قاعدهٔ مالی این‌جا تکرار نشده.

export const COLUMNS = {
  customers: [['code', 'کد'], ['name', 'نام'], ['kind', 'نوع'], ['phone', 'تماس'], ['address', 'آدرس'], ['currency', 'ارز'], ['opening', 'مانده افتتاحیه'], ['status', 'وضعیت']],
  branches: [['code', 'کد'], ['name', 'نام'], ['city', 'موقعیت'], ['phone', 'تماس'], ['status', 'وضعیت']],
  cash: [['name', 'نام صندوق'], ['currency', 'ارز'], ['opening', 'مانده افتتاحیه'], ['status', 'وضعیت']],
  banks: [['name', 'بانک'], ['account', 'شماره حساب'], ['currency', 'ارز'], ['opening', 'مانده افتتاحیه'], ['description', 'توضیح'], ['status', 'وضعیت']],
  currencies: [['code', 'کد'], ['name', 'نام'], ['symbol', 'نماد'], ['rate', 'نرخ'], ['active', 'وضعیت']],
  accounts: [['code', 'کد حساب'], ['name', 'نام حساب'], ['accountType', 'نوع'], ['parentId', 'حساب مادر'], ['currency', 'ارز'], ['status', 'وضعیت']],
  expenses: [['date', 'تاریخ'], ['number', 'شماره سند'], ['title', 'شرح مصرف'], ['expenseAccount', 'حساب مصرف'], ['currency', 'ارز'], ['amount', 'مبلغ'], ['payerType', 'پرداخت از'], ['cash', 'صندوق'], ['bank', 'بانک'], ['note', 'یادداشت'], ['status', 'وضعیت']],
  remittance: [['date', 'تاریخ'], ['number', 'شماره حواله'], ['direction', 'نوع'], ['sender', 'فرستنده'], ['receiver', 'گیرنده'], ['currency', 'ارز'], ['amount', 'مبلغ'], ['fee', 'کمیشن'], ['branch', 'نمایندگی'], ['settlement', 'تسویه'], ['note', 'یادداشت'], ['status', 'وضعیت']],
  exchange: [['date', 'تاریخ'], ['number', 'شماره سند'], ['kind', 'نوع'], ['party', 'طرف حساب'], ['foreignCurrency', 'ارز اول'], ['foreignAmount', 'مبلغ ارز اول'], ['baseCurrency', 'ارز دوم'], ['baseAmount', 'مبلغ ارز دوم'], ['foreignCash', 'صندوق ارز اول'], ['baseCash', 'صندوق ارز دوم'], ['fee', 'کمیشن'], ['note', 'یادداشت'], ['status', 'وضعیت']],
  journal: [['date', 'تاریخ'], ['number', 'شماره سند'], ['description', 'شرح'], ['currency', 'ارز'], ['debitTotal', 'جمع بدهکار'], ['creditTotal', 'جمع بستانکار'], ['status', 'وضعیت']],
  transactions: [['date', 'تاریخ'], ['type', 'نوع عملیات'], ['party', 'طرف حساب'], ['currency', 'ارز'], ['amount', 'مبلغ'], ['cash', 'صندوق'], ['description', 'شرح'], ['status', 'وضعیت']],
  ledger: [['date', 'تاریخ'], ['number', 'شماره سند'], ['account', 'حساب'], ['description', 'شرح'], ['debit', 'بدهکار'], ['credit', 'بستانکار'], ['currency', 'ارز']],
  reports: [['date', 'تاریخ'], ['number', 'شماره سند'], ['type', 'نوع'], ['party', 'طرف حساب'], ['description', 'شرح'], ['debit', 'بدهکار'], ['credit', 'بستانکار'], ['currency', 'ارز']],
  activity: [['date', 'تاریخ'], ['action', 'عملیات'], ['entity', 'بخش'], ['description', 'شرح'], ['status', 'وضعیت']],
  errors: [['date', 'تاریخ'], ['error_type', 'بخش / فیلد'], ['error_message', 'شرح خطا'], ['device', 'دستگاه'], ['app_version', 'نسخه'], ['status', 'وضعیت']],
};

const ALIASES = {
  customerLedger: 'customers',
  debtors: 'customers',
  branchLedger: 'branches',
  cashFlow: 'transactions',
};

export const columnsFor = (moduleId) => COLUMNS[ALIASES[moduleId] || moduleId] || null;

const escapeCell = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';

export function buildCsv(moduleId, rows) {
  const columns = columnsFor(moduleId);
  if (!columns) return '';
  const header = columns.map(([, label]) => escapeCell(label)).join(',');
  const body = rows.map((row) => columns.map(([key]) => escapeCell(row[key])).join(','));
  return [header, ...body].join('\n');
}

export function downloadCsv(moduleId, label, rows) {
  const csv = buildCsv(moduleId, rows);
  if (!csv) return false;
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (moduleId || 'report') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
}

// سند اصلی هر سطر دفتر کل/گزارش: بر اساس شمارهٔ سند
const SOURCE_BY_NUMBER = ['journal', 'remittance', 'exchange', 'expenses', 'transactions'];

export function findSourceDocument(data, row) {
  // اول با شناسهٔ سند (دقیق‌ترین پیوند)، بعد با شمارهٔ سند
  if (row?.documentId) {
    for (const moduleId of SOURCE_BY_NUMBER) {
      const record = (data?.[moduleId] || []).find(
        (item) => String(item.id) === String(row.documentId) || String(item.documentId) === String(row.documentId)
      );
      if (record) return { moduleId, record };
    }
  }
  const number = row?.number;
  if (!number) return null;
  for (const moduleId of SOURCE_BY_NUMBER) {
    const record = (data?.[moduleId] || []).find((item) => item.number === number);
    if (record) return { moduleId, record };
  }
  return null;
}