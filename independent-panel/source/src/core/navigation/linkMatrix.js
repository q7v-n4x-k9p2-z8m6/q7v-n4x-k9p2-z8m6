// src/core/navigation/linkMatrix.js — ماتریس یکتای زنجیرهٔ ناوبری حساب صراف
// هر مسیر یک زنجیرهٔ واقعی است: از یک بخش (fromModule) به رکورد/سند/گردش حساب مرتبط (toModule).
// هر مسیر برای هر دو محیط (پیش‌نمایش میز کار و هارنس آزمایشگاهی) یک سنجهٔ مستقل دارد.
// فقط خواندن است؛ هیچ سندی ساخته، ویرایش یا حذف نمی‌شود.
import { lineAccountLink, documentAccountLinks } from '@/core/navigation/chain';
import { customerStatement, branchStatement, accountStatement } from '@/core/domain/statement';

export const AUDIT_ROLES = [
  { role: 'creator', label: 'سازنده سیستم' },
  { role: 'admin', label: 'مدیر صرافی' },
  { role: 'sarraaf', label: 'صراف' },
  { role: 'employee', label: 'کارمند' },
  { role: 'customer', label: 'مشتری' },
];

export const LINK_ENVIRONMENTS = [
  { id: 'preview', label: 'پیش‌نمایش میز کار' },
  { id: 'harness', label: 'هارنس آزمایشگاهی' },
];

const text = (value) => String(value ?? '').trim();
const list = (value) => (Array.isArray(value) ? value : []);
const same = (a, b) => text(a) !== '' && text(a) === text(b);

// هر ردیف یکی از این سه حالت را دارد:
// linked = مرجع واقعی پیدا شد · missing = مرجع هست ولی مقصدش پیدا نشد · noref = مرجعی ثبت نشده است
export const ROW = { linked: 'linked', missing: 'missing', noref: 'noref' };

export function countRows(outcomes) {
  const counts = { total: 0, linked: 0, missing: 0, noref: 0 };
  list(outcomes).forEach((outcome) => {
    counts.total += 1;
    if (counts[outcome] !== undefined) counts[outcome] += 1;
    else counts.noref += 1;
  });
  return counts;
}

const statementOutcome = (statement) => (list(statement?.rows).length ? ROW.linked : ROW.noref);
const accountsOutcome = (links) => (list(links).length ? ROW.linked : ROW.noref);

// ——— سنجه‌های محیط پیش‌نمایش (میز کار) ———
const rowMatchesAccount = (data, type, id, names = []) => list(data?.transactions).some((line) => {
  if (text(line.accountType).toLowerCase() !== type) return false;
  if (id && same(line.accountId, id)) return true;
  return names.filter(Boolean).some((name) => same(line.account, name) || same(line.party, name));
});

const documentLinks = (data, documentId) => (text(documentId) ? documentAccountLinks(data, documentId) : []);

const documentOutcome = (data, documentId) => {
  if (!text(documentId)) return ROW.noref;
  const exists = list(data?.reports).some((row) => same(row.id, documentId));
  if (!exists) return ROW.missing;
  return accountsOutcome(documentLinks(data, documentId));
};

// ——— سنجه‌های محیط هارنس (دادهٔ ساختگی در حافظه) ———
const refOutcome = (found) => (found ? ROW.linked : ROW.missing);

