// a1/pages/customer/CustomerShop.jsx — فروشگاه مشتری (جدول online_products)
import React from 'react';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

export default function CustomerShop() {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  return (
    <PCard title="محصولات فروشگاه" note="فهرست از جدول online_products همین دستگاه خوانده می‌شود؛ خرید آنلاین در این مرحله فعال نیست.">
      {(data.products || []).length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {(data.products || []).map(product => (
            <div key={product.id} className="rounded-xl border border-[#e3edf6] bg-[#f7faff] p-3">
              <b className="block text-[12px] text-[#102b4c]">{product.name}</b>
              <span className="mt-1 block text-[11px] tabular-nums text-slate-600">{money(product.price)} {product.currency || 'AFN'}</span>
              <span className="mt-1 block text-[9px] text-slate-400">{product.active === false ? 'غیرفعال' : 'فعال'}</span>
            </div>
          ))}
        </div>
      ) : <PEmpty>محصولی برای نمایش ثبت نشده است.</PEmpty>}
    </PCard>
  );
}