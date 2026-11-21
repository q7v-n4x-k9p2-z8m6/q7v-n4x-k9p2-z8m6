// src/demo/seed.js — دادهٔ آزمایشی محلی حساب صراف (فقط حافظه)
// این داده در زمان اجرا داخل درگاه حافظه‌ای بارگذاری می‌شود و هیچ‌جا ذخیره نمی‌گردد.
import { daysAgo } from '@/core/domain/dates';

// مجوزهای نمایشی کارمند — همان شکل جدول user_permissions تا قاعدهٔ بررسی مجوز یکی بماند
export const DEMO_EMPLOYEE_PERMISSIONS = [
  { section: 'dashboard', can_view: true, can_create: false, can_edit: false, can_delete: false },
  { section: 'customers', can_view: true, can_create: true, can_edit: true, can_delete: false },
  { section: 'accounts_receivable', can_view: true, can_create: false, can_edit: false, can_delete: false },
  { section: 'cash', can_view: true, can_create: true, can_edit: true, can_delete: false },
  { section: 'bank', can_view: false, can_create: false, can_edit: false, can_delete: false },
  { section: 'trade', can_view: true, can_create: true, can_edit: false, can_delete: false },
  { section: 'transfers', can_view: true, can_create: true, can_edit: false, can_delete: false },
  { section: 'reports', can_view: true, can_create: false, can_edit: false, can_delete: false },
  { section: 'currencies', can_view: true, can_create: false, can_edit: false, can_delete: false },
  { section: 'online_products', can_view: true, can_create: true, can_edit: false, can_delete: false },
  { section: 'assistant', can_view: true, can_create: true, can_edit: true, can_delete: false },
  { section: 'settings', can_view: true, can_create: false, can_edit: false, can_delete: false },
];

