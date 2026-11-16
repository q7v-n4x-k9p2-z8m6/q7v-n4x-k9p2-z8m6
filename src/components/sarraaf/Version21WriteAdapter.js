import { supabase } from '@/lib/supabaseClient';
import { getExchangeCode } from '@/lib/supabaseApi';

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
  expenses: 'cash',
  exchange: 'trade',
  journal: 'journal',
  transactions: 'accounts_receivable',
};

async function requireModulePermission(ctx, module, action) {
  // Never trust the role cached in localStorage for authorization.
  // Read the current user's role under the own-user RLS policy.
  const { data: verifiedUser, error: roleError } = await supabase.from('users')
    .select('role').eq('id', ctx.userId).maybeSingle();
  if (roleError) throw new Error('تأیید نقش کاربر ناموفق بود: ' + roleError.message);
  if (!verifiedUser?.role) throw new Error('نقش معتبر کاربر از سرور دریافت نشد؛ عملیات متوقف شد.');
  const role = String(verifiedUser.role).toLowerCase();
  if (['creator', 'admin', 'exchange', 'sarraaf'].includes(role)) return;
  if (role !== 'employee') throw new Error('این نقش اجازه اجرای عملیات نسخه ۲۱ را ندارد.');

  const section = PERMISSION_SECTION_BY_MODULE[module];
  if (!section) throw new Error('این بخش برای نقش کارمند مجوز عملیاتی تعریف‌شده ندارد.');
  const { data, error } = await supabase.from('user_permissions')
    .select('section,can_view,can_create,can_edit,can_delete')
    .eq('user_id', String(ctx.userId))
    .eq('section', section)
    .maybeSingle();
  if (error) throw new Error('بررسی مجوز کارمند ناموفق بود: ' + error.message);
  const flag = action === 'create' ? 'can_create'
    : action === 'edit' ? 'can_edit'
      : action === 'delete' ? 'can_delete'
        : 'can_view';
  if (!data || data.can_view !== true || data[flag] !== true) {
    throw new Error('برای این عملیات مجوز کافی از مدیر صرافی دریافت نشده است.');
  }
}

