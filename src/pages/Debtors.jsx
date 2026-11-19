import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers, useCustomerLedgerBalances } from '@/lib/useSarraaf';
import { PageHeader, EmptyState, LoadingState, StatusBadge } from '@/components/sarraaf/Pieces';
import { Input } from '@/components/ui/input';
import { formatNumber, formatAmount } from '@/lib/sarraaf';
import { Search, Handshake, Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'debtors', label: 'بدهکاران' },
  { key: 'creditors', label: 'بستانکاران' },
  { key: 'all', label: 'همه' },
];

export default function Debtors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: customerBalancesData, isLoading: txsLoading } = useCustomerLedgerBalances();

  const loading = customersLoading || txsLoading;

  const allRows = useMemo(() => {
    if (!customers || !customerBalancesData) return [];
    return customers.map(customer => {
      const balances = {};
      for (const item of customerBalancesData) {
        if (String(item.customer_id) === String(customer.id)) {
          balances[item.currency || 'AFN'] = (balances[item.currency || 'AFN'] || 0) + (Number(item.net_balance) || 0);
        }
      }
      const openingCurrency = customer.balance_currency || 'AFN';
      if (Number(customer.opening_balance)) {
        balances[openingCurrency] = (balances[openingCurrency] || 0) + Number(customer.opening_balance);
      }
      const hasBalance = Object.values(balances).some(value => Math.abs(value) > 0.0001);
      return { customer, balances, hasBalance };
    }).filter(row => row.hasBalance);
  }, [customers, customerBalancesData]);

  const rows = useMemo(() => allRows.filter(row => {
    const values = Object.values(row.balances);
    if (tab === 'debtors' && !values.some(value => value > 0.0001)) return false;
    if (tab === 'creditors' && !values.some(value => value < -0.0001)) return false;
    if (search) {
      const value = search.toLowerCase();
      const customer = row.customer;
      if (
        !(customer.name || '').toLowerCase().includes(value) &&
        !(customer.phone || '').includes(value) &&
        !(customer.code || '').toLowerCase().includes(value)
      ) return false;
    }
    return true;
  }), [allRows, tab, search]);

  const totalsByCurrency = useMemo(() => {
    const totals = {};
    for (const row of rows) {
      for (const [currency, balance] of Object.entries(row.balances)) {
        const item = totals[currency] || { debit: 0, credit: 0, net: 0 };
        if (balance > 0) item.debit += balance;
        if (balance < 0) item.credit += Math.abs(balance);
        item.net += balance;
        totals[currency] = item;
      }
    }
    return totals;
  }, [rows]);
  const totalCount = rows.length;

  return (
    <>
      <PageHeader
        title="بدهکاران و بستانکاران"
        subtitle={`${formatNumber(totalCount)} نفر`}
        icon={Handshake}
      />

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو نام / موبایل / کد"
          className="pr-9"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
              tab === t.key ? (t.key==='debtors'?'bg-rose-100 text-rose-800 shadow-sm':t.key==='creditors'?'bg-emerald-100 text-emerald-800 shadow-sm':'bg-blue-100 text-blue-800 shadow-sm') : 'text-muted-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="موردی یافت نشد" description="مشتری با مانده غیرصفر وجود ندارد" />
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border bg-card">
          <table dir="rtl" className="w-full min-w-[720px] border-collapse text-right text-xs">
            <thead className="bg-muted/80 text-foreground">
              <tr>
                <th className="whitespace-nowrap border-b px-4 py-3 font-semibold">نام مشتری</th>
                <th className="whitespace-nowrap border-b px-4 py-3 font-semibold">کد مشتری</th>
                <th className="whitespace-nowrap border-b px-4 py-3 font-semibold">شماره تماس</th>
                <th className="whitespace-nowrap border-b px-4 py-3 font-semibold">نوع حساب</th>
                <th className="whitespace-nowrap border-b px-4 py-3 font-semibold">مانده حساب</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, balances, net }, index) => {
                const currencyValues = Object.values(balances);
                const isDebtor = currencyValues.some(value => value > 0.0001);
                const isCreditor = currencyValues.some(value => value < -0.0001);
                return (
                  <tr
                    key={customer.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/customers/${customer.id}`);
                      }
                    }}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/50',
                      index % 2 === 1 && 'bg-muted/20'
                    )}
                  >
                    <td className="whitespace-nowrap border-b px-4 py-3 font-semibold">{customer.name || '—'}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3">{customer.code || '—'}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3" dir="ltr">{customer.phone || '—'}</td>
                    <td className="whitespace-nowrap border-b px-4 py-3">
                      <StatusBadge
                        status={isDebtor && isCreditor ? 'pending' : isDebtor ? 'active' : 'inactive'}
                        labels={{ active: 'بدهکار', inactive: 'بستانکار', pending: 'چندارزی' }}
                        variant={isDebtor && isCreditor ? 'warning' : isDebtor ? 'destructive' : 'success'}
                      />
                    </td>
                    <td className={cn(
                      'whitespace-nowrap border-b px-4 py-3 font-bold tabular-nums',
                      isDebtor ? 'text-rose-700' : 'text-emerald-700'
                    )}>
                      {Object.entries(balances).map(([cur, val]) => (
                        <span key={cur} className="ml-3 inline-block">{formatAmount(Math.abs(val), cur)}</span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#eaf1f9] text-foreground font-bold">
              <tr>
                <td colSpan={5} className="border-t-2 border-[#174b7d] px-4 py-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <span>جمع ردیف‌های قابل‌مشاهده: {formatNumber(totalCount)} نفر</span>
                    {Object.entries(totalsByCurrency).map(([currency, total]) => (
                      <span key={currency} className="whitespace-nowrap">
                        {currency}: بدهکار {formatAmount(total.debit, currency)} · بستانکار {formatAmount(total.credit, currency)} · مانده {formatAmount(Math.abs(total.net), currency)} {total.net > 0 ? 'بدهکار' : total.net < 0 ? 'بستانکار' : 'تسویه'}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}