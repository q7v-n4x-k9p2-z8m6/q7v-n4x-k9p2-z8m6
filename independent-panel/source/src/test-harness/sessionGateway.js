// test-harness/sessionGateway.js — درگاه دادهٔ محیط آزمون
// خواندن دادهٔ ساختگی از fixtures و ویرایش «فقط در حافظهٔ همین تب».
// هیچ نوشتنی در localStorage، sessionStorage، IndexedDB، کوکی یا شبکه انجام نمی‌شود؛
// هیچ داده‌ای از برنامهٔ اصلی یا دیتابیس نسخهٔ اصلی خوانده یا تغییر داده نمی‌شود و
// با تازه‌سازی صفحه همه‌چیز به حالت اولیه بازمی‌گردد.
import { FIXTURES } from './fixtures';
import { TEST_IDENTITY } from './identity';
import { totalsOf, withRunning, sideOf } from './ledgerMath';

// عملیات عمومی نوشتن که در این محیط مسدود می‌مانند؛ فقط دو ویرایش سطری و حسابی در حافظه مجاز است.
export const BLOCKED_OPERATIONS = Object.freeze([
  'create',
  'update',
  'delete',
  'reverse',
  'deactivate',
  'replace',
  'submit',
  'reset',
  'importRecords',
  'bulkCreate',
  'postDocument',
]);

