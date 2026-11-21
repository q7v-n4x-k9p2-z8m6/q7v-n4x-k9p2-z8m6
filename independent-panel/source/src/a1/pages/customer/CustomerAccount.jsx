// a1/pages/customer/CustomerAccount.jsx — حساب مشتری با صراف (ساختار: src/pages/customer/CustomerAccount.jsx)
import React from 'react';
import { usePortal } from '@/a1/lib/portalData';
import { withRunningPartyBalances } from '@/a1/lib/v21Rules';
import { displayDate } from '@/core/domain/dates';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

export default function CustomerAccount() {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const currency = data.customer?.currency || 'AFN';
  const rows = withRunningPartyBalances(data.lines || [], { [currency]: Number(data.customer?.opening ?? 0) || 0 });

  return (
    <div className="space-y-3">
      <PCard title="مشخصات حساب" note="مبنای داده: جدول customers و سطرهای دفتر کل همین دستگاه.">
        <ul className="space-y-1 text-[11px] text-slate-600">
          <li>نام: <b className="text-[#102b4c]">{data.customer?.name || '—'}</b></li>
          <li>کد مشتری: {data.customer?.code || '—'}</li>
          <li>شماره تماس: <span dir="ltr">{data.customer?.phone || '—'}</span></li>
          <li>ارز اصلی: {currency}</li>
          <li>ماندهٔ افتتاحیه: <span className="tabular-nums">{money(data.customer?.opening)}</span></li>
        </ul>
      </PCard>

      <PCard title="دفتر حساب">
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-[11px]">
              <thead className="bg-[#164b87] text-white">
                <tr><th className="p-2 text-right">تاریخ</th><th className="p-2 text-right">شرح</th><th className="p-2">بدهکار</th><th className="p-2">بستانکار</th><th className="p-2">مانده</th></tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-t border-[#eef3f7] even:bg-[#f7faff]">
                    <td className="p-2 whitespace-nowrap">{displayDate(row.date) || '—'}</td>
                    <td className="p-2">{row.description || row.type}</td>
                    <td className="p-2 text-center tabular-nums">{money(row.debit)}</td>
                    <td className="p-2 text-center tabular-nums">{money(row.credit)}</td>
                    <td className="p-2 text-center font-bold tabular-nums text-[#102b4c]">{money(row.runningBalance)} · {row.runningSide}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <PEmpty>گردشی برای این حساب ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}