export const LINK_CHAIN = [
  {
    id: 'customers-statement',
    from: 'مشتریان',
    fromModule: 'customers',
    to: 'دفتر حساب مشتری',
    toModule: 'customerLedger',
    definition: 'هر مشتری به گردش حساب خودش و از آن‌جا به سند و حساب طرف مقابل می‌رسد.',
    preview: (data) => list(data?.customers).map((row) => statementOutcome(customerStatement(data, row))),
    harness: (gateway) => list(gateway.list('customers'))
      .map((row) => (list(gateway.ledgerById(row.ledgerId)?.lines).length ? ROW.linked : ROW.noref)),
  },
  {
    id: 'customers-transactions',
    from: 'مشتریان',
    fromModule: 'customers',
    to: 'تراکنش‌های همان مشتری',
    toModule: 'transactions',
    definition: 'از پروندهٔ مشتری، فهرست تراکنش‌های ثبت‌شده روی شناسهٔ همان حساب.',
    preview: (data) => list(data?.customers)
      .map((row) => (rowMatchesAccount(data, 'customer', row.id) ? ROW.linked : ROW.noref)),
    harness: (gateway) => list(gateway.list('customers'))
      .map((row) => (list(gateway.ledgerById(row.ledgerId)?.lines).length ? ROW.linked : ROW.noref)),
  },
  {
    id: 'customers-remittances',
    from: 'مشتریان',
    fromModule: 'customers',
    to: 'حواله‌های همان مشتری',
    toModule: 'remittance',
    definition: 'از پروندهٔ مشتری به حواله‌هایی که نام همان مشتری را دارند.',
    preview: (data) => list(data?.customers).map((row) => (list(data?.remittance)
      .some((item) => same(item.customer_name, row.name)) ? ROW.linked : ROW.noref)),
    harness: (gateway) => list(gateway.list('customers')).map((row) => (list(gateway.list('remittances'))
      .some((item) => same(item.customerId, row.id)) ? ROW.linked : ROW.noref)),
  },
  {
    id: 'branches-statement',
    from: 'نمایندگی‌ها',
    fromModule: 'branches',
    to: 'دفتر حساب نمایندگی',
    toModule: 'branchLedger',
    definition: 'هر نمایندگی به گردش حساب خودش و حواله‌های مبدأ/مقصد همان نمایندگی.',
    preview: (data) => list(data?.branches).map((row) => statementOutcome(branchStatement(data, row))),
    harness: (gateway) => list(gateway.list('branches'))
      .map((row) => (list(gateway.ledgerById(row.ledgerId)?.lines).length ? ROW.linked : ROW.noref)),
  },
  {
    id: 'cash-statement',
    from: 'صندوق‌ها',
    fromModule: 'cash',
    to: 'دفتر حساب صندوق',
    toModule: 'cash',
    definition: 'هر صندوق به گردش خودش با ماندهٔ تجمعی و اسناد همان صندوق.',
    preview: (data) => list(data?.cash).map((row) => statementOutcome(accountStatement(data, row, 'cash'))),
    harness: (gateway) => list(gateway.list('cash'))
      .map((row) => (list(gateway.ledgerFor('cash', row.id)?.lines).length ? ROW.linked : ROW.noref)),
  },
  {
    id: 'cash-transactions',
    from: 'صندوق‌ها',
    fromModule: 'cash',
    to: 'تراکنش‌ها و مصارف صندوق',
    toModule: 'transactions',
    definition: 'از صندوق به اسناد نقدی و مصارفی که از همان صندوق پرداخت شده‌اند.',
    preview: (data) => list(data?.cash).map((row) => {
      const transactions = rowMatchesAccount(data, 'cash', row.id, [row.name], row.currency);
      const expenses = list(data?.expenses).some((item) => same(item.cash, row.name));
      return transactions || expenses ? ROW.linked : ROW.noref;
    }),
    harness: (gateway) => list(gateway.list('cash')).map((row) => {
      const lines = list(gateway.relatedTransactionsForCash(row.id)).length;
      const expenses = list(gateway.relatedExpensesForCash(row.id)).length;
      return lines || expenses ? ROW.linked : ROW.noref;
    }),
  },
  {
    id: 'banks-statement',
    from: 'بانک‌ها',
    fromModule: 'banks',
    to: 'گردش حساب بانکی',
    toModule: 'banks',
    definition: 'هر حساب بانکی به گردش خودش و اسناد واریز/برداشت همان حساب.',
    preview: (data) => list(data?.banks).map((row) => statementOutcome(accountStatement(data, row, 'bank'))),
    harness: (gateway) => list(gateway.list('banks')).map((row) => {
      const movements = list(gateway.list('transactions')).some((item) => same(item.bankId, row.id));
      const expenses = list(gateway.relatedExpensesForBank(row.id)).length;
      return movements || expenses ? ROW.linked : ROW.noref;
    }),
  },
  {
    id: 'transactions-account',
    from: 'تراکنش‌ها',
    fromModule: 'transactions',
    to: 'حساب واقعی سطر (مشتری/نمایندگی/صندوق/بانک)',
    toModule: 'customerLedger',
    definition: 'هر سطر تراکنش به حساب واقعی خودش باز می‌شود؛ در نبود شناسه، نام حساب ملاک است.',
    preview: (data) => list(data?.transactions).map((row) => {
      const reference = text(row.accountId) || text(row.account) || text(row.party);
      if (!reference) return ROW.noref;
      return lineAccountLink(data, row) ? ROW.linked : ROW.missing;
    }),
    harness: (gateway) => list(gateway.list('transactions')).map((row) => {
      const refs = [
        row.customerId && gateway.get('customers', row.customerId),
        row.cashId && gateway.get('cash', row.cashId),
        row.bankId && gateway.get('banks', row.bankId),
      ].filter(Boolean);
      const hasRef = row.customerId || row.cashId || row.bankId;
      return hasRef ? refOutcome(refs.length) : ROW.noref;
    }),
  },
  {
    id: 'transactions-document-accounts',
    from: 'تراکنش‌ها',
    fromModule: 'transactions',
    to: 'طرف مقابل همان سند',
    toModule: 'ledger',
    definition: 'از هر سطر به همهٔ حساب‌های همان سند (طرف مقابل معامله) و سند مالی آن.',
    preview: (data) => list(data?.transactions).map((row) => {
      if (!text(row.documentId)) return ROW.noref;
      return accountsOutcome(documentLinks(data, row.documentId));
    }),
    harness: (gateway) => list(gateway.list('transactions')).map((row) => {
      const refs = [row.customerId, row.cashId, row.bankId].filter(Boolean);
      return refs.length ? ROW.linked : ROW.noref;
    }),
  },
  {
    id: 'ledger-accounts',
    from: 'دفتر کل',
    fromModule: 'ledger',
    to: 'حساب سطر دفتر',
    toModule: 'customerLedger',
    definition: 'هر سطر دفتر کل با نام حسابش به همان حساب واقعی یا حساب کدینگ وصل است.',
    preview: (data) => list(data?.ledger).map((row) => {
      const reference = text(row.account) || text(row.accountId);
      if (!reference) return ROW.noref;
      return lineAccountLink(data, row) ? ROW.linked : ROW.missing;
    }),
    harness: (gateway) => list(gateway.list('ledgers')).map((ledger) => {
      const document = list(ledger.lines).find((line) => line.sourceModule && line.sourceId);
      if (!document) return ROW.noref;
      return gateway.get(document.sourceModule, document.sourceId) ? ROW.linked : ROW.missing;
    }),
  },
  {
    id: 'documents-accounts',
    from: 'گزارش اسناد',
    fromModule: 'reports',
    to: 'حساب‌های همان سند',
    toModule: 'ledger',
    definition: 'هر سند به همهٔ حساب‌هایی که در سطرهایش آمده‌اند و به رکورد عملیاتی خودش وصل است.',
    preview: (data) => list(data?.reports).map((row) => documentOutcome(data, row.id)),
    harness: (gateway) => list(gateway.list('transactions')).map((row) => {
      const refs = [row.customerId, row.cashId, row.bankId].filter(Boolean);
      return refs.length ? ROW.linked : ROW.noref;
    }),
  },
  {
    id: 'journal-accounts',
    from: 'دفتر روزنامه',
    fromModule: 'journal',
    to: 'حساب‌های سند روزنامچه',
    toModule: 'accounts',
    definition: 'هر سند روزنامچه به حساب کدینگ بدهکار و بستانکار خودش می‌رسد.',
    preview: (data) => list(data?.journal).map((row) => documentOutcome(data, row.documentId)),
    harness: (gateway) => list(gateway.list('ledgers')).map((ledger) => {
      const document = list(ledger.lines).find((line) => line.sourceModule && line.sourceId);
      if (!document) return ROW.noref;
      return gateway.get(document.sourceModule, document.sourceId) ? ROW.linked : ROW.missing;
    }),
  },
  {
    id: 'expenses-accounts',
    from: 'مصارف',
    fromModule: 'expenses',
    to: 'صندوق/بانک پرداخت‌کننده و حساب مصرف',
    toModule: 'cash',
    definition: 'هر مصرف به صندوق یا بانک پرداخت‌کننده و حساب مصرف همان سند وصل است.',
    preview: (data) => list(data?.expenses).map((row) => {
      if (!text(row.documentId)) {
        return text(row.cash) ? (list(data?.cash).some((item) => same(item.name, row.cash))
          || list(data?.banks).some((item) => same(item.bank_name, row.cash)) ? ROW.linked : ROW.missing) : ROW.noref;
      }
      return accountsOutcome(documentLinks(data, row.documentId));
    }),
    harness: (gateway) => list(gateway.list('expenses')).map((row) => {
      const hasRef = row.cashId || row.bankId;
      if (!hasRef) return ROW.noref;
      const found = (row.cashId && gateway.get('cash', row.cashId)) || (row.bankId && gateway.get('banks', row.bankId));
      return refOutcome(found);
    }),
  },
  {
    id: 'remittances-accounts',
    from: 'دفتر حواله‌ها',
    fromModule: 'remittance',
    to: 'سند حواله و حساب‌های آن',
    toModule: 'reports',
    definition: 'هر حواله به سند خودش، حساب صندوق/بانک تسویه و دفتر مشتری/نمایندگی مرتبط است.',
    preview: (data) => list(data?.remittance).map((row) => {
      if (!text(row.documentId)) return ROW.noref;
      return documentOutcome(data, row.documentId);
    }),
    harness: (gateway) => list(gateway.list('remittances')).map((row) => {
      const hasRef = row.customerId || row.branchId;
      if (!hasRef) return ROW.noref;
      const found = (row.customerId && gateway.get('customers', row.customerId))
        || (row.branchId && gateway.get('branches', row.branchId));
      return refOutcome(found);
    }),
  },
  {
    id: 'exchange-accounts',
    from: 'معاملات اسعار',
    fromModule: 'exchange',
    to: 'سند معامله و صندوق‌های مبدأ/مقصد',
    toModule: 'reports',
    definition: 'هر معاملهٔ اسعار به سند خودش و صندوق ارز داده‌شده و گرفته‌شده وصل است.',
    preview: (data) => list(data?.exchange).map((row) => {
      if (!text(row.documentId)) return ROW.noref;
      return documentOutcome(data, row.documentId);
    }),
    harness: (gateway) => list(gateway.list('transactions')).map((row) => {
      const refs = [row.customerId, row.cashId].filter(Boolean);
      return refs.length ? ROW.linked : ROW.noref;
    }),
  },
  {
    id: 'chart-account-ledger',
    from: 'کدینگ حساب‌ها',
    fromModule: 'accounts',
    to: 'سطرهای دفتر کل همان حساب',
    toModule: 'ledger',
    definition: 'هر حساب کدینگ به سطرهای دفتر کل و اسناد همان حساب باز می‌شود.',
    preview: (data) => list(data?.accounts).map((row) => (list(data?.transactions)
      .some((line) => same(line.accountId, row.id) && text(line.accountType).toLowerCase() === 'suspense')
      ? ROW.linked : ROW.noref)),
    harness: (gateway) => list(gateway.list('transactions')).map((row) => {
      const refs = [row.customerId, row.cashId, row.bankId].filter(Boolean);
      return refs.length ? ROW.linked : ROW.noref;
    }),
  },
  {
    id: 'profit-account',
    from: 'مفاد معاملات',
    fromModule: 'profit',
    to: 'حساب درآمد/مصرف و سند آن',
    toModule: 'accounts',
    definition: 'هر سطر سود و زیان به حساب کدینگ خودش و سند ثبت‌شدهٔ همان حساب وصل است.',
    preview: (data) => list(data?.profitAccounts).map((row) => {
      const account = list(data?.accounts).find((item) => same(item.id, row.accountId) || same(item.code, row.code)
        || same(item.name, row.account));
      if (!account) return ROW.missing;
      return list(data?.profitEntries).some((entry) => same(entry.accountId, account.id)) ? ROW.linked : ROW.missing;
    }),
    harness: (gateway) => list(gateway.list('expenses')).map((row) => {
      const hasRef = row.cashId || row.bankId;
      if (!hasRef) return ROW.noref;
      const found = (row.cashId && gateway.get('cash', row.cashId)) || (row.bankId && gateway.get('banks', row.bankId));
      return refOutcome(found);
    }),
  },
  {
    id: 'ledger-documents',
    from: 'دفتر کل',
    fromModule: 'ledger',
    to: 'سند مالی سطر',
    toModule: 'reports',
    definition: 'از هر سطر دفتر کل به سند مالی همان سطر و سپس به حساب‌های سند.',
    preview: (data) => list(data?.ledger).map((row) => {
      if (!text(row.documentId)) return ROW.noref;
      return list(data?.reports).some((item) => same(item.id, row.documentId)) ? ROW.linked : ROW.missing;
    }),
    harness: (gateway) => list(gateway.list('ledgers')).map((ledger) => {
      const line = list(ledger.lines).find((item) => item.sourceModule && item.sourceId);
      if (!line) return ROW.noref;
      return gateway.get(line.sourceModule, line.sourceId) ? ROW.linked : ROW.missing;
    }),
  },
  {
    id: 'debtors-customer',
    from: 'بدهکاران',
    fromModule: 'debtors',
    to: 'پرونده و دفتر مشتری',
    toModule: 'customers',
    definition: 'از سطر بدهکار به پروندهٔ مشتری و گردش حساب همان مشتری.',
    preview: (data) => list(data?.customers)
      .filter((row) => Math.abs(Number(row.balance ?? row.opening ?? 0)) > 0.005)
      .map((row) => (customerStatement(data, row).rows.length ? ROW.linked : ROW.noref)),
    harness: (gateway) => list(gateway.list('debtors')).map((row) => refOutcome(gateway.get('customers', row.customerId))),
  },
];