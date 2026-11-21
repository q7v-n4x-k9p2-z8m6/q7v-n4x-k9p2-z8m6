import React, { useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { useLedger } from '@/hooks/useRecords';
import { nativeBalances } from '@/lib/accounting/queries';
import { ACCOUNT_TYPES } from '@/lib/accounting/chart';
import { dec, faDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function GeneralLedger() {
  const { entries, loading } = useLedger();
  const [selectedKey, setSelectedKey] = useState('');

  const accounts = useMemo(() => nativeBalances(entries), [entries]);
  const selected = accounts.find((row) => row.key === selectedKey);

  const rows = useMemo(() => {
    if (!selectedKey) return [];
    const filtered = entries
      .filter((entry) => `${entry.account_type}:${entry.account_id || entry.account_name}` === selectedKey)
      .slice()
      .reverse();
    let balance = 0;
    return filtered.map((entry) => {
      balance += entry.side === 'debit' ? Number(entry.amount) : -Number(entry.amount);
      return { ...entry, running_balance: balance };
    });
  }, [entries, selectedKey]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="دفتر کل"
        description="گردش و ماندهٔ هر حساب. ماندهٔ نمایش‌داده‌شده به ارز اصلی همان حساب است و برای هر ارز جدا محاسبه می‌شود."
        icon={ScrollText}
      />

      <SectionCard title="حساب‌ها" description="صندوق‌ها، بانک‌ها، مشتریان، درآمد و هزینه">
        {accounts.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <button
                key={account.key}
                type="button"
                onClick={() => setSelectedKey(account.key === selectedKey ? '' : account.key)}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-right transition-colors',
                  account.key === selectedKey ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-card hover:bg-secondary/60'
                )}
              >
                <p className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11.5px] font-bold">{account.account_name}</span>
                  <span className="shrink-0 text-[9px] text-muted-foreground">{ACCOUNT_TYPES[account.account_type]?.label}</span>
                </p>
                <p className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(account.balances).map(([currency, value]) => (
                    <span key={currency} className={cn('num text-[10.5px] font-bold', value < 0 ? 'text-rose-700' : 'text-emerald-700')}>
                      {dec(value)} {currency}
                    </span>
                  ))}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">
            {loading ? 'در حال بارگذاری…' : 'هنوز ردیف دفتری ثبت نشده است.'}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title={selected ? `گردش حساب — ${selected.account_name}` : 'گردش حساب'}
        description={selected ? 'ردیف‌ها از قدیم به جدید با ماندهٔ تجمعی' : 'یک حساب را از فهرست بالا انتخاب کنید'}
      >
        {selected ? (
          <DataTable
            rows={rows}
            empty={{ title: 'گردشی برای این حساب ثبت نشده است' }}
            columns={[
              { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
              { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
              {
                key: 'description',
                label: 'شرح',
                hideOnMobile: true,
                render: (row) => <span className="truncate text-[11px]">{row.description || '—'}</span>,
              },
              {
                key: 'debit',
                label: 'بدهکار',
                render: (row) => (row.side === 'debit' ? <span className="num">{dec(row.amount)}</span> : '—'),
              },
              {
                key: 'credit',
                label: 'بستانکار',
                render: (row) => (row.side === 'credit' ? <span className="num">{dec(row.amount)}</span> : '—'),
              },
              {
                key: 'running_balance',
                label: 'مانده',
                render: (row) => (
                  <span className={cn('num font-bold', row.running_balance < 0 ? 'text-rose-700' : 'text-emerald-700')}>
                    {dec(row.running_balance)} {row.currency}
                  </span>
                ),
              },
              {
                key: 'type',
                label: 'نوع',
                hideOnMobile: true,
                render: (row) => <StatusBadge label={ACCOUNT_TYPES[row.account_type]?.label} tone={ACCOUNT_TYPES[row.account_type]?.tone} />,
              },
            ]}
          />
        ) : (
          <p className="text-[11.5px] leading-6 text-muted-foreground">
            دفتر کل بر پایهٔ ردیف‌های بدهکار و بستانکار ساخته می‌شود؛ هیچ مانده‌ای دستی قابل تغییر نیست.
          </p>
        )}
      </SectionCard>
    </div>
  );
}