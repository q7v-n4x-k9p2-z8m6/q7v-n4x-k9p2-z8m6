import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import CustomerDialog from '@/components/customers/CustomerDialog';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { CUSTOMER_STATUS } from '@/lib/accounting/chart';
import { customerBalances } from '@/lib/accounting/queries';
import { num, dec } from '@/lib/format';

export default function Customers() {
  const navigate = useNavigate();
  const { can } = useRole();
  const { items, loading, reload } = useRecords('Customer');
  const { entries } = useLedger();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const balances = useMemo(() => {
    const map = new Map(customerBalances(entries).map((row) => [row.id, row]));
    return map;
  }, [entries]);

  const rows = useMemo(() => {
    const term = search.trim();
    return items
      .filter((item) => (status ? item.status === status : true))
      .filter((item) =>
        term
          ? [item.full_name, item.code, item.mobile, item.city].filter(Boolean).some((field) => String(field).includes(term))
          : true
      )
      .sort((a, b) => String(a.full_name).localeCompare(String(b.full_name), 'fa'));
  }, [items, search, status]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="مشتریان"
        description="تعریف و مدیریت مشتریان صرافی؛ مانده هر مشتری از ردیف‌های دفتر محاسبه می‌شود و قابل ویرایش دستی نیست."
        icon={Users}
        actions={
          can('customers.manage') ? (
            <button
              type="button"
              onClick={openNew}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11.5px] font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              مشتری جدید
            </button>
          ) : null
        }
      />

      <SectionCard
        title={`فهرست مشتریان (${num(rows.length)})`}
        actions={
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="نام، کد یا موبایل"
                className="h-8 w-40 rounded-lg border border-input bg-background pr-7 pl-2 text-[11.5px] outline-none focus:ring-1 focus:ring-ring sm:w-52"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-[11px] outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
              <option value="blocked">مسدود</option>
            </select>
          </div>
        }
      >
        <DataTable
          rows={rows}
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
          empty={{
            title: loading ? 'در حال بارگذاری…' : 'مشتری ثبت نشده است',
            description: 'برای شروع، نخستین مشتری را ثبت کنید.',
          }}
          columns={[
            {
              key: 'full_name',
              label: 'نام مشتری',
              render: (row) => (
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-bold">
                    {row.full_name}
                    {row.is_demo ? <span className="chip bg-muted px-1 py-0 text-[8.5px] text-muted-foreground">نمونه</span> : null}
                  </p>
                  <p className="num text-[10px] text-muted-foreground">{row.code || 'بدون کد'}</p>
                </div>
              ),
            },
            { key: 'mobile', label: 'موبایل', render: (row) => <span className="num">{row.mobile || '—'}</span> },
            { key: 'customer_type', label: 'نوع', hideOnMobile: true },
            { key: 'city', label: 'شهر', hideOnMobile: true, render: (row) => row.city || '—' },
            {
              key: 'balance',
              label: 'مانده (ارز پایه)',
              render: (row) => {
                const balance = balances.get(row.id)?.value || 0;
                return (
                  <span className={`num font-bold ${balance < 0 ? 'text-rose-700' : balance > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    {dec(Math.abs(balance))} {balance === 0 ? '' : balance > 0 ? 'بستانکار' : 'بدهکار'}
                  </span>
                );
              },
            },
            {
              key: 'status',
              label: 'وضعیت',
              render: (row) => (
                <StatusBadge
                  label={CUSTOMER_STATUS[row.status]?.label || row.status}
                  tone={CUSTOMER_STATUS[row.status]?.tone || 'slate'}
                />
              ),
            },
          ]}
        />
      </SectionCard>

      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editing} onSaved={reload} />
    </div>
  );
}