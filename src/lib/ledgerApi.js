// ledgerApi.js — Direct Supabase financial operations (no Base44 backend function)
//
// تمام عملیات مالی مستقیماً از طریق کلاینت Supabase انجام می‌شوند.
// tenant isolation از طریق RLS policies (x-app-token header) تأمین می‌شود.
// عملیات اتمیک از طریق توابع RPC موجود در Supabase انجام می‌شوند.

import { supabase } from './supabaseClient';
import { getExchangeCode, listTransactions } from './supabaseApi';

// ─ـ Helper: get current user from session ──
function getSessionUser() {
  try {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) return JSON.parse(userStr);
  } catch { /* ignore */ }
  return null;
}

function getSessionUserId() {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    return payload.uid ? String(payload.uid) : null;
  } catch { return null; }
}

// ── Post Document (document + ledger lines) — atomic Supabase RPC ──
export async function postDocument({ doc_type, currency, amount, fee, related_type, related_id, related_name, description, lines, transfer_id, client_operation_id, exchange_code }) {
  const ec = exchange_code || getExchangeCode();
  if (!ec) throw new Error('کد صرافی معتبر نیست؛ لطفاً دوباره وارد شوید');
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('برای ثبت سند، ردیف‌های دفترکل الزامی است');
  }

  const numericAmount = Number(amount);
  const numericFee = Number(fee) || 0;
  if (!Number.isFinite(numericAmount) || !Number.isFinite(numericFee)) {
    throw new Error('مبلغ یا کارمزد معتبر نیست');
  }

  const userIdRaw = getSessionUserId();
  const userId = userIdRaw && Number.isFinite(Number(userIdRaw)) ? Number(userIdRaw) : null;
  const user = getSessionUser();
  const userName = user?.full_name || user?.name || '';

  // Keep idempotency keys tenant-scoped because the database key is globally unique.
  const localOperationId = client_operation_id ||
    (globalThis.crypto?.randomUUID?.() || `op-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const operationId = `${ec}:${localOperationId}`;

  const rpcLines = lines.map((line, index) => ({
    account_type: line.account_type || 'cash',
    account_id: line.account_id === undefined || line.account_id === null ? '' : String(line.account_id),
    account_name: line.account_name || '',
    currency: line.currency || currency,
    debit: Number(line.debit) || 0,
    credit: Number(line.credit) || 0,
    rate: line.rate === undefined || line.rate === null ? null : Number(line.rate),
    pair_entry_id: line.pair_entry_id || null,
    description: line.description || '',
    line_no: Number(line.line_no ?? line.doc_line_no ?? index + 1),
  }));

  const { data, error } = await supabase.rpc('post_document_transaction', {
    p_exchange_code: ec,
    p_doc_type: doc_type,
    p_currency: currency,
    p_amount: numericAmount,
    p_fee: numericFee,
    p_related_type: related_type || 'none',
    p_related_id: related_id ? Number(related_id) : null,
    p_related_name: related_name || null,
    p_description: description || '',
    p_registered_by: userName,
    p_lines: rpcLines,
    p_transfer_id: transfer_id ? Number(transfer_id) : null,
    p_user_id: userId,
    p_client_operation_id: operationId,
  });

  if (error) throw new Error(error.message || 'postDocument_failed');
  if (!data) throw new Error('postDocument_no_result');
  return {
    id: data.document_id,
    doc_number: data.doc_number || null,
    idempotent: !!data.idempotent,
  };
}

// ── Post Transfer (atomic Supabase RPC) ──
export async function postTransfer({ direction, sender_name, sender_phone, receiver_name, receiver_phone, destination, origin, amount, currency, rate, fee, fee_currency, description, client_operation_id, exchange_code, customer_id, agent_id }) {
  const ec = exchange_code || getExchangeCode();
  if (!ec) throw new Error('کد صرافی معتبر نیست؛ لطفاً دوباره وارد شوید');

  const numericAmount = Number(amount);
  const numericFee = Number(fee) || 0;
  if (!Number.isFinite(numericAmount) || !Number.isFinite(numericFee)) {
    throw new Error('مبلغ یا کارمزد معتبر نیست');
  }

  const userIdRaw = getSessionUserId();
  const userId = userIdRaw && Number.isFinite(Number(userIdRaw)) ? Number(userIdRaw) : null;
  const user = getSessionUser();
  const userName = user?.full_name || user?.name || '';
  const localOperationId = client_operation_id ||
    (globalThis.crypto?.randomUUID?.() || `op-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const { data, error } = await supabase.rpc('post_transfer_transaction_v2', {
    p_exchange_code: ec,
    p_direction: direction,
    p_sender_name: sender_name || '',
    p_sender_phone: sender_phone || '',
    p_receiver_name: receiver_name || '',
    p_receiver_phone: receiver_phone || '',
    p_destination: destination || '',
    p_origin: origin || '',
    p_amount: numericAmount,
    p_currency: currency || 'AFN',
    p_rate: rate ? Number(rate) : null,
    p_fee: numericFee,
    p_fee_currency: fee_currency || null,
    p_description: description || '',
    p_registered_by: userName,
    p_doc_type: 'transfer',
    p_user_id: userId,
    p_client_operation_id: `${ec}:${localOperationId}`,
    p_customer_id: customer_id ? Number(customer_id) : null,
    p_agent_id: agent_id ? Number(agent_id) : null,
  });

  if (error) throw new Error(error.message || 'postTransfer_failed');
  if (!data) throw new Error('postTransfer_no_result');
  return data;
}

