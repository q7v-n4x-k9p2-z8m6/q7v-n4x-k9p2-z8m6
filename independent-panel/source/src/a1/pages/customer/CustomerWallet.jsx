// a1/pages/customer/CustomerWallet.jsx — کیف پول مشتری (ساختار: src/pages/customer/CustomerWallet.jsx)
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { usePortal } from '@/a1/lib/portalData';
import { displayDate } from '@/core/domain/dates';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

export default function CustomerWallet() {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  return (
    <div className="space-y-3">
      <PCard title="موجودی‌ها" note="از گردش حساب مشتری در دفتر کل محلی محاسبه می‌شود.">
        {(data.balances || []).length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {(data.balances || []).map(item => (
              <div key={item.currency} className="rounded-xl border border-[#e3edf6] bg-[#f7faff] p-3">
                <span className="text-[10px] text-slate-500">{item.currency} · {item.side}</span>
                <b className="mt-1 block text-lg tabular-nums text-[#102b4c]">{money(Math.abs(item.balance))}</b>
              </div>
            ))}
          </div>
        ) : <PEmpty>موجودی‌ای برای این مشتری ثبت نشده است.</PEmpty>}
      </PCard>

      <PCard title="تاریخچهٔ تراکنش‌ها"
        action={<Link to="/customer/transfer" className="inline-flex items-center gap-1 rounded-lg border border-[#164b87] px-2 py-1 text-[10px] font-bold text-[#164b87]"><ArrowLeftRight className="h-3 w-3" /> حوالهٔ جدید</Link>}>
        {(data.lines || []).length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-[11px]">
              <thead className="bg-[#edf4fb] text-[#102b4c]">
                <tr><th className="p-2 text-right">تاریخ</th><th className="p-2 text-right">شرح</th><th className="p-2">بدهکار</th><th className="p-2">بستانکار</th><th className="p-2">ارز</th></tr>
              </thead>
              <tbody>
                {(data.lines || []).slice().reverse().map(line => (
                  <tr key={line.id} className="border-t border-[#eef3f7]">
                    <td className="p-2 whitespace-nowrap">{displayDate(line.date) || '—'}</td>
                    <td className="p-2">{line.description || line.type}</td>
                    <td className="p-2 text-center tabular-nums">{money(line.debit)}</td>
                    <td className="p-2 text-center tabular-nums">{money(line.credit)}</td>
                    <td className="p-2 text-center">{line.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <PEmpty>تراکنشی ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}