import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Database, ShieldCheck, History, Map } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatCard from '@/components/ui-kit/StatCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { Notice } from '@/components/forms/FormField';
import { useRecords } from '@/hooks/useRecords';
import { CAPABILITY_MAP, STATUS_META } from '@/lib/roadmap';
import { APP_META } from '@/lib/config';
import { num, faDate } from '@/lib/format';

export default function Builder() {
  const { items: documents } = useRecords('Document');
  const { items: entries } = useRecords('LedgerEntry');
  const { items: customers } = useRecords('Customer');
  const { items: audit } = useRecords('AuditLog');

  const statusCounts = useMemo(() => {
    return CAPABILITY_MAP.reduce(
      (acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }),
      { done: 0, partial: 0, design: 0, pending: 0 }
    );
  }, []);

  const recentAudit = useMemo(
    () => audit.slice().sort((a, b) => String(b.created_date).localeCompare(String(a.created_date))).slice(0, 6),
    [audit]
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="پنل سازنده"
        description="نمای فنی نسخهٔ مرجع: وضعیت پیاده‌سازی، حجم داده و رویدادهای اخیر. این صفحه فقط برای نقش سازنده قابل دسترسی است."
        icon={Wrench}
        badge={APP_META.buildStage}
        actions={
          <Link to="/roadmap" className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground/80 hover:bg-secondary">
            <Map className="h-3.5 w-3.5" /> نگاشت کامل
          </Link>
        }
      />

      <Notice tone="slate">
        این پنل هیچ دسترسی اجرایی به کد یا پایگاه دادهٔ واقعی ندارد؛ فقط دادهٔ همین محیط آزمایشی را نشان می‌دهد.
      </Notice>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="اسناد مالی" value={num(documents.length)} icon={Database} tone="sky" />
        <StatCard label="ردیف دفتر" value={num(entries.length)} icon={Database} tone="violet" />
        <StatCard label="مشتریان" value={num(customers.length)} icon={Database} tone="emerald" />
        <StatCard label="رویدادها" value={num(audit.length)} icon={History} tone="amber" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div key={key} className="card-flat flex items-center justify-between px-3 py-2">
            <span className="text-[11.5px] font-bold text-foreground/80">{meta.label}</span>
            <StatusBadge label={num(statusCounts[key] || 0)} tone={meta.tone} />
          </div>
        ))}
      </div>

      <SectionCard title="رویدادهای اخیر" description="ثبت‌شده توسط لایهٔ حسابداری و مدیریت">
        <DataTable
          rows={recentAudit}
          empty={{ title: 'رویدادی ثبت نشده است' }}
          columns={[
            { key: 'created_date', label: 'زمان', render: (row) => faDate(row.created_date) },
            { key: 'actor_name', label: 'کاربر' },
            { key: 'action', label: 'عملیات', render: (row) => <StatusBadge label={row.action} tone="slate" /> },
            { key: 'title', label: 'عنوان', render: (row) => <span className="truncate text-[11px]">{row.title}</span> },
          ]}
        />
      </SectionCard>

      <SectionCard title="سلامت ساختار" description="بررسی سریع یکپارچگی لایهٔ مالی">
        <div className="grid gap-2 sm:grid-cols-3">
          <Health title="جداسازی منطق از رابط" state="انجام‌شده" detail="همهٔ اسناد از src/lib/accounting ساخته می‌شوند." tone="emerald" />
          <Health title="کنترل توازن سند" state="فعال" detail="هر سند پیش از ثبت، بدهکار و بستانکار آن بررسی می‌شود." tone="emerald" />
          <Health title="ابطال بدون حذف" state="فعال" detail="حذف مستقیم سند وجود ندارد؛ سند معکوس صادر می‌شود." tone="emerald" />
          <Health title="اتصال به پایگاه دادهٔ واقعی" state="غیرفعال" detail="طبق محدودهٔ پروژه، هیچ اتصال خارجی ساخته نشده است." tone="slate" />
          <Health title="احراز هویت" state="پیاده‌نشده" detail="نقش‌ها در رابط کاربری شبیه‌سازی می‌شوند." tone="amber" />
          <Health title="ترجمهٔ کامل متن صفحات" state="ناقص" detail="ساختار i18n آماده است؛ متن صفحات فارسی است." tone="amber" />
        </div>
      </SectionCard>
    </div>
  );
}

function Health({ title, state, detail, tone }) {
  return (
    <div className="rounded-lg border border-border/70 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11.5px] font-bold">{title}</p>
        <StatusBadge label={state} tone={tone} />
      </div>
      <p className="mt-1 text-[10.5px] leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}