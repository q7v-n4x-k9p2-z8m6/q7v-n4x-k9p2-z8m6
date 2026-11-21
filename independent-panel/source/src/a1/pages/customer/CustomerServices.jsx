// a1/pages/customer/CustomerServices.jsx — صفحات خدمات مشتری: شارژ، افغان۵، بازی
// وضعیت «در حال به‌روزرسانی» همان برچسب سورس A1 برای این سرویس‌هاست؛ سرویس بیرونی متصل نمی‌شود.
import React from 'react';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

const CONFIG = {
  recharge: { title: 'شارژ و بستهٔ اینترنت', note: 'ارائهٔ این سرویس به درگاه بیرونی وابسته است و در این نسخهٔ نمایشی فعال نیست.' },
  afghan5: { title: 'افغان۵', note: 'خرید بسته از سرویس افغان۵ در این نسخهٔ نمایشی به سرویس بیرونی متصل نیست.' },
  games: { title: 'بازی‌ها و اعتبار', note: 'سرویس UC و اعتبار بازی‌ها در این نسخهٔ نمایشی به سرویس بیرونی متصل نیست.' },
};

export default function CustomerServices({ kind = 'recharge' }) {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;
  const config = CONFIG[kind] || CONFIG.recharge;

  return (
    <div className="space-y-3">
      <PCard title={config.title}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-6 text-amber-900">
          <b className="block">در حال به‌روزرسانی</b>
          {config.note}
        </div>
      </PCard>
      <PCard title="سفارش‌های مرتبط">
        {(data.orders || []).length ? (
          <ul className="space-y-1.5 text-[11px]">
            {(data.orders || []).map(item => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eef3f7] p-2">
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                <span className="shrink-0 tabular-nums">{money(item.amount)} {item.currency}</span>
                <span className="shrink-0 text-[9px] text-slate-500">{item.status}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>سفارشی برای این بخش ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}