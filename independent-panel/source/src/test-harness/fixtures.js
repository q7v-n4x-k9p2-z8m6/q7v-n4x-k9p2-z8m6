// test-harness/fixtures.js — دادهٔ سناریوسازی‌شده در حافظه
// هیچ رکوردی از IndexedDB، localStorage، پیش‌نمایش یا تولید خوانده نمی‌شود؛
// همهٔ شناسه‌ها دستی و همهٔ مبالغ ساختگی‌اند.
import { totalsOf, withRunning, sideOf } from './ledgerMath';

const RAW_LEDGERS = [
  {
    id: 'lg-k1',
    partyType: 'cash',
    partyId: 'k1',
    name: 'صندوق اصلی افغانی',
    currency: 'AFN',
    lines: [
      { id: 'lk1-1', date: '2026-11-13', number: 'DV-00003', description: 'دخل صندوق — کمیشن حواله', debit: 18000, credit: 0, sourceModule: 'transactions', sourceId: 't3' },
      { id: 'lk1-2', date: '2026-11-14', number: 'DV-00004', description: 'خرج صندوق — مصارف اداری دفتر', debit: 0, credit: 7500, sourceModule: 'transactions', sourceId: 't4' },
      { id: 'lk1-3', date: '2026-11-14', number: 'EX-00001', description: 'مصارف اداری دفتر', debit: 0, credit: 7500, sourceModule: 'expenses', sourceId: 'e1' },
      { id: 'lk1-4', date: '2026-11-16', number: 'EX-00003', description: 'مصرف سوخت موتر', debit: 0, credit: 2300, sourceModule: 'expenses', sourceId: 'e3' },
    ],
  },
  {
    id: 'lg-c1',
    partyType: 'customer',
    partyId: 'c1',
    name: 'حاجی نظر احمد',
    currency: 'AFN',
    lines: [
      { id: 'lc1-1', date: '2026-11-14', number: 'DV-00004', description: 'خرج صندوق به حساب مشتری', debit: 7500, credit: 0, sourceModule: 'transactions', sourceId: 't4' },
    ],
  },
  {
    id: 'lg-c2',
    partyType: 'customer',
    partyId: 'c2',
    name: 'محمد یوسف',
    currency: 'USD',
    lines: [
      { id: 'lc2-1', date: '2026-11-15', number: 'TR-00001', description: 'حوالهٔ ارسالی به هرات', debit: 1500, credit: 0, sourceModule: 'remittances', sourceId: 'r1' },
      { id: 'lc2-2', date: '2026-11-15', number: 'TR-00001', description: 'کمیشن حوالهٔ ارسالی', debit: 15, credit: 0, sourceModule: 'remittances', sourceId: 'r1' },
    ],
  },
  {
    id: 'lg-c3',
    partyType: 'customer',
    partyId: 'c3',
    name: 'سید کریم',
    currency: 'AFN',
    lines: [
      { id: 'lc3-1', date: '2026-11-16', number: 'TR-00002', description: 'حوالهٔ دریافتی از قندهار', debit: 0, credit: 320000, sourceModule: 'remittances', sourceId: 'r2' },
    ],
  },
  {
    id: 'lg-c4',
    partyType: 'customer',
    partyId: 'c4',
    name: 'شرکت الفتح لمت',
    currency: 'USD',
    lines: [
      { id: 'lc4-1', date: '2026-11-12', number: 'DV-00002', description: 'فروش دالر به شرکت الفتح لمت', debit: 3200, credit: 0, sourceModule: 'transactions', sourceId: 't2' },
    ],
  },
  {
    id: 'lg-b1',
    partyType: 'branch',
    partyId: 'b1',
    name: 'حواله‌خانهٔ هرات',
    currency: 'USD',
    lines: [
      { id: 'lb1-1', date: '2026-11-15', number: 'TR-00001', description: 'تسویهٔ حواله با نمایندگی هرات', debit: 0, credit: 1500, sourceModule: 'remittances', sourceId: 'r1' },
    ],
  },
  {
    id: 'lg-b3',
    partyType: 'branch',
    partyId: 'b3',
    name: 'شبکهٔ نور',
    currency: 'AFN',
    lines: [
      { id: 'lb3-1', date: '2026-11-16', number: 'TR-00002', description: 'حوالهٔ دریافتی از شبکهٔ نور', debit: 320000, credit: 0, sourceModule: 'remittances', sourceId: 'r2' },
    ],
  },
];

const LEDGERS = RAW_LEDGERS.map((ledger) => {
  const lines = withRunning(ledger.lines);
  const totals = totalsOf(lines);
  return { ...ledger, lines, totals, side: sideOf(totals.balance) };
});

