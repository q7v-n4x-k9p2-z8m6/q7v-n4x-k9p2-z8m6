import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers, useCustomerBalances } from '@/lib/useSarraaf';
import { PageHeader, StatCard, EmptyState, LoadingState, StatusBadge } from '@/components/sarraaf/Pieces';
import { Input } from '@/components/ui/input';
import { formatNumber, formatAmount } from '@/lib/sarraaf';
import { Search, Handshake, Wallet, TrendingDown, TrendingUp, ChevronLeft } from 'lucide-react';
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
  const { data: customerBalancesData, isLoading: txsLoading } = useCustomerBalances();

  const loading = customersLoading || txsLoading;

  const allRows = useMemo(() => {
    if (!customers || !customerBalancesData) return [];
    return customers
      .map(c => {
        const balRow = customerBalancesData.find(b => String(b.customer_id) === String(c.id));
        const balances = {};
        if (balRow) balances[balRow.balance_currency || 'AFN'] = balRow.net_balance || 0;
        const net = Object.values(balances).reduce((sum, value) => sum + (value || 0), 0);
        const hasBalance = Object.values(balances).some(value => Math.abs(value) > 0.0001);
        return { customer: c, balances, net, hasBalance };
      })
      .filter(row => row.hasBalance)
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [customers, customerBalancesData]);

  const rows = useMemo(() => allRows.filter(row => {
    if (tab === 'debtors' && row.net <= 0) return false;
    if (tab === 'creditors' && row.net >= 0) return false;
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

  const totals = useMemo(() => {
    const debt = allRows.filter(row => row.net > 0).reduce((sum, row) => sum + row.net, 0);
    const credit = allRows.filter(row => row.net < 0).reduce((sum, row) => sum + Math.abs(row.net), 0);
    return { debt, credit, count: allRows.length };
  }, [allRows]);

  return (
    <>
      <PageHeader
        title="بدهکاران و بستانکاران"
        subtitle={`${formatNumber(totals.count)} نفر`}
        icon={Handshake}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard
          label="بدهکار"
          value={formatNumber(totals.debt)}
          icon={TrendingUp}
          gradient="from-rose-600 to-rose-500"
        />
        <StatCard
          label="بستانکار"
          value={formatNumber(totals.credit)}
          icon={TrendingDown}
          gradient="from-emerald-600 to-teal-600"
        />
        <StatCard
          label="خالص"
          value={formatNumber(totals.debt - totals.credit)}
          icon={Wallet}
          gradient="from-primary/90 to-primary/70"
        />
      </div>

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
                const isDebtor = net > 0;
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
                        status={isDebtor ? 'active' : 'inactive'}
                        labels={{ active: 'بدهکار', inactive: 'بستانکار' }}
                        variant={isDebtor ? 'destructive' : 'success'}
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
          </table>
        </div>
      )}
    </>
  );
}