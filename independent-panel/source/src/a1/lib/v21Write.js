// a1/lib/v21Write.js — نوشتن اتمیک اطلاعات میز کار نسخهٔ ۲۱
// حواله، مصرف، معاملهٔ اسعار، روزنامچه و ابطال اسناد هرکدام در یک تراکنش IndexedDB واحد
// (سند + سطرهای دفتر + سابقهٔ فعالیت + رکورد عملیاتی) ثبت می‌شوند.
// هیچ درخواست شبکه‌ای، Supabase یا تغییر سورس A1 انجام نمی‌شود.
import { all, get, insert, update, writeTx } from '@/a1/lib/db';
import { number, documentDateTimestamp } from './v21Rules';
import { validatePeriodDraft, findClosedPeriod, closedPeriodMessage, periodIsClosed } from './fiscalPeriods';
import { sessionContext } from './v21Session';
import {
  postDocumentInTx, reverseDocumentInTx, replaceDocumentLinesInTx, assertNoDuplicateOperation,
} from './v21Posting';
import {
  buildRemittanceLines, buildFeeLines, buildExpenseLines, buildCashMovementLines,
  buildConversionLines, buildJournalLines, buildSettlementLines, makeSettlementNumber,
  positive, nonNegative, customerRef, suspenseRef,
} from './v21Domain';

const TABLES = {
  customers: 'customers',
  branches: 'origins',
  cash: 'safes',
  banks: 'bank_accounts',
  currencies: 'rates',
  accounts: 'chart_of_accounts',
};

const PERMISSION_SECTION_BY_MODULE = {
  customers: 'customers',
  branches: 'agents',
  cash: 'cash',
  banks: 'bank',
  currencies: 'currencies',
  accounts: 'chart_of_accounts',
  remittance: 'transfers',
  cashAction: 'cash',
  settlement: 'cash',
  expenses: 'cash',
  exchange: 'trade',
  journal: 'journal',
  transactions: 'accounts_receivable',
  fiscalPeriods: 'chart_of_accounts',
};

// اسناد مالی تاریخ‌دار: هر ثبت یا ویرایشی که تاریخش داخل دورهٔ بسته بیفتد متوقف می‌شود.
const FINANCIAL_DATED_MODULES = ['remittance', 'expenses', 'exchange', 'journal', 'settlement', 'cashAction'];

async function assertFinancialDateOpen(ctx, date, module) {
  if (!FINANCIAL_DATED_MODULES.includes(module)) return;
  const rows = (await all('fiscal_periods'))
    .filter(row => !row.exchange_code || row.exchange_code === ctx.exchangeCode);
  const closed = findClosedPeriod(rows, date);
  if (closed) throw new Error(closedPeriodMessage(closed, date));
}

const DOCUMENT_TABLES = ['documents', 'ledger_entries', 'audit_logs'];
const todayIso = () => new Date().toISOString();

