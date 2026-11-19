import { supabase } from '@/lib/supabaseClient';
import { getExchangeCode } from '@/lib/supabaseApi';
import { loadDemoPreviewRecords } from './Version21DemoAdapter';
import { resolveSessionUserId } from './Version21DemoRules';
import { isChartAccountLedgerLine } from './Version21AccountingRules';

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
  return resolveSessionUserId(
    localStorage.getItem('auth_user') || 'null',
    localStorage.getItem('auth_token') || ''
  );
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

  // Resolve the tenant from the exchange code carried by the signed session.
  // Do not require owner_user_id here: authorized employees also use the same
  // exchange tenant. Every tenant table read below is still constrained by
  // exchange_code and Supabase RLS validates that it matches the signed app_ec().
  const { data: exchange, error: exchangeError } = await supabase
    .from('exchanges')
    .select('id, owner_user_id, exchange_code, exchange_name')
    .eq('exchange_code', exchangeCode)
    .maybeSingle();
  if (exchangeError) throw new Error(`تأیید حساب صراف ناموفق بود: ${exchangeError.message}`);
  if (!exchange) throw new Error('حساب صراف در نشست فعلی پیدا نشد؛ برای امنیت، داده‌ای بارگذاری نشد.');

  const [
    customers, safes, origins, bankAccounts, rates, chartAccounts,
    documents, ledgerEntries, transfers, conversions, treasuryTransactions,
    bankTransactions, journalEntries, sessionUser, userPermissions, auditLogs, errorReports,
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
    (async () => {
      const { data, error } = await supabase.from('users').select('role')
        .eq('id', Number(userId)).maybeSingle();
      if (error) throw new Error(`تأیید نقش کاربر ناموفق بود: ${error.message}`);
      if (!data?.role) throw new Error('نقش کاربر از سرور دریافت نشد.');
      return data;
    })(),
    (async () => {
      const { data, error } = await supabase.from('user_permissions')
        .select('section,can_view,can_create,can_edit,can_delete,can_print,can_report,can_settings')
        .eq('user_id', String(userId));
      if (error) throw new Error(`خواندن مجوزهای کاربر ناموفق بود: ${error.message}`);
      return data || [];
    })(),
    // This table has an owner-only SELECT policy for rows whose user_id matches the signed session.
    (async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id,user_id,action,entity_type,entity_id,description,status,created_at,target_name,reason')
        .eq('user_id', userId)
        .eq('exchange_code', exchangeCode)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`خواندن سوابق فعالیت ناموفق بود: ${error.message}`);
      return data || [];
    })(),
    (async () => {
      const { data, error } = await supabase.from('error_reports').select('id,user_id,exchange_code,error_type,error_message,device,app_version,status,created_at')
        .eq('user_id', userId).eq('exchange_code', exchangeCode).order('created_at', { ascending: false });
      if (error) throw new Error(`خواندن گزارش خطاها ناموفق بود: ${error.message}`);
      return data || [];
    })(),
  ]);

  const documentsById = new Map(documents.map(row => [String(row.id), row]));
  const safeById = new Map(safes.map(row => [String(row.id), row]));
  const chartAccountById = new Map(chartAccounts.map(row => [String(row.id), row]));
  const activeLedgerEntries = ledgerEntries.filter(row => !row.deleted);
  const documentBalanceCache = new Map();
  const isDocumentBalanced = documentId => {
    if (!documentId) return false;
    const key = String(documentId);
    if (documentBalanceCache.has(key)) return documentBalanceCache.get(key);
    const lines = activeLedgerEntries.filter(row => String(row.document_id || '') === key);
    if (!lines.length) { documentBalanceCache.set(key, false); return false; }
    const totals = new Map();
    for (const line of lines) {
      const currency = String(line.currency || 'AFN');
      // Parse raw database values before validating; never coerce malformed amounts to zero.
      const debit = line.debit === null || line.debit === undefined || line.debit === '' ? 0 : Number(line.debit);
      const credit = line.credit === null || line.credit === undefined || line.credit === '' ? 0 : Number(line.credit);
      if (!Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        documentBalanceCache.set(key, false); return false;
      }
      const total = totals.get(currency) || { debit: 0, credit: 0 };
      total.debit += debit; total.credit += credit; totals.set(currency, total);
    }
    const balanced = [...totals.values()].every(total => Math.abs(total.debit - total.credit) < 0.005);
    documentBalanceCache.set(key, balanced);
    return balanced;
  };

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
    status: activeLabel(row.active),
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

  const mappedAccounts = chartAccounts.map(row => {
    const accountLines = activeLedgerEntries.filter(line =>
      isChartAccountLedgerLine(line, row) &&
      !documentsById.get(String(line.document_id || ''))?.deleted
    );
    const balanceMap = new Map();
    const addAccountBalance = (currencyValue, debitValue, creditValue, lineCount = 1) => {
      const currency = String(currencyValue || row.currency || 'AFN');
      const total = balanceMap.get(currency) || { currency, debit: 0, credit: 0, balance: 0, lineCount: 0 };
      total.debit += num(debitValue);
      total.credit += num(creditValue);
      total.balance = row.normal_balance === 'credit' ? total.credit - total.debit : total.debit - total.credit;
      total.lineCount += lineCount;
      balanceMap.set(currency, total);
    };
    accountLines.forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    // Roll up the existing cash, bank and customer subledgers into their
    // corresponding control accounts without rewriting legacy ledger rows.
    if (row.account_code === '1010') {
      safes.forEach(safe => addAccountBalance(safe.currency, Math.max(0, num(safe.opening_balance)), Math.max(0, -num(safe.opening_balance)), 0));
      activeLedgerEntries.filter(line => line.account_type === 'cash' && safeById.has(String(line.account_id || '')))
        .forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    } else if (row.account_code === '1020') {
      bankAccounts.forEach(bank => addAccountBalance(bank.currency, Math.max(0, num(bank.balance)), Math.max(0, -num(bank.balance)), 0));
      activeLedgerEntries.filter(line => line.account_type === 'bank')
        .forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    } else if (row.account_code === '1030') {
      customers.forEach(customer => addAccountBalance(customer.balance_currency || 'AFN', Math.max(0, num(customer.opening_balance)), Math.max(0, -num(customer.opening_balance)), 0));
      activeLedgerEntries.filter(line => line.account_type === 'customer')
        .forEach(line => addAccountBalance(line.currency, line.debit, line.credit));
    }
    return {
      ...row,
      id: String(row.id),
      code: row.account_code || '',
      name: row.account_name || '',
      level: row.parent_id ? 'معین' : 'کل',
      parentId: row.parent_id ? String(row.parent_id) : '',
      accountType: row.account_type || '',
      nature: row.normal_balance === 'credit' ? 'بستانکار' : 'بدهکار',
      status: row.is_active === false ? 'غیرفعال' : 'فعال',
      balanceByCurrency: [...balanceMap.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
      description: row.description || '',
      _sourceTable: 'chart_of_accounts',
    };
  });

  mappedAccounts.filter(account => !account.parentId).forEach(parent => {
    const totals = new Map((parent.balanceByCurrency || []).map(row => [row.currency, { ...row }]));
    mappedAccounts.filter(child => String(child.parentId || '') === String(parent.id)).forEach(child => {
      (child.balanceByCurrency || []).forEach(balance => {
        const total = totals.get(balance.currency) || { currency: balance.currency, debit: 0, credit: 0, balance: 0, lineCount: 0 };
        total.debit += num(balance.debit);
        total.credit += num(balance.credit);
        total.lineCount += num(balance.lineCount);
        total.balance = parent.nature === 'بستانکار' ? total.credit - total.debit : total.debit - total.credit;
        totals.set(balance.currency, total);
      });
    });
    parent.balanceByCurrency = [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  });

  const mappedTransfers = transfers.map(row => ({
    ...row,
    id: String(row.id),
    date: dateOnly(row.created_at),
    number: row.transfer_number || '',
    direction: row.direction === 'receive' ? 'دریافتی' : row.direction === 'send' ? 'ارسالی' : 'نامعلوم',
    sender: row.sender_name || '',
    receiver: row.receiver_name || '',
    origin: row.origin || '',
    destination: row.destination || '',
    branch: row.origin || row.destination || '',
    currency: row.currency || 'AFN',
    amount: num(row.amount),
    fee: num(row.fee),
    total: Number.isFinite(num(row.total)) && num(row.total) > 0 ? num(row.total) : num(row.amount) + num(row.fee),
    cash: '',
    status: ['paid','done','completed'].includes(String(row.status || '').toLowerCase()) ? 'اجرا شده' : (row.status === 'reversed' ? 'ابطال شده' : row.status === 'pending' ? 'در انتظار' : row.status),
    accountingStatus: (() => {
      const doc = documents.find(item => Number(item.transfer_id) === Number(row.id));
      const feeDocs = documents.filter(item => item.doc_type === 'transfer_fee' && item.related_type === 'transfer' && Number(item.related_id) === Number(row.id) && !item.deleted);
      if (!doc) return 'سند ندارد';
      if (!isDocumentBalanced(doc.id) && !doc.reversed) return 'نیازمند بررسی';
      if (doc.reversed) return (num(row.fee) > 0 && (!feeDocs.length || feeDocs.some(item => !item.reversed))) ? 'ابطال ناقص' : 'ابطال شده';
      if (num(row.fee) > 0 && !feeDocs.length) return 'سند کمیشن ندارد';
      if (feeDocs.some(item => !item.reversed && !isDocumentBalanced(item.id))) return 'نیازمند بررسی';
      if (num(row.fee) > 0 && feeDocs.length && feeDocs.every(item => item.reversed)) return 'کمیشن ابطال شده';
      return 'متوازن';
    })(),
    note: row.destination || row.agent_route || '',
    _sourceTable: 'transfers',
  }));

  const mappedConversions = conversions.map(row => {
    const linkedDocument = documents.find(item => item.related_type === 'conversion' && Number(item.related_id) === Number(row.id));
    const documentLines = linkedDocument
      ? activeLedgerEntries.filter(line => String(line.document_id || '') === String(linkedDocument.id))
      : [];
    return {
      ...row,
      id: String(row.id),
      date: dateOnly(row.created_at),
      number: linkedDocument?.doc_number || '',
      kind: 'تبدیل',
      fromCurrency: row.from_currency || '',
      fromAmount: num(row.from_amount),
      toCurrency: row.to_currency || '',
      toAmount: num(row.to_amount),
      rate: num(row.rate),
      profit: null,
      debitAccount: [...new Set(documentLines.filter(line => num(line.debit) > 0).map(line => line.account_name).filter(Boolean))].join(' / '),
      creditAccount: [...new Set(documentLines.filter(line => num(line.credit) > 0).map(line => line.account_name).filter(Boolean))].join(' / '),
      accountingStatus: !linkedDocument ? 'سند ندارد' : (linkedDocument.reversed ? 'ابطال شده' : isDocumentBalanced(linkedDocument.id) ? 'متوازن' : 'نیازمند بررسی'),
      party: row.customer_name || '',
      note: row.description || '',
      _sourceTable: 'conversions',
    };
  });

  const mappedTransactions = activeLedgerEntries.map(row => {
    const linkedDocument = row.document_id ? documentsById.get(String(row.document_id)) : null;
    const accountType = String(row.account_type || '').toLowerCase();
    const isCustomer = accountType === 'customer';
    const isCash = accountType === 'cash';
    const isBranch = !isCash && (linkedDocument?.related_type === 'branch' || accountType === 'origin' || accountType === 'branch');
    const currency = row.currency || linkedDocument?.currency || 'AFN';
    const debit = num(row.debit);
    const credit = num(row.credit);
    const amount = (isCustomer || isBranch) ? credit - debit : debit - credit;
    const safe = isCash ? safeById.get(String(row.account_id || '')) : null;
    const documentLines = linkedDocument
      ? activeLedgerEntries.filter(line => String(line.document_id || '') === String(linkedDocument.id))
      : [row];
    const debitAccount = [...new Set(documentLines.filter(line => num(line.debit) > 0).map(line => line.account_name).filter(Boolean))].join(' / ');
    const creditAccount = [...new Set(documentLines.filter(line => num(line.credit) > 0).map(line => line.account_name).filter(Boolean))].join(' / ');
    return {
      id: String(row.id),
      date: dateOnly(row.created_at),
      created_at: row.created_at,
      type: documentTypeLabel(linkedDocument?.doc_type || row.type || accountType, linkedDocument?.description || row.description),
      party: (linkedDocument?.related_name && linkedDocument.related_type === 'branch' ? linkedDocument.related_name : row.account_name) || linkedDocument?.related_name || '',
      partyType: isCustomer ? 'customer' : (linkedDocument?.related_type === 'branch' || accountType === 'origin' || accountType === 'branch' ? 'branch' : 'other'),
      currency,
      amount,
      cash: isCash ? (safe?.name || row.account_name || 'صندوق') : '',
      description: row.description || linkedDocument?.description || '',
      number: linkedDocument?.doc_number || '',
      account: row.account_name || '',
      debitAccount,
      creditAccount,
      debit,
      credit,
      accountType,
      accountId: row.account_id || '',
      documentId: row.document_id || null,
      status: linkedDocument?.reversed ? 'ابطال شده' : (row.document_id && isDocumentBalanced(row.document_id) ? 'قطعی' : 'نیازمند بررسی'),
      deleted: !!row.deleted,
      _sourceTable: 'ledger_entries',
    };
  });

  const journalGroups = new Map();
  activeLedgerEntries.forEach(row => {
    const linkedDocument = row.document_id ? documentsById.get(String(row.document_id)) : null;
    if (String(linkedDocument?.doc_type || '').toLowerCase() !== 'journal') return;
    const documentKey = String(row.document_id);
    const currency = row.currency || linkedDocument?.currency || 'AFN';
    const key = `${documentKey}::${currency}`;
    if (!journalGroups.has(key)) journalGroups.set(key, []);
    journalGroups.get(key).push(row);
  });
  const mappedJournal = [...journalGroups.entries()].map(([key, lines]) => {
    const first = lines[0] || {};
    const documentKey = String(first.document_id);
    const linkedDocument = documentsById.get(documentKey);
    const currency = first.currency || linkedDocument?.currency || 'AFN';
    const debitTotal = lines.reduce((sum, row) => sum + num(row.debit), 0);
    const creditTotal = lines.reduce((sum, row) => sum + num(row.credit), 0);
    const debitNames = [...new Set(lines.filter(row => num(row.debit) > 0).map(row => row.account_name).filter(Boolean))];
    const creditNames = [...new Set(lines.filter(row => num(row.credit) > 0).map(row => row.account_name).filter(Boolean))];
    return {
      id: key,
      documentId: documentKey,
      date: dateOnly(first.created_at),
      number: linkedDocument?.doc_number || `JE-${first.id}`,
      description: linkedDocument?.description || first.description || '',
      debitAccount: debitNames.join(' / '),
      creditAccount: creditNames.join(' / '),
      currency,
      amount: debitTotal,
      debitTotal,
      creditTotal,
      status: linkedDocument?.reversed ? 'ابطال شده' : (Math.abs(debitTotal - creditTotal) < 0.005 ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'documents',
    };
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const mappedLedger = activeLedgerEntries.map(row => {
    const doc = row.document_id ? documentsById.get(String(row.document_id)) : null;
    return {
      id: String(row.id),
      documentId: row.document_id ? String(row.document_id) : null,
      date: dateOnly(row.created_at),
      number: doc?.doc_number || `LE-${row.id}`,
      description: row.description || doc?.description || '',
      account: row.account_name || '',
      accountType: row.account_type || '',
      debit: num(row.debit),
      credit: num(row.credit),
      amount: num(row.debit) || num(row.credit),
      currency: row.currency || doc?.currency || 'AFN',
      status: doc?.reversed ? 'ابطال شده' : (doc?.id && isDocumentBalanced(doc.id) ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'ledger_entries',
    };
  }).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const mappedReports = documents.filter(row => !row.deleted).map(row => {
    const lines = activeLedgerEntries.filter(line => String(line.document_id || '') === String(row.id));
    const cashLine = lines.find(line => line.account_type === 'cash');
    const cash = cashLine ? (safeById.get(String(cashLine.account_id || ''))?.name || cashLine.account_name || '') : '';
    const debitLines = lines.filter(line => num(line.debit) > 0);
    const creditLines = lines.filter(line => num(line.credit) > 0);
    return {
      id: String(row.id), documentId: String(row.id),
      date: dateOnly(row.created_at),
      type: documentTypeLabel(row.doc_type, row.description),
      party: row.related_name || '',
      partyType: row.related_type === 'customer' ? 'customer' : (row.related_type === 'branch' ? 'branch' : 'other'),
      currency: row.currency || 'AFN',
      amount: num(row.amount),
      debit: debitLines.reduce((sum, line) => sum + num(line.debit), 0),
      credit: creditLines.reduce((sum, line) => sum + num(line.credit), 0),
      debitAccount: [...new Set(debitLines.map(line => line.account_name).filter(Boolean))].join(' / '),
      creditAccount: [...new Set(creditLines.map(line => line.account_name).filter(Boolean))].join(' / '),
      account: [...new Set(lines.map(line => line.account_name).filter(Boolean))].join(' / '),
      cash,
      description: row.description || '',
      number: row.doc_number || '',
      status: row.reversed ? 'ابطال شده' : (isDocumentBalanced(row.id) ? 'قطعی' : 'نیازمند بررسی'),
      _sourceTable: 'documents',
    };
  });

  const mappedExpenses = documents
    .filter(row => !row.deleted && /expense|cost|masraf|مصرف/i.test(String(row.doc_type || '') + ' ' + String(row.description || '')))
    .map(row => {
      const documentLines = activeLedgerEntries.filter(line => String(line.document_id || '') === String(row.id));
      const cashLine = documentLines.find(line => line.account_type === 'cash');
      const expenseLine = documentLines.find(line => line.account_type === 'suspense' && line.account_id && chartAccountById.has(String(line.account_id)));
      const expenseChartAccount = expenseLine ? chartAccountById.get(String(expenseLine.account_id)) : null;
      return {
        id: String(row.id), documentId: String(row.id),
        date: dateOnly(row.created_at),
        title: row.description || documentTypeLabel(row.doc_type),
        expenseAccount: expenseChartAccount ? expenseChartAccount.account_code + ' — ' + expenseChartAccount.account_name : '',
        currency: row.currency || 'AFN',
        amount: num(row.amount),
        cash: cashLine ? (safeById.get(String(cashLine.account_id || ''))?.name || cashLine.account_name || '') : '',
        number: row.doc_number || '',
        note: row.doc_number || '',
        status: row.reversed ? 'ابطال شده' : (isDocumentBalanced(row.id) ? 'قطعی' : 'نیازمند بررسی'),
        _sourceTable: 'documents',
      };
    });

  // Profit & loss is calculated from posted double-entry ledger lines and the
  // tenant's chart of accounts. Cash/customer/suspense movements are not
  // treated as income or expense unless they are explicitly linked to a
  // revenue/expense account in chart_of_accounts.
  const profitTotals = new Map();
  const profitAccountTotals = new Map();
  const profitEntries = [];
  const unclassifiedProfitLines = [];
  for (const line of activeLedgerEntries) {
    const linkedDocument = line.document_id ? documentsById.get(String(line.document_id)) : null;
    if (linkedDocument?.deleted) continue;
    const account = line.account_id ? chartAccountById.get(String(line.account_id)) : null;
    const accountType = String(account?.account_type || line.account_type || '').toLowerCase();
    if (!['revenue', 'expense'].includes(accountType)) {
      const label = String(line.account_name || '');
      if (!account && line.account_type === 'suspense' && /(درآمد|کمیشن|مصارف|هزینه|سود|زیان|income|expense|profit|loss)/i.test(label)) {
        unclassifiedProfitLines.push({
          id: String(line.id), date: dateOnly(line.created_at), account: label,
          currency: line.currency || linkedDocument?.currency || 'AFN',
          debit: num(line.debit), credit: num(line.credit),
          documentId: line.document_id || null,
        });
      }
      continue;
    }
    const currency = String(line.currency || linkedDocument?.currency || account?.currency || 'AFN');
    const debit = num(line.debit);
    const credit = num(line.credit);
    const normalBalance = account?.normal_balance || (accountType === 'revenue' ? 'credit' : 'debit');
    const signedAmount = normalBalance === 'credit' ? credit - debit : debit - credit;
    profitEntries.push({
      id: String(line.id), date: dateOnly(line.created_at),
      documentId: line.document_id || null,
      accountId: String(account?.id || line.account_id || ''),
      code: account?.account_code || '',
      account: account?.account_name || line.account_name || 'حساب نامشخص',
      accountType, currency, amount: signedAmount,
      debit, credit,
    });
    const key = currency;
    const totals = profitTotals.get(key) || { currency, revenue: 0, expense: 0, net: 0, lineCount: 0 };
    if (accountType === 'revenue') totals.revenue += signedAmount;
    else totals.expense += signedAmount;
    totals.lineCount += 1;
    totals.net = totals.revenue - totals.expense;
    profitTotals.set(key, totals);

    const accountId = String(account?.id || line.account_id || line.account_name || 'unmapped');
    const accountKey = accountId + '::' + currency;
    const accountTotals = profitAccountTotals.get(accountKey) || {
      accountId, code: account?.account_code || '', account: account?.account_name || line.account_name || 'حساب نامشخص',
      accountType, currency, amount: 0, lineCount: 0,
    };
    accountTotals.amount += signedAmount;
    accountTotals.lineCount += 1;
    profitAccountTotals.set(accountKey, accountTotals);
  }
  const profitByCurrency = [...profitTotals.values()].sort((a, b) => a.currency.localeCompare(b.currency));
  const profitAccounts = [...profitAccountTotals.values()].sort((a, b) =>
    a.accountType.localeCompare(b.accountType) || a.account.localeCompare(b.account)
  );

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

  const isDemoAccount = (Number(userId) === 107 && exchangeCode === 'EX-261019-9B2573C5') ||
    (Number(userId) === 114 && exchangeCode === 'EX-261028-27497E95');
  const demoPreviewRecords = isDemoAccount ? await loadDemoPreviewRecords() : [];

  return {
    exchange: {
      id: String(exchange.id),
      name: exchange.exchange_name || '',
      code: exchange.exchange_code,
      ownerUserId: String(exchange.owner_user_id),
    },
    permissions: userPermissions,
    data: {
      isDemoAccount,
      demoPreviewRecords,
      role: String(sessionUser.role || '').toLowerCase(),
      permissions: userPermissions,
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
      ledger: mappedLedger,
      transactions: mappedTransactions,
      reports: mappedReports,
      activity: mappedActivity,
      errors: mappedErrors,
      profitByCurrency,
      profitAccounts,
      profitEntries,
      unclassifiedProfitLines,
    },
    loadedAt: new Date().toISOString(),
  };
}
