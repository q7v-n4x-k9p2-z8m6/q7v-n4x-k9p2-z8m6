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

const number = value => Number(value ?? 0) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const makeOperationId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `v21-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

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

async function getSafe(ctx, name, currency) {
  const { data, error } = await supabase.from('safes').select('id,name,currency')
    .eq('exchange_code', ctx.exchangeCode).eq('name', name).eq('currency', currency).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('صندوق انتخاب‌شده در همین صرافی و با همین ارز پیدا نشد.');
  return data;
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
  const { data, error } = await supabase.from('chart_of_accounts')
    .select('id,account_code,account_name').eq('exchange_code', ctx.exchangeCode)
    .or(`account_code.eq.${value.split(' — ')[0]},account_name.eq.${value}`).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`حساب «${value}» در کدینگ همین صرافی پیدا نشد.`);
  return { account_type: 'suspense', account_id: String(data.id), account_name: data.account_name };
}

async function postDocument(ctx, {
  docType, currency, amount, fee = 0, relatedType = 'none', relatedId = null,
  relatedName = '', description = '', lines, clientOperationId = makeOperationId(),
}) {
  if (!Array.isArray(lines) || lines.length < 2) throw new Error('سند حسابداری باید حداقل دو سطر داشته باشد.');
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

export async function saveVersion21Record(module, draft) {
  const ctx = sessionContext();
  if (TABLES[module]) {
    const table = TABLES[module];
    const payload = mapMasterRecord(module, draft, ctx);
    if (!payload.name && ['customers', 'branches', 'cash', 'banks', 'accounts'].includes(module)) {
      throw new Error('نام این رکورد الزامی است.');
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
    if (!draft.sender || !draft.receiver || number(draft.amount) <= 0) throw new Error('فرستنده، گیرنده و مبلغ مثبت الزامی است.');
    if (draft.id) throw new Error('برای اصلاح حواله ثبت‌شده، ابتدا باید گردش آن معکوس و حواله اصلاحی صادر شود؛ ویرایش مستقیم حواله مالی مجاز نیست.');
    const customer = await getCustomer(ctx, draft.sender || draft.receiver);
    const { data, error } = await supabase.rpc('post_transfer_transaction_v2', {
      p_exchange_code: ctx.exchangeCode,
      p_direction: draft.direction === 'دریافتی' ? 'receive' : 'send',
      p_sender_name: draft.sender,
      p_sender_phone: draft.senderPhone || null,
      p_receiver_name: draft.receiver,
      p_receiver_phone: draft.receiverPhone || null,
      p_destination: draft.note || draft.branch || '',
      p_origin: draft.branch || '',
      p_amount: number(draft.amount),
      p_currency: draft.currency || 'AFN',
      p_rate: number(draft.rate) || null,
      p_fee: number(draft.fee),
      p_fee_currency: draft.currency || 'AFN',
      p_description: draft.note || `حواله ${draft.direction}`,
      p_registered_by: ctx.userName,
      p_doc_type: 'transfer',
      p_user_id: ctx.userId,
      p_client_operation_id: makeOperationId(),
      p_customer_id: customer?.id || null,
      p_agent_id: null,
    });
    if (error) throw error;
    const auditWarning = await writeAudit(ctx, 'create', 'transfer', data?.transfer_id,
      `ثبت حواله ${data?.transfer_number || ''}`, null, draft);
    return { id: String(data?.transfer_id || ''), auditWarning };
  }

  if (module === 'cashAction' || module === 'expenses') {
    const currency = draft.currency || 'AFN';
    const safe = await getSafe(ctx, draft.cash, currency);
    const amount = number(draft.amount);
    if (amount <= 0) throw new Error('مبلغ باید بیشتر از صفر باشد.');
    if (module === 'cashAction' && draft.kind === 'خرج' && draft.partyType === 'customer') {
      // Customer/cash posting is a paired journal, not a local balance adjustment.
    }
    const customer = module === 'cashAction' ? await getCustomer(ctx, draft.party) : null;
    const isCashIn = module === 'cashAction' && draft.kind === 'دخل';
    const isExpense = module === 'expenses';
    const counter = isExpense
      ? { account_type: 'suspense', account_id: '', account_name: 'مصارف' }
      : customer
        ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
        : { account_type: 'suspense', account_id: '', account_name: draft.party || (isExpense ? 'مصارف' : 'حساب مقابل') };
    const cashLine = { account_type: 'cash', account_id: String(safe.id), account_name: safe.name, currency };
    const counterLine = { ...counter, currency };
    const lines = isCashIn
      ? [{ ...cashLine, debit: amount, credit: 0 }, { ...counterLine, debit: 0, credit: amount }]
      : [{ ...counterLine, debit: amount, credit: 0 }, { ...cashLine, debit: 0, credit: amount }];
    const doc = await postDocument(ctx, {
      docType: isExpense ? 'expense' : (isCashIn ? 'cash_in' : 'cash'),
      currency, amount, relatedType: customer ? 'customer' : 'none',
      relatedId: customer?.id || null, relatedName: draft.party || draft.title || '',
      description: draft.description || draft.title || draft.note || (isCashIn ? 'دخل صندوق' : 'خرج صندوق'),
      lines,
    });
    const auditWarning = await writeAudit(ctx, 'create', isExpense ? 'expense' : 'cash', doc?.document_id,
      isExpense ? 'ثبت مصرف و سند حسابداری' : 'ثبت گردش صندوق و سند حسابداری', null, draft);
    return { id: String(doc?.document_id || ''), auditWarning };
  }

  if (module === 'exchange') {
    if (draft.fromCurrency === draft.toCurrency) throw new Error('ارز مبدا و مقصد باید متفاوت باشد.');
    const fromAmount = number(draft.fromAmount);
    const toAmount = number(draft.toAmount);
    if (fromAmount <= 0 || toAmount <= 0) throw new Error('مبالغ هر دو طرف معامله باید مثبت باشند.');
    const fromSafe = await getSafe(ctx, draft.cashFrom || draft.cash, draft.fromCurrency);
    const toSafe = await getSafe(ctx, draft.cashTo || draft.cash, draft.toCurrency);
    const lines = [
      { account_type: 'cash', account_id: String(fromSafe.id), account_name: fromSafe.name, currency: draft.fromCurrency, debit: 0, credit: fromAmount },
      { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: draft.fromCurrency, debit: fromAmount, credit: 0 },
      { account_type: 'cash', account_id: String(toSafe.id), account_name: toSafe.name, currency: draft.toCurrency, debit: toAmount, credit: 0 },
      { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: draft.toCurrency, debit: 0, credit: toAmount },
    ];
    const doc = await postDocument(ctx, {
      docType: 'convert', currency: draft.fromCurrency, amount: fromAmount,
      relatedType: 'none', relatedName: draft.party || '',
      description: draft.note || `تبدیل ${draft.fromCurrency} به ${draft.toCurrency}`, lines,
    });
    const { data: conversion, error: conversionError } = await supabase.from('conversions').insert({
      exchange_code: ctx.exchangeCode,
      customer_name: draft.party || 'مشتری نقدی',
      from_currency: draft.fromCurrency, from_amount: fromAmount,
      rate: number(draft.rate) || toAmount / fromAmount,
      to_currency: draft.toCurrency, to_amount: toAmount,
      description: draft.note || 'معامله تبدیل ارز',
      registered_by: ctx.userName, registered_by_user_id: ctx.userId,
    }).select('id').single();
    if (conversionError) {
      await supabase.rpc('reverse_document_transaction', {
        p_exchange_code: ctx.exchangeCode, p_document_id: doc.document_id,
        p_registered_by: ctx.userName, p_reason: 'ثبت ردیف تبدیل ارز ناموفق بود؛ سند به‌صورت خودکار معکوس شد.',
      });
      throw conversionError;
    }
    const auditWarning = await writeAudit(ctx, 'create', 'conversion', conversion.id, 'ثبت معامله تبدیل ارز و سندهای دفتر کل', null, draft);
    return { id: String(conversion.id), auditWarning };
  }

  if (module === 'journal') {
    const amount = number(draft.amount);
    if (amount <= 0) throw new Error('مبلغ سند باید مثبت باشد.');
    const debit = await resolveLedgerAccount(ctx, draft.debitAccount, draft.currency || 'AFN');
    const credit = await resolveLedgerAccount(ctx, draft.creditAccount, draft.currency || 'AFN');
    if (debit.account_id === credit.account_id && debit.account_type === credit.account_type) throw new Error('حساب بدهکار و بستانکار یکسان است.');
    const doc = await postDocument(ctx, {
      docType: 'journal', currency: draft.currency || 'AFN', amount,
      description: draft.description, lines: [
        { ...debit, debit: amount, credit: 0 },
        { ...credit, debit: 0, credit: amount },
      ],
    });
    const auditWarning = await writeAudit(ctx, 'create', 'journal', doc?.document_id, 'ثبت سند روزنامچه و سطرهای دفتر کل', null, draft);
    return { id: String(doc?.document_id || ''), auditWarning };
  }

  throw new Error(`فرم «${module}» هنوز به عملیات پایگاه داده متصل نشده است.`);
}

export async function deleteVersion21Record(module, record) {
  const ctx = sessionContext();
  if (!record?.id) throw new Error('رکورد انتخاب‌شده معتبر نیست.');
  if (['customerLedger', 'branchLedger', 'reports', 'profit', 'balance', 'ledger', 'activity'].includes(module)) {
    throw new Error('این صفحه گزارش یا دفتر تجمیعی است؛ رکورد اصلی را از بخش عملیات مربوط انتخاب کنید.');
  }
  if (['transactions', 'cashAction', 'expenses', 'journal'].includes(module) || record.documentId) {
    const documentId = Number(record.documentId || record.id);
    const { data, error } = await supabase.rpc('reverse_document_transaction', {
      p_exchange_code: ctx.exchangeCode,
      p_document_id: documentId,
      p_registered_by: ctx.userName,
      p_reason: 'ابطال از نسخه ۲۱ با ثبت سند معکوس؛ حذف فیزیکی انجام نشد.',
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    await writeAudit(ctx, 'reverse', 'document', documentId, 'معکوس‌سازی سند به‌جای حذف فیزیکی', null, data);
    return { reversed: true };
  }
  const table = TABLES[module];
  if (!table) throw new Error(`حذف برای بخش ${module} تعریف نشده است.`);
  const { data, error } = await supabase.from(table).delete()
    .eq('id', Number(record.id)).eq('exchange_code', ctx.exchangeCode).select('id').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('رکورد پیدا نشد یا توسط رکوردهای مالی دیگر استفاده می‌شود.');
  const auditWarning = await writeAudit(ctx, 'delete', module, record.id, `حذف ${module}`, record, null);
  return { deleted: true, auditWarning };
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
