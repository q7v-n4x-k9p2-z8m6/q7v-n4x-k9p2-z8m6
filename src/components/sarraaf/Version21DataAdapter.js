import { supabase } from '@/lib/supabaseClient';
import { getExchangeCode } from '@/lib/supabaseApi';

const num = value => Number(value ?? 0) || 0;
const dateOnly = value => value ? String(value).slice(0, 10) : '';
const activeLabel = value => value === false || value === 'inactive' ? 'غیرفعال' : 'فعال';
const documentTypeLabel = (value, description = '') => {
  const detail = String(description || '');
  if (detail.includes('پرداخت')) return 'پرداخت';
  if (detail.includes('دریافت')) return 'دریافت';
  return ({
    dadogereft: 'دریافت',
    pardakht: 'پرداخت',
    transfer: 'حواله',
    expense: 'مصرف',
    exchange: 'معامله اسعار',
    convert: 'تبدیل ارز',
    cash: 'گردش صندوق',
    cash_in: 'دخل صندوق',
    journal: 'سند روزنامچه',
    transfer_fee: 'کمیشن حواله',
    reversal: 'سند معکوس',
  }[String(value || '').toLowerCase()] || String(value || 'سند'));
};

function getSessionUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
    if (user?.id !== undefined && user?.id !== null) return String(user.id);
    const token = localStorage.getItem('auth_token') || '';
    const payloadPart = token.split('.')[0];
    if (!payloadPart) return '';
    let base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const payload = JSON.parse(atob(base64));
    return payload?.uid !== undefined && payload?.uid !== null ? String(payload.uid) : '';
  } catch {
    return '';
  }
}

async function readTenantTable(table, exchangeCode) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('exchange_code', exchangeCode)
    .order('id', { ascending: true });
  if (error) throw new Error(`خواندن جدول ${table} ناموفق بود: ${error.message}`);
  return data || [];
}