// ── Execute Transfer (atomic document + ledger + status RPC) ──
export async function executeTransfer({ transfer_id, pay_currency, pay_amount, pay_counter, bank_account_id }) {
  const ec = getExchangeCode();
  if (!ec) throw new Error('کد صرافی معتبر نیست؛ لطفاً دوباره وارد شوید');

  const transferId = Number(transfer_id);
  const amount = Number(pay_amount);
  if (!Number.isInteger(transferId) || transferId <= 0) {
    throw new Error('شناسه حواله معتبر نیست');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('مبلغ پرداخت معتبر نیست');
  }
  if (!pay_currency || !['cash', 'bank'].includes(pay_counter)) {
    throw new Error('ارز یا حساب پرداخت معتبر نیست');
  }

  const { data, error } = await supabase.rpc('execute_transfer_transaction', {
    p_exchange_code: ec,
    p_transfer_id: transferId,
    p_pay_currency: pay_currency,
    p_pay_amount: amount,
    p_pay_counter: pay_counter,
    p_bank_account_id: pay_counter === 'bank' && bank_account_id
      ? Number(bank_account_id)
      : null,
  });

  if (error) throw new Error(error.message || 'executeTransfer_failed');
  if (!data || data.error) throw new Error(data?.error || 'executeTransfer_no_result');
  return data;
}

// ── Reverse Document (via Supabase RPC) ──
export async function reverseDocument(document_id, reason, exchange_code) {
  try {
    const user = getSessionUser();
    const registeredBy = user?.full_name || user?.name || '';
    const { data, error } = await supabase.rpc('reverse_document_transaction', {
      p_exchange_code: exchange_code || getExchangeCode(),
      p_document_id: document_id,
      p_registered_by: registeredBy,
      p_reason: reason || '',
    });

    if (error) {
      // Never fall back to soft-deleting a document: that would leave its
      // ledger entries active and make the accounting balances inconsistent.
      throw new Error(error.message || 'reverseDocument_failed');
    }
    if (!data || data.error) {
      throw new Error(data?.error || 'reverseDocument_no_result');
    }
    if (!data.reversal_doc_id) {
      throw new Error('reverseDocument_invalid_result');
    }

    return data;
  } catch (err) {
    throw new Error(err.message || 'reverseDocument_failed');
  }
}