export class BlockedOperation extends Error {
  constructor(operation) {
    super(`عملیات «${operation}» در محیط آزمون مسدود است؛ ویرایش فقط از فرم‌های همین محیط و در حافظهٔ تب انجام می‌شود.`);
    this.name = 'BlockedOperation';
    this.operation = operation;
  }
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const num = (value) => Number(String(value ?? '').replaceAll(',', '')) || 0;

const MODULE_OF_PARTY = { customer: 'customers', branch: 'branches', cash: 'cash' };
const PARTY_OF_MODULE = { customers: 'customer', branches: 'branch', cash: 'cash' };
const PARTY_LABEL = { customer: 'مشتری', branch: 'نمایندگی', cash: 'صندوق' };

export function createSessionGateway() {
  const data = clone(FIXTURES);

  const blocked = {};
  BLOCKED_OPERATIONS.forEach((operation) => {
    blocked[operation] = () => { throw new BlockedOperation(operation); };
  });

  const ledgerFor = (partyType, partyId) =>
    data.ledgers.find((ledger) => ledger.partyType === partyType && ledger.partyId === partyId) || null;

  const ledgerById = (id) => data.ledgers.find((ledger) => ledger.id === id) || null;

  const recalcLedger = (ledger) => {
    // ترتیب زمانی حفظ می‌شود تا ماندهٔ تجمعی هر سطر با تاریخ همان سطر بخواند
    const ordered = [...ledger.lines].sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')));
    const lines = withRunning(ordered);
    const totals = totalsOf(lines);
    return { ...ledger, lines, totals, side: sideOf(totals.balance) };
  };

  // ماندهٔ فهرست‌ها از همان دفتر بازمحاسبه می‌شود تا عدد فهرست و صفحهٔ اختصاصی حساب یکی بمانند.
  const syncBalances = () => {
    ['customers', 'branches', 'cash'].forEach((module) => {
      const partyType = PARTY_OF_MODULE[module];
      data[module] = data[module].map((row) => {
        const ledger = ledgerFor(partyType, row.id);
        return {
          ...row,
          ledgerId: ledger ? ledger.id : (row.ledgerId || null),
          balance: ledger ? ledger.totals.balance : 0,
          balanceSide: ledger ? ledger.side : 'تسویه',
          ledgerCurrency: ledger ? ledger.currency : row.currency,
        };
      });
    });
    data.debtors = data.customers
      .filter((row) => Math.abs(num(row.balance)) > 0.005)
      .map((row) => ({
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
  };

  const snapshot = () => JSON.stringify(data);

  return {
    identity: TEST_IDENTITY,
    ...blocked,

    list(moduleId) {
      return data[moduleId] || [];
    },

    get(moduleId, id) {
      if (moduleId === 'debtors') {
        const debtor = data.debtors.find((row) => row.id === id);
        if (!debtor) return null;
        return data.customers.find((row) => row.id === debtor.customerId) || null;
      }
      return (data[moduleId] || []).find((row) => row.id === id) || null;
    },

    ledgerById,
    ledgerFor,

    ledgersOf(partyType) {
      return data.ledgers.filter((ledger) => ledger.partyType === partyType);
    },

    totals(ledgerId) {
      const ledger = ledgerById(ledgerId);
      return ledger ? totalsOf(ledger.lines) : { debit: 0, credit: 0, balance: 0 };
    },

    // صاحب حساب همان دفتر؛ برای نمایش کد، تلفن و شهر در صفحهٔ اختصاصی
    partyOf(ledger) {
      const module = MODULE_OF_PARTY[ledger?.partyType];
      if (!module) return null;
      return (data[module] || []).find((row) => row.id === ledger.partyId) || null;
    },

    partyModule(ledger) {
      return MODULE_OF_PARTY[ledger?.partyType] || null;
    },

    partyLabel(ledger) {
      return PARTY_LABEL[ledger?.partyType] || 'حساب';
    },

    // اسناد و معاملات مرتبط با همین حساب؛ هیچ رکورد حساب دیگری در آن نیست
    relatedDocuments(ledger) {
      const rows = [];
      const push = (module, record) => rows.push({ module, record });
      if (!ledger) return rows;
      if (ledger.partyType === 'customer') {
        data.transactions.filter((row) => row.customerId === ledger.partyId).forEach((row) => push('transactions', row));
        data.remittances.filter((row) => row.customerId === ledger.partyId).forEach((row) => push('remittances', row));
      } else if (ledger.partyType === 'branch') {
        data.remittances.filter((row) => row.branchId === ledger.partyId).forEach((row) => push('remittances', row));
      } else if (ledger.partyType === 'cash') {
        data.transactions.filter((row) => row.cashId === ledger.partyId).forEach((row) => push('transactions', row));
        data.expenses.filter((row) => row.cashId === ledger.partyId).forEach((row) => push('expenses', row));
      }
      return rows.sort((left, right) => String(right.record.date || '').localeCompare(String(left.record.date || '')));
    },

    // ویرایش یک سطر گردش: تاریخ، شرح علت، بدهکار و بستانکار؛ ماندهٔ دفتر و فهرست‌ها بازمحاسبه می‌شود
    saveLine(ledgerId, lineId, patch) {
      const ledger = ledgerById(ledgerId);
      if (!ledger) throw new Error('دفتر حساب پیدا نشد.');
      const index = ledger.lines.findIndex((line) => line.id === lineId);
      if (index < 0) throw new Error('سطر گردش پیدا نشد.');
      const current = ledger.lines[index];
      const nextLine = {
        ...current,
        date: String(patch.date ?? current.date ?? ''),
        description: String(patch.description ?? current.description ?? ''),
        debit: Math.max(0, num(patch.debit ?? current.debit)),
        credit: Math.max(0, num(patch.credit ?? current.credit)),
      };
      const next = recalcLedger({
        ...ledger,
        lines: ledger.lines.map((line, position) => (position === index ? nextLine : line)),
      });
      data.ledgers = data.ledgers.map((item) => (item.id === next.id ? next : item));
      syncBalances();
      return next;
    },

    // ویرایش اطلاعات حساب (نام، تلفن، شهر و وضعیت)
    saveParty(moduleId, id, patch) {
      const module = PARTY_OF_MODULE[moduleId] ? moduleId : 'customers';
      const partyType = PARTY_OF_MODULE[module];
      data[module] = data[module].map((row) => (row.id === id ? {
        ...row,
        name: String(patch.name ?? row.name ?? ''),
        phone: String(patch.phone ?? row.phone ?? ''),
        city: String(patch.city ?? row.city ?? ''),
        status: String(patch.status ?? row.status ?? ''),
      } : row));
      if (patch.name) {
        data.ledgers = data.ledgers.map((ledger) => (
          ledger.partyType === partyType && ledger.partyId === id ? { ...ledger, name: patch.name } : ledger
        ));
      }
      syncBalances();
      return (data[module] || []).find((row) => row.id === id) || null;
    },

    relatedExpensesForCash(cashId) {
      return data.expenses.filter((row) => row.cashId === cashId);
    },

    relatedExpensesForBank(bankId) {
      return data.expenses.filter((row) => row.bankId === bankId);
    },

    relatedTransactionsForCash(cashId) {
      return data.transactions.filter((row) => row.cashId === cashId);
    },

    relatedRemittancesForBranch(branchId) {
      return data.remittances.filter((row) => row.branchId === branchId);
    },

    snapshot,

    // آزمایش عملی: هر عملیات عمومی نوشتن تلاش می‌شود و باید رد شود.
    probe() {
      const before = snapshot();
      const results = BLOCKED_OPERATIONS.map((operation) => {
        try {
          blocked[operation]();
          return { operation, blocked: false, message: 'اجرا شد — این یک خطا در مرز محیط آزمون است.' };
        } catch (error) {
          return {
            operation,
            blocked: error instanceof BlockedOperation,
            message: error.message,
          };
        }
      });
      return {
        results,
        unchanged: before === snapshot(),
        allBlocked: results.every((row) => row.blocked),
      };
    },
  };
}