const ledgerIndex = new Map(LEDGERS.map((ledger) => [`${ledger.partyType}:${ledger.partyId}`, ledger]));
export const ledgerByParty = (partyType, partyId) => ledgerIndex.get(`${partyType}:${partyId}`) || null;
export const ledgerById = (id) => LEDGERS.find((ledger) => ledger.id === id) || null;

const withLedger = (partyType, rows) =>
  rows.map((row) => {
    const ledger = ledgerByParty(partyType, row.id);
    return {
      ...row,
      ledgerId: ledger ? ledger.id : null,
      balance: ledger ? ledger.totals.balance : 0,
      balanceSide: ledger ? ledger.side : 'تسویه',
      ledgerCurrency: ledger ? ledger.currency : row.currency,
    };
  });

const CUSTOMERS = withLedger('customer', [
  { id: 'c1', name: 'حاجی نظر احمد', code: 'CU-0001', phone: '0700000001', city: 'کابل', kind: 'دایمی', currency: 'AFN', opening: 0, status: 'فعال' },
  { id: 'c2', name: 'محمد یوسف', code: 'CU-0002', phone: '0700000003', city: 'هرات', kind: 'دایمی', currency: 'USD', opening: 0, status: 'فعال' },
  { id: 'c3', name: 'سید کریم', code: 'CU-0003', phone: '0700000006', city: 'کابل', kind: 'دایمی', currency: 'AFN', opening: 0, status: 'فعال' },
  { id: 'c4', name: 'شرکت الفتح لمت', code: 'CU-0004', phone: '0700000002', city: 'مزار', kind: 'دایمی', currency: 'USD', opening: 0, status: 'فعال' },
  { id: 'c5', name: 'عبدالرحیم', code: 'CU-0005', phone: '0700000004', city: 'قندهار', kind: 'موقت', currency: 'AFN', opening: 0, status: 'غیرفعال' },
]);

const BRANCHES = withLedger('branch', [
  { id: 'b1', name: 'حواله‌خانهٔ هرات', code: 'BR-01', city: 'هرات', phone: '0799000001', status: 'فعال' },
  { id: 'b2', name: 'حواله‌خانهٔ قندهار', code: 'BR-02', city: 'قندهار', phone: '0799000002', status: 'فعال' },
  { id: 'b3', name: 'شبکهٔ نور', code: 'BR-03', city: 'کابل', phone: '0799000003', status: 'فعال' },
]);

const CASH = withLedger('cash', [
  { id: 'k1', name: 'صندوق اصلی افغانی', currency: 'AFN', opening: 1500000, status: 'فعال' },
  { id: 'k2', name: 'صندوق دالر', currency: 'USD', opening: 25000, status: 'فعال' },
  { id: 'k3', name: 'صندوق یورو', currency: 'EUR', opening: 8000, status: 'فعال' },
]);

const BANKS = [
  { id: 'n1', name: 'عزیزی بانک', account: '1002345', bank_name: 'عزیزی بانک', currency: 'AFN', opening: 850000, holder: 'حساب صرافی نمایشی', status: 'فعال' },
  { id: 'n2', name: 'ملی بانک', account: '7781002', bank_name: 'ملی بانک', currency: 'USD', opening: 12000, holder: 'حساب صرافی نمایشی', status: 'فعال' },
  { id: 'n3', name: 'پشتنی بانک', account: '2001111', bank_name: 'پشتنی بانک', currency: 'AFN', opening: 420000, holder: 'حساب صرافی نمایشی', status: 'فعال' },
];

const TRANSACTIONS = [
  { id: 't1', number: 'DV-00001', date: '2026-11-12', kind: 'معاملهٔ اسعار', description: 'خرید دالر از حاجی نظر احمد', party: 'حاجی نظر احمد', partyType: 'مشتری', customerId: 'c1', currency: 'USD', amount: 5000, direction: 'دریافت' },
  { id: 't2', number: 'DV-00002', date: '2026-11-12', kind: 'معاملهٔ اسعار', description: 'فروش دالر به شرکت الفتح لمت', party: 'شرکت الفتح لمت', partyType: 'مشتری', customerId: 'c4', currency: 'USD', amount: 3200, direction: 'پرداخت' },
  { id: 't3', number: 'DV-00003', date: '2026-11-13', kind: 'دخل صندوق', description: 'کمیشن حوالهٔ دریافتی', party: 'صندوق اصلی افغانی', partyType: 'صندوق', cashId: 'k1', currency: 'AFN', amount: 18000, direction: 'دریافت' },
  { id: 't4', number: 'DV-00004', date: '2026-11-14', kind: 'خرج صندوق', description: 'مصارف اداری دفتر', party: 'صندوق اصلی افغانی', partyType: 'صندوق', cashId: 'k1', currency: 'AFN', amount: 7500, direction: 'پرداخت' },
  { id: 't5', number: 'DV-00005', date: '2026-11-15', kind: 'حواله', description: 'ثبت حوالهٔ ارسالی TR-00001', party: 'محمد یوسف', partyType: 'مشتری', customerId: 'c2', currency: 'USD', amount: 1500, direction: 'پرداخت' },
  { id: 't6', number: 'DV-00006', date: '2026-11-16', kind: 'واریز بانک', description: 'واریز نقدی به عزیزی بانک', party: 'عزیزی بانک', partyType: 'بانک', bankId: 'n1', currency: 'AFN', amount: 250000, direction: 'دریافت' },
];