// ── Edit Document (via Supabase RPC) ──
export async function editDocument({ document_id, description, amount, currency, edit_note, new_lines, exchange_code }) {
  try {
    // The SQL routine replaces all existing ledger lines before inserting
    // new_lines. An empty array would therefore erase the document's ledger.
    if (!Array.isArray(new_lines) || new_lines.length === 0) {
      throw new Error('برای ویرایش سند، ردیف‌های جدید و متوازن دفترکل الزامی است؛ سند برای حفظ اطلاعات مالی تغییر نکرد.');
    }

    const user = getSessionUser();
    const userIdRaw = getSessionUserId();
    const userId = userIdRaw && Number.isFinite(Number(userIdRaw)) ? Number(userIdRaw) : null;
    const registeredBy = user?.full_name || user?.name || '';
    const { data, error } = await supabase.rpc('edit_document_transaction', {
      p_exchange_code: exchange_code || getExchangeCode(),
      p_document_id: document_id,
      p_description: description || '',
      p_amount: amount ? Number(amount) : null,
      p_currency: currency || null,
      p_edit_note: edit_note || '',
      p_new_lines: new_lines || [],
      p_registered_by: registeredBy,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(error.message || 'editDocument_failed');
    }
    if (!data || data.error) {
      throw new Error(data?.error || 'editDocument_no_result');
    }
    if (Number(data.lines_inserted) <= 0) {
      throw new Error('ویرایش سند بدون ردیف دفترکل معتبر است؛ نتیجه تأیید نشد.');
    }

    return data;
  } catch (err) {
    throw new Error(err.message || 'editDocument_failed');
  }
}

// ── Get Balances (from SQL views, direct query) ──
const VIEW_MAP = {
  treasury: 'v_treasury_balances',
  bank: 'v_bank_balances',
  customer: 'v_customer_balances',
  wallet: 'v_wallet_balances',
  agent: 'v_agent_balances',
  profit_loss: 'v_profit_loss',
  currency: 'v_currency_balances',
  exchange_summary: 'v_exchange_summary',
};

export async function getBalances(balance_type, params = {}) {
  try {
    const view = VIEW_MAP[balance_type];
    if (!view) throw new Error('invalid_balance_type');

    const ec = getExchangeCode();
    let query = supabase.from(view).select('*');

    // Filter by exchange_code if the view has it
    if (ec) {
      query = query.eq('exchange_code', ec);
    }

    // Apply additional filters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query.limit(500);
    if (error) throw new Error(error.message || 'getBalances_failed');
    return data || [];
  } catch (err) {
    throw new Error(err.message || 'getBalances_failed');
  }
}

// ── Currency-safe ledger aggregation (read-only; never mixes currencies) ──
export async function getLedgerCurrencyBalances(accountType) {
  const ec = getExchangeCode();
  if (!ec) return [];
  const grouped = new Map();
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('account_id,currency,debit,credit')
      .eq('exchange_code', ec)
      .eq('account_type', accountType)
      .eq('deleted', false)
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message || 'ledger_balance_read_failed');
    const rows = data || [];
    for (const row of rows) {
      const accountId = String(row.account_id ?? '');
      const currency = row.currency || 'AFN';
      const key = accountId + '::' + currency;
      const current = grouped.get(key) || { account_id: accountId, currency, debit_total: 0, credit_total: 0 };
      current.debit_total += Number(row.debit) || 0;
      current.credit_total += Number(row.credit) || 0;
      grouped.set(key, current);
    }
    if (rows.length < pageSize) break;
  }
  return Array.from(grouped.values()).map(row => ({
    ...row,
    net_balance: row.debit_total - row.credit_total,
    balance: row.debit_total - row.credit_total,
    customer_id: accountType === 'customer' ? row.account_id : undefined,
    agent_id: accountType === 'agent' ? row.account_id : undefined,
    balance_currency: row.currency,
  }));
}

// ── List Documents (with ledger lines) ──
export async function listDocuments(filters = {}, sort, limit) {
  return listTransactions(filters, sort, limit);
}

// ── Balance helpers ──
export function fetchTreasuryBalances() { return getBalances('treasury'); }
export function fetchBankBalances() { return getBalances('bank'); }
export function fetchCustomerBalances() { return getBalances('customer'); }
export function fetchWalletBalances() { return getBalances('wallet'); }
export function fetchAgentBalances() { return getBalances('agent'); }
export function fetchProfitLoss() { return getBalances('profit_loss'); }
export function fetchCurrencyBalances() { return getBalances('currency'); }
export function fetchExchangeSummary() { return getBalances('exchange_summary'); }

// ── Line builders (construct ledger lines for common operations) ──