const number = value => Number(value ?? 0) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const makeOperationId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `v21-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

function validateBalancedLines(lines, label = 'سند') {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error(`${label}: حداقل دو سطر حسابداری لازم است.`);
  }
  const totals = new Map();
  for (const [index, line] of lines.entries()) {
    const currency = String(line.currency || 'AFN').trim().toUpperCase();
    const debit = number(line.debit);
    const credit = number(line.credit);
    if (!currency || !Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      throw new Error(`${label}: مبلغ یا ماهیت بدهکار/بستانکار در سطر ${index + 1} معتبر نیست.`);
    }
    if (!line.account_type || !line.account_name) {
      throw new Error(`${label}: حساب سطر ${index + 1} مشخص نشده است.`);
    }
    if (['cash', 'customer'].includes(String(line.account_type)) && !(Number(line.account_id) > 0)) {
      throw new Error(`${label}: شناسه حساب مرتبط در سطر ${index + 1} معتبر نیست.`);
    }
    const total = totals.get(currency) || { debit: 0, credit: 0 };
    total.debit += debit;
    total.credit += credit;
    totals.set(currency, total);
  }
  for (const [currency, total] of totals) {
    if (Math.abs(total.debit - total.credit) > 0.004) {
      throw new Error(`${label}: سند در ارز ${currency} تراز نیست؛ جمع بدهکار و بستانکار باید برابر باشد.`);
    }
  }
}

function sessionContext() {
  const exchangeCode = getExchangeCode();
  let user = {};
  try { user = JSON.parse(localStorage.getItem('auth_user') || '{}') || {}; } catch { user = {}; }
  const userId = Number(user.id || 0);
  if (!exchangeCode || !Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('نشست معتبر صراف پیدا نشد. دوباره وارد حساب شوید.');
  }
  return {
    exchangeCode,
    userId,
    userName: user.full_name || user.name || user.username || 'کاربر',
    userType: user.role || 'exchange',
  };
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
        notes: draft.description || null, active: true,
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
        description: draft.description || null, is_active: true,
      };
    default:
      throw new Error(`فرم ${module} هنوز به جدول واقعی نگاشت نشده است.`);
  }
}

async function writeAudit(ctx, action, entityType, entityId, description, oldValues, newValues) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: ctx.userId,
    registered_by_user_id: ctx.userId,
    user_name: ctx.userName,
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
  if (error) return error.message;
  return null;
}

async function getSafeById(ctx, id) {
  const { data, error } = await supabase.from('safes').select('id,name,currency')
    .eq('exchange_code', ctx.exchangeCode).eq('id', Number(id)).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('صندوق مرتبط با سند پیدا نشد.');
  return data;
}

async function getSafe(ctx, name, currency) {
  const { data, error } = await supabase.from('safes').select('id,name,currency')
    .eq('exchange_code', ctx.exchangeCode).eq('name', name).eq('currency', currency).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('صندوق انتخاب‌شده در همین صرافی و با همین ارز پیدا نشد.');
  return data;
}

async function getBranch(ctx, name) {
  if (!name) return null;
  const { data, error } = await supabase.from('origins').select('id,name')
    .eq('exchange_code', ctx.exchangeCode).eq('name', name).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function getCustomer(ctx, name) {
  if (!name) return null;
  const { data, error } = await supabase.from('customers').select('id,name,mobile')
    .eq('exchange_code', ctx.exchangeCode).eq('name', name).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function resolveLedgerAccount(ctx, label, currency) {
  const value = String(label || '');
  if (value.startsWith('صندوق: ')) {
    const safe = await getSafe(ctx, value.slice(7), currency);
    return { account_type: 'cash', account_id: String(safe.id), account_name: safe.name };
  }
  const accountCode = value.includes(' — ') ? value.split(' — ')[0] : '';
  let query = supabase.from('chart_of_accounts').select('id,account_code,account_name').eq('exchange_code', ctx.exchangeCode);
  query = accountCode ? query.eq('account_code', accountCode) : query.eq('account_name', value);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`حساب «${value}» در کدینگ همین صرافی پیدا نشد.`);
  return { account_type: 'suspense', account_id: String(data.id), account_name: data.account_name };
}

async function postDocument(ctx, {
  docType, currency, amount, fee = 0, relatedType = 'none', relatedId = null,
  relatedName = '', description = '', lines, clientOperationId = makeOperationId(),
}) {
  validateBalancedLines(lines, 'ثبت سند');
  const { data, error } = await supabase.rpc('post_document_transaction', {
    p_exchange_code: ctx.exchangeCode,
    p_doc_type: docType,
    p_currency: currency,
    p_amount: number(amount),
    p_fee: number(fee),
    p_related_type: relatedType,
    p_related_id: relatedId,
    p_related_name: relatedName,
    p_description: description,
    p_registered_by: ctx.userName,
    p_lines: lines.map((line, index) => ({
      ...line, line_no: index + 1, currency: line.currency || currency,
      debit: number(line.debit), credit: number(line.credit),
      description: line.description || description,
    })),
    p_transfer_id: null,
    p_user_id: ctx.userId,
    p_client_operation_id: clientOperationId,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

async function applyDocumentDate(ctx, documentId, date, linkedTable = null, linkedId = null) {
  if (!date || !documentId) return '';
  const timestamp = new Date(`${date}T12:00:00.000Z`).toISOString();
  const warnings = [];
  const { error: documentError } = await supabase.from('documents').update({ created_at: timestamp })
    .eq('id', Number(documentId)).eq('exchange_code', ctx.exchangeCode);
  if (documentError) warnings.push(documentError.message);
  const { error: ledgerError } = await supabase.from('ledger_entries').update({ created_at: timestamp })
    .eq('document_id', Number(documentId)).eq('exchange_code', ctx.exchangeCode);
  if (ledgerError) warnings.push(ledgerError.message);
  if (linkedTable && linkedId) {
    const { error: linkedError } = await supabase.from(linkedTable).update({ created_at: timestamp })
      .eq('id', Number(linkedId)).eq('exchange_code', ctx.exchangeCode);
    if (linkedError) warnings.push(linkedError.message);
  }
  return warnings.join(' | ');
}

export async function saveVersion21Record(module, draft) {
  const ctx = sessionContext();
  await requireModulePermission(ctx, module, draft?.id ? 'edit' : 'create');
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
    if (module === 'accounts' && !payload.account_code) throw new Error('کد حساب الزامی است.');
    if (module === 'currencies' && !payload.currency) throw new Error('کد ارز الزامی است.');
    if (module === 'currencies' && (!Number.isFinite(payload.buy_rate) || !Number.isFinite(payload.sell_rate) || payload.buy_rate <= 0 || payload.sell_rate <= 0)) {
      throw new Error('نرخ خرید و فروش باید عدد معتبر و بزرگ‌تر از صفر باشد.');
    }
    let result;
    if (draft.id) {
      const { data, error } = await supabase.from(table).update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('رکورد برای ویرایش پیدا نشد یا دسترسی این صرافی به آن مجاز نیست.');
      result = data;
    } else {
      const { data, error } = await supabase.from(table).insert(payload).select('id').single();
      if (error) throw error;
      result = data;
    }
    const auditWarning = await writeAudit(ctx, draft.id ? 'update' : 'create', module, result.id,
      `${draft.id ? 'ویرایش' : 'ثبت'} ${module} · ${payload.name || payload.account_name || payload.currency || ''}`,
      null, payload);
    return { id: String(result.id), auditWarning };
  }

  if (module === 'remittance') {
    const transferAmount = number(draft.amount);
    const transferFee = number(draft.fee);
    const transferRate = number(draft.rate);
    if (!draft.sender || !draft.receiver || !Number.isFinite(transferAmount) || transferAmount <= 0) throw new Error('فرستنده، گیرنده و مبلغ معتبر و مثبت الزامی است.');
    if (!Number.isFinite(transferFee) || transferFee < 0) throw new Error('کمیشن حواله معتبر نیست.');
    if (draft.rate && (!Number.isFinite(transferRate) || transferRate <= 0)) throw new Error('نرخ حواله باید عدد معتبر و مثبت باشد.');
    if (draft.id) throw new Error('برای اصلاح حواله ثبت‌شده، ابتدا باید گردش آن معکوس و حواله اصلاحی صادر شود؛ ویرایش مستقیم حواله مالی مجاز نیست.');
    const customer = await getCustomer(ctx, draft.direction === 'دریافتی' ? draft.receiver : draft.sender);
    if (!customer) throw new Error('برای ثبت حواله، طرف حساب باید ابتدا در فهرست مشتریان همین صراف ثبت شده باشد؛ از ایجاد سطر دفتر کل بدون شناسه مشتری جلوگیری شد.');
    const branch = await getBranch(ctx, draft.branch);
    const operationId = draft.clientOperationId || makeOperationId();
    const { data, error } = await supabase.rpc('post_transfer_transaction_v2', {
      p_exchange_code: ctx.exchangeCode,
      p_direction: draft.direction === 'دریافتی' ? 'receive' : 'send',
      p_sender_name: draft.sender,
      p_sender_phone: draft.senderPhone || null,
      p_receiver_name: draft.receiver,
      p_receiver_phone: draft.receiverPhone || null,
      p_destination: draft.note || draft.branch || '',
      p_origin: draft.branch || '',
      p_amount: transferAmount,
      p_currency: draft.currency || 'AFN',
      p_rate: transferRate || null,
      p_fee: 0,
      p_fee_currency: draft.currency || 'AFN',
      p_description: draft.note || `حواله ${draft.direction}`,
      p_registered_by: ctx.userName,
      p_doc_type: 'transfer',
      p_user_id: ctx.userId,
      p_client_operation_id: operationId,
      p_customer_id: customer?.id || null,
      p_agent_id: branch?.id || null,
    });
    if (error) throw error;
    if (!data?.transfer_id) throw new Error('پاسخ ثبت حواله شناسه معتبر ندارد؛ وضعیت عملیات را در دفتر حواله بررسی کنید.');
    let warning = '';
    if (number(draft.fee) > 0) {
      const feeAmount = number(draft.fee);
      const { error: transferFeeError } = await supabase.from('transfers').update({ fee: feeAmount, fee_currency: draft.currency || 'AFN' })
        .eq('id', data.transfer_id).eq('exchange_code', ctx.exchangeCode);
      if (!transferFeeError) {
        try {
          const feeDoc = await postDocument(ctx, {
            docType: 'transfer_fee', currency: draft.currency || 'AFN', amount: feeAmount,
            relatedType: 'transfer', relatedId: data.transfer_id, relatedName: draft.sender,
            description: 'کمیشن حواله ' + (data.transfer_number || ''), clientOperationId: operationId + '-fee',
            lines: [
              { account_type: 'customer', account_id: String(customer.id), account_name: draft.sender, currency: draft.currency || 'AFN', debit: feeAmount, credit: 0 },
              { account_type: 'suspense', account_id: '', account_name: 'درآمد کمیشن حواله', currency: draft.currency || 'AFN', debit: 0, credit: feeAmount },
            ],
          });
          if (!feeDoc?.document_id) warning = 'حواله ثبت شد، اما سند کمیشن باید بررسی شود.';
          else {
            const feeDateWarning = await applyDocumentDate(ctx, feeDoc.document_id, draft.date);
            if (feeDateWarning) warning = 'سند کمیشن ثبت شد، اما تاریخ آن کامل همگام نشد: ' + feeDateWarning;
          }
        } catch (feeError) {
          warning = 'حواله ثبت شد، اما سند حسابداری کمیشن ثبت نشد؛ این مورد باید پیگیری شود: ' + (feeError?.message || 'خطای نامشخص');
          await captureVersion21Error(feeError, 'transfer-fee');
        }
      } else warning = 'حواله ثبت شد، اما ذخیره کمیشن در رکورد حواله ناموفق بود: ' + transferFeeError.message;
    }
    const dateWarning = await applyDocumentDate(ctx, data?.document_id, draft.date, 'transfers', data?.transfer_id);
    const auditWarning = await writeAudit(ctx, 'create', 'transfer', data?.transfer_id,
      `ثبت حواله ${data?.transfer_number || ''}`, null, draft);
    return { id: String(data?.transfer_id || ''), auditWarning, warning: [warning, dateWarning].filter(Boolean).join(' | ') };
  }

  if (module === 'cashAction' || module === 'expenses') {
    const currency = draft.currency || 'AFN';
    const safe = await getSafe(ctx, draft.cash, currency);
    const amount = number(draft.amount);
    if (amount <= 0) throw new Error('مبلغ باید بیشتر از صفر باشد.');
    if (module === 'cashAction' && draft.kind === 'خرج' && draft.partyType === 'customer') {
      // Customer/cash posting is a paired journal, not a local balance adjustment.
    }
    const customer = module === 'cashAction' && draft.partyType === 'customer' ? await getCustomer(ctx, draft.party) : null;
    const branch = module === 'cashAction' && draft.partyType === 'branch' ? await getBranch(ctx, draft.party) : null;
    if (module === 'cashAction' && draft.partyType === 'customer' && !customer) throw new Error('مشتری انتخاب‌شده در فهرست همین صراف پیدا نشد؛ ابتدا مشتری را ثبت کنید.');
    if (module === 'cashAction' && draft.partyType === 'branch' && !branch) throw new Error('نمایندگی انتخاب‌شده در فهرست همین صراف پیدا نشد؛ ابتدا نمایندگی را ثبت کنید.');
    const isCashIn = module === 'cashAction' && draft.kind === 'دخل';
    const isExpense = module === 'expenses';
    const counter = isExpense
      ? { account_type: 'suspense', account_id: '', account_name: 'مصارف' }
      : customer
        ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
        : branch
          ? { account_type: 'suspense', account_id: String(branch.id), account_name: branch.name }
          : { account_type: 'suspense', account_id: '', account_name: draft.party || (isExpense ? 'مصارف' : 'حساب مقابل') };
    const cashLine = { account_type: 'cash', account_id: String(safe.id), account_name: safe.name, currency };
    const counterLine = { ...counter, currency };
    const lines = isCashIn
      ? [{ ...cashLine, debit: amount, credit: 0 }, { ...counterLine, debit: 0, credit: amount }]
      : [{ ...counterLine, debit: amount, credit: 0 }, { ...cashLine, debit: 0, credit: amount }];
    const doc = await postDocument(ctx, {
      docType: isExpense ? 'expense' : (isCashIn ? 'cash_in' : 'cash'),
      currency, amount, relatedType: customer ? 'customer' : (branch ? 'branch' : 'none'),
      relatedId: customer?.id || branch?.id || null, relatedName: draft.party || draft.title || '',
      description: draft.description || draft.title || draft.note || (isCashIn ? 'دخل صندوق' : 'خرج صندوق'),
      lines, clientOperationId: draft.clientOperationId,
    });
    const dateWarning = await applyDocumentDate(ctx, doc?.document_id, draft.date);
    const auditWarning = await writeAudit(ctx, 'create', isExpense ? 'expense' : 'cash', doc?.document_id,
      isExpense ? 'ثبت مصرف و سند حسابداری' : 'ثبت گردش صندوق و سند حسابداری', null, draft);
    return { id: String(doc?.document_id || ''), auditWarning, warning: dateWarning };
  }

  if (module === 'exchange') {
    if (draft.id) throw new Error('برای اصلاح معامله ارزی، از عملیات اصلاح سند مالی استفاده کنید؛ ایجاد معامله تکراری مجاز نیست.');
    if (draft.fromCurrency === draft.toCurrency) throw new Error('ارز مبدا و مقصد باید متفاوت باشند.');
    const fromAmount = number(draft.fromAmount);
    const toAmount = number(draft.toAmount);
    const exchangeRate = number(draft.rate);
    if (!Number.isFinite(fromAmount) || !Number.isFinite(toAmount) || fromAmount <= 0 || toAmount <= 0) throw new Error('مبالغ هر دو طرف معامله باید معتبر و مثبت باشند.');
    if (draft.rate && (!Number.isFinite(exchangeRate) || exchangeRate <= 0)) throw new Error('نرخ تبدیل باید عدد معتبر و مثبت باشد.');
    const fromSafe = await getSafe(ctx, draft.cashFrom || draft.cash, draft.fromCurrency);
    const toSafe = await getSafe(ctx, draft.cashTo || draft.cash, draft.toCurrency);
    const customer = await getCustomer(ctx, draft.party);
    const { data: conversion, error: conversionError } = await supabase.from('conversions').insert({
      exchange_code: ctx.exchangeCode,
      customer_id: customer?.id || null, customer_name: draft.party || 'مشتری نقدی', customer_mobile: customer?.mobile || null,
      from_currency: draft.fromCurrency, from_amount: fromAmount,
      rate: exchangeRate || toAmount / fromAmount,
      to_currency: draft.toCurrency, to_amount: toAmount,
      description: draft.note || 'معامله تبدیل ارز',
      registered_by: ctx.userName, registered_by_user_id: ctx.userId,
    }).select('id').single();
    if (conversionError) throw conversionError;
    try {
      const fromCounter = customer
        ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
        : { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز' };
      const toCounter = customer
        ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
        : { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز' };
      const lines = [
        // The source-currency safe pays out; the destination-currency safe receives funds.
        { ...fromCounter, currency: draft.fromCurrency, debit: fromAmount, credit: 0 },
        { account_type: 'cash', account_id: String(fromSafe.id), account_name: fromSafe.name, currency: draft.fromCurrency, debit: 0, credit: fromAmount },
        { account_type: 'cash', account_id: String(toSafe.id), account_name: toSafe.name, currency: draft.toCurrency, debit: toAmount, credit: 0 },
        { ...toCounter, currency: draft.toCurrency, debit: 0, credit: toAmount },
      ];
      const doc = await postDocument(ctx, {
        docType: 'convert', currency: draft.fromCurrency, amount: fromAmount,
        relatedType: 'conversion', relatedId: conversion.id, relatedName: draft.party || '',
        description: draft.note || `تبدیل ${draft.fromCurrency} به ${draft.toCurrency}`, lines, clientOperationId: draft.clientOperationId,
      });
      const dateWarning = await applyDocumentDate(ctx, doc?.document_id, draft.date, 'conversions', conversion.id);
      const auditWarning = await writeAudit(ctx, 'create', 'conversion', conversion.id, 'ثبت معامله تبدیل ارز و سندهای دفتر کل', null, draft);
      return { id: String(conversion.id), documentId: doc?.document_id, auditWarning, warning: dateWarning };
    } catch (error) {
      // Preserve the source conversion record if ledger posting fails.
      // Report the failure for reconciliation; never physically delete financial data.
      await captureVersion21Error(error, 'conversion-posting');
      throw error;
    }
  }

  if (module === 'journal') {
    const amount = number(draft.amount);
    if (amount <= 0) throw new Error('مبلغ سند باید مثبت باشد.');
    const debit = await resolveLedgerAccount(ctx, draft.debitAccount, draft.currency || 'AFN');
    const credit = await resolveLedgerAccount(ctx, draft.creditAccount, draft.currency || 'AFN');
    if (debit.account_id === credit.account_id && debit.account_type === credit.account_type) throw new Error('حساب بدهکار و بستانکار یکسان است.');
    const doc = await postDocument(ctx, {
      docType: 'journal', currency: draft.currency || 'AFN', amount,
      description: draft.description, clientOperationId: draft.clientOperationId, lines: [
        { ...debit, debit: amount, credit: 0 },
        { ...credit, debit: 0, credit: amount },
      ],
    });
    const dateWarning = await applyDocumentDate(ctx, doc?.document_id, draft.date);
    const auditWarning = await writeAudit(ctx, 'create', 'journal', doc?.document_id, 'ثبت سند روزنامچه و سطرهای دفتر کل', null, draft);
    return { id: String(doc?.document_id || ''), auditWarning, warning: dateWarning };
  }

  throw new Error(`فرم «${module}» هنوز به عملیات پایگاه داده متصل نشده است.`);
}

async function editDocument(ctx, documentId, description, amount, currency, lines) {
  validateBalancedLines(lines, 'ویرایش سند');
  const { data, error } = await supabase.rpc('edit_document_transaction', {
    p_exchange_code: ctx.exchangeCode,
    p_document_id: Number(documentId),
    p_description: description || '',
    p_amount: number(amount),
    p_currency: currency || 'AFN',
    p_edit_note: 'ویرایش از نسخه ۲۱',
    p_new_lines: lines.map((line, index) => ({
      ...line, line_no: index + 1, currency: line.currency || currency || 'AFN',
      debit: number(line.debit), credit: number(line.credit),
      description: line.description || description || '',
    })),
    p_registered_by: ctx.userName,
    p_user_id: ctx.userId,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function editVersion21Record(module, draft) {
  const ctx = sessionContext();
  if (!draft?.id) throw new Error('شناسه رکورد برای ویرایش موجود نیست.');
  await requireModulePermission(ctx, module, 'edit');

  if (TABLES[module]) return saveVersion21Record(module, draft);

  if (module === 'expenses') {
    let safe;
    if (draft.cash) safe = await getSafe(ctx, draft.cash, draft.currency || 'AFN');
    else {
      const { data: lines, error: linesError } = await supabase.from('ledger_entries').select('account_id')
        .eq('exchange_code', ctx.exchangeCode).eq('document_id', Number(draft.id)).eq('account_type', 'cash').eq('deleted', false).limit(1);
      if (linesError) throw linesError;
      if (!lines?.[0]?.account_id) throw new Error('صندوق مرتبط با مصرف پیدا نشد.');
      safe = await getSafeById(ctx, lines[0].account_id);
    }
    const amount = number(draft.amount);
    if (amount <= 0) throw new Error('مبلغ مصرف باید مثبت باشد.');
    const lines = [
      { account_type: 'suspense', account_id: '', account_name: 'مصارف', currency: draft.currency || 'AFN', debit: amount, credit: 0 },
      { account_type: 'cash', account_id: String(safe.id), account_name: safe.name, currency: draft.currency || 'AFN', debit: 0, credit: amount },
    ];
    const result = await editDocument(ctx, draft.id, draft.title, amount, draft.currency, lines);
    const dateWarning = await applyDocumentDate(ctx, draft.id, draft.date);
    const auditWarning = await writeAudit(ctx, 'update', 'expense', draft.id, 'ویرایش مصرف و سطرهای دفتر کل', null, draft);
    return { id: String(draft.id), result, auditWarning, warning: dateWarning };
  }

  if (module === 'journal') {
    const amount = number(draft.amount);
    if (amount <= 0) throw new Error('مبلغ سند باید مثبت باشد.');
    const debit = await resolveLedgerAccount(ctx, draft.debitAccount, draft.currency || 'AFN');
    const credit = await resolveLedgerAccount(ctx, draft.creditAccount, draft.currency || 'AFN');
    if (debit.account_type === credit.account_type && debit.account_id === credit.account_id) {
      throw new Error('حساب بدهکار و بستانکار یکسان است.');
    }
    const result = await editDocument(ctx, draft.id, draft.description, amount, draft.currency, [
      { ...debit, debit: amount, credit: 0 },
      { ...credit, debit: 0, credit: amount },
    ]);
    const dateWarning = await applyDocumentDate(ctx, draft.id, draft.date);
    const auditWarning = await writeAudit(ctx, 'update', 'journal', draft.id, 'ویرایش سند روزنامچه', null, draft);
    return { id: String(draft.id), result, auditWarning, warning: dateWarning };
  }

  if (module === 'transactions') {
    const documentId = Number(draft.documentId || 0);
    if (!documentId) throw new Error('سند اصلی این گردش پیدا نشد.');
    const { data: oldLines, error: lineError } = await supabase.from('ledger_entries')
      .select('account_type,account_id,account_name,currency')
      .eq('exchange_code', ctx.exchangeCode).eq('document_id', documentId).eq('deleted', false);
    if (lineError) throw lineError;
    const oldCash = (oldLines || []).find(line => line.account_type === 'cash');
    if (!oldCash?.account_id) throw new Error('صندوق متناظر این سند مشخص نیست؛ ویرایش برای جلوگیری از تغییر نادرست مانده متوقف شد.');
    const amount = number(draft.amount);
    if (!amount) throw new Error('مبلغ گردش نمی‌تواند صفر باشد.');
    const currency = draft.currency || oldCash.currency || 'AFN';
    const customer = draft.partyType === 'customer' ? await getCustomer(ctx, draft.party) : null;
    const branch = draft.partyType === 'branch' ? await getBranch(ctx, draft.party) : null;
    const other = customer
      ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
      : branch
        ? { account_type: 'suspense', account_id: String(branch.id), account_name: branch.name }
        : { account_type: 'suspense', account_id: '', account_name: draft.party || 'حساب مقابل' };
    const cash = { account_type: 'cash', account_id: String(oldCash.account_id), account_name: oldCash.account_name, currency };
    const lines = amount > 0
      ? [{ ...cash, debit: amount, credit: 0 }, { ...other, currency, debit: 0, credit: amount }]
      : [{ ...other, currency, debit: Math.abs(amount), credit: 0 }, { ...cash, debit: 0, credit: Math.abs(amount) }];
    const result = await editDocument(ctx, documentId, draft.description, Math.abs(amount), currency, lines);
    const dateWarning = await applyDocumentDate(ctx, documentId, draft.date);
    const auditWarning = await writeAudit(ctx, 'update', 'cash_transaction', documentId, 'ویرایش گردش و سطرهای دفتر کل', null, draft);
    return { id: String(documentId), result, auditWarning, warning: dateWarning };
  }

  if (module === 'exchange') {
    const { data: conversion, error } = await supabase.from('conversions').select('*')
      .eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode).maybeSingle();
    if (error) throw error;
    if (!conversion) throw new Error('معامله تبدیل ارز پیدا نشد.');
    const { data: doc, error: docError } = await supabase.from('documents').select('id')
      .eq('exchange_code', ctx.exchangeCode).eq('related_type', 'conversion')
      .eq('related_id', Number(draft.id)).limit(1).maybeSingle();
    if (docError) throw docError;
    if (!doc) throw new Error('سند دفتر کل مرتبط با این تبدیل پیدا نشد؛ ویرایش امن ممکن نیست.');
    let fromSafe, toSafe;
    if (draft.cashFrom || draft.cashTo || draft.cash) {
      fromSafe = await getSafe(ctx, draft.cashFrom || draft.cash, draft.fromCurrency);
      toSafe = await getSafe(ctx, draft.cashTo || draft.cash, draft.toCurrency);
    } else {
      const { data: oldLines, error: oldLinesError } = await supabase.from('ledger_entries')
        .select('account_id,currency').eq('exchange_code', ctx.exchangeCode).eq('document_id', doc.id).eq('account_type', 'cash').eq('deleted', false);
      if (oldLinesError) throw oldLinesError;
      const fromLine = oldLines?.find(line => line.currency === draft.fromCurrency);
      const toLine = oldLines?.find(line => line.currency === draft.toCurrency);
      if (!fromLine || !toLine) throw new Error('صندوق‌های دو طرف معامله برای ویرایش پیدا نشدند.');
      fromSafe = await getSafeById(ctx, fromLine.account_id);
      toSafe = await getSafeById(ctx, toLine.account_id);
    }
    const fromAmount = number(draft.fromAmount), toAmount = number(draft.toAmount);
    if (fromAmount <= 0 || toAmount <= 0 || draft.fromCurrency === draft.toCurrency) throw new Error('ارزها و مبالغ معامله معتبر نیستند.');
    const customer = await getCustomer(ctx, draft.party);
    const fromCounter = customer
      ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
      : { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز' };
    const toCounter = customer
      ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
      : { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز' };
    const lines = [
      // The source-currency safe pays out; the destination-currency safe receives funds.
      { ...fromCounter, currency: draft.fromCurrency, debit: fromAmount, credit: 0 },
      { account_type: 'cash', account_id: String(fromSafe.id), account_name: fromSafe.name, currency: draft.fromCurrency, debit: 0, credit: fromAmount },
      { account_type: 'cash', account_id: String(toSafe.id), account_name: toSafe.name, currency: draft.toCurrency, debit: toAmount, credit: 0 },
      { ...toCounter, currency: draft.toCurrency, debit: 0, credit: toAmount },
    ];
    await editDocument(ctx, doc.id, draft.note || 'تبدیل ارز', fromAmount, draft.fromCurrency, lines);
    const dateWarning = await applyDocumentDate(ctx, doc.id, draft.date, 'conversions', draft.id);
    const { error: updateError } = await supabase.from('conversions').update({
      customer_id: customer?.id || null, customer_name: draft.party || 'مشتری نقدی', customer_mobile: customer?.mobile || null,
      from_currency: draft.fromCurrency, from_amount: fromAmount, rate: number(draft.rate) || toAmount / fromAmount,
      to_currency: draft.toCurrency, to_amount: toAmount,
      description: draft.note || 'معامله تبدیل ارز', updated_at: new Date().toISOString(),
    }).eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode);
    if (updateError) throw updateError;
    const auditWarning = await writeAudit(ctx, 'update', 'conversion', draft.id, 'ویرایش تبدیل ارز و سند دفتر کل', conversion, draft);
    return { id: String(draft.id), auditWarning, warning: dateWarning };
  }

  if (module === 'remittance') {
    const { data: transfer, error } = await supabase.from('transfers').select('*')
      .eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode).maybeSingle();
    if (error) throw error;
    if (!transfer) throw new Error('حواله برای ویرایش پیدا نشد.');
    const { data: doc, error: docError } = await supabase.from('documents').select('id')
      .eq('exchange_code', ctx.exchangeCode).eq('transfer_id', Number(draft.id)).limit(1).maybeSingle();
    if (docError) throw docError;
    if (!doc) throw new Error('سند مالی حواله پیدا نشد؛ ویرایش امن ممکن نیست.');
    const direction = draft.direction === 'دریافتی' ? 'receive' : 'send';
    const customer = await getCustomer(ctx, direction === 'receive' ? draft.receiver : draft.sender);
    if (!customer) throw new Error('برای اصلاح حواله، طرف حساب باید در فهرست مشتریان همین صراف موجود باشد؛ سند بدون شناسه مشتری اصلاح نمی‌شود.');
    const amount = number(draft.amount);
    if (amount <= 0 || !draft.sender || !draft.receiver) throw new Error('فرستنده، گیرنده و مبلغ مثبت الزامی است.');
    const lines = direction === 'send'
      ? [
          { account_type: 'customer', account_id: String(customer?.id || ''), account_name: draft.sender, currency: draft.currency, debit: amount, credit: 0 },
          { account_type: 'suspense', account_id: String(draft.id), account_name: 'حواله در جریان', currency: draft.currency, debit: 0, credit: amount },
        ]
      : [
          { account_type: 'suspense', account_id: String(draft.id), account_name: 'حواله در جریان', currency: draft.currency, debit: amount, credit: 0 },
          { account_type: 'customer', account_id: String(customer?.id || ''), account_name: draft.receiver, currency: draft.currency, debit: 0, credit: amount },
        ];
    await editDocument(ctx, doc.id, draft.note || 'حواله', amount, draft.currency, lines);
    const dateWarning = await applyDocumentDate(ctx, doc.id, draft.date, 'transfers', draft.id);
    const { error: updateError } = await supabase.from('transfers').update({
      sender_name: draft.sender, receiver_name: draft.receiver,
      amount, currency: draft.currency, fee: number(draft.fee),
      direction, origin: draft.branch || null, destination: draft.note || draft.branch || null,
      updated_at: new Date().toISOString(),
    }).eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode);
    if (updateError) throw updateError;
    const { data: feeDoc, error: feeDocError } = await supabase.from('documents').select('id')
      .eq('exchange_code', ctx.exchangeCode).eq('related_type', 'transfer')
      .eq('related_id', Number(draft.id)).eq('doc_type', 'transfer_fee').limit(1).maybeSingle();
    if (feeDocError) throw feeDocError;
    const feeAmount = number(draft.fee);
    if (feeAmount > 0) {
      const feeLines = [
        { account_type: 'customer', account_id: String(customer?.id || ''), account_name: direction === 'send' ? draft.sender : draft.receiver, currency: draft.currency, debit: feeAmount, credit: 0 },
        { account_type: 'suspense', account_id: '', account_name: 'درآمد کمیشن حواله', currency: draft.currency, debit: 0, credit: feeAmount },
      ];
      if (feeDoc) await editDocument(ctx, feeDoc.id, 'کمیشن حواله ' + (draft.number || ''), feeAmount, draft.currency, feeLines);
      else await postDocument(ctx, { docType: 'transfer_fee', currency: draft.currency, amount: feeAmount,
        relatedType: 'transfer', relatedId: Number(draft.id), relatedName: draft.sender,
        description: 'کمیشن حواله ' + (draft.number || ''), lines: feeLines });
    } else if (feeDoc) {
      const { data: reversedFee, error: reverseFeeError } = await supabase.rpc('reverse_document_transaction', {
        p_exchange_code: ctx.exchangeCode, p_document_id: feeDoc.id,
        p_registered_by: ctx.userName, p_reason: 'کمیشن حواله در ویرایش حذف شد.',
      });
      if (reverseFeeError) throw reverseFeeError;
      if (reversedFee?.error) throw new Error(reversedFee.error);
    }
    const auditWarning = await writeAudit(ctx, 'update', 'transfer', draft.id, 'ویرایش حواله و سند دفتر کل', transfer, draft);
    return { id: String(draft.id), auditWarning, warning: dateWarning };
  }

  throw new Error(`ویرایش واقعی برای بخش ${module} هنوز تعریف نشده است.`);
}

export async function deleteVersion21Record(module, record) {
  const ctx = sessionContext();
  if (!record?.id) throw new Error('رکورد انتخاب‌شده معتبر نیست.');
  await requireModulePermission(ctx, module, 'delete');

  // Production safety: Version 21 never physically deletes user or financial records.
  // Financial documents may only be reversed through the existing accounting RPC.
  if (record.documentId || ['transactions', 'cashAction', 'expenses', 'journal', 'ledger'].includes(module)) {
    const documentId = Number(record.documentId || record.id);
    const { data, error } = await supabase.rpc('reverse_document_transaction', {
      p_exchange_code: ctx.exchangeCode,
      p_document_id: documentId,
      p_registered_by: ctx.userName,
      p_reason: 'ابطال از نسخه ۲۱ با ثبت سند معکوس؛ حذف فیزیکی ممنوع است.',
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    const auditWarning = await writeAudit(ctx, 'reverse', 'document', documentId,
      'معکوس‌سازی سند به‌جای حذف فیزیکی', null, data);
    return { reversed: true, auditWarning };
  }

  if (module === 'remittance' || module === 'exchange') {
    const table = module === 'remittance' ? 'transfers' : 'conversions';
    const linkColumn = module === 'remittance' ? 'transfer_id' : 'related_id';
    let query = supabase.from('documents').select('id').eq('exchange_code', ctx.exchangeCode);
    if (module === 'remittance') query = query.eq(linkColumn, Number(record.id));
    else query = query.eq('related_type', 'conversion').eq(linkColumn, Number(record.id));
    const { data: linkedDoc, error: linkError } = await query.order('id', { ascending: false }).limit(1).maybeSingle();
    if (linkError) throw linkError;
    if (!linkedDoc) throw new Error('سند مالی مرتبط پیدا نشد؛ هیچ رکوردی حذف یا تغییر داده نشد.');

    const { data, error } = await supabase.rpc('reverse_document_transaction', {
      p_exchange_code: ctx.exchangeCode,
      p_document_id: linkedDoc.id,
      p_registered_by: ctx.userName,
      p_reason: 'ابطال سند مرتبط از نسخه ۲۱؛ رکورد اصلی حفظ می‌شود.',
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    const auditWarning = await writeAudit(ctx, 'reverse', module, record.id,
      'ابطال سند مرتبط؛ رکورد اصلی حفظ شد', null, data);
    return { reversed: true, auditWarning };
  }

  if (['customerLedger', 'branchLedger', 'reports', 'profit', 'balance', 'activity'].includes(module)) {
    throw new Error('این صفحه گزارش یا دفتر تجمیعی است؛ رکورد اصلی از این بخش قابل حذف نیست.');
  }

  // Master data (customers, branches, cashboxes, banks, currencies, accounts)
  // are retained. Users can deactivate them through edit/status instead.
  throw new Error('حذف فیزیکی اطلاعات در نسخه ۲۱ غیرفعال است؛ برای حفظ سوابق، رکورد را غیرفعال کنید.');
}

export async function captureVersion21Error(error, area = 'Version21Workspace') {
  try {
    const ctx = sessionContext();
    await supabase.from('error_reports').insert({
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
    // Preserve the original operation error; diagnostics must never hide it.
  }
}
