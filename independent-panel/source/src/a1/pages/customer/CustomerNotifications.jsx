// a1/pages/customer/CustomerNotifications.jsx — اعلان‌های مشتری
import React from 'react';
import { Bell } from 'lucide-react';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PLoading, PError } from '@/a1/components/customer/PortalBits';

export default function CustomerNotifications() {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const list = data.notifications || [];

  return (
    <PCard title="اعلان‌ها" note="مبنای داده: جدول customer_notifications همین دستگاه.">
      {list.length ? (
        <ul className="space-y-1.5">
          {list.map(item => (
            <li key={item.id} className="flex items-start gap-2 rounded-lg border border-[#eef3f7] p-2 text-[11px]">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#164b87]" />
              <span className="min-w-0 flex-1">
                <b className="block text-[#102b4c]">{item.title || 'اعلان'}</b>
                <span className="mt-0.5 block text-slate-600">{item.message || item.body || '—'}</span>
              </span>
              <span className="shrink-0 text-[9px] text-slate-400">{String(item.created_at || '').slice(0, 10)}</span>
            </li>
          ))}
        </ul>
      ) : <PEmpty>اعلانی برای این مشتری ثبت نشده است.</PEmpty>}
    </PCard>
  );
}