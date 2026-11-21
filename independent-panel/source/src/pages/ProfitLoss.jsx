import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatCard from '@/components/ui-kit/StatCard';
import { useLedger } from '@/hooks/useRecords';
import { profitAndLoss } from '@/lib/accounting/queries';
import { dec, isoToday } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';
import { roundMoney } from '@/lib/accounting/postings';

export default function ProfitLoss() {
  const { entries } = useLedger();
  const today = isoToday();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);

  const filtered = useMemo(
    () => entries.filter((entry) => (!from || entry.date >= from) && (!to || entry.date <= to)),
    [entries, from, to]
  );

  const totals = useMemo(() => profitAndLoss(filtered), [filtered]);

  const breakdown = useMemo(() => {
    const map = new Map();
    filtered
      .filter((entry) => ['income', 'expense'].includes(entry.account_type))
      .forEach((entry) => {
        const key = `${entry.account_type}:${entry.account_id || entry.account_name}`;
        if (!map.has(key)) {
          map.set(key, { id: key, account_type: entry.account_type, name: entry.account_name, amount: 0 });
        }
        const row = map.get(key);
        const signed = entry.account_type === 'income'
          ? (entry.side === 'credit' ? Number(entry.value) : -Number(entry.value))
          : (entry.side === 'debit' ? Number(entry.value) : -Number(entry.value));
        row.amount = roundMoney(row.amount + signed);
      });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="سود و زیان"
        description="درآمد و هزینهٔ ثبت‌شده در بازهٔ انتخابی. سود از حساب‌های درآمد و هزینه در دفتر محاسبه می‌شود، نه از فیلدهای دستی."
        icon={TrendingUp}
      />

      <SectionCard title="بازهٔ گزارش" bodyClassName="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-muted-foreground">از تاریخ</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-[11.5px]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-muted-foreground">تا تاریخ</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-[11.5px]" />
        </label>
        <p className="text-[10.5px] text-muted-foreground">{filtered.length} ردیف در این بازه</p>
      </SectionCard>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="درآمد" value={`${dec(totals.income)}`} hint={BASE_CURRENCY} tone="emerald" />
        <StatCard label="هزینه" value={`${dec(totals.expense)}`} hint={BASE_CURRENCY} tone="rose" />
        <StatCard label="سود / زیان" value={`${dec(totals.profit)}`} hint={BASE_CURRENCY} tone={totals.profit >= 0 ? 'emerald' : 'rose'} />
      </div>

      <SectionCard title="تفکیک حساب‌ها">
        <DataTable
          rows={breakdown}
          empty={{ title: 'درآمد یا هزینه‌ای در این بازه ثبت نشده است' }}
          columns={[
            { key: 'name', label: 'حساب', render: (row) => <span className="font-bold">{row.name}</span> },
            {
              key: 'account_type',
              label: 'نوع',
              render: (row) => (row.account_type === 'income' ? 'درآمد' : 'هزینه'),
            },
            {
              key: 'amount',
              label: 'مبلغ',
              render: (row) => (
                <span className={`num font-bold ${row.amount < 0 ? 'text-rose-700' : ''}`}>{dec(row.amount)} {BASE_CURRENCY}</span>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}