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
    const customer = await getCustomer(ctx, draft.direction === 'دریافتی' ? draft.receiver : draft.sender);
    const branch = await getBranch(ctx, draft.branch);
    const operationId = makeOperationId();
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
    let warning = '';
    if (number(draft.fee) > 0) {
      const feeAmount = number(draft.fee);
      const { error: transferFeeError } = await supabase.from('transfers').update({ fee: feeAmount, fee_currency: draft.currency || 'AFN' })
        .eq('id', data.transfer_id).eq('exchange_code', ctx.exchangeCode);
      if (!transferFeeError) {
        const feeDoc = await postDocument(ctx, {
          docType: 'transfer_fee', currency: draft.currency || 'AFN', amount: feeAmount,
          relatedType: 'transfer', relatedId: data.transfer_id, relatedName: draft.sender,
          description: 'کمیشن حواله ' + (data.transfer_number || ''), clientOperationId: operationId + '-fee',
          lines: [
            { account_type: 'customer', account_id: String(customer?.id || ''), account_name: draft.sender, currency: draft.currency || 'AFN', debit: feeAmount, credit: 0 },
            { account_type: 'suspense', account_id: '', account_name: 'درآمد کمیشن حواله', currency: draft.currency || 'AFN', debit: 0, credit: feeAmount },
          ],
        });
        if (!feeDoc?.document_id) warning = 'حواله ثبت شد، اما سند کمیشن باید بررسی شود.';
      } else warning = 'حواله ثبت شد، اما ذخیره کمیشن در رکورد حواله ناموفق بود: ' + transferFeeError.message;
    }
    const auditWarning = await writeAudit(ctx, 'create', 'transfer', data?.transfer_id,
      `ثبت حواله ${data?.transfer_number || ''}`, null, draft);
    return { id: String(data?.transfer_id || ''), auditWarning, warning };
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
    if (draft.id) throw new Error('برای اصلاح معامله ارزی، از عملیات اصلاح سند مالی استفاده کنید؛ ایجاد معامله تکراری مجاز نیست.');
    if (draft.fromCurrency === draft.toCurrency) throw new Error('ارز مبدا و مقصد باید متفاوت باشند.');
    const fromAmount = number(draft.fromAmount);
    const toAmount = number(draft.toAmount);
    if (fromAmount <= 0 || toAmount <= 0) throw new Error('مبالغ هر دو طرف معامله باید مثبت باشند.');
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
    const { data: conversion, error: conversionError } = await supabase.from('conversions').insert({
      exchange_code: ctx.exchangeCode,
      customer_name: draft.party || 'مشتری نقدی',
      from_currency: draft.fromCurrency, from_amount: fromAmount,
      rate: number(draft.rate) || toAmount / fromAmount,
      to_currency: draft.toCurrency, to_amount: toAmount,
      description: draft.note || 'معامله تبدیل ارز',
      registered_by: ctx.userName, registered_by_user_id: ctx.userId,
    }).select('id').single();
    if (conversionError) throw conversionError;
    try {
      const lines = [
        { account_type: 'cash', account_id: String(fromSafe.id), account_name: fromSafe.name, currency: draft.fromCurrency, debit: 0, credit: fromAmount },
        { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: draft.fromCurrency, debit: fromAmount, credit: 0 },
        { account_type: 'cash', account_id: String(toSafe.id), account_name: toSafe.name, currency: draft.toCurrency, debit: toAmount, credit: 0 },
        { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: draft.toCurrency, debit: 0, credit: toAmount },
      ];
      const doc = await postDocument(ctx, {
        docType: 'convert', currency: draft.fromCurrency, amount: fromAmount,
        relatedType: 'conversion', relatedId: conversion.id, relatedName: draft.party || '',
        description: draft.note || `تبدیل ${draft.fromCurrency} به ${draft.toCurrency}`, lines,
      });
      const auditWarning = await writeAudit(ctx, 'create', 'conversion', conversion.id, 'ثبت معامله تبدیل ارز و سندهای دفتر کل', null, draft);
      return { id: String(conversion.id), documentId: doc?.document_id, auditWarning };
    } catch (error) {
      await supabase.from('conversions').delete().eq('id', conversion.id).eq('exchange_code', ctx.exchangeCode);
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

async function editDocument(ctx, documentId, description, amount, currency, lines) {
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
    const auditWarning = await writeAudit(ctx, 'update', 'expense', draft.id, 'ویرایش مصرف و سطرهای دفتر کل', null, draft);
    return { id: String(draft.id), result, auditWarning };
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
    const auditWarning = await writeAudit(ctx, 'update', 'journal', draft.id, 'ویرایش سند روزنامچه', null, draft);
    return { id: String(draft.id), result, auditWarning };
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
    const other = customer
      ? { account_type: 'customer', account_id: String(customer.id), account_name: customer.name }
      : { account_type: 'suspense', account_id: '', account_name: draft.party || 'حساب مقابل' };
    const cash = { account_type: 'cash', account_id: String(oldCash.account_id), account_name: oldCash.account_name, currency };
    const lines = amount > 0
      ? [{ ...cash, debit: amount, credit: 0 }, { ...other, currency, debit: 0, credit: amount }]
      : [{ ...other, currency, debit: Math.abs(amount), credit: 0 }, { ...cash, debit: 0, credit: Math.abs(amount) }];
    const result = await editDocument(ctx, documentId, draft.description, Math.abs(amount), currency, lines);
    const auditWarning = await writeAudit(ctx, 'update', 'cash_transaction', documentId, 'ویرایش گردش و سطرهای دفتر کل', null, draft);
    return { id: String(documentId), result, auditWarning };
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
    const fromSafe = await getSafe(ctx, draft.cashFrom || draft.cash, draft.fromCurrency);
    const toSafe = await getSafe(ctx, draft.cashTo || draft.cash, draft.toCurrency);
    const fromAmount = number(draft.fromAmount), toAmount = number(draft.toAmount);
    if (fromAmount <= 0 || toAmount <= 0 || draft.fromCurrency === draft.toCurrency) throw new Error('ارزها و مبالغ معامله معتبر نیستند.');
    const lines = [
      { account_type: 'cash', account_id: String(fromSafe.id), account_name: fromSafe.name, currency: draft.fromCurrency, debit: 0, credit: fromAmount },
      { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: draft.fromCurrency, debit: fromAmount, credit: 0 },
      { account_type: 'cash', account_id: String(toSafe.id), account_name: toSafe.name, currency: draft.toCurrency, debit: toAmount, credit: 0 },
      { account_type: 'suspense', account_id: '', account_name: 'حساب واسط تبدیل ارز', currency: draft.toCurrency, debit: 0, credit: toAmount },
    ];
    await editDocument(ctx, doc.id, draft.note || 'تبدیل ارز', fromAmount, draft.fromCurrency, lines);
    const { error: updateError } = await supabase.from('conversions').update({
      customer_name: draft.party || 'مشتری نقدی', from_currency: draft.fromCurrency,
      from_amount: fromAmount, rate: number(draft.rate) || toAmount / fromAmount,
      to_currency: draft.toCurrency, to_amount: toAmount,
      description: draft.note || 'معامله تبدیل ارز', updated_at: new Date().toISOString(),
    }).eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode);
    if (updateError) throw updateError;
    const auditWarning = await writeAudit(ctx, 'update', 'conversion', draft.id, 'ویرایش تبدیل ارز و سند دفتر کل', conversion, draft);
    return { id: String(draft.id), auditWarning };
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
    const customer = await getCustomer(ctx, draft.sender || draft.receiver);
    const amount = number(draft.amount);
    if (amount <= 0 || !draft.sender || !draft.receiver) throw new Error('فرستنده، گیرنده و مبلغ مثبت الزامی است.');
    const direction = draft.direction === 'دریافتی' ? 'receive' : 'send';
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
    const { error: updateError } = await supabase.from('transfers').update({
      sender_name: draft.sender, receiver_name: draft.receiver,
      amount, currency: draft.currency, fee: number(draft.fee),
      direction, origin: draft.branch || null, destination: draft.note || draft.branch || null,
      updated_at: new Date().toISOString(),
    }).eq('id', Number(draft.id)).eq('exchange_code', ctx.exchangeCode);
    if (updateError) throw updateError;
    const auditWarning = await writeAudit(ctx, 'update', 'transfer', draft.id, 'ویرایش حواله و سند دفتر کل', transfer, draft);
    return { id: String(draft.id), auditWarning };
  }

  throw new Error(`ویرایش واقعی برای بخش ${module} هنوز تعریف نشده است.`);
}

