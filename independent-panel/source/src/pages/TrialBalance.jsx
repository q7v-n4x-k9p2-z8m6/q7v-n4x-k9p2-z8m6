import React, { useMemo } from 'react';
import { Scale } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { useLedger } from '@/hooks/useRecords';
import { trialBalance } from '@/lib/accounting/queries';
import { ACCOUNT_TYPES } from '@/lib/accounting/chart';
import { dec } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';

export default function TrialBalance() {
  const { entries } = useLedger();
  const rows = useMemo(() => trialBalance(entries), [entries]);
  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({ debit: acc.debit + row.debit, credit: acc.credit + row.credit }),
        { debit: 0, credit: 0 }
      ),
    [rows]
  );
  const difference = Math.round((totals.debit - totals.credit) * 100) / 100;

  return (
    <div className="space-y-4">
      <PageHeader
        title="تراز آزمایشی"
        description={`جمع بدهکار و بستانکار همهٔ حساب‌ها به ارزش ${BASE_CURRENCY}. اگر سندها متوازن ثبت شوند، اختلاف صفر است.`}
        icon={Scale}
        badge={difference === 0 ? 'متوازن' : 'اختلاف دارد'}
      />

      <div className="grid grid-cols-3 gap-2">
        <div className="card-flat px-3 py-2">
          <p className="text-[10.5px] text-muted-foreground">جمع بدهکار</p>
          <p className="num font-heading text-base font-extrabold text-emerald-700">{dec(totals.debit)}</p>
        </div>
        <div className="card-flat px-3 py-2">
          <p className="text-[10.5px] text-muted-foreground">جمع بستانکار</p>
          <p className="num font-heading text-base font-extrabold text-rose-700">{dec(totals.credit)}</p>
        </div>
        <div className="card-flat px-3 py-2">
          <p className="text-[10.5px] text-muted-foreground">اختلاف</p>
          <p className={`num font-heading text-base font-extrabold ${difference === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {dec(difference)}
          </p>
        </div>
      </div>

      <SectionCard title="حساب‌ها">
        <DataTable
          rows={rows}
          empty={{ title: 'ردیف دفتری وجود ندارد', description: 'پس از ثبت اولین سند، تراز آزمایشی ساخته می‌شود.' }}
          columns={[
            {
              key: 'account_name',
              label: 'حساب',
              render: (row) => (
                <div>
                  <p className="font-bold">{row.account_name}</p>
                  <p className="text-[10px] text-muted-foreground">{ACCOUNT_TYPES[row.account_type]?.label}</p>
                </div>
              ),
            },
            { key: 'debit', label: 'بدهکار', render: (row) => <span className="num">{dec(row.debit)}</span> },
            { key: 'credit', label: 'بستانکار', render: (row) => <span className="num">{dec(row.credit)}</span> },
            {
              key: 'balance',
              label: 'مانده',
              render: (row) => (
                <span className={`num font-bold ${row.balance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {dec(row.balance)}
                </span>
              ),
            },
            {
              key: 'side',
              label: 'ماهیت',
              hideOnMobile: true,
              render: (row) => (
                <StatusBadge label={row.balance >= 0 ? 'بدهکار' : 'بستانکار'} tone={row.balance >= 0 ? 'emerald' : 'rose'} />
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}