const makeOperationId = () => globalThis.crypto?.randomUUID?.() || `v21-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function runVersion21Tx(extraTables = [], task) {
  return writeTx([...new Set([...DOCUMENT_TABLES, ...extraTables])], task);
}

async function auditInTx(handles, ctx, action, entityType, entityId, description, oldValues, newValues) {
  await handles.audit_logs.add({
    user_id: ctx.userId,
    user_name: ctx.userName,
    actor_name: ctx.userName,
    actor_role: ctx.role,
    user_type: ctx.userType,
    action,
    entity_type: entityType,
    entity_id: String(entityId ?? ''),
    description,
    status: 'success',
    exchange_code: ctx.exchangeCode,
    old_values: oldValues || null,
    new_values: newValues || null,
    target_name: description,
    created_at: todayIso(),
  });
}

async function requireModulePermission(ctx, module, action) {
  if (['creator', 'admin', 'exchange', 'sarraaf'].includes(ctx.role)) return;
  if (ctx.role !== 'employee') throw new Error('این نقش اجازهٔ اجرای عملیات نسخهٔ ۲۱ را ندارد.');
  const section = PERMISSION_SECTION_BY_MODULE[module];
  if (!section) throw new Error('این بخش برای نقش کارمند مجوز عملیاتی تعریف‌شده ندارد.');
  const rows = await all('user_permissions');
  const data = rows.find(row => String(row.user_id) === String(ctx.userId) && row.section === section);
  const flag = action === 'create' ? 'can_create' : action === 'edit' ? 'can_edit' : action === 'delete' ? 'can_delete' : 'can_view';
  if (!data || data.can_view !== true || data[flag] !== true) {
    throw new Error('برای این عملیات مجوز کافی از مدیر صرافی دریافت نشده است.');
  }
}

function mapMasterRecord(module, draft, ctx) {
  const common = { exchange_code: ctx.exchangeCode };
  switch (module) {
    case 'customers':
      return {
        ...common, code: draft.code || null, name: String(draft.name || '').trim(),
        mobile: draft.phone || null, phone: draft.phone || null, email: draft.email || null,
        country: draft.country || null, opening_balance: number(draft.opening),
        balance_currency: draft.currency || 'AFN',
        customer_type: draft.kind === 'موقتی' ? 'misc' : 'permanent',
        status: draft.status === 'غیرفعال' || draft.status === 'قفل' ? 'inactive' : 'active',
        notes: draft.notes || draft.address || null, description: draft.address || null,
      };
    case 'branches':
      return {
        ...common, code: draft.code || null, name: String(draft.name || '').trim(),
        type: 'origin', city: draft.city || null, phone: draft.phone || null,
        notes: draft.description || null, is_active: draft.status !== 'غیرفعال',
      };
    case 'cash':
      return {
        ...common, name: String(draft.name || '').trim(), currency: draft.currency || 'AFN',
        opening_balance: number(draft.opening), active: draft.status !== 'غیرفعال',
        registered_by: ctx.userName, registered_by_user_id: ctx.userId,
      };
    case 'banks':
      return {
        ...common, bank_name: String(draft.name || '').trim(),
        account_number: draft.account || '', currency: draft.currency || 'AFN',
        balance: number(draft.opening), holder: draft.holder || null,
        notes: draft.description || null, active: draft.status !== 'غیرفعال',
      };
    case 'currencies':
      return {
        ...common, currency: String(draft.code || '').trim().toUpperCase(),
        description: draft.name || null, symbol: draft.symbol || draft.code || null,
        buy_rate: number(draft.rate), sell_rate: number(draft.rate),
        is_active: draft.active !== 'غیرفعال',
      };
    case 'accounts':
      return {
        ...common, account_code: String(draft.code || '').trim(),
        account_name: String(draft.name || '').trim(),
        account_type: draft.accountType || 'asset',
        normal_balance: draft.nature === 'بستانکار' ? 'credit' : 'debit',
        parent_id: draft.parentId ? Number(draft.parentId) : null,
        currency: draft.currency || null,
        description: draft.description || null,
        is_active: draft.status !== 'غیرفعال',
      };
    default:
      throw new Error(`فرم ${module} هنوز به جدول واقعی نگاشت نشده است.`);
  }
}

async function writeAudit(ctx, action, entityType, entityId, description, oldValues, newValues) {
  try {
    await insert('audit_logs', {
      user_id: ctx.userId,
      user_name: ctx.userName,
      actor_name: ctx.userName,
      actor_role: ctx.role,
      user_type: ctx.userType,
      action,
      entity_type: entityType,
      entity_id: String(entityId ?? ''),
      description,
      status: 'success',
      exchange_code: ctx.exchangeCode,
      old_values: oldValues || null,
      new_values: newValues || null,
      target_name: description,
    });
  } catch {
    return 'ثبت سابقهٔ فعالیت انجام نشد.';
  }
  return null;
}

const tenantRows = async (table, ctx) => (await all(table)).filter(row => !row.exchange_code || row.exchange_code === ctx.exchangeCode);

async function getSafe(ctx, name, currency) {
  const row = (await tenantRows('safes', ctx)).find(item => item.name === name && item.currency === currency);
  if (!row) throw new Error('صندوق انتخاب‌شده در همین صرافی و با همین ارز پیدا نشد.');
  return row;
}

async function getSafeById(ctx, id) {
  const row = (await tenantRows('safes', ctx)).find(item => String(item.id) === String(id));
  if (!row) throw new Error('صندوق مرتبط با سند پیدا نشد.');
  return row;
}

async function getBankById(ctx, id, currency) {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new Error('شناسهٔ حساب بانکی معتبر نیست.');
  const row = (await tenantRows('bank_accounts', ctx)).find(item => Number(item.id) === numericId && item.active !== false);
  if (!row) throw new Error('حساب بانکی فعال در همین صرافی پیدا نشد.');
  if (String(row.currency || 'AFN') !== String(currency || 'AFN')) throw new Error('ارز حساب بانکی با ارز سند یکسان نیست.');
  return row;
}

async function getBranch(ctx, name) {
  if (!name) return null;
  return (await tenantRows('origins', ctx)).find(row => row.name === name) || null;
}

async function getCustomer(ctx, name) {
  if (!name) return null;
  return (await tenantRows('customers', ctx)).find(row => row.name === name) || null;
}

async function safeRef(ctx, name, currency) {
  const safe = await getSafe(ctx, name, currency);
  return { account_type: 'cash', account_id: String(safe.id), account_name: safe.name, currency };
}

async function bankRef(ctx, id, currency) {
  const bank = await getBankById(ctx, id, currency);
  return { account_type: 'bank', account_id: String(bank.id), account_name: bank.bank_name || bank.holder || 'حساب بانکی', currency };
}

async function findChartAccountByType(ctx, accountType) {
  const rows = (await tenantRows('chart_of_accounts', ctx))
    .filter(row => row.account_type === accountType && row.is_active !== false)
    .sort((a, b) => String(a.account_code || '').localeCompare(String(b.account_code || '')));
  return rows.find(row => row.parent_id !== null && row.parent_id !== undefined) || rows[0] || null;
}

function chartAccountLedgerRef(account) {
  return { account_type: 'suspense', account_id: String(account.id), account_name: account.account_name };
}

async function defaultExpenseRef(ctx) {
  const account = await findChartAccountByType(ctx, 'expense');
  if (!account) throw new Error('برای ثبت مصرف، ابتدا در کدینگ حساب‌ها یک حساب از نوع «مصرف» ایجاد کنید.');
  return chartAccountLedgerRef(account);
}

async function revenueRef(ctx, preferredCode, label) {
  const rows = (await tenantRows('chart_of_accounts', ctx))
    .filter(row => row.account_type === 'revenue' && row.is_active !== false);
  const account = rows.find(row => String(row.account_code) === preferredCode)
    || rows.find(row => row.parent_id !== null && row.parent_id !== undefined)
    || rows[0];
  if (!account) throw new Error(`حساب درآمدی «${label}» در کدینگ این صراف وجود ندارد؛ ابتدا کدینگ حساب‌ها را کامل کنید.`);
  return chartAccountLedgerRef(account);
}

async function resolveLedgerAccount(ctx, label, currency) {
  const value = String(label || '');
  if (!value.trim()) throw new Error('حساب سند انتخاب نشده است.');
  if (value.startsWith('صندوق: ')) {
    return safeRef(ctx, value.slice(7), currency);
  }
  if (value.startsWith('بانک: ')) {
    return bankRef(ctx, value.slice('بانک: '.length).trim(), currency);
  }
  const accountCode = value.includes(' — ') ? value.split(' — ')[0] : '';
  const rows = await tenantRows('chart_of_accounts', ctx);
  const data = accountCode ? rows.find(row => row.account_code === accountCode) : rows.find(row => row.account_name === value);
  if (!data) throw new Error(`حساب «${value}» در کدینگ همین صرافی پیدا نشد.`);
  return chartAccountLedgerRef(data);
}

async function nextTransferNumberInTx(handles) {
  const rows = await handles.transfers.getAll();
  const max = rows.reduce((top, row) => {
    const match = /^TR-(\d+)$/.exec(String(row.transfer_number || ''));
    return match ? Math.max(top, Number(match[1])) : top;
  }, 0);
  return `TR-${String(max + 1).padStart(5, '0')}`;
}

function settlementMeta(settlement, settleType, counter) {
  if (settlement !== 'instant' || !counter) {
    return { settlement_mode: 'suspense', settle_type: '', settle_account_id: null, settle_account_name: 'حواله در جریان' };
  }
  return {
    settlement_mode: 'instant',
    settle_type: settleType,
    settle_account_id: counter.account_id,
    settle_account_name: counter.account_name,
  };
}

async function remittanceSettlement(ctx, draft, currency) {
  const settlement = draft.settlement === 'instant' ? 'instant' : 'suspense';
  const settleType = draft.settleType === 'bank' ? 'bank' : 'cash';
  const counter = settlement === 'instant'
    ? (settleType === 'bank' ? await bankRef(ctx, draft.bank, currency) : await safeRef(ctx, draft.cash, currency))
    : null;
  return { settlement, settleType, counter };
}

// ماندهٔ در دسترس یک صندوق یا بانک: ماندهٔ افتتاحیه + حرکت دفتر کل همان حساب در همان ارز.
// پیش از ثبت معامله استفاده می‌شود تا فروش بیش از موجودی رد شود، نه اینکه فقط هشدار بگیرد.
async function accountBalanceInTx(handles, ctx, account) {
  // خواندن موجودی در همان تراکنش read-write ثبت سند انجام می‌شود؛
  // تراکنش‌های هم‌زمانی که دفترکل/حساب مشترک دارند به‌صورت ترتیبی اجرا می‌شوند.
  const table = account.account_type === 'bank' ? 'bank_accounts' : 'safes';
  const rows = await handles[table].getAll();
  const row = rows.find(item => String(item.id) === String(account.account_id)
    && (!item.exchange_code || item.exchange_code === ctx.exchangeCode));
  const opening = number(row?.opening_balance ?? row?.balance ?? 0);
  const lines = await handles.ledger_entries.getAll();
  const movement = lines
    .filter(line => !line.deleted
      && String(line.account_type || '') === account.account_type
      && String(line.account_id || '') === String(account.account_id)
      && String(line.currency || 'AFN') === String(account.currency || 'AFN')
      && (!line.exchange_code || line.exchange_code === ctx.exchangeCode))
    .reduce((sum, line) => sum + number(line.debit) - number(line.credit), 0);
  return opening + movement;
}

function assertReason(reason) {
  const text = String(reason || '').trim();
  if (text.length < 3) throw new Error('علت ابطال الزامی است و باید حداقل سه نویسه باشد.');
  return text;
}

// ── ثبت رکوردهای پایه ──
export async function saveVersion21Record(module, draft) {
  if (draft?.date) documentDateTimestamp(draft.date);
  const ctx = sessionContext();
  await requireModulePermission(ctx, module, draft?.id ? 'edit' : 'create');
  await assertFinancialDateOpen(ctx, draft?.date, module);
  const operationId = draft.clientOperationId || makeOperationId();

  if (TABLES[module]) {
    const table = TABLES[module];
    const payload = mapMasterRecord(module, draft, ctx);
    const recordName = payload.name || payload.bank_name || payload.account_name;
    if (!recordName && ['customers', 'branches', 'cash', 'banks', 'accounts'].includes(module)) {
      throw new Error('نام این رکورد الزامی است.');
    }
    if (['customers', 'cash', 'banks'].includes(module) && !Number.isFinite(number(draft.opening))) {
      throw new Error('مانده افتتاحیه باید عدد معتبر باشد.');
    }
    if (module === 'banks' && !payload.account_number) throw new Error('شماره حساب بانکی الزامی است.');
    if (module === 'accounts') {
      if (!payload.account_code || !payload.account_name) throw new Error('کد و نام حساب الزامی است.');
      if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(payload.account_type)) throw new Error('نوع حساب معتبر نیست.');
      const rows = await tenantRows('chart_of_accounts', ctx);
      if (rows.some(row => row.account_code === payload.account_code && String(row.id) !== String(draft.id || ''))) {
        throw new Error('این کد حساب قبلاً در کدینگ همین صراف استفاده شده است.');
      }
      if (payload.parent_id) {
        if (Number(payload.parent_id) === Number(draft.id)) throw new Error('یک حساب نمی‌تواند حساب مادر خودش باشد.');
        const parent = rows.find(row => Number(row.id) === Number(payload.parent_id));
        if (!parent || parent.parent_id || parent.is_active === false) throw new Error('حساب مادر باید یک حساب کل فعال از همین صراف باشد.');
        if (parent.account_type !== payload.account_type) throw new Error('نوع حساب فرعی باید با نوع حساب مادر یکسان باشد.');
      }
    }
    if (module === 'currencies' && !payload.currency) throw new Error('کد ارز الزامی است.');
    if (module === 'currencies' && (!Number.isFinite(payload.buy_rate) || !Number.isFinite(payload.sell_rate) || payload.buy_rate <= 0 || payload.sell_rate <= 0)) {
      throw new Error('نرخ خرید و فروش باید عدد معتبر و بزرگ‌تر از صفر باشد.');
    }
    const result = draft.id
      ? await update(table, Number(draft.id), { ...payload, updated_at: new Date().toISOString() })
      : await insert(table, { ...payload, client_operation_id: operationId });
    const auditWarning = await writeAudit(ctx, draft.id ? 'update' : 'create', module, result.id,
      `${draft.id ? 'ویرایش' : 'ثبت'} ${module} · ${payload.name || payload.account_name || payload.currency || ''}`, null, payload);
    return { id: String(result.id), auditWarning };
  }

  // ── حواله: ارسالی/دریافتی با تسویهٔ فوری یا حساب واسط ──
  if (module === 'remittance') {
    if (draft.id) throw new Error('برای ثبت حوالهٔ جدید نباید شناسه داشته باشد؛ برای اصلاح از ویرایش همان ردیف استفاده کنید.');
    const direction = String(draft.direction || '').trim();
    if (!['ارسالی', 'دریافتی'].includes(direction)) {
      throw new Error('نوع حواله باید صریحاً «ارسالی» یا «دریافتی» انتخاب شود؛ حوالهٔ نامشخص ثبت نمی‌شود.');
    }
    if (!draft.sender || !draft.receiver) throw new Error('فرستنده و گیرنده الزامی است.');
    const amount = positive(draft.amount, 'مبلغ حواله باید عدد معتبر و بزرگ‌تر از صفر باشد.');
    const fee = nonNegative(draft.fee ?? 0, 'کمیشن حواله باید صفر یا عدد مثبت باشد.');
    const currency = draft.currency || 'AFN';
    const customer = await getCustomer(ctx, direction === 'دریافتی' ? draft.receiver : draft.sender);
    if (!customer) throw new Error('طرف حساب حواله باید از مشتریان ثبت‌شدهٔ همین صراف باشد؛ ابتدا مشتری را ثبت کنید.');
    const branch = await getBranch(ctx, draft.branch);
    const { settlement, settleType, counter } = await remittanceSettlement(ctx, draft, currency);
    const revenue = fee > 0 ? await revenueRef(ctx, '4010', 'درآمد کمیشن حواله') : null;

    return runVersion21Tx(['transfers'], async handles => {
      await assertNoDuplicateOperation(handles, operationId);
      const transferNumber = await nextTransferNumberInTx(handles);
      const meta = settlementMeta(settlement, settleType, counter);
      const transferId = await handles.transfers.add({
        exchange_code: ctx.exchangeCode,
        transfer_number: transferNumber,
        direction: direction === 'دریافتی' ? 'receive' : 'send',
        sender_name: draft.sender,
        receiver_name: draft.receiver,
        destination: draft.note || draft.branch || '',
        origin: draft.branch || '',
        amount,
        currency,
        rate: number(draft.rate) || null,
        fee,
        fee_currency: currency,
        total: amount + fee,
        status: 'done',
        customer_id: customer.id,
        agent_id: branch?.id || null,
        ...meta,
        client_operation_id: operationId,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
      });

      const party = customerRef(customer, currency);
      const counterLine = counter ? counter : suspenseRef(String(transferId), 'حواله در جریان', currency);
      const lines = buildRemittanceLines({ direction, amount, currency, party, counter: counterLine });
      const document = await postDocumentInTx(handles, {
        doc_type: 'transfer',
        currency,
        amount,
        related_type: 'customer',
        related_id: customer.id,
        related_name: direction === 'دریافتی' ? draft.receiver : draft.sender,
        description: draft.note || `حواله ${direction}`,
        lines,
        transfer_id: transferId,
        exchange_code: ctx.exchangeCode,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
        date: draft.date,
        client_operation_id: operationId,
      });

      let feeDocument = null;
      if (fee > 0 && revenue) {
        feeDocument = await postDocumentInTx(handles, {
          doc_type: 'transfer_fee',
          currency,
          amount: fee,
          related_type: 'transfer',
          related_id: transferId,
          related_name: customer.name,
          description: `کمیشن حواله ${transferNumber}`,
          lines: buildFeeLines({ amount: fee, currency, party, revenue }),
          transfer_id: transferId,
          exchange_code: ctx.exchangeCode,
          registered_by: ctx.userName,
          registered_by_user_id: ctx.userId,
          date: draft.date,
          client_operation_id: `${operationId}-fee`,
        });
      }

      await auditInTx(handles, ctx, 'create', 'transfer', transferId,
        `ثبت حوالهٔ ${direction} ${transferNumber} با تسویهٔ ${settlement === 'instant' ? 'فوری' : 'واسط'}`, null, { ...draft, documentNumber: document.doc_number });
      return { id: String(transferId), documentId: document.id, feeDocumentId: feeDocument?.id || null };
    });
  }

  // ── مصرف: پرداخت از صندوق یا بانک ──
  if (module === 'expenses') {
    if (draft.id) throw new Error('برای ویرایش مصرف از همان ردیف انتخاب‌شده استفاده کنید.');
    const currency = draft.currency || 'AFN';
    const amount = positive(draft.amount, 'مبلغ مصرف باید عدد معتبر و بزرگ‌تر از صفر باشد.');
    const expense = draft.expenseAccount ? await resolveLedgerAccount(ctx, draft.expenseAccount, currency) : await defaultExpenseRef(ctx);
    const payerType = draft.payerType === 'bank' ? 'bank' : 'cash';
    const payer = payerType === 'bank' ? await bankRef(ctx, draft.bank, currency) : await safeRef(ctx, draft.cash, currency);
    const description = String(draft.title || draft.note || '').trim() || 'مصرف';

    return runVersion21Tx([], async handles => {
      await assertNoDuplicateOperation(handles, operationId);
      const document = await postDocumentInTx(handles, {
        doc_type: 'expense',
        currency,
        amount,
        description,
        lines: buildExpenseLines({ amount, currency, expense, payer }),
        exchange_code: ctx.exchangeCode,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
        date: draft.date,
        client_operation_id: operationId,
      });
      await auditInTx(handles, ctx, 'create', 'expense', document.id,
        `ثبت مصرف از ${payerType === 'bank' ? 'بانک' : 'صندوق'} · سند ${document.doc_number}`, null, draft);
      return { id: String(document.id), documentId: document.id };
    });
  }

  // ── انتقال بین حساب‌های خود صراف: صندوق ↔ صندوق، صندوق ↔ بانک و بانک ↔ بانک ──
  // یک سند متوازن با دو سطر آینه‌ای و یک شناسهٔ تسویهٔ مشترک ثبت می‌شود؛
  // ماندهٔ هر دو حساب از همان سطرها فوراً به‌روز می‌شود.
  if (module === 'settlement') {
    if (draft.id) throw new Error('انتقال ثبت‌شده ویرایش نمی‌شود؛ برای اصلاح، سند را ابطال و انتقال تازه ثبت کنید.');
    const currency = draft.currency || 'AFN';
    const amount = positive(draft.amount, 'مبلغ انتقال باید معتبر و بزرگ‌تر از صفر باشد.');
    const fromKind = draft.fromKind === 'bank' ? 'bank' : 'cash';
    const toKind = draft.toKind === 'bank' ? 'bank' : 'cash';
    const from = fromKind === 'bank' ? await bankRef(ctx, draft.fromAccount, currency) : await safeRef(ctx, draft.fromAccount, currency);
    const to = toKind === 'bank' ? await bankRef(ctx, draft.toAccount, currency) : await safeRef(ctx, draft.toAccount, currency);
    if (String(from.account_type) === String(to.account_type) && String(from.account_id) === String(to.account_id)) {
      throw new Error('حساب مبدأ و مقصد انتقال نباید یکی باشند.');
    }
    const sourceAccountTable = from.account_type === 'bank' ? 'bank_accounts' : 'safes';
    const settlementId = String(draft.settlementId || '').trim() || makeSettlementNumber(draft.date);

    return runVersion21Tx([sourceAccountTable], async handles => {
      await assertNoDuplicateOperation(handles, operationId);
      const available = await accountBalanceInTx(handles, ctx, from);
      if (available + 0.005 < amount) {
        throw new Error(`موجودی ${from.account_name} برای این انتقال کافی نیست؛ ماندهٔ در دسترس ${available} ${currency} است.`);
      }
      const repeated = (await handles.documents.getAll())
        .find(row => !row.deleted && String(row.settlement_id || '') === settlementId);
      if (repeated) throw new Error(`شناسهٔ تسویهٔ ${settlementId} قبلاً روی سند ${repeated.doc_number} ثبت شده است.`);

      const document = await postDocumentInTx(handles, {
        doc_type: 'settlement',
        currency,
        amount,
        description: `انتقال از ${from.account_name} به ${to.account_name} · شناسهٔ تسویه ${settlementId}` + (draft.note ? ` · ${draft.note}` : ''),
        lines: buildSettlementLines({ amount, currency, from, to }),
        exchange_code: ctx.exchangeCode,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
        date: draft.date,
        settlement_id: settlementId,
        client_operation_id: operationId,
      });
      await auditInTx(handles, ctx, 'create', 'settlement', document.id,
        `انتقال ${amount} ${currency} از ${from.account_name} به ${to.account_name} · تسویه ${settlementId} · سند ${document.doc_number}`,
        null, { ...draft, settlementId });
      return { id: String(document.id), documentId: document.id, settlementId, warning: `انتقال با شناسهٔ تسویهٔ ${settlementId} ثبت شد.` };
    });
  }

  // ── دخل و خرج صندوق ──
  if (module === 'cashAction') {
    const currency = draft.currency || 'AFN';
    const amount = positive(draft.amount, 'مبلغ باید بیشتر از صفر باشد.');
    const cash = await safeRef(ctx, draft.cash, currency);
    const customer = draft.partyType === 'customer' ? await getCustomer(ctx, draft.party) : null;
    const branch = draft.partyType === 'branch' ? await getBranch(ctx, draft.party) : null;
    if (draft.partyType === 'customer' && !customer) throw new Error('مشتری انتخاب‌شده در فهرست همین صراف پیدا نشد؛ ابتدا مشتری را ثبت کنید.');
    if (draft.partyType === 'branch' && !branch) throw new Error('نمایندگی انتخاب‌شده در فهرست همین صراف پیدا نشد؛ ابتدا نمایندگی را ثبت کنید.');
    const kind = draft.kind === 'دخل' ? 'دخل' : 'خرج';
    const counter = customer
      ? customerRef(customer, currency)
      : branch
        ? suspenseRef(String(branch.id), branch.name, currency)
        : suspenseRef('', String(draft.party || 'حساب مقابل'), currency);

    return runVersion21Tx([], async handles => {
      await assertNoDuplicateOperation(handles, operationId);
      const document = await postDocumentInTx(handles, {
        doc_type: kind === 'دخل' ? 'cash_in' : 'cash',
        currency,
        amount,
        description: draft.description || (kind === 'دخل' ? 'دخل صندوق' : 'خرج صندوق'),
        related_type: customer ? 'customer' : branch ? 'branch' : 'none',
        related_id: customer?.id || branch?.id || null,
        related_name: draft.party || '',
        lines: buildCashMovementLines({ kind, amount, currency, cash, counter }),
        exchange_code: ctx.exchangeCode,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
        date: draft.date,
        client_operation_id: operationId,
      });
      await auditInTx(handles, ctx, 'create', 'cash', document.id, `ثبت ${kind} صندوق · سند ${document.doc_number}`, null, draft);
      return { id: String(document.id), documentId: document.id };
    });
  }

  // ── معاملهٔ اسعار: تبدیل، خرید و فروش ──
  if (module === 'exchange') {
    if (draft.id) throw new Error('برای ثبت معاملهٔ جدید نباید شناسه داشته باشد.');
    const kind = ['convert', 'buy', 'sell'].includes(draft.kind) ? draft.kind : 'convert';
    const foreignCurrency = draft.foreignCurrency || 'USD';
    const baseCurrency = draft.baseCurrency || 'AFN';
    if (foreignCurrency === baseCurrency) throw new Error('ارز دو طرف معامله باید متفاوت باشد.');
    const foreignAmount = positive(draft.foreignAmount, 'مبلغ ارز خارجی باید معتبر و مثبت باشد.');
    const baseAmount = positive(draft.baseAmount, 'مبلغ ارز پایه باید معتبر و مثبت باشد.');
    const customer = draft.party ? await getCustomer(ctx, draft.party) : null;
    if (kind !== 'convert' && !customer) throw new Error('برای خرید یا فروش اسعار، طرف حساب باید از مشتریان ثبت‌شده انتخاب شود.');
    const foreignAccount = await safeRef(ctx, draft.foreignCash, foreignCurrency);
    const baseAccount = await safeRef(ctx, draft.baseCash, baseCurrency);
    const party = customer ? customerRef(customer, foreignCurrency) : suspenseRef('', 'حساب واسط تبدیل ارز', foreignCurrency);
    const fee = nonNegative(draft.fee ?? 0, 'کمیشن معامله باید صفر یا عدد مثبت باشد.');
    const feeRevenue = fee > 0 ? await revenueRef(ctx, '4020', 'درآمد معاملات اسعار') : null;
    const rate = baseAmount / foreignAmount;
    const kindLabel = kind === 'buy' ? 'خرید اسعار' : kind === 'sell' ? 'فروش اسعار' : 'تبدیل ارز';

    // ارزی که از صندوق بیرون می‌رود باید در همان صندوق موجود باشد؛
    // فروش بیش از موجودی، سود و زیان و ماندهٔ صندوق را خراب می‌کرد.
    const payout = kind === 'buy'
      ? { account: baseAccount, currency: baseCurrency, amount: baseAmount }
      : { account: foreignAccount, currency: foreignCurrency, amount: foreignAmount };
    const payoutTable = payout.account.account_type === 'bank' ? 'bank_accounts' : 'safes';

    return runVersion21Tx(['conversions', payoutTable], async handles => {
      await assertNoDuplicateOperation(handles, operationId);
      const available = await accountBalanceInTx(handles, ctx, payout.account);
      if (payout.amount > available + 0.000001) {
        throw new Error(
          `موجودی ${payout.account.account_name} برای این معامله کافی نیست؛ `
          + `ماندهٔ در دسترس ${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(available)} ${payout.currency} `
          + `و مبلغ لازم ${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(payout.amount)} ${payout.currency} است.`
        );
      }
      const conversionId = await handles.conversions.add({
        exchange_code: ctx.exchangeCode,
        kind,
        customer_id: customer?.id || null,
        customer_name: customer?.name || 'مشتری نقدی',
        customer_mobile: customer?.mobile || null,
        from_currency: foreignCurrency,
        from_amount: foreignAmount,
        rate,
        to_currency: baseCurrency,
        to_amount: baseAmount,
        cash_from: foreignAccount.account_name,
        cash_to: baseAccount.account_name,
        description: draft.note || kindLabel,
        status: 'posted',
        client_operation_id: operationId,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
      });

      const document = await postDocumentInTx(handles, {
        doc_type: kind === 'convert' ? 'convert' : 'exchange',
        currency: foreignCurrency,
        amount: foreignAmount,
        related_type: 'conversion',
        related_id: conversionId,
        related_name: customer?.name || '',
        description: draft.note || kindLabel,
        lines: buildConversionLines({
          kind,
          party,
          currencyA: foreignCurrency,
          amountA: foreignAmount,
          accountA: foreignAccount,
          currencyB: baseCurrency,
          amountB: baseAmount,
          accountB: baseAccount,
        }),
        exchange_code: ctx.exchangeCode,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
        date: draft.date,
        client_operation_id: operationId,
        pair_currency: baseCurrency,
        pair_amount: baseAmount,
        rate,
      });

      if (fee > 0 && feeRevenue) {
        await postDocumentInTx(handles, {
          doc_type: 'exchange_fee',
          currency: baseCurrency,
          amount: fee,
          related_type: 'conversion',
          related_id: conversionId,
          related_name: customer?.name || '',
          description: `کمیشن ${kindLabel}`,
          lines: buildFeeLines({
            amount: fee,
            currency: baseCurrency,
            party: customer ? customerRef(customer, baseCurrency) : suspenseRef('', 'حساب واسط تبدیل ارز', baseCurrency),
            revenue: feeRevenue,
          }),
          exchange_code: ctx.exchangeCode,
          registered_by: ctx.userName,
          registered_by_user_id: ctx.userId,
          date: draft.date,
          client_operation_id: `${operationId}-fee`,
        });
      }

      await auditInTx(handles, ctx, 'create', 'conversion', conversionId,
        `ثبت ${kindLabel} و سند دفتر کل ${document.doc_number}`, null, draft);
      return { id: String(conversionId), documentId: document.id };
    });
  }

  // ── روزنامچه: دو سطری و چندسطری ──
  if (module === 'journal') {
    if (draft.id) throw new Error('برای ویرایش سند روزنامچه از همان ردیف انتخاب‌شده استفاده کنید.');
    const currency = draft.currency || 'AFN';
    const rows = Array.isArray(draft.rows) && draft.rows.length
      ? draft.rows
      : [
          { account: draft.debitAccount, debit: draft.amount },
          { account: draft.creditAccount, credit: draft.amount },
        ];
    const resolved = [];
    for (const row of rows) {
      const debit = number(row.debit) || 0;
      const credit = number(row.credit) || 0;
      if (!debit && !credit) continue;
      const account = await resolveLedgerAccount(ctx, row.account, currency);
      resolved.push({ ...account, debit, credit, currency });
    }
    const lines = buildJournalLines({ rows: resolved, currency });
    const totalDebit = resolved.reduce((sum, row) => sum + (number(row.debit) || 0), 0);
    const description = String(draft.description || '').trim() || 'سند روزنامچه';

    return runVersion21Tx([], async handles => {
      await assertNoDuplicateOperation(handles, operationId);
      const document = await postDocumentInTx(handles, {
        doc_type: 'journal',
        currency,
        amount: totalDebit,
        description,
        lines,
        exchange_code: ctx.exchangeCode,
        registered_by: ctx.userName,
        registered_by_user_id: ctx.userId,
        date: draft.date,
        client_operation_id: operationId,
      });
      await auditInTx(handles, ctx, 'create', 'journal', document.id, `ثبت سند روزنامچه ${document.doc_number}`, null, draft);
      return { id: String(document.id), documentId: document.id };
    });
  }

  throw new Error(`فرم «${module}» هنوز به عملیات پایگاه داده متصل نشده است.`);
}

// ── دوره‌های مالی: تعریف و بستن ──
// بازهٔ هر دوره دو سر inclusive است و بستن دوره، تاریخ و نام بسته‌کننده را ثبت می‌کند.
export async function saveFiscalPeriod(draft) {
  const ctx = sessionContext();
  await requireModulePermission(ctx, 'fiscalPeriods', draft?.id ? 'edit' : 'create');
  const rows = (await all('fiscal_periods'))
    .filter(row => !row.exchange_code || row.exchange_code === ctx.exchangeCode);
  const validated = validatePeriodDraft(draft, rows, draft?.id || '');
  const current = draft?.id ? rows.find(row => String(row.id) === String(draft.id)) : null;
  if (draft?.id && !current) throw new Error('دورهٔ مالی برای ویرایش پیدا نشد.');
  if (current && periodIsClosed(current)) throw new Error('دورهٔ مالی بسته‌شده قابل ویرایش نیست.');
  const payload = {
    exchange_code: ctx.exchangeCode,
    period_code: validated.code,
    period_name: validated.name,
    start_date: validated.startDate,
    end_date: validated.endDate,
    status: 'open',
    description: validated.description,
  };
  const result = draft?.id
    ? await update('fiscal_periods', Number(draft.id), payload)
    : await insert('fiscal_periods', payload);
  const auditWarning = await writeAudit(ctx, draft?.id ? 'update' : 'create', 'fiscal_periods', result.id,
    `${draft?.id ? 'ویرایش' : 'تعریف'} دورهٔ مالی ${validated.code}`, current, payload);
  return { id: String(result.id), auditWarning };
}

export async function closeFiscalPeriod(id, reason = '') {
  const ctx = sessionContext();
  await requireModulePermission(ctx, 'fiscalPeriods', 'edit');
  const rows = (await all('fiscal_periods'))
    .filter(row => !row.exchange_code || row.exchange_code === ctx.exchangeCode);
  const current = rows.find(row => String(row.id) === String(id));
  if (!current) throw new Error('دورهٔ مالی پیدا نشد.');
  if (periodIsClosed(current)) throw new Error('این دورهٔ مالی قبلاً بسته شده است.');
  const patch = {
    status: 'closed',
    closed_at: new Date().toISOString(),
    closed_by: ctx.userName,
    closed_by_user_id: ctx.userId,
    close_reason: String(reason || '').trim() || null,
  };
  const result = await update('fiscal_periods', Number(current.id), patch);
  const auditWarning = await writeAudit(ctx, 'update', 'fiscal_periods', result.id,
    `بستن دورهٔ مالی ${current.period_code}`, current, patch);
  return { id: String(result.id), closedAt: patch.closed_at, closedBy: patch.closed_by, auditWarning };
}

// ── کدینگ پایه ──
export async function seedVersion21BaseAccounts() {
  const ctx = sessionContext();
  await requireModulePermission(ctx, 'accounts', 'create');
  const seeds = [
    { code: '1000', name: 'دارایی‌ها', type: 'asset', normal: 'debit' },
    { code: '1010', name: 'صندوق‌ها', type: 'asset', normal: 'debit', parent: '1000' },
    { code: '1020', name: 'حساب‌های بانکی', type: 'asset', normal: 'debit', parent: '1000' },
    { code: '1030', name: 'مطالبات مشتریان', type: 'asset', normal: 'debit', parent: '1000' },
    { code: '2000', name: 'بدهی‌ها', type: 'liability', normal: 'credit' },
    { code: '2010', name: 'بدهی به مشتریان', type: 'liability', normal: 'credit', parent: '2000' },
    { code: '3000', name: 'سرمایه', type: 'equity', normal: 'credit' },
    { code: '4000', name: 'درآمدها', type: 'revenue', normal: 'credit' },
    { code: '4010', name: 'درآمد کمیشن حواله', type: 'revenue', normal: 'credit', parent: '4000' },
    { code: '4020', name: 'درآمد معاملات اسعار', type: 'revenue', normal: 'credit', parent: '4000' },
    { code: '5000', name: 'مصارف', type: 'expense', normal: 'debit' },
    { code: '5010', name: 'مصارف عملیاتی', type: 'expense', normal: 'debit', parent: '5000' },
    { code: '5020', name: 'زیان معاملات اسعار', type: 'expense', normal: 'debit', parent: '5000' },
  ];
  const existing = await tenantRows('chart_of_accounts', ctx);
  const ids = new Map(existing.map(row => [String(row.account_code), Number(row.id)]));
  let created = 0;
  for (const row of seeds.filter(item => !item.parent && !ids.has(item.code))) {
    const saved = await insert('chart_of_accounts', {
      exchange_code: ctx.exchangeCode, account_code: row.code, account_name: row.name,
      account_type: row.type, normal_balance: row.normal, is_system: true, is_active: true,
    });
    ids.set(row.code, saved.id);
    created += 1;
  }
  for (const row of seeds.filter(item => item.parent && !ids.has(item.code))) {
    const parentId = ids.get(row.parent);
    if (!parentId) throw new Error('حساب مادر ' + row.parent + ' پیدا نشد؛ کدینگ پایه کامل نشد.');
    const saved = await insert('chart_of_accounts', {
      exchange_code: ctx.exchangeCode, account_code: row.code, account_name: row.name,
      account_type: row.type, normal_balance: row.normal, parent_id: parentId,
      is_system: true, is_active: true,
    });
    ids.set(row.code, saved.id);
    created += 1;
  }
  const auditWarning = await writeAudit(ctx, 'create', 'chart_of_accounts', '', 'ایجاد کدینگ پایه حساب‌های نسخهٔ ۲۱', null, { accountCodes: seeds.map(row => row.code) });
  return { created, total: seeds.length, auditWarning };
}

// ── بارگذاری رکورد برای ویرایش ──
export async function loadVersion21RecordForEdit(module, record) {
  if (!record?.id) throw new Error('ردیف انتخاب‌شده معتبر نیست.');
  const [documents, ledger, chartAccounts, transfers, conversions] = await Promise.all([
    all('documents'), all('ledger_entries'), all('chart_of_accounts'), all('transfers'), all('conversions'),
  ]);
  const chartById = new Map(chartAccounts.map(row => [String(row.id), row]));
  const dayOf = value => (value ? String(value).slice(0, 10) : new Date().toLocaleDateString('en-CA'));
  const accountLabel = line => {
    if (!line) return '';
    if (line.account_type === 'cash') return `صندوق: ${line.account_name}`;
    if (line.account_type === 'bank') return `بانک: ${line.account_id}`;
    const chart = chartById.get(String(line.account_id));
    return chart ? `${chart.account_code} — ${chart.account_name}` : line.account_name;
  };

  if (module === 'remittance') {
    const transfer = transfers.find(row => Number(row.id) === Number(record.id));
    if (!transfer) throw new Error('حواله برای ویرایش پیدا نشد.');
    const main = documents.find(doc => Number(doc.transfer_id) === Number(transfer.id) && doc.doc_type === 'transfer');
    if (!main) throw new Error('سند اصلی حواله پیدا نشد؛ ویرایش امن ممکن نیست.');
    if (main.reversed) throw new Error('این حواله ابطال شده است و قابل ویرایش نیست.');
    const feeDoc = documents.find(doc => doc.doc_type === 'transfer_fee' && doc.related_type === 'transfer' && Number(doc.related_id) === Number(transfer.id) && !doc.reversed);
    return {
      id: String(transfer.id),
      date: dayOf(transfer.created_at || main.created_at),
      direction: transfer.direction === 'receive' ? 'دریافتی' : 'ارسالی',
      sender: transfer.sender_name || '',
      receiver: transfer.receiver_name || '',
      branch: transfer.origin || '',
      currency: transfer.currency || 'AFN',
      amount: number(transfer.amount),
      fee: feeDoc ? number(feeDoc.amount) : number(transfer.fee),
      rate: number(transfer.rate) || '',
      note: transfer.destination || '',
      settlement: transfer.settlement_mode === 'instant' ? 'instant' : 'suspense',
      settleType: transfer.settle_type === 'bank' ? 'bank' : 'cash',
      cash: transfer.settle_type === 'cash' ? (transfer.settle_account_name || '') : '',
      bank: transfer.settle_type === 'bank' ? String(transfer.settle_account_id || '') : '',
      documentId: main.id,
    };
  }

  if (module === 'expenses') {
    const document = documents.find(doc => Number(doc.id) === Number(record.documentId || record.id));
    if (!document) throw new Error('سند مصرف پیدا نشد.');
    if (document.reversed) throw new Error('این مصرف ابطال شده است و قابل ویرایش نیست.');
    const lines = ledger.filter(line => Number(line.document_id) === Number(document.id) && !line.deleted);
    const payerLine = lines.find(line => ['cash', 'bank'].includes(line.account_type));
    const expenseLine = lines.find(line => line.account_type === 'suspense');
    return {
      id: String(document.id),
      date: dayOf(document.created_at),
      title: document.description || '',
      currency: document.currency || 'AFN',
      amount: number(document.amount),
      expenseAccount: expenseLine ? accountLabel(expenseLine) : '',
      payerType: payerLine?.account_type === 'bank' ? 'bank' : 'cash',
      cash: payerLine?.account_type === 'cash' ? payerLine.account_name : '',
      bank: payerLine?.account_type === 'bank' ? String(payerLine.account_id) : '',
      note: '',
    };
  }

  if (module === 'journal') {
    const documentId = Number(record.documentId || record.id);
    const document = documents.find(doc => Number(doc.id) === documentId);
    if (!document) throw new Error('سند روزنامچه پیدا نشد.');
    if (document.reversed) throw new Error('این سند ابطال شده است و قابل ویرایش نیست.');
    const lines = ledger.filter(line => Number(line.document_id) === documentId && !line.deleted);
    return {
      id: String(document.id),
      date: dayOf(document.created_at),
      description: document.description || '',
      currency: document.currency || 'AFN',
      journalMode: lines.length > 2 ? 'multi' : 'simple',
      rows: lines.map(line => ({ account: accountLabel(line), debit: number(line.debit) || '', credit: number(line.credit) || '' })),
    };
  }

  if (module === 'exchange') {
    const conversion = conversions.find(row => Number(row.id) === Number(record.id));
    if (!conversion) throw new Error('معامله برای ویرایش پیدا نشد.');
    const document = documents.find(doc => doc.related_type === 'conversion' && Number(doc.related_id) === Number(conversion.id) && !doc.reversed && doc.doc_type !== 'exchange_fee');
    if (!document) throw new Error('سند دفتر کل این معامله پیدا نشد؛ ویرایش امن ممکن نیست.');
    const lines = ledger.filter(line => Number(line.document_id) === Number(document.id) && !line.deleted);
    const cashLines = lines.filter(line => line.account_type === 'cash');
    const foreignLine = cashLines.find(line => line.currency === (conversion.from_currency || 'USD'));
    const baseLine = cashLines.find(line => line.currency === (conversion.to_currency || 'AFN'));
    const feeDoc = documents.find(doc => doc.doc_type === 'exchange_fee' && doc.related_type === 'conversion' && Number(doc.related_id) === Number(conversion.id) && !doc.reversed);
    return {
      id: String(conversion.id),
      date: dayOf(conversion.created_at || document.created_at),
      kind: conversion.kind || 'convert',
      party: conversion.customer_name && conversion.customer_id ? conversion.customer_name : '',
      foreignCurrency: conversion.from_currency || 'USD',
      foreignAmount: number(conversion.from_amount),
      baseCurrency: conversion.to_currency || 'AFN',
      baseAmount: number(conversion.to_amount),
      foreignCash: foreignLine?.account_name || conversion.cash_from || '',
      baseCash: baseLine?.account_name || conversion.cash_to || '',
      fee: feeDoc ? number(feeDoc.amount) : '',
      note: conversion.description || '',
      documentId: document.id,
    };
  }

  throw new Error('ویرایش این نوع رکورد از این بخش پشتیبانی نمی‌شود.');
}

// ── ویرایش: جایگزینی اتمیک سطرها ──
export async function editVersion21Record(module, draft) {
  if (draft?.date) documentDateTimestamp(draft.date);
  const ctx = sessionContext();
  if (!draft?.id) throw new Error('شناسهٔ رکورد برای ویرایش موجود نیست.');
  await requireModulePermission(ctx, module, 'edit');
  await assertFinancialDateOpen(ctx, draft?.date, module);

  if (TABLES[module]) return saveVersion21Record(module, draft);

  if (module === 'expenses') {
    const currency = draft.currency || 'AFN';
    const amount = positive(draft.amount, 'مبلغ مصرف باید عدد معتبر و بزرگ‌تر از صفر باشد.');
    const expense = draft.expenseAccount ? await resolveLedgerAccount(ctx, draft.expenseAccount, currency) : await defaultExpenseRef(ctx);
    const payerType = draft.payerType === 'bank' ? 'bank' : 'cash';
    const payer = payerType === 'bank' ? await bankRef(ctx, draft.bank, currency) : await safeRef(ctx, draft.cash, currency);
    const lines = buildExpenseLines({ amount, currency, expense, payer });

    return runVersion21Tx([], async handles => {
      await replaceDocumentLinesInTx(handles, Number(draft.id), {
        lines,
        description: String(draft.title || draft.note || '').trim() || 'مصرف',
        amount,
        currency,
        user: ctx.userName,
        note: 'ویرایش مصرف',
      });
      await auditInTx(handles, ctx, 'update', 'expense', draft.id, 'ویرایش مصرف و جایگزینی سطرهای دفتر کل', null, draft);
      return { id: String(draft.id), documentId: Number(draft.id) };
    });
  }

  if (module === 'journal') {
    const currency = draft.currency || 'AFN';
    const rows = Array.isArray(draft.rows) && draft.rows.length ? draft.rows : [];
    const resolved = [];
    for (const row of rows) {
      const debit = number(row.debit) || 0;
      const credit = number(row.credit) || 0;
      if (!debit && !credit) continue;
      const account = await resolveLedgerAccount(ctx, row.account, currency);
      resolved.push({ ...account, debit, credit, currency });
    }
    const lines = buildJournalLines({ rows: resolved, currency });
    const totalDebit = resolved.reduce((sum, row) => sum + (number(row.debit) || 0), 0);

    return runVersion21Tx([], async handles => {
      await replaceDocumentLinesInTx(handles, Number(draft.id), {
        lines,
        description: String(draft.description || '').trim() || 'سند روزنامچه',
        amount: totalDebit,
        currency,
        user: ctx.userName,
        note: 'ویرایش سند روزنامچه',
      });
      await auditInTx(handles, ctx, 'update', 'journal', draft.id, 'ویرایش سند روزنامچه و جایگزینی سطرها', null, draft);
      return { id: String(draft.id), documentId: Number(draft.id) };
    });
  }

  if (module === 'exchange') {
    const conversion = (await all('conversions')).find(row => Number(row.id) === Number(draft.id));
    if (!conversion) throw new Error('معامله برای ویرایش پیدا نشد.');
    const documents = await all('documents');
    const document = documents.find(doc => doc.related_type === 'conversion' && Number(doc.related_id) === Number(draft.id) && doc.doc_type !== 'exchange_fee' && !doc.reversed);
    if (!document) throw new Error('سند دفتر کل این معامله پیدا نشد یا ابطال شده است؛ ویرایش متوقف شد.');
    const kind = ['convert', 'buy', 'sell'].includes(draft.kind) ? draft.kind : (conversion.kind || 'convert');
    const foreignCurrency = draft.foreignCurrency || 'USD';
    const baseCurrency = draft.baseCurrency || 'AFN';
    if (foreignCurrency === baseCurrency) throw new Error('ارز دو طرف معامله باید متفاوت باشد.');
    const foreignAmount = positive(draft.foreignAmount, 'مبلغ ارز خارجی معتبر و مثبت باشد.');
    const baseAmount = positive(draft.baseAmount, 'مبلغ ارز پایه معتبر و مثبت باشد.');
    const customer = draft.party ? await getCustomer(ctx, draft.party) : null;
    if (kind !== 'convert' && !customer) throw new Error('برای خرید یا فروش اسعار، طرف حساب الزامی است.');
    const foreignAccount = await safeRef(ctx, draft.foreignCash, foreignCurrency);
    const baseAccount = await safeRef(ctx, draft.baseCash, baseCurrency);
    const party = customer ? customerRef(customer, foreignCurrency) : suspenseRef('', 'حساب واسط تبدیل ارز', foreignCurrency);
    const fee = nonNegative(draft.fee ?? 0, 'کمیشن معامله باید صفر یا مثبت باشد.');
    const feeRevenue = fee > 0 ? await revenueRef(ctx, '4020', 'درآمد معاملات اسعار') : null;
    const lines = buildConversionLines({
      kind,
      party,
      currencyA: foreignCurrency,
      amountA: foreignAmount,
      accountA: foreignAccount,
      currencyB: baseCurrency,
      amountB: baseAmount,
      accountB: baseAccount,
    });
    const feeDoc = documents.find(doc => doc.doc_type === 'exchange_fee' && doc.related_type === 'conversion' && Number(doc.related_id) === Number(draft.id) && !doc.reversed);

    return runVersion21Tx(['conversions'], async handles => {
      await replaceDocumentLinesInTx(handles, document.id, {
        lines,
        description: draft.note || 'معاملهٔ اسعار',
        amount: foreignAmount,
        currency: foreignCurrency,
        user: ctx.userName,
        note: 'ویرایش معاملهٔ اسعار',
      });
      if (fee > 0 && feeRevenue) {
        const feeLines = buildFeeLines({
          amount: fee,
          currency: baseCurrency,
          party: customer ? customerRef(customer, baseCurrency) : suspenseRef('', 'حساب واسط تبدیل ارز', baseCurrency),
          revenue: feeRevenue,
        });
        if (feeDoc) {
          await replaceDocumentLinesInTx(handles, feeDoc.id, { lines: feeLines, description: 'کمیشن معاملهٔ اسعار', amount: fee, currency: baseCurrency, user: ctx.userName, note: 'ویرایش کمیشن معامله' });
        } else {
          await postDocumentInTx(handles, {
            doc_type: 'exchange_fee', currency: baseCurrency, amount: fee,
            related_type: 'conversion', related_id: Number(draft.id), related_name: customer?.name || '',
            description: 'کمیشن معاملهٔ اسعار', lines: feeLines,
            exchange_code: ctx.exchangeCode, registered_by: ctx.userName, registered_by_user_id: ctx.userId, date: draft.date,
          });
        }
      } else if (feeDoc) {
        await reverseDocumentInTx(handles, feeDoc.id, { reason: 'کمیشن معامله در ویرایش حذف شد', registeredBy: ctx.userName, exchangeCode: ctx.exchangeCode });
      }
      const fresh = await handles.conversions.get(Number(draft.id));
      await handles.conversions.put({
        ...fresh,
        kind,
        customer_id: customer?.id || null,
        customer_name: customer?.name || 'مشتری نقدی',
        from_currency: foreignCurrency,
        from_amount: foreignAmount,
        rate: baseAmount / foreignAmount,
        to_currency: baseCurrency,
        to_amount: baseAmount,
        cash_from: foreignAccount.account_name,
        cash_to: baseAccount.account_name,
        description: draft.note || 'معاملهٔ اسعار',
        updated_at: todayIso(),
      });
      await auditInTx(handles, ctx, 'update', 'conversion', draft.id, 'ویرایش معاملهٔ اسعار و اسناد مرتبط', conversion, draft);
      return { id: String(draft.id), documentId: document.id };
    });
  }

  if (module === 'remittance') {
    const transfer = (await all('transfers')).find(row => Number(row.id) === Number(draft.id));
    if (!transfer) throw new Error('حواله برای ویرایش پیدا نشد.');
    const direction = String(draft.direction || '').trim();
    if (!['ارسالی', 'دریافتی'].includes(direction)) throw new Error('نوع حواله باید صریحاً «ارسالی» یا «دریافتی» باشد.');
    if (!draft.sender || !draft.receiver) throw new Error('فرستنده و گیرنده الزامی است.');
    const amount = positive(draft.amount, 'مبلغ حواله باید معتبر و مثبت باشد.');
    const fee = nonNegative(draft.fee ?? 0, 'کمیشن حواله باید صفر یا مثبت باشد.');
    const currency = draft.currency || 'AFN';
    const customer = await getCustomer(ctx, direction === 'دریافتی' ? draft.receiver : draft.sender);
    if (!customer) throw new Error('طرف حساب حواله باید از مشتریان ثبت‌شدهٔ همین صراف باشد.');
    const { settlement, settleType, counter } = await remittanceSettlement(ctx, draft, currency);
    const revenue = fee > 0 ? await revenueRef(ctx, '4010', 'درآمد کمیشن حواله') : null;
    const documents = await all('documents');
    const main = documents.find(doc => Number(doc.transfer_id) === Number(draft.id) && doc.doc_type === 'transfer');
    if (!main) throw new Error('سند اصلی حواله پیدا نشد؛ ویرایش امن ممکن نیست.');
    if (main.reversed) throw new Error('حوالهٔ ابطال‌شده قابل ویرایش نیست.');
    const feeDoc = documents.find(doc => doc.doc_type === 'transfer_fee' && doc.related_type === 'transfer' && Number(doc.related_id) === Number(draft.id) && !doc.reversed);
    const counterLine = counter ? counter : suspenseRef(String(draft.id), 'حواله در جریان', currency);
    const lines = buildRemittanceLines({ direction, amount, currency, party: customerRef(customer, currency), counter: counterLine });

    return runVersion21Tx(['transfers'], async handles => {
      await replaceDocumentLinesInTx(handles, main.id, {
        lines,
        description: draft.note || `حواله ${direction}`,
        amount,
        currency,
        user: ctx.userName,
        note: 'ویرایش حواله',
      });

      if (fee > 0 && revenue) {
        const feeLines = buildFeeLines({ amount: fee, currency, party: customerRef(customer, currency), revenue });
        if (feeDoc) {
          await replaceDocumentLinesInTx(handles, feeDoc.id, {
            lines: feeLines,
            description: `کمیشن حواله ${transfer.transfer_number}`,
            amount: fee,
            currency,
            user: ctx.userName,
            note: 'ویرایش کمیشن حواله',
          });
        } else {
          await postDocumentInTx(handles, {
            doc_type: 'transfer_fee', currency, amount: fee,
            related_type: 'transfer', related_id: Number(draft.id), related_name: customer.name,
            description: `کمیشن حواله ${transfer.transfer_number}`, lines: feeLines,
            transfer_id: Number(draft.id), exchange_code: ctx.exchangeCode,
            registered_by: ctx.userName, registered_by_user_id: ctx.userId, date: draft.date,
          });
        }
      } else if (feeDoc) {
        await reverseDocumentInTx(handles, feeDoc.id, { reason: 'کمیشن حواله در ویرایش حذف شد', registeredBy: ctx.userName, exchangeCode: ctx.exchangeCode });
      }

      const fresh = await handles.transfers.get(Number(draft.id));
      await handles.transfers.put({
        ...fresh,
        sender_name: draft.sender,
        receiver_name: draft.receiver,
        amount,
        currency,
        fee,
        fee_currency: currency,
        total: amount + fee,
        direction: direction === 'دریافتی' ? 'receive' : 'send',
        origin: draft.branch || '',
        destination: draft.note || draft.branch || '',
        ...settlementMeta(settlement, settleType, counter),
        updated_at: todayIso(),
      });

      await auditInTx(handles, ctx, 'update', 'transfer', draft.id, 'ویرایش حواله و اسناد مرتبط', transfer, draft);
      return { id: String(draft.id), documentId: main.id };
    });
  }

  if (module === 'transactions') {
    const documentId = Number(draft.documentId || 0);
    if (!documentId) throw new Error('سند اصلی این گردش پیدا نشد.');
    const source = await get('documents', documentId);
    if (!source) throw new Error('سند اصلی گردش در همین صراف پیدا نشد.');
    const oldLines = (await all('ledger_entries')).filter(line => Number(line.document_id) === documentId && !line.deleted);
    const oldCash = oldLines.find(line => line.account_type === 'cash');
    if (!oldCash?.account_id) throw new Error('صندوق متناظر این سند مشخص نیست؛ ویرایش متوقف شد.');
    const amount = number(draft.amount);
    if (!amount) throw new Error('مبلغ گردش نمی‌تواند صفر باشد.');
    const currency = draft.currency || oldCash.currency || 'AFN';
    const customer = draft.partyType === 'customer' ? await getCustomer(ctx, draft.party) : null;
    const branch = draft.partyType === 'branch' ? await getBranch(ctx, draft.party) : null;
    if (draft.partyType === 'customer' && !customer) throw new Error('مشتری انتخاب‌شده پیدا نشد؛ ویرایش متوقف شد.');
    if (draft.partyType === 'branch' && !branch) throw new Error('نمایندگی انتخاب‌شده پیدا نشد؛ ویرایش متوقف شد.');
    const cash = { account_type: 'cash', account_id: String(oldCash.account_id), account_name: oldCash.account_name, currency };
    const other = customer
      ? customerRef(customer, currency)
      : branch
        ? suspenseRef(String(branch.id), branch.name, currency)
        : suspenseRef('', String(draft.party || '').trim(), currency);
    const lines = amount > 0
      ? [{ ...cash, debit: amount, credit: 0 }, { ...other, debit: 0, credit: amount }]
      : [{ ...other, debit: Math.abs(amount), credit: 0 }, { ...cash, debit: 0, credit: Math.abs(amount) }];

    return runVersion21Tx([], async handles => {
      await replaceDocumentLinesInTx(handles, documentId, {
        lines,
        description: draft.description || source.description,
        amount: Math.abs(amount),
        currency,
        user: ctx.userName,
        note: 'ویرایش گردش',
      });
      await auditInTx(handles, ctx, 'update', 'cash_transaction', documentId, 'ویرایش گردش و جایگزینی سطرهای دفتر کل', null, draft);
      return { id: String(documentId), documentId };
    });
  }

  throw new Error(`ویرایش واقعی برای بخش ${module} هنوز تعریف نشده است.`);
}

// ── ابطال: سند معکوس برای سند اصلی و همهٔ اسناد وابسته در یک تراکنش ──
function linkedDocuments(module, record, documents) {
  if (module === 'remittance') {
    return documents.filter(doc => !doc.deleted && Number(doc.transfer_id) === Number(record.id));
  }
  if (module === 'exchange') {
    return documents.filter(doc => !doc.deleted && doc.related_type === 'conversion' && Number(doc.related_id) === Number(record.id));
  }
  const documentId = Number(record.documentId || record.id);
  return documents.filter(doc => !doc.deleted && Number(doc.id) === documentId);
}

export async function reverseVersion21Record(module, record, reason) {
  const ctx = sessionContext();
  if (!record?.id) throw new Error('رکورد انتخاب‌شده معتبر نیست.');
  await requireModulePermission(ctx, module, 'delete');
  const reasonText = assertReason(reason);
  const documents = await all('documents');
  const linked = linkedDocuments(module, record, documents);
  if (!linked.length) throw new Error('سند مالی مرتبط پیدا نشد؛ هیچ تغییری ثبت نشد.');
  const active = linked.filter(doc => !doc.reversed);
  if (!active.length) throw new Error('همهٔ اسناد مرتبط قبلاً ابطال شده‌اند؛ عملیات تکرار نشد.');

  return runVersion21Tx(['transfers', 'conversions'], async handles => {
    const reversed = [];
    for (const doc of active) {
      const reversal = await reverseDocumentInTx(handles, doc.id, {
        reason: reasonText,
        registeredBy: ctx.userName,
        registeredByUserId: ctx.userId,
        exchangeCode: ctx.exchangeCode,
      });
      reversed.push({ documentId: doc.id, docNumber: doc.doc_number, reversalNumber: reversal.doc_number });
    }

    if (module === 'remittance') {
      const transfer = await handles.transfers.get(Number(record.id));
      if (transfer) await handles.transfers.put({ ...transfer, status: 'reversed', updated_at: todayIso() });
    }
    if (module === 'exchange') {
      const conversion = await handles.conversions.get(Number(record.id));
      if (conversion) await handles.conversions.put({ ...conversion, status: 'reversed', updated_at: todayIso() });
    }

    await auditInTx(handles, ctx, 'reverse', module, record.id,
      `ابطال ${reversed.length} سند مرتبط — ${reasonText}`, null, { reversed });
    return { reversed: true, reversedCount: reversed.length, documents: reversed, warning: '' };
  });
}

export async function deleteVersion21Record(module, record) {
  const ctx = sessionContext();
  if (!record?.id) throw new Error('رکورد انتخاب‌شده معتبر نیست.');
  await requireModulePermission(ctx, module, 'delete');
  if (['customerLedger', 'branchLedger', 'reports', 'profit', 'balance', 'activity', 'ledger'].includes(module)) {
    throw new Error('این صفحه گزارش یا دفتر تجمیعی است؛ رکورد اصلی از این بخش قابل ابطال نیست.');
  }
  if (!['remittance', 'exchange', 'expenses', 'journal', 'transactions', 'cashAction', 'settlement'].includes(module)) {
    throw new Error('حذف فیزیکی اطلاعات در نسخهٔ ۲۱ غیرفعال است؛ برای حفظ سوابق، رکورد را غیرفعال کنید.');
  }
  return reverseVersion21Record(module, record, 'ابطال از نسخهٔ ۲۱ با ثبت سند معکوس');
}

const MASTER_RECORD_DEACTIVATION = {
  customers: { table: 'customers', patch: { status: 'inactive' } },
  branches: { table: 'origins', patch: { is_active: false } },
  cash: { table: 'safes', patch: { active: false } },
  banks: { table: 'bank_accounts', patch: { active: false } },
  currencies: { table: 'rates', patch: { is_active: false } },
  accounts: { table: 'chart_of_accounts', patch: { is_active: false } },
};

export async function deactivateVersion21MasterRecord(module, record) {
  const ctx = sessionContext();
  if (!record?.id) throw new Error('رکورد انتخاب‌شده معتبر نیست.');
  const config = MASTER_RECORD_DEACTIVATION[module];
  if (!config) throw new Error('غیرفعال‌سازی برای این نوع رکورد تعریف نشده است.');
  await requireModulePermission(ctx, module, 'delete');
  await update(config.table, Number(record.id), config.patch);
  const auditWarning = await writeAudit(ctx, 'deactivate', module, record.id, 'غیرفعال‌سازی اطلاعات پایه؛ سابقه و ارتباطات حفظ شد', record, config.patch);
  return { deactivated: true, auditWarning };
}

export async function captureVersion21Error(error, area = 'Version21Workspace') {
  try {
    const ctx = sessionContext();
    await insert('error_reports', {
      user_id: String(ctx.userId),
      exchange_code: ctx.exchangeCode,
      error_type: area,
      error_message: String(error?.message || error || 'Unknown error').slice(0, 4000),
      stack_trace: String(error?.stack || '').slice(0, 12000),
      device: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      app_version: '21',
      status: 'new',
    });
  } catch {
    // diagnostics must never hide the original operation error
  }
}