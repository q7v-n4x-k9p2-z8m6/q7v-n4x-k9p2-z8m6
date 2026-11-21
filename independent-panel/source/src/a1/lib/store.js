// a1/lib/store.js — لایهٔ دادهٔ محلی، معادل lib/useSarraaf.js سورس A1
// امضای hooks حفظ شده است، اما منبع داده IndexedDB است و هیچ درخواست شبکه‌ای انجام نمی‌شود.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { all, insert, update, postDocument, ledgerEntries } from '@/a1/lib/db';

const EXCHANGE = 'DEMO-EX';

function documentToTx(doc) {
  return {
    id: doc.id,
    type: doc.doc_type,
    date: doc.created_at || doc.date,
    description: doc.description,
    amount: doc.amount,
    currency: doc.currency,
    counter_type: doc.counter_type || doc.related_type,
    related_type: doc.related_type,
    related_id: doc.related_id,
    related_name: doc.related_name,
    doc_number: doc.doc_number,
    deleted: doc.reversed,
    edited: Boolean(doc.edited),
    status: doc.status,
  };
}

export function useTransactions() {
  return useQuery({
    queryKey: ['a1', 'documents'],
    queryFn: async () => {
      const docs = await all('documents');
      return docs
        .slice()
        .sort((a, b) => (b.id || 0) - (a.id || 0))
        .map(documentToTx);
    },
  });
}

export function useDocuments() {
  return useTransactions();
}

export function useSafes() {
  return useQuery({
    queryKey: ['a1', 'safes'],
    queryFn: async () => (await all('safes')).filter((row) => row.active !== false),
  });
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ['a1', 'bank_accounts'],
    queryFn: async () => (await all('bank_accounts')).filter((row) => row.active !== false),
  });
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['a1', 'rates'],
    queryFn: async () => (await all('rates')).map((row) => ({
      ...row,
      code: row.currency,
      name: row.currency,
      is_active: row.is_active !== false,
    })),
  });
}

export function useCustomers(search = '') {
  return useQuery({
    queryKey: ['a1', 'customers', search],
    queryFn: async () => {
      const rows = await all('customers');
      const term = search.trim();
      const filtered = term ? rows.filter((row) => String(row.name || '').includes(term) || String(row.mobile || '').includes(term)) : rows;
      return filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'fa'));
    },
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['a1', 'origins'],
    queryFn: async () => (await all('origins')).filter((row) => row.is_active !== false),
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: ['a1', 'transfers'],
    queryFn: async () => (await all('transfers')).slice().sort((a, b) => (b.id || 0) - (a.id || 0)),
  });
}

export function useRateSettings() {
  return useQuery({
    queryKey: ['a1', 'app_settings'],
    queryFn: async () => {
      const rows = await all('app_settings');
      return Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]));
    },
  });
}

export function useFeatures() {
  return useQuery({
    queryKey: ['a1', 'feature_settings'],
    queryFn: async () => all('feature_settings'),
  });
}

export function useSarraafProfile() {
  return useQuery({
    queryKey: ['a1', 'exchanges'],
    queryFn: async () => (await all('exchanges'))[0] || null,
  });
}

export function useCreateSafe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => insert('safes', { ...data, exchange_code: EXCHANGE }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['a1', 'safes'] }),
  });
}

export function useUpdateSafe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => update('safes', id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['a1', 'safes'] });
      queryClient.invalidateQueries({ queryKey: ['a1', 'documents'] });
    },
  });
}

export function usePostDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => postDocument({ ...payload, exchange_code: payload.exchange_code || EXCHANGE }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['a1', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['a1', 'treasury'] });
    },
  });
}

// ماندهٔ خزانه: ماندهٔ آغازین صندوق‌ها + گردش حساب نقدی در دفتر
export function useTreasuryBalances() {
  return useQuery({
    queryKey: ['a1', 'treasury'],
    queryFn: async () => {
      const [safes, entries] = await Promise.all([all('safes'), ledgerEntries()]);
      const map = new Map();
      safes.filter((row) => row.active !== false).forEach((safe) => {
        const current = map.get(safe.currency) || { currency: safe.currency, balance: 0 };
        current.balance += Number(safe.opening_balance) || 0;
        map.set(safe.currency, current);
      });
      entries.filter((row) => row.account_type === 'cash').forEach((row) => {
        const current = map.get(row.currency) || { currency: row.currency, balance: 0 };
        current.balance += (Number(row.debit) || 0) - (Number(row.credit) || 0);
        map.set(row.currency, current);
      });
      return Array.from(map.values());
    },
  });
}