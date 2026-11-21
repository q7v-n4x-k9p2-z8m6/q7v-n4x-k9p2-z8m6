import React from 'react';
import { History } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { useRecords } from '@/hooks/useRecords';
import { faDate } from '@/lib/format';

const ACTION_STYLE = {
  create: { label: 'ایجاد', tone: 'emerald' },
  update: { label: 'ویرایش', tone: 'sky' },
  delete: { label: 'حذف', tone: 'rose' },
  reverse: { label: 'ابطال', tone: 'amber' },
  settings: { label: 'تنظیمات', tone: 'violet' },
  login: { label: 'ورود', tone: 'slate' },
};

export default function Audit() {
  const { items, loading } = useRecords('AuditLog');
  const rows = items.slice().sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));

  return (
    <div className="space-y-4">
      <PageHeader
        title="رویدادهای سیستم"
        description="ردّ حسابرسی عملیات مالی و مدیریتی. هر ثبت سند، ابطال و تغییر تنظیمات اینجا ثبت می‌شود."
        icon={History}
        badge="فقط مدیر و سازنده"
      />

      <SectionCard title={`رویدادها (${rows.length})`}>
        <DataTable
          rows={rows}
          empty={{ title: loading ? 'در حال بارگذاری…' : 'رویدادی ثبت نشده است' }}
          columns={[
            { key: 'created_date', label: 'زمان', render: (row) => faDate(row.created_date) },
            {
              key: 'action',
              label: 'عملیات',
              render: (row) => (
                <StatusBadge label={ACTION_STYLE[row.action]?.label || row.action} tone={ACTION_STYLE[row.action]?.tone || 'slate'} />
              ),
            },
            { key: 'actor_name', label: 'کاربر', render: (row) => <span>{row.actor_name || '—'}</span> },
            { key: 'entity_type', label: 'موجودیت', hideOnMobile: true, render: (row) => row.entity_type || '—' },
            { key: 'title', label: 'عنوان', render: (row) => <span className="truncate text-[11px]">{row.title || '—'}</span> },
            { key: 'description', label: 'توضیح', hideOnMobile: true, render: (row) => <span className="truncate text-[11px]">{row.description || '—'}</span> },
          ]}
        />
      </SectionCard>
    </div>
  );
}