const REMITTANCES = [
  { id: 'r1', number: 'TR-00001', date: '2026-11-15', direction: 'ارسالی', sender: 'محمد یوسف', senderPhone: '0700000003', receiver: 'عبدالله', receiverPhone: '0788000001', customerId: 'c2', branchId: 'b1', currency: 'USD', amount: 1500, fee: 15, status: 'اجرا شده', note: 'تسویه در شعبهٔ هرات' },
  { id: 'r2', number: 'TR-00002', date: '2026-11-16', direction: 'دریافتی', sender: 'شبکهٔ نور', senderPhone: '0799000003', receiver: 'سید کریم', receiverPhone: '0700000006', customerId: 'c3', branchId: 'b3', currency: 'AFN', amount: 320000, fee: 0, status: 'در انتظار', note: 'در انتظار تأیید نمایندگی' },
  { id: 'r3', number: 'TR-00003', date: '2026-11-17', direction: 'ارسالی', sender: 'عبدالرحیم', senderPhone: '0700000004', receiver: 'نجیب‌الله', receiverPhone: '0788000007', customerId: 'c5', branchId: 'b2', currency: 'AFN', amount: 180000, fee: 900, status: 'اجرا شده', note: 'پرداخت نقدی در قندهار' },
];

const EXPENSES = [
  { id: 'e1', number: 'EX-00001', date: '2026-11-13', title: 'مصارف اداری دفتر', account: '5010 — مصارف عملیاتی', payer: 'صندوق اصلی افغانی', payerType: 'صندوق', cashId: 'k1', currency: 'AFN', amount: 7500, status: 'قطعی' },
  { id: 'e2', number: 'EX-00002', date: '2026-11-14', title: 'کرایهٔ دفتر', account: '5010 — مصارف عملیاتی', payer: 'عزیزی بانک', payerType: 'بانک', bankId: 'n1', currency: 'AFN', amount: 12000, status: 'قطعی' },
  { id: 'e3', number: 'EX-00003', date: '2026-11-16', title: 'مصرف سوخت موتر', account: '5010 — مصارف عملیاتی', payer: 'صندوق اصلی افغانی', payerType: 'صندوق', cashId: 'k1', currency: 'AFN', amount: 2300, status: 'قطعی' },
];

const DEBTORS = CUSTOMERS.filter((row) => Math.abs(row.balance) > 0.005).map((row) => ({
  id: `db-${row.id}`,
  customerId: row.id,
  name: row.name,
  code: row.code,
  phone: row.phone,
  currency: row.ledgerCurrency,
  balance: row.balance,
  side: row.balanceSide,
  ledgerId: row.ledgerId,
}));

export const FIXTURES = {
  customers: CUSTOMERS,
  branches: BRANCHES,
  cash: CASH,
  banks: BANKS,
  debtors: DEBTORS,
  transactions: TRANSACTIONS,
  remittances: REMITTANCES,
  expenses: EXPENSES,
  ledgers: LEDGERS,
};

export const SCENARIO_NOTES = {
  customers: 'مشتریان با ماندهٔ مشتق از دفتر حساب',
  branches: 'نمایندگی‌ها با دفتر حساب جداگانه',
  cash: 'صندوق‌ها با گردش پیوندخورده به تراکنش و مصرف',
  banks: 'حساب‌های بانکی و ماندهٔ افتتاحیه',
  debtors: 'بدهکاران و بستانکاران مشتق از دفتر حساب',
  transactions: 'تراکنش‌ها با پیوند به مشتری، صندوق و بانک',
  remittances: 'حواله‌ها با پیوند به مشتری و نمایندگی',
  expenses: 'مصارف با پیوند به صندوق یا بانک پرداخت‌کننده',
  ledgers: 'دفتر حساب مشتری، نمایندگی و صندوق با گردش تجمعی',
};