export function buildBuyLines({ customer_id, customer_name, currency, amount, paid_amount, paid_currency, fee, fee_currency }) {
  const lines = [
    { account_type: 'cash', account_id: paid_currency, account_name: 'صندوق', currency: paid_currency, debit: Number(paid_amount), credit: 0, description: `دریافت ${paid_currency} از صندوق`, line_no: 1 },
    { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency: paid_currency, debit: 0, credit: Number(paid_amount), description: `بستانکاری ${customer_name}`, line_no: 2 },
    { account_type: 'cash', account_id: currency, account_name: 'صندوق', currency, debit: Number(amount), credit: 0, description: `دریافت ${currency} در صندوق`, line_no: 3 },
    { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency, debit: 0, credit: Number(amount), description: `بدهکاری ${customer_name}`, line_no: 4 },
  ];
  if (fee && Number(fee) > 0) {
    lines.push(
      { account_type: 'fee', account_id: String(customer_id), account_name: 'کارمزد', currency: fee_currency || paid_currency, debit: Number(fee), credit: 0, description: 'کارمزد خرید', line_no: 5 },
      { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency: fee_currency || paid_currency, debit: 0, credit: Number(fee), description: 'کارمزد از مشتری', line_no: 6 },
    );
  }
  return lines;
}

export function buildSellLines({ customer_id, customer_name, currency, amount, received_amount, received_currency, fee, fee_currency }) {
  const lines = [
    { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency: received_currency, debit: Number(received_amount), credit: 0, description: `بدهکاری ${customer_name}`, line_no: 1 },
    { account_type: 'cash', account_id: received_currency, account_name: 'صندوق', currency: received_currency, debit: 0, credit: Number(received_amount), description: `پرداخت ${received_currency} از صندوق`, line_no: 2 },
    { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency, debit: 0, credit: Number(amount), description: `بستانکاری ${customer_name}`, line_no: 3 },
    { account_type: 'cash', account_id: currency, account_name: 'صندوق', currency, debit: 0, credit: Number(amount), description: `تحویل ${currency} از صندوق`, line_no: 4 },
  ];
  if (fee && Number(fee) > 0) {
    lines.push(
      { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency: fee_currency || received_currency, debit: Number(fee), credit: 0, description: 'کارمزد به عهده مشتری', line_no: 5 },
      { account_type: 'fee', account_id: String(customer_id), account_name: 'کارمزد', currency: fee_currency || received_currency, debit: 0, credit: Number(fee), description: 'سود کارمزد صراف', line_no: 6 },
    );
  }
  return lines;
}

export function buildDadogereftLines({ customer_id, customer_name, direction, currency, amount, counter_type, counter_id }) {
  const isIn = direction === 'in' || direction === 'receive';
  const cashAccount = counter_type === 'bank' ? 'bank' : 'cash';
  const lines = isIn ? [
    { account_type: cashAccount, account_id: counter_id ? String(counter_id) : currency, account_name: counter_type === 'bank' ? 'بانک' : 'صندوق', currency, debit: Number(amount), credit: 0, description: `دریافت از ${customer_name}`, line_no: 1 },
    { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency, debit: 0, credit: Number(amount), description: `بستانکاری ${customer_name}`, line_no: 2 },
  ] : [
    { account_type: 'customer', account_id: String(customer_id), account_name: customer_name, currency, debit: Number(amount), credit: 0, description: `بدهکاری ${customer_name}`, line_no: 1 },
    { account_type: cashAccount, account_id: counter_id ? String(counter_id) : currency, account_name: counter_type === 'bank' ? 'بانک' : 'صندوق', currency, debit: 0, credit: Number(amount), description: `پرداخت به ${customer_name}`, line_no: 2 },
  ];
  return lines;
}

