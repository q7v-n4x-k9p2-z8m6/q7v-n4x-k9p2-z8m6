// a1/pages/customer/CustomerProfile.jsx — پروفایل مشتری
import React from 'react';
import { LogOut } from 'lucide-react';
import { usePortal } from '@/a1/lib/portalData';
import { useAuth } from '@/a1/lib/demoAuth';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

export default function CustomerProfile() {
  const { loading, data, error } = usePortal();
  const { logout } = useAuth();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const customer = data.customer;

  return (
    <div className="space-y-3">
      <PCard title="مشخصات مشتری">
        {customer ? (
          <ul className="space-y-1.5 text-[11px] text-slate-600">
            <li>نام: <b className="text-[#102b4c]">{customer.name}</b></li>
            <li>کد: {customer.code || '—'}</li>
            <li>موبایل: <span dir="ltr">{customer.phone || '—'}</span></li>
            <li>شهر: {customer.city || '—'}</li>
            <li>نوع حساب: {customer.kind || 'دائمی'}</li>
            <li>وضعیت: {customer.status}</li>
            <li>ماندهٔ افتتاحیه: <span className="tabular-nums">{money(customer.opening)} {customer.currency}</span></li>
          </ul>
        ) : <PEmpty>مشتری نمایشی در این دستگاه ثبت نشده است.</PEmpty>}
      </PCard>

      <PCard title="نشست">
        <p className="text-[11px] leading-6 text-slate-600">
          این پنل با نشست آزمایشی محلی باز شده است؛ احراز هویت واقعی برای مرحلهٔ بعد فعال می‌شود و هیچ حساب واقعی‌ای ساخته نشده است.
        </p>
        <button type="button" onClick={() => logout()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800">
          <LogOut className="h-3.5 w-3.5" /> خروج از نشست نمایشی
        </button>
      </PCard>
    </div>
  );
}