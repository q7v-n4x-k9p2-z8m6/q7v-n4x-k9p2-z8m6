// src/core/registry/schemas.js — تعریف واحد فیلدهای فرم‌های حساب صراف
// این جدول از Version21Workspace منتقل شده و تنها منبع فیلدها برای هر دو چیدمان (لپ‌تاپ و موبایل) است.
// ساختار هر فیلد: [کلید, برچسب, نوع, گزینه‌ها?] — هیچ فیلدی حذف یا ساده‌سازی نشده است.

export const CURRENCIES = ['AFN', 'USD', 'EUR', 'IRR', 'TRY', 'PKR', 'AED', 'SAR', 'GBP', 'CNY'];

export const SCHEMAS = {
  transactions: { title: 'گردش حساب', fields: [['date', 'تاریخ', 'date'], ['type', 'نوع عملیات', 'text'], ['partyType', 'نوع طرف حساب', 'select', ['customer', 'branch', 'other']], ['party', 'طرف حساب', 'text'], ['currency', 'ارز', 'select', CURRENCIES], ['amount', 'مبلغ (+ دریافت / - پرداخت)', 'number'], ['description', 'شرح', 'text']] },
  customers: { title: 'مشتری', fields: [['code', 'کد مشتری', 'text'], ['name', 'نام مشتری', 'text'], ['kind', 'نوع حساب', 'select', ['دائمی', 'موقتی']], ['phone', 'شماره تماس', 'text'], ['address', 'آدرس', 'text'], ['currency', 'ارز اصلی', 'select', CURRENCIES], ['opening', 'مانده افتتاحیه', 'number'], ['status', 'وضعیت', 'select', ['فعال', 'غیرفعال', 'قفل']]] },
  branches: { title: 'نمایندگی', fields: [['code', 'کد نمایندگی', 'text'], ['name', 'نام نمایندگی', 'text'], ['city', 'موقعیت', 'text'], ['phone', 'شماره تماس', 'text'], ['status', 'وضعیت', 'select', ['فعال', 'غیرفعال']]] },
  cash: { title: 'صندوق', fields: [['name', 'نام صندوق', 'text'], ['currency', 'ارز', 'select', CURRENCIES], ['opening', 'مانده افتتاحیه', 'number'], ['status', 'وضعیت', 'select', ['فعال', 'غیرفعال']]] },
  banks: { title: 'حساب بانکی / چک', fields: [['name', 'نام بانک یا حساب', 'text'], ['account', 'شماره حساب', 'text'], ['currency', 'ارز', 'select', CURRENCIES], ['opening', 'مانده افتتاحیه', 'number'], ['status', 'وضعیت', 'select', ['فعال', 'غیرفعال']], ['description', 'توضیحات', 'text']] },
  currencies: { title: 'ارز', fields: [['code', 'کد ارز', 'text'], ['name', 'نام ارز', 'text'], ['symbol', 'نماد', 'text'], ['rate', 'نرخ مقابل ارز پایه', 'number'], ['active', 'وضعیت', 'select', ['فعال', 'غیرفعال']]] },
  accounts: { title: 'حساب کل', fields: [['code', 'کد حساب', 'text'], ['name', 'نام حساب', 'text'], ['accountType', 'نوع حساب', 'select', [{ value: 'asset', label: 'دارایی' }, { value: 'liability', label: 'بدهی' }, { value: 'equity', label: 'سرمایه' }, { value: 'revenue', label: 'درآمد' }, { value: 'expense', label: 'مصرف' }]], ['nature', 'ماهیت', 'select', ['بدهکار', 'بستانکار']], ['parentId', 'حساب مادر', 'select', []], ['currency', 'ارز اختصاصی (اختیاری)', 'select', ['', 'AFN', 'USD', 'EUR', 'IRR', 'TRY', 'PKR', 'AED', 'SAR', 'GBP', 'CNY']], ['status', 'وضعیت', 'select', ['فعال', 'غیرفعال']], ['description', 'شرح', 'text']] },
  expenses: { title: 'مصرف', fields: [['date', 'تاریخ', 'date'], ['title', 'شرح مصرف', 'text'], ['expenseAccount', 'حساب مصرف', 'select', []], ['currency', 'ارز', 'select', CURRENCIES], ['amount', 'مبلغ', 'number'], ['payerType', 'پرداخت از', 'select', ['cash', 'bank']], ['cash', 'صندوق', 'text'], ['bank', 'حساب بانکی', 'text'], ['note', 'یادداشت', 'text']] },
  remittance: { title: 'حواله', fields: [['date', 'تاریخ', 'date'], ['direction', 'نوع حواله', 'select', ['ارسالی', 'دریافتی']], ['sender', 'فرستنده', 'text'], ['receiver', 'گیرنده', 'text'], ['branch', 'نمایندگی', 'text'], ['currency', 'ارز', 'select', CURRENCIES], ['amount', 'مبلغ', 'number'], ['fee', 'کمیشن', 'number'], ['settlement', 'روش تسویه', 'select', ['suspense', 'instant']], ['settleType', 'حساب تسویه', 'select', ['cash', 'bank']], ['cash', 'صندوق', 'text'], ['bank', 'حساب بانکی', 'text'], ['note', 'یادداشت', 'text']] },
  exchange: { title: 'معامله اسعار', fields: [['date', 'تاریخ', 'date'], ['kind', 'نوع عملیات', 'select', ['خرید', 'فروش', 'تبدیل']], ['party', 'طرف حساب', 'text'], ['foreignCurrency', 'ارز اول', 'select', CURRENCIES], ['foreignAmount', 'مبلغ ارز اول', 'number'], ['baseCurrency', 'ارز دوم', 'select', CURRENCIES], ['baseAmount', 'مبلغ ارز دوم', 'number'], ['foreignCash', 'صندوق ارز اول', 'text'], ['baseCash', 'صندوق ارز دوم', 'text'], ['fee', 'کمیشن', 'number'], ['note', 'یادداشت', 'text']] },
  journal: { title: 'سند روزنامچه', fields: [['date', 'تاریخ', 'date'], ['description', 'شرح سند', 'text'], ['currency', 'ارز', 'select', CURRENCIES], ['journalMode', 'حالت سند', 'select', ['simple', 'multi']]] },
  settlement: { title: 'انتقال بین حساب‌ها', fields: [['date', 'تاریخ', 'date'], ['currency', 'ارز', 'select', CURRENCIES], ['fromKind', 'از (صندوق/بانک)', 'select', ['cash', 'bank']], ['fromAccount', 'حساب مبدأ', 'text'], ['toKind', 'به (صندوق/بانک)', 'select', ['cash', 'bank']], ['toAccount', 'حساب مقصد', 'text'], ['amount', 'مبلغ انتقال', 'number'], ['settlementId', 'شناسهٔ تسویهٔ مشترک', 'text'], ['note', 'یادداشت', 'text']] },
};

// فرم‌های مالی که بدنهٔ اختصاصی دارند (گردش صندوق نیز در لایهٔ دامنه تعریف شده است)
export const POSTING_FORMS = ['remittance', 'expenses', 'exchange', 'journal', 'settlement'];

// فرم‌های تعریف (Master) که چیدمان موبایل مستقیماً از همین جدول ساخته می‌شود
export const MASTER_FORM_MODULES = ['customers', 'branches', 'cash', 'banks', 'currencies', 'accounts'];

export const schemaFor = (moduleId) => SCHEMAS[moduleId] || null;