export function buildTransferLines({ from_type, from_id, to_type, to_id, currency, amount, rate, pair_currency, pair_amount }) {
  const lines = [];
  if (pair_currency && pair_amount && pair_currency !== currency) {
    lines.push(
      { account_type: from_type, account_id: String(from_id), account_name: from_type === 'bank' ? 'بانک' : 'صندوق', currency, debit: 0, credit: Number(amount), description: `خروج ${currency} از ${from_type}`, line_no: 1, rate: rate || null },
      { account_type: to_type, account_id: String(to_id), account_name: to_type === 'bank' ? 'بانک' : 'صندوق', currency: pair_currency, debit: Number(pair_amount), credit: 0, description: `ورود ${pair_currency} به ${to_type}`, line_no: 2, rate: rate || null },
    );
  } else {
    lines.push(
      { account_type: from_type, account_id: String(from_id), account_name: from_type === 'bank' ? 'بانک' : 'صندوق', currency, debit: 0, credit: Number(amount), description: `خروج از ${from_type}`, line_no: 1 },
      { account_type: to_type, account_id: String(to_id), account_name: to_type === 'bank' ? 'بانک' : 'صندوق', currency, debit: Number(amount), credit: 0, description: `ورود به ${to_type}`, line_no: 2 },
    );
  }
  return lines;
}

export function buildConversionLines({ from_currency, from_amount, to_currency, to_amount, rate }) {
  return [
    { account_type: 'cash', account_id: from_currency, account_name: 'صندوق', currency: from_currency, debit: 0, credit: Number(from_amount), description: `خروج ${from_currency} از صندوق`, line_no: 1, rate: rate || null },
    { account_type: 'cash', account_id: to_currency, account_name: 'صندوق', currency: to_currency, debit: Number(to_amount), credit: 0, description: `ورود ${to_currency} به صندوق`, line_no: 2, rate: rate || null },
  ];
}

export function buildWalletTopupLines({ wallet_id, wallet_owner, currency, amount }) {
  return [
    { account_type: 'cash', account_id: currency, account_name: 'صندوق', currency, debit: 0, credit: Number(amount), description: 'کاهش صندوق — شارژ کیف پول', line_no: 1 },
    { account_type: 'wallet', account_id: String(wallet_id), account_name: wallet_owner === 'exchange' ? 'کیف پول صراف' : 'کیف پول مشتری', currency, debit: Number(amount), credit: 0, description: 'افزایش موجودی کیف پول', line_no: 2 },
  ];
}

export function buildWalletWithdrawLines({ wallet_id, wallet_owner, currency, amount }) {
  return [
    { account_type: 'wallet', account_id: String(wallet_id), account_name: wallet_owner === 'exchange' ? 'کیف پول صراف' : 'کیف پول مشتری', currency, debit: 0, credit: Number(amount), description: 'کاهش موجودی کیف پول', line_no: 1 },
    { account_type: 'cash', account_id: currency, account_name: 'صندوق', currency, debit: Number(amount), credit: 0, description: 'افزایش صندوق — برداشت از کیف پول', line_no: 2 },
  ];
}

export function buildWalletTransferLines({ from_wallet_id, to_wallet_id, currency, amount }) {
  return [
    { account_type: 'wallet', account_id: String(from_wallet_id), account_name: 'کیف پول مبدأ', currency, debit: 0, credit: Number(amount), description: 'کاهش کیف پول مبدأ', line_no: 1 },
    { account_type: 'wallet', account_id: String(to_wallet_id), account_name: 'کیف پول مقصد', currency, debit: Number(amount), credit: 0, description: 'افزایش کیف پول مقصد', line_no: 2 },
  ];
}

export function buildOpeningBalanceLines({ customer_id, customer_name, currency, amount }) {
  // صندوق‌ها در v_treasury_balances با account_type='cash' و ارز تجمیع می‌شوند.
  return [
    { account_type: 'cash', account_id: currency, account_name: customer_name || 'صندوق', currency, debit: Number(amount), credit: 0, description: 'موجودی افتتاحیه صندوق', line_no: 1 },
    { account_type: 'suspense', account_id: '', account_name: 'موجودی افتتاحیه', currency, debit: 0, credit: Number(amount), description: 'بستانکاری موقت افتتاحیه', line_no: 2 },
  ];
}

export default {
  postDocument, postTransfer, reverseDocument, editDocument,
  getBalances, listDocuments,
  fetchTreasuryBalances, fetchBankBalances, fetchCustomerBalances,
  fetchWalletBalances, fetchAgentBalances, fetchProfitLoss,
  fetchCurrencyBalances, fetchExchangeSummary,
  buildBuyLines, buildSellLines, buildDadogereftLines,
  buildTransferLines, buildConversionLines,
  buildWalletTopupLines, buildWalletWithdrawLines, buildWalletTransferLines,
  buildOpeningBalanceLines,
};