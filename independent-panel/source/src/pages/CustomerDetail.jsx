import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Pencil, UserRound, Wallet, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatCard from '@/components/ui-kit/StatCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import CustomerDialog from '@/components/customers/CustomerDialog';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { CUSTOMER_STATUS, DOC_TYPES } from '@/lib/accounting/chart';
import { valueBalanceFor } from '@/lib/accounting/queries';
import { dec, faDate } from '@/lib/format';

export default function CustomerDetail() {
  const { id } = useParams();
  const { can } = useRole();
  const [customer, setCustomer] = useState(null);
  const [missing, setMissing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { entries } = useLedger();
  const { items: documents } = useRecords('Document', { customer_id: id });

  useEffect(() => {
    let active = true;
    setMissing(false);
    base44.entities.Customer.get(id)
      .then((record) => active && setCustomer(record))
      .catch(() => active && setMissing(true));
    return () => {
      active = false;
    };
  }, [id]);

  const customerEntries = useMemo(
    () => entries.filter((entry) => entry.account_type === 'customer' && entry.account_id === id),
    [entries, id]
  );

  const balance = useMemo(
    () => valueBalanceFor(entries, 'customer', id),
    [entries, id]
  );

  if (missing) {
    return (
      <div className="space-y-3">
        <Link to="/customers" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-primary">
          <ArrowRight className="h-3.5 w-3.5" /> بازگشت به فهرست مشتریان
        </Link>
        <SectionCard title="مشتری یافت نشد">
          <p className="text-[12px] text-muted-foreground">این مشتری در دیتابیس این محیط وجود ندارد یا حذف شده است.</p>
        </SectionCard>
      </div>
    );
  }

  if (!customer) {
    return <p className="p-6 text-center text-[12px] text-muted-foreground">در حال بارگذاری…</p>;
  }

  return (
    <div className="space-y-4">
      <Link to="/customers" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-primary">
        <ArrowRight className="h-3.5 w-3.5" /> فهرست مشتریان
      </Link>

      <PageHeader
        title={customer.full_name}
        description={`کد مشتری: ${customer.code || '—'} • ${customer.customer_type || 'حقیقی'} • ${customer.city || 'بدون شهر'}`}
        icon={UserRound}
        badge={customer.is_demo ? 'رکورد نمونه' : undefined}
        actions={
          <>
            <StatusBadge
              label={CUSTOMER_STATUS[customer.status]?.label || customer.status}
              tone={CUSTOMER_STATUS[customer.status]?.tone || 'slate'}
            />
            {can('customers.manage') ? (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground/80 hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5" /> ویرایش
              </button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="مانده حساب"
          value={`${dec(Math.abs(balance))} AFN`}
          hint={balance > 0 ? 'بستانکار (ما بدهکاریم)' : balance < 0 ? 'بدهکار (مشتری بدهکار است)' : 'تسویه'}
          icon={Wallet}
          tone={balance < 0 ? 'rose' : 'emerald'}
        />
        <StatCard label="تعداد اسناد" value={documents.length} hint="اسناد مرتبط با این مشتری" icon={FileText} tone="sky" />
        <StatCard label="موبایل" value={customer.mobile || '—'} hint={customer.city || '—'} tone="slate" />
        <StatCard
          label="وضعیت هویت"
          value={customer.identity_status === 'verified' ? 'تأییدشده' : 'تأییدنشده'}
          hint={customer.national_id ? `تذکره: ${customer.national_id}` : 'شماره تذکره ثبت نشده'}
          tone={customer.identity_status === 'verified' ? 'emerald' : 'amber'}
        />
      </div>

      <SectionCard title="گردش حساب" description="ردیف‌های دفتر معین این مشتری">
        <DataTable
          rows={customerEntries}
          empty={{ title: 'گردشی ثبت نشده', description: 'با ثبت معامله یا دریافت/پرداخت، گردش این مشتری ایجاد می‌شود.' }}
          columns={[
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
            { key: 'doc_number', label: 'سند', render: (row) => <span className="num">{row.doc_number}</span> },
            { key: 'description', label: 'شرح', render: (row) => <span className="truncate">{row.description || '—'}</span> },
            {
              key: 'debit',
              label: 'بدهکار',
              render: (row) => (row.side === 'debit' ? <span className="num">{dec(row.amount)} {row.currency}</span> : '—'),
            },
            {
              key: 'credit',
              label: 'بستانکار',
              render: (row) => (row.side === 'credit' ? <span className="num">{dec(row.amount)} {row.currency}</span> : '—'),
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="اسناد مالی مشتری">
        <DataTable
          rows={documents}
          empty={{ title: 'سندی برای این مشتری ثبت نشده است' }}
          columns={[
            { key: 'doc_number', label: 'شماره سند', render: (row) => <span className="num">{row.doc_number}</span> },
            {
              key: 'doc_type',
              label: 'نوع',
              render: (row) => (
                <StatusBadge label={DOC_TYPES[row.doc_type]?.label || row.doc_type} tone={DOC_TYPES[row.doc_type]?.tone || 'slate'} />
              ),
            },
            { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
            { key: 'amount', label: 'مبلغ', render: (row) => <span className="num">{dec(row.amount)} {row.currency}</span> },
            { key: 'base_value', label: 'ارزش پایه', hideOnMobile: true, render: (row) => <span className="num">{dec(row.base_value)}</span> },
          ]}
        />
      </SectionCard>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={customer}
        onSaved={() => base44.entities.Customer.get(id).then(setCustomer)}
      />
    </div>
  );
}