export async function loadVersion21Database() {
  const exchangeCode = getExchangeCode();
  const userId = getSessionUserId();
  if (!exchangeCode || !userId) {
    throw new Error('برای مشاهده اطلاعات، با حساب همان صراف وارد نسخه ۲۱ شوید.');
  }

  // Validate that the signed-in user owns this exact exchange before loading any tenant data.
  const { data: exchange, error: exchangeError } = await supabase
    .from('exchanges')
    .select('id, owner_user_id, exchange_code, exchange_name')
    .eq('owner_user_id', userId)
    .eq('exchange_code', exchangeCode)
    .maybeSingle();
  if (exchangeError) throw new Error(`تأیید حساب صراف ناموفق بود: ${exchangeError.message}`);
  if (!exchange) throw new Error('حساب صراف با نشست فعلی مطابقت ندارد؛ برای امنیت، داده‌ای بارگذاری نشد.');

  const [
    customers, safes, origins, bankAccounts, rates, chartAccounts,
    documents, ledgerEntries, transfers, conversions, treasuryTransactions,
    bankTransactions, journalEntries, auditLogs, errorReports,
  ] = await Promise.all([
    readTenantTable('customers', exchangeCode),
    readTenantTable('safes', exchangeCode),
    readTenantTable('origins', exchangeCode),
    readTenantTable('bank_accounts', exchangeCode),
    readTenantTable('rates', exchangeCode),
    readTenantTable('chart_of_accounts', exchangeCode),
    readTenantTable('documents', exchangeCode),
    readTenantTable('ledger_entries', exchangeCode),
    readTenantTable('transfers', exchangeCode),
    readTenantTable('conversions', exchangeCode),
    readTenantTable('treasury_transactions', exchangeCode),
    readTenantTable('bank_transactions', exchangeCode),
    readTenantTable('journal_entries', exchangeCode),
    // This table has an owner-only SELECT policy for rows whose user_id matches the signed session.
    (async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id,user_id,action,entity_type,entity_id,description,status,created_at,target_name,reason')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`خواندن سوابق فعالیت ناموفق بود: ${error.message}`);
      return data || [];
    })(),
    (async () => {
      const { data, error } = await supabase.from('error_reports').select('id,user_id,exchange_code,error_type,error_message,device,app_version,status,created_at')
        .eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw new Error(`خواندن گزارش خطاها ناموفق بود: ${error.message}`);
      return data || [];
    })(),
  ]);

  const documentsById = new Map(documents.map(row => [String(row.id), row]));
  const safeById = new Map(safes.map(row => [String(row.id), row]));
  const activeLedgerEntries = ledgerEntries.filter(row => !row.deleted);

  const mappedCustomers = customers.map(row => ({
    ...row,
    id: String(row.id),
    kind: row.customer_type === 'misc' ? 'موقتی' : 'دائمی',
    phone: row.mobile || row.phone || '',
    currency: row.balance_currency || 'AFN',
    opening: num(row.opening_balance),
    status: activeLabel(row.status),
    _sourceTable: 'customers',
  }));

  const mappedBranches = origins.map(row => ({
    ...row,
    id: String(row.id),
    code: row.code || '',
    name: row.name || '',
    city: row.city || '',
    phone: row.phone || '',
    currency: 'AFN',
    opening: 0,
    status: activeLabel(row.is_active),
    description: row.notes || '',
    _sourceTable: 'origins',
  }));

  const mappedCash = safes.map(row => ({
    ...row,
    id: String(row.id),
    code: String(row.id),
    opening: num(row.opening_balance),
    status: activeLabel(row.active),
    description: '',
    _sourceTable: 'safes',
  }));

  const mappedBanks = bankAccounts.map(row => ({
    ...row,
    id: String(row.id),
    name: row.bank_name || row.holder || 'حساب بانکی',
    account: row.account_number || row.card_number || row.sheba || '',
    opening: num(row.balance),
    description: row.notes || '',
    _sourceTable: 'bank_accounts',
  }));

  const mappedCurrencies = rates.map(row => ({
    ...row,
    id: String(row.id),
    code: row.currency || '',
    name: row.description || row.currency || '',
    symbol: row.symbol || row.currency || '',
    rate: num(row.sell_rate || row.buy_rate),
    active: activeLabel(row.is_active),
    _sourceTable: 'rates',
  }));

  const mappedAccounts = chartAccounts.map(row => ({
    ...row,
    id: String(row.id),
    code: row.account_code || '',
    name: row.account_name || '',
    level: row.parent_id ? 'معین' : 'کل',
    nature: row.normal_balance === 'credit' ? 'بستانکار' : 'بدهکار',
    description: row.description || '',
    _sourceTable: 'chart_of_accounts',
  }));

  const mappedTransfers = transfers.map(row => ({
    ...row,
    id: String(row.id),
    date: dateOnly(row.created_at),
    number: row.transfer_number || '',
    direction: row.direction === 'receive' ? 'دریافتی' : 'ارسالی',
    sender: row.sender_name || '',
    receiver: row.receiver_name || '',
    branch: row.origin || row.destination || '',
    currency: row.currency || 'AFN',
    amount: num(row.amount),
    fee: num(row.fee),
    cash: '',
    status: ['paid','done','completed'].includes(String(row.status || '').toLowerCase()) ? 'اجرا شده' : (row.status === 'reversed' ? 'ابطال شده' : row.status === 'pending' ? 'در انتظار' : row.status),
    note: row.destination || row.agent_route || '',
    _sourceTable: 'transfers',
  }));

  const mappedConversions = conversions.map(row => ({
    ...row,
    id: String(row.id),
    date: dateOnly(row.created_at),
    kind: 'تبدیل',
    fromCurrency: row.from_currency || '',
    fromAmount: num(row.from_amount),
    toCurrency: row.to_currency || '',
    toAmount: num(row.to_amount),
    rate: num(row.rate),
    profit: 0,
    party: row.customer_name || '',
    note: row.description || '',
    _sourceTable: 'conversions',
  }));

  const mappedTransactions = activeLedgerEntries.map(row => {
    const linkedDocument = row.document_id ? documentsById.get(String(row.document_id)) : null;
    const accountType = String(row.account_type || '').toLowerCase();
    const isCustomer = accountType === 'customer';
    const isCash = accountType === 'cash';
    const currency = row.currency || linkedDocument?.currency || 'AFN';
    const debit = num(row.debit);
    const credit = num(row.credit);
    const amount = isCustomer ? credit - debit : debit - credit;
    const safe = isCash ? safeById.get(String(row.account_id || '')) : null;
    return {
      id: String(row.id),
      date: dateOnly(row.created_at),
      created_at: row.created_at,
      type: documentTypeLabel(linkedDocument?.doc_type || row.type || accountType, linkedDocument?.description || row.description),
      party: row.account_name || linkedDocument?.related_name || '',
      partyType: isCustomer ? 'customer' : (accountType === 'origin' || accountType === 'branch' ? 'branch' : 'other'),
      currency,
      amount,
      cash: isCash ? (safe?.name || row.account_name || 'صندوق') : '',
      description: row.description || linkedDocument?.description || '',
      number: linkedDocument?.doc_number || '',
      debit,
      credit,
      accountType,
      accountId: row.account_id || '',
      documentId: row.document_id || null,
      deleted: !!row.deleted,
      _sourceTable: 'ledger_entries',
    };
  });

  const journalGroups = new Map();
  activeLedgerEntries.forEach(row => {
    const documentKey = row.document_id ? String(row.document_id) : `ledger-${row.id}`;
    const currency = row.currency || documentsById.get(documentKey)?.currency || 'AFN';
    const key = `${documentKey}::${currency}`;
    if (!journalGroups.has(key)) journalGroups.set(key, []);
    journalGroups.get(key).push(row);
  });
  const mappedJournal = [...journalGroups.entries()].map(([key, lines]) => {
    const first = lines[0] || {};
    const documentKey = first.document_id ? String(first.document_id) : `ledger-${first.id}`;
    const linkedDocument = documentsById.get(documentKey);
    const currency = first.currency || linkedDocument?.currency || 'AFN';
    const debitTotal = lines.reduce((sum, row) => sum + num(row.debit), 0);
    const creditTotal = lines.reduce((sum, row) => sum + num(row.credit), 0);
    const debitNames = [...new Set(lines.filter(row => num(row.debit) > 0).map(row => row.account_name).filter(Boolean))];
    const creditNames = [...new Set(lines.filter(row => num(row.credit) > 0).map(row => row.account_name).filter(Boolean))];
    return {
      id: key,
      documentId: first.document_id ? String(first.document_id) : null,
      date: dateOnly(first.created_at),
      number: linkedDocument?.doc_number || `LE-${first.id}`,
      description: linkedDocument?.description || first.description || '',
      debitAccount: debitNames.join(' / '),
      creditAccount: creditNames.join(' / '),
      currency,
      amount: debitTotal,
      debitTotal,
      creditTotal,
      status: linkedDocument?.reversed ? 'ابطال شده' : (Math.abs(debitTotal - creditTotal) < 0.005 ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'ledger_entries',
    };
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const mappedReports = documents.filter(row => !row.deleted).map(row => {
    const lines = activeLedgerEntries.filter(line => String(line.document_id || '') === String(row.id));
    const cashLine = lines.find(line => line.account_type === 'cash');
    const cash = cashLine ? (safeById.get(String(cashLine.account_id || ''))?.name || cashLine.account_name || '') : '';
    return {
      id: String(row.id), documentId: String(row.id),
      date: dateOnly(row.created_at),
      type: documentTypeLabel(row.doc_type, row.description),
      party: row.related_name || '',
      partyType: row.related_type === 'customer' ? 'customer' : (row.related_type === 'branch' ? 'branch' : 'other'),
      currency: row.currency || 'AFN',
      amount: num(row.amount),
      cash,
      description: row.description || '',
      number: row.doc_number || '',
      status: row.reversed ? 'ابطال شده' : 'قطعی',
      _sourceTable: 'documents',
    };
  });

  const mappedExpenses = documents
    .filter(row => !row.deleted && /expense|cost|masraf|مصرف/i.test(String(row.doc_type || '') + ' ' + String(row.description || '')))
    .map(row => {
      const cashLine = activeLedgerEntries.find(line => String(line.document_id || '') === String(row.id) && line.account_type === 'cash');
      return {
        id: String(row.id), documentId: String(row.id),
        date: dateOnly(row.created_at),
        title: row.description || documentTypeLabel(row.doc_type),
        currency: row.currency || 'AFN',
        amount: num(row.amount),
        cash: cashLine ? (safeById.get(String(cashLine.account_id || ''))?.name || cashLine.account_name || '') : '',
        note: row.doc_number || '',
        status: row.reversed ? 'ابطال شده' : 'قطعی',
        _sourceTable: 'documents',
      };
    });

  const mappedErrors = errorReports.map(row => ({
    id: String(row.id), date: dateOnly(row.created_at), error_type: row.error_type || '',
    error_message: row.error_message || '', device: row.device || '',
    app_version: row.app_version || '', status: row.status || 'new',
    _sourceTable: 'error_reports',
  }));

  const mappedActivity = auditLogs.map(row => ({
    id: String(row.id),
    date: dateOnly(row.created_at),
    action: row.action || '',
    entity: row.entity_type || '',
    entityId: row.entity_id || '',
    description: row.description || row.reason || row.target_name || '',
    status: row.status || '',
    _sourceTable: 'audit_logs',
  }));

  return {
    exchange: {
      id: String(exchange.id),
      name: exchange.exchange_name || '',
      code: exchange.exchange_code,
      ownerUserId: String(exchange.owner_user_id),
    },
    data: {
      customers: mappedCustomers,
      branches: mappedBranches,
      cash: mappedCash,
      banks: mappedBanks,
      currencies: mappedCurrencies,
      accounts: mappedAccounts,
      expenses: mappedExpenses,
      remittance: mappedTransfers,
      exchange: mappedConversions,
      journal: mappedJournal,
      transactions: mappedTransactions,
      reports: mappedReports,
      activity: mappedActivity,
      errors: mappedErrors,
    },
    loadedAt: new Date().toISOString(),
  };
}
