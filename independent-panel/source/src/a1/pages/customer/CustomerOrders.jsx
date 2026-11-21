// a1/pages/customer/CustomerOrders.jsx — سفارش‌ها و درخواست‌های مشتری
import React from 'react';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

const STATUS_LABEL = { pending: 'در انتظار', processing: 'در حال انجام', done: 'انجام شد', paid: 'پرداخت شد', cancelled: 'لغو شد' };

export default function CustomerOrders() {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const orders = data.orders || [];
  const withdrawals = data.withdrawals || [];

  return (
    <div className="space-y-3">
      <PCard title="سفارش‌های خدمات">
        {orders.length ? (
          <ul className="space-y-1.5 text-[11px]">
            {orders.map(item => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eef3f7] p-2">
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="shrink-0 tabular-nums">{money(item.amount)} {item.currency}</span>
                <span className="shrink-0 rounded-full bg-[#eef4fb] px-2 py-0.5 text-[9px] text-[#164b87]">{STATUS_LABEL[item.status] || item.status}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>سفارشی برای این مشتری ثبت نشده است.</PEmpty>}
      </PCard>

      <PCard title="درخواست‌های برداشت">
        {withdrawals.length ? (
          <ul className="space-y-1.5 text-[11px]">
            {withdrawals.map(item => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eef3f7] p-2">
                <span className="tabular-nums">{money(item.amount)} {item.currency}</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] text-amber-800">{STATUS_LABEL[item.status] || item.status}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>درخواست برداشتی ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}