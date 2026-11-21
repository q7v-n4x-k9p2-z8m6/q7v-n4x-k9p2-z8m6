import React, { useEffect, useMemo, useState } from 'react';
import { UserRound, Wallet, Send } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatCard from '@/components/ui-kit/StatCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { Notice } from '@/components/forms/FormField';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { TRANSFER_STATUS } from '@/lib/accounting/chart';
import { valueBalanceFor } from '@/lib/accounting/queries';
import { dec, faDate } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';

export default function CustomerPortal() {
  const { items: customers } = useRecords('Customer');
  const { entries } = useLedger();
  const [customerId, setCustomerId] = useState('');

  const demoCustomers = useMemo(() => customers.filter((item) => item.is_demo), [customers]);
  const pool = demoCustomers.length ? demoCustomers : customers;

  useEffect(() => {
    if (!customerId && pool.length) setCustomerId(pool[0].id);
  }, [pool, customerId]);

  const customer = customers.find((item) => item.id === customerId);
  const { items: transfers } = useRecords('Transfer', customerId ? { customer_id: customerId } : {});
  const entriesForCustomer = useMemo(
    () => entries.filter((entry) => entry.account_type === 'customer' && entry.account_id === customerId),
    [entries, customerId]
  );

  const balance = customerId ? valueBalanceFor(entries, 'customer', customerId) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="پنل مشتری"
        description="نمای محدودی که مشتری از وضعیت حساب خود می‌بیند: مانده، صورت حساب و حواله‌ها."
        icon={UserRound}
        badge="نمای نمونه"
      />

      <Notice>
        در نسخهٔ واقعی، این صفحه فقط برای کاربر واردشده با نقش مشتری و تنها با دادهٔ خودش نمایش داده می‌شود. برای
        بررسی رابط، مشتری نمونه را از فهرست زیر انتخاب کنید.
      </Notice>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          نمای مشتری:
          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2 text-[11.5px]"
          >
            {pool.map((item) => (
              <option key={item.id} value={item.id}>
                {item.full_name}
              </option>
            ))}
          </select>
        </label>
        {customer?.is_demo ? <StatusBadge label="مشتری نمونه" tone="amber" /> : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <StatCard
          label="مانده حساب شما"
          value={`${dec(Math.abs(balance))} ${BASE_CURRENCY}`}
          hint={balance > 0 ? 'بستانکار' : balance < 0 ? 'بدهکار' : 'تسویه'}
          icon={Wallet}
          tone={balance < 0 ? 'rose' : 'emerald'}
        />
        <StatCard label="تعداد حواله‌ها" value={transfers.length} icon={Send} tone="sky" />
        <StatCard label="مشتری" value={customer?.full_name || '—'} hint={customer?.mobile || '—'} icon={UserRound} tone="slate" />
      </div>

      <SectionCard title="صورت حساب" description="گردش حساب به ارز پایه">
        <DataTable
          rows={entriesForCustomer}
          empty={{ title: 'گردشی وجود ندارد' }}
          columns={[
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
            { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
            { key: 'description', label: 'شرح', render: (row) => row.description || '—' },
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
          ]}
        />
      </SectionCard>

      <SectionCard title="حواله‌های من">
        <DataTable
          rows={transfers}
          empty={{ title: 'حواله‌ای ثبت نشده است' }}
          columns={[
            { key: 'transfer_number', label: 'شماره', render: (row) => <span className="num">{row.transfer_number}</span> },
            { key: 'direction', label: 'جهت', render: (row) => (row.direction === 'send' ? 'ارسالی' : 'دریافتی') },
            { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
            { key: 'status', label: 'وضعیت', render: (row) => <StatusBadge label={TRANSFER_STATUS[row.status]?.label} tone={TRANSFER_STATUS[row.status]?.tone} /> },
          ]}
        />
      </SectionCard>
    </div>
  );
}