export function createDemoData() {
  const base = {
    customers: [
      { id: 'c1', code: 'C-1001', name: 'حاجی نصیر احمد', kind: 'دائمی', phone: '0700 111 222', address: 'کابل، سرای شهزاده', currency: 'AFN', opening: 125000, status: 'فعال' },
      { id: 'c2', code: 'C-1002', name: 'شرکت الفتح', kind: 'دائمی', phone: '0788 334 455', address: 'هرات، جاده مخابرات', currency: 'USD', opening: 4800, status: 'فعال' },
      { id: 'c3', code: 'C-1003', name: 'محمد یوسف', kind: 'موقتی', phone: '0776 909 112', address: 'مزار شریف', currency: 'AFN', opening: -32000, status: 'فعال' },
      { id: 'c4', code: 'C-1004', name: 'عبدالرحیم صافی', kind: 'دائمی', phone: '0744 556 889', address: 'کابل، پل سرخ', currency: 'AFN', opening: 76500, status: 'فعال' },
      { id: 'c5', code: 'C-1005', name: 'حرم سرای تجارت', kind: 'دائمی', phone: '0790 227 331', address: 'جلال آباد', currency: 'USD', opening: -1200, status: 'فعال' },
      { id: 'c6', code: 'C-1006', name: 'بی‌بی حوا', kind: 'موقتی', phone: '0700 884 553', address: 'کابل، خیرخانه', currency: 'AFN', opening: 0, status: 'غیرفعال' },
    ],
    branches: [
      { id: 'b1', code: 'B-01', name: 'نمایندگی هرات', city: 'هرات', phone: '040 222 3344', status: 'فعال' },
      { id: 'b2', code: 'B-02', name: 'نمایندگی مزار', city: 'مزار شریف', phone: '050 221 6688', status: 'فعال' },
      { id: 'b3', code: 'B-03', name: 'نمایندگی جلال آباد', city: 'جلال آباد', phone: '060 224 9911', status: 'فعال' },
    ],
    cash: [
      { id: 's1', name: 'صندوق افغانی مرکزی', currency: 'AFN', opening: 850000, status: 'فعال' },
      { id: 's2', name: 'صندوق دالر', currency: 'USD', opening: 24000, status: 'فعال' },
      { id: 's3', name: 'صندوق یورو', currency: 'EUR', opening: 6500, status: 'فعال' },
      { id: 's4', name: 'صندوق تومان', currency: 'IRR', opening: 120000000, status: 'فعال' },
      { id: 's5', name: 'صندوق کلداری', currency: 'AFN', opening: 150000, status: 'غیرفعال' },
      { id: 's6', name: 'صندوق کلدار', currency: 'PKR', opening: 0, status: 'فعال' },
    ],
    banks: [
      { id: 'k1', name: 'عزیزی بانک', account: '0012-4455-7788', currency: 'AFN', opening: 320000, status: 'فعال', description: 'حساب جاری صرافی' },
      { id: 'k2', name: 'ملی بانک', account: '7788-1122-3344', currency: 'USD', opening: 18500, status: 'فعال', description: 'حساب دالری' },
      { id: 'k3', name: 'الکسیس بانک', account: '9900-5566-2211', currency: 'EUR', opening: 3200, status: 'فعال', description: '' },
      { id: 'k4', name: 'بیمه افغان', account: '4455-8899-0011', currency: 'AFN', opening: 0, status: 'غیرفعال', description: 'حساب بسته‌شده' },
    ],
    currencies: [
      { id: 'r1', code: 'USD', name: 'دالر امریکایی', symbol: '$', rate: 71.2, active: 'فعال' },
      { id: 'r2', code: 'EUR', name: 'یورو', symbol: '€', rate: 77.4, active: 'فعال' },
      { id: 'r3', code: 'IRR', name: 'تومان ایرانی', symbol: '﷼', rate: 0.0016, active: 'فعال' },
      { id: 'r4', code: 'PKR', name: 'کلدار پاکستانی', symbol: '₨', rate: 0.25, active: 'فعال' },
      { id: 'r5', code: 'AED', name: 'درهم امارات', symbol: 'د.إ', rate: 19.4, active: 'فعال' },
      { id: 'r6', code: 'TRY', name: 'لیر ترکی', symbol: '₺', rate: 2.1, active: 'غیرفعال' },
    ],
    accounts: [
      { id: 'a1', code: '1000', name: 'دارایی‌های جاری', accountType: 'asset', nature: 'بدهکار', parentId: '', currency: '', status: 'فعال', description: 'حساب کل' },
      { id: 'a2', code: '1010', name: 'صندوق‌ها', accountType: 'asset', nature: 'بدهکار', parentId: '1000', currency: '', status: 'فعال', description: 'حساب معین' },
      { id: 'a3', code: '1020', name: 'بانک‌ها', accountType: 'asset', nature: 'بدهکار', parentId: '1000', currency: '', status: 'فعال', description: '' },
      { id: 'a4', code: '1030', name: 'حساب مشتریان', accountType: 'asset', nature: 'بدهکار', parentId: '1000', currency: '', status: 'فعال', description: '' },
      { id: 'a5', code: '2000', name: 'بدهی‌ها', accountType: 'liability', nature: 'بستانکار', parentId: '', currency: '', status: 'فعال', description: '' },
      { id: 'a6', code: '3000', name: 'سرمایه صراف', accountType: 'equity', nature: 'بستانکار', parentId: '', currency: '', status: 'فعال', description: '' },
      { id: 'a7', code: '4000', name: 'درآمد کمیشن', accountType: 'revenue', nature: 'بستانکار', parentId: '', currency: '', status: 'فعال', description: '' },
      { id: 'a8', code: '5000', name: 'مصارف اداری', accountType: 'expense', nature: 'بدهکار', parentId: '', currency: '', status: 'فعال', description: '' },
    ],
    expenses: [
      { id: 'e1', date: daysAgo(0), title: 'کرایه دفتر', expenseAccount: '5000 — مصارف اداری', currency: 'AFN', amount: 24000, payerType: 'cash', cash: 'صندوق افغانی مرکزی', bank: '', note: 'کرایه ماه جاری' },
      { id: 'e2', date: daysAgo(1), title: 'برق و آب', expenseAccount: '5000 — مصارف اداری', currency: 'AFN', amount: 3800, payerType: 'cash', cash: 'صندوق افغانی مرکزی', bank: '', note: '' },
      { id: 'e3', date: daysAgo(3), title: 'قرطاسیه', expenseAccount: '5000 — مصارف اداری', currency: 'AFN', amount: 1650, payerType: 'cash', cash: 'صندوق کلداری', bank: '', note: 'خرید لوازم' },
      { id: 'e4', date: daysAgo(6), title: 'کمک تبلیغاتی', expenseAccount: '5000 — مصارف اداری', currency: 'USD', amount: 120, payerType: 'bank', cash: '', bank: 'ملی بانک', note: '' },
    ],
    remittance: [
      { id: 't1', date: daysAgo(0), number: 'TR-4021', direction: 'ارسالی', sender: 'حاجی نصیر احمد', receiver: 'عبدالله', currency: 'USD', amount: 4200, fee: 25, branch: 'نمایندگی هرات', settlement: 'instant', settleType: 'cash', cash: 'صندوق دالر', bank: '', note: 'حواله فوری' },
      { id: 't2', date: daysAgo(1), number: 'TR-4022', direction: 'دریافتی', sender: 'شرکت الفتح', receiver: 'محمد یوسف', currency: 'AFN', amount: 180000, fee: 900, branch: 'نمایندگی مزار', settlement: 'suspense', settleType: 'cash', cash: '', bank: '', note: 'در انتظار تسویه' },
      { id: 't3', date: daysAgo(2), number: 'TR-4023', direction: 'ارسالی', sender: 'عبدالرحیم صافی', receiver: 'کریم', currency: 'USD', amount: 900, fee: 8, branch: '', settlement: 'instant', settleType: 'bank', cash: '', bank: 'ملی بانک', note: '' },
      { id: 't4', date: daysAgo(4), number: 'TR-4024', direction: 'دریافتی', sender: 'حرم سرای تجارت', receiver: 'اداره گمرک', currency: 'EUR', amount: 1500, fee: 12, branch: 'نمایندگی جلال آباد', settlement: 'suspense', settleType: 'cash', cash: '', bank: '', note: '' },
    ],
    exchange: [
      { id: 'x1', date: daysAgo(0), kind: 'خرید', party: 'حاجی نصیر احمد', foreignCurrency: 'USD', foreignAmount: 5000, baseCurrency: 'AFN', baseAmount: 354500, foreignCash: 'صندوق دالر', baseCash: 'صندوق افغانی مرکزی', fee: 0, note: '' },
      { id: 'x2', date: daysAgo(1), kind: 'فروش', party: 'شرکت الفتح', foreignCurrency: 'EUR', foreignAmount: 1200, baseCurrency: 'AFN', baseAmount: 92880, foreignCash: 'صندوق یورو', baseCash: 'صندوق افغانی مرکزی', fee: 450, note: 'کمیشن معامله' },
      { id: 'x3', date: daysAgo(2), kind: 'تبدیل', party: '', foreignCurrency: 'USD', foreignAmount: 2000, baseCurrency: 'IRR', baseAmount: 89000000, foreignCash: 'صندوق دالر', baseCash: 'صندوق تومان', fee: 0, note: '' },
      { id: 'x4', date: daysAgo(5), kind: 'خرید', party: 'محمد یوسف', foreignCurrency: 'PKR', foreignAmount: 150000, baseCurrency: 'AFN', baseAmount: 37500, foreignCash: 'صندوق کلدار', baseCash: 'صندوق افغانی مرکزی', fee: 0, note: '' },
    ],
    journal: [
      { id: 'j1', date: daysAgo(0), number: 'JE-1101', description: 'ثبت کرایه دفتر', currency: 'AFN', journalMode: 'simple', rows: [{ account: '5000 — مصارف اداری', debit: 24000, credit: '' }, { account: '1010 — صندوق‌ها', debit: '', credit: 24000 }], debitTotal: 24000, creditTotal: 24000, status: 'قطعی' },
      { id: 'j2', date: daysAgo(1), number: 'JE-1102', description: 'واریز به بانک', currency: 'AFN', journalMode: 'simple', rows: [{ account: '1020 — بانک‌ها', debit: 120000, credit: '' }, { account: '1010 — صندوق‌ها', debit: '', credit: 120000 }], debitTotal: 120000, creditTotal: 120000, status: 'قطعی' },
      { id: 'j3', date: daysAgo(3), number: 'JE-1103', description: 'افتتاحیه سرمایه', currency: 'AFN', journalMode: 'multi', rows: [{ account: '1010 — صندوق‌ها', debit: 500000, credit: '' }, { account: '1020 — بانک‌ها', debit: 200000, credit: '' }, { account: '3000 — سرمایه صراف', debit: '', credit: 700000 }], debitTotal: 700000, creditTotal: 700000, status: 'قطعی' },
    ],
    // دفتر کل، گزارش عملیات و مفاد و زیان در درگاه از خود اسناد ساخته می‌شوند
    transactions: [
      { id: 'tx1', date: daysAgo(0), type: 'دخل صندوق', partyType: 'customer', party: 'حاجی نصیر احمد', currency: 'AFN', amount: 42000, cash: 'صندوق افغانی مرکزی', description: 'دریافت نقدی' },
      { id: 'tx3', date: daysAgo(1), type: 'دخل صندوق', partyType: 'customer', party: 'شرکت الفتح', currency: 'USD', amount: 4800, cash: 'صندوق دالر', description: 'واریز مشتری' },
      { id: 'tx4', date: daysAgo(2), type: 'خرج صندوق', partyType: 'branch', party: 'نمایندگی هرات', currency: 'USD', amount: -900, cash: 'صندوق دالر', description: 'ارسال حواله' },
      { id: 'tx5', date: daysAgo(3), type: 'دخل صندوق', partyType: 'other', party: 'کمیشن معامله', currency: 'AFN', amount: 45500, cash: 'صندوق افغانی مرکزی', description: 'کمیشن' },
      { id: 'tx6', date: daysAgo(4), type: 'دخل صندوق', partyType: 'customer', party: 'عبدالرحیم صافی', currency: 'AFN', amount: 96000, cash: 'صندوق افغانی مرکزی', description: '' },
      { id: 'tx7', date: daysAgo(5), type: 'خرج صندوق', partyType: 'customer', party: 'محمد یوسف', currency: 'AFN', amount: -32000, cash: 'صندوق افغانی مرکزی', description: 'برداشت' },
      { id: 'tx8', date: daysAgo(7), type: 'دخل صندوق', partyType: 'branch', party: 'نمایندگی مزار', currency: 'AFN', amount: 180000, cash: 'صندوق کلداری', description: '' },
    ],
    activity: [
      { id: 'ag1', date: daysAgo(0), action: 'create', entity: 'حواله', description: 'ثبت حواله TR-4021 توسط صراف', status: 'موفق' },
      { id: 'ag2', date: daysAgo(0), action: 'update', entity: 'مشتری', description: 'ویرایش مشتری حاجی نصیر احمد', status: 'موفق' },
      { id: 'ag3', date: daysAgo(1), action: 'create', entity: 'روزنامچه', description: 'ثبت سند JE-1102', status: 'موفق' },
      { id: 'ag4', date: daysAgo(2), action: 'reverse', entity: 'مصرف', description: 'ابطال سند مصرف قدیمی', status: 'موفق' },
      { id: 'ag5', date: daysAgo(3), action: 'settings', entity: 'تنظیمات', description: 'تغییر تنظیمات نمایشی', status: 'موفق' },
      { id: 'ag6', date: daysAgo(6), action: 'login', entity: 'احراز هویت', description: 'ورود کارمند به میز کار', status: 'موفق' },
    ],
    errors: [
      { id: 'er1', date: daysAgo(1), error_type: 'فرم مشتری', error_message: 'شماره تماس نامعتبر وارد شد', device: 'Android', app_version: '21.4', status: 'بررسی‌شده' },
      { id: 'er2', date: daysAgo(2), error_type: 'فرم حواله', error_message: 'مبلغ حواله خالی بود', device: 'iOS', app_version: '21.3', status: 'باز' },
      { id: 'er3', date: daysAgo(4), error_type: 'فرم صندوق', error_message: 'ارز صندوق انتخاب نشده بود', device: 'Android', app_version: '21.3', status: 'باز' },
    ],
    rates: [
      { id: 'ra1', code: 'USD', name: 'دالر امریکایی', buy: 70.8, sell: 71.4 },
      { id: 'ra2', code: 'EUR', name: 'یورو', buy: 76.9, sell: 77.8 },
      { id: 'ra3', code: 'IRR', name: 'تومان ایرانی', buy: 0.00155, sell: 0.00165 },
      { id: 'ra4', code: 'PKR', name: 'کلدار پاکستانی', buy: 0.248, sell: 0.252 },
      { id: 'ra5', code: 'AED', name: 'درهم امارات', buy: 19.2, sell: 19.6 },
      { id: 'ra6', code: 'TRY', name: 'لیر ترکی', buy: 2.05, sell: 2.15 },
    ],
    chatGroups: [
      {
        id: 'g1', title: 'گروه صرافان کابل', members: 24,
        messages: [
          { id: 'm1', author: 'صراف احمد', text: 'نرخ دالر امروز ۷۱٫۴۰ است.', time: '۰۹:۱۲' },
          { id: 'm2', author: 'صراف کریم', text: 'برای حواله هرات آماده‌ام.', time: '۰۹:۲۰' },
        ],
      },
      { id: 'g2', title: 'گروه هماهنگی نمایندگی‌ها', members: 8, messages: [{ id: 'm3', author: 'نمایندگی هرات', text: 'موجودی دالر تمام شده.', time: 'دیروز' }] },
      { id: 'g3', title: 'گفت‌وگوی خصوصی — شرکت الفتح', members: 2, messages: [] },
    ],
    products: [
      { id: 'pd1', name: 'شارژ ۱۰۰ افغانی', category: 'شارژ موبایل', price: 100, currency: 'AFN' },
      { id: 'pd2', name: 'شارژ ۵۰۰ افغانی', category: 'شارژ موبایل', price: 500, currency: 'AFN' },
      { id: 'pd3', name: 'بسته ۵ گیگابایت', category: 'بسته اینترنت', price: 350, currency: 'AFN' },
      { id: 'pd4', name: 'بسته ۲۰ گیگابایت', category: 'بسته اینترنت', price: 950, currency: 'AFN' },
      { id: 'pd5', name: 'UC پابجی ۶۰', category: 'بازی و خدمات', price: 60, currency: 'AFN' },
      { id: 'pd6', name: 'UC پابجی ۳۲۵', category: 'بازی و خدمات', price: 325, currency: 'AFN' },
    ],
    orders: [
      { id: 'or1', name: 'شارژ ۵۰۰ افغانی', at: daysAgo(0), status: 'ثبت نمایشی' },
      { id: 'or2', name: 'بسته ۵ گیگابایت', at: daysAgo(1), status: 'ثبت نمایشی' },
    ],
    settings: { language: 'فارسی', theme: 'روشن', note: 'تنظیمات نمایشی' },
  };

  return base;
}