export async function deleteVersion21Record(module, record) {
  const ctx = sessionContext();
  if (!record?.id) throw new Error('رکورد انتخاب‌شده معتبر نیست.');
  if (record.documentId || ['transactions', 'cashAction', 'expenses', 'journal', 'ledger'].includes(module)) {
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
    if (module === 'remittance') {
      await supabase.from('transfers').update({ status: 'reversed', updated_at: new Date().toISOString() })
        .eq('id', Number(record.id)).eq('exchange_code', ctx.exchangeCode);
    }
    if (module === 'exchange') {
      await supabase.from('conversions').delete().eq('id', Number(record.id)).eq('exchange_code', ctx.exchangeCode);
    }
    return { reversed: true };
  }
  if (['customerLedger', 'branchLedger', 'reports', 'profit', 'balance', 'activity'].includes(module)) {
    throw new Error('این صفحه گزارش یا دفتر تجمیعی است؛ رکورد اصلی را از بخش عملیات مربوط انتخاب کنید.');
  }
  if (module === 'remittance' || module === 'exchange') {
    const table = module === 'remittance' ? 'transfers' : 'conversions';
    const linkColumn = module === 'remittance' ? 'transfer_id' : 'related_id';
    let documentQuery = supabase.from('documents').select('id').eq('exchange_code', ctx.exchangeCode);
    if (module === 'remittance') documentQuery = documentQuery.eq('transfer_id', Number(record.id));
    else documentQuery = documentQuery.eq('related_type', 'conversion').eq('related_id', Number(record.id));
    const { data: linkedDoc, error: linkError } = await documentQuery.order('id', { ascending: false }).limit(1).maybeSingle();
    if (linkError) throw linkError;
    if (!linkedDoc) throw new Error('سند مالی مرتبط پیدا نشد؛ برای جلوگیری از حذف ناقص، عملیات متوقف شد.');
    const { data, error } = await supabase.rpc('reverse_document_transaction', {
      p_exchange_code: ctx.exchangeCode, p_document_id: linkedDoc.id,
      p_registered_by: ctx.userName, p_reason: 'ابطال سند مرتبط با رکورد از نسخه ۲۱.',
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (module === 'remittance') {
      const { error: updateError } = await supabase.from(table).update({ status: 'reversed', updated_at: new Date().toISOString() })
        .eq('id', Number(record.id)).eq('exchange_code', ctx.exchangeCode);
      if (updateError) throw updateError;
    } else {
      const { error: deleteError } = await supabase.from(table).delete()
        .eq('id', Number(record.id)).eq('exchange_code', ctx.exchangeCode);
      if (deleteError) throw deleteError;
    }
    await writeAudit(ctx, 'reverse', module, record.id, 'ابطال سند و ثبت سابقه', null, data);
    return { reversed: true };
  }
  const table = TABLES[module];
  if (!table) throw new Error(`حذف برای بخش ${module} تعریف نشده است.`);
  const id = String(record.id);
  const referenceChecks = {
    cash: ['cash', 'account_id'],
    banks: ['bank', 'account_id'],
    customers: ['customer', 'account_id'],
    accounts: ['suspense', 'account_id'],
  };
  if (referenceChecks[module]) {
    const [accountType, accountColumn] = referenceChecks[module];
    const { count, error: countError } = await supabase.from('ledger_entries').select('id', { count: 'exact', head: true })
      .eq('exchange_code', ctx.exchangeCode).eq('account_type', accountType).eq(accountColumn, id).eq('deleted', false);
    if (countError) throw countError;
    if (count > 0) throw new Error('این رکورد در اسناد مالی استفاده شده است؛ حذف فیزیکی مجاز نیست. ابتدا باید آن را غیرفعال کنید.');
  }
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
