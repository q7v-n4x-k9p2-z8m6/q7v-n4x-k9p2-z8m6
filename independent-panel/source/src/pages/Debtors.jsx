import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatCard from '@/components/ui-kit/StatCard';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { customerBalances } from '@/lib/accounting/queries';
import { dec } from '@/lib/format';
import { BASE_CURRENCY } from '@/lib/config';

export default function Debtors() {
  const navigate = useNavigate();
  const { items: customers } = useRecords('Customer');
  const { entries } = useLedger();

  const rows = useMemo(() => {
    const map = new Map(customers.map((customer) => [customer.id, customer]));
    return customerBalances(entries)
      .filter((row) => row.value < 0)
      .map((row) => ({
        id: row.id,
        name: map.get(row.id)?.full_name || row.name,
        mobile: map.get(row.id)?.mobile || '—',
        debt: Math.abs(row.value),
      }))
      .sort((a, b) => b.debt - a.debt);
  }, [customers, entries]);

  const total = rows.reduce((sum, row) => sum + row.debt, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="بدهکاران"
        description="مشتریانی که مانده حساب آن‌ها بدهکار است (طلب صرافی). این فهرست از دفتر معین مشتریان استخراج می‌شود."
        icon={Wallet}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard label="جمع طلب از مشتریان" value={`${dec(total)} ${BASE_CURRENCY}`} tone="rose" />
        <StatCard label="تعداد بدهکاران" value={rows.length} tone="slate" />
      </div>

      <SectionCard title="فهرست بدهکاران">
        <DataTable
          rows={rows}
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
          empty={{ title: 'بدهکاری وجود ندارد', description: 'همهٔ مشتریان تسویه یا بستانکار هستند.' }}
          columns={[
            { key: 'name', label: 'مشتری', render: (row) => <span className="font-bold">{row.name}</span> },
            { key: 'mobile', label: 'موبایل', render: (row) => <span className="num">{row.mobile}</span> },
            { key: 'debt', label: 'مبلغ بدهی', render: (row) => <span className="num font-bold text-rose-700">{dec(row.debt)}</span> },
            { key: 'currency', label: 'ارز', hideOnMobile: true, render: () => BASE_CURRENCY },
          ]}
        />
      </SectionCard>
    </div>
  );
}