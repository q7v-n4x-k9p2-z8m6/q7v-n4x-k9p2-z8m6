import React, { useMemo, useState } from 'react';
import { FileBarChart } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { DOC_TYPES, TRANSFER_STATUS } from '@/lib/accounting/chart';
import { nativeBalances } from '@/lib/accounting/queries';
import { dec, faDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'trades', label: 'معاملات' },
  { key: 'cash', label: 'صندوق' },
  { key: 'transfers', label: 'حواله‌ها' },
  { key: 'balances', label: 'موجودی‌ها' },
];

export default function Reports() {
  const [tab, setTab] = useState('trades');
  const { items: documents } = useRecords('Document');
  const { items: transfers } = useRecords('Transfer');
  const { entries } = useLedger();

  const trades = useMemo(() => documents.filter((doc) => ['trade_buy', 'trade_sell', 'conversion'].includes(doc.doc_type)), [documents]);
  const cashDocs = useMemo(() => documents.filter((doc) => ['cash_in', 'cash_out', 'expense', 'receive', 'pay'].includes(doc.doc_type)), [documents]);
  const balances = useMemo(() => nativeBalances(entries), [entries]);

  const tabsContent = {
    trades: (
      <DataTable
        rows={trades}
        empty={{ title: 'معامله‌ای ثبت نشده است' }}
        columns={[
          { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
          { key: 'doc_type', label: 'نوع', render: (row) => <StatusBadge label={DOC_TYPES[row.doc_type]?.label} tone={DOC_TYPES[row.doc_type]?.tone} /> },
          { key: 'customer_name', label: 'مشتری', render: (row) => row.customer_name || '—' },
          { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
          { key: 'base_value', label: 'ارزش پایه', render: (row) => <span className="num">{dec(row.base_value)}</span> },
          { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
        ]}
      />
    ),
    cash: (
      <DataTable
        rows={cashDocs}
        empty={{ title: 'گردشی ثبت نشده است' }}
        columns={[
          { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
          { key: 'doc_type', label: 'نوع', render: (row) => <StatusBadge label={DOC_TYPES[row.doc_type]?.label} tone={DOC_TYPES[row.doc_type]?.tone} /> },
          { key: 'counter_name', label: 'صندوق/بانک', render: (row) => row.counter_name || '—' },
          { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
          { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
        ]}
      />
    ),
    transfers: (
      <DataTable
        rows={transfers}
        empty={{ title: 'حواله‌ای ثبت نشده است' }}
        columns={[
          { key: 'transfer_number', label: 'شماره', render: (row) => <span className="num">{row.transfer_number}</span> },
          { key: 'direction', label: 'جهت', render: (row) => (row.direction === 'out' ? 'ارسالی' : 'دریافتی') },
          { key: 'receiver_name', label: 'گیرنده' },
          { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
          { key: 'status', label: 'وضعیت', render: (row) => <StatusBadge label={TRANSFER_STATUS[row.status]?.label} tone={TRANSFER_STATUS[row.status]?.tone} /> },
        ]}
      />
    ),
    balances: (
      <DataTable
        rows={balances}
        empty={{ title: 'گردشی ثبت نشده است' }}
        columns={[
          { key: 'account_name', label: 'حساب', render: (row) => <span className="font-bold">{row.account_name}</span> },
          { key: 'account_type', label: 'نوع' },
          {
            key: 'balance',
            label: 'مانده',
            render: (row) => (
              <span className="flex flex-wrap gap-1">
                {Object.entries(row.balances).map(([currency, value]) => (
                  <span key={currency} className={cn('num font-bold', value < 0 ? 'text-rose-700' : 'text-emerald-700')}>
                    {dec(value)} {currency}
                  </span>
                ))}
              </span>
            ),
          },
        ]}
      />
    ),
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="گزارش‌ها"
        description="گزارش‌های عملیاتی بر پایهٔ اسناد و دفتر. هر گزارش فقط داده‌های ثبت‌شده در همین محیط را نشان می‌دهد."
        icon={FileBarChart}
      />

      <div className="flex flex-wrap gap-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors',
              tab === item.key ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <SectionCard title={TABS.find((item) => item.key === tab)?.label}>{tabsContent[tab]}</SectionCard>
    </div>
  );
}