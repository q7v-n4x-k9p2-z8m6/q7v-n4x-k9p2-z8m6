// a1/components/v21/BankLedgerPanel.jsx — دفتر گردش بانک
// بخش ثانویهٔ صفحهٔ «بانک و چک»؛ فهرست حساب‌های بانکی بالای این پنل نمایش داده می‌شود.
import React from 'react';
import { Plus } from 'lucide-react';
import { currencyLabel } from '@/a1/lib/format';
import { displayDate } from '@/core/domain/dates';

export default function BankLedgerPanel({ rows, fmt, canPost, onDeposit, onWithdraw }) {
  return (
    <section className="mt-3 border border-[#b6c4cf] bg-[#edf3f7] px-2 py-1.5">
      <div className="flex flex-nowrap items-center gap-1.5 text-[10px] leading-none">
        <b className="shrink-0 text-[11px] text-[#24496d]">دفتر گردش بانک</b>
        <span className="min-w-0 flex-1 truncate text-[9px] text-slate-500">گردش هر بانک از سطرهای دفتر کل با شناسه دقیق همان حساب محاسبه می‌شود؛ ثبت گردش از طریق سند روزنامه انجام می‌شود.</span>
        <button onClick={onDeposit} disabled={!canPost} className="flex h-7 shrink-0 items-center gap-1 rounded border border-blue-300 bg-white px-2 font-bold text-blue-900 disabled:opacity-50"><Plus className="h-3.5 w-3.5" />واریز به بانک</button>
        <button onClick={onWithdraw} disabled={!canPost} className="flex h-7 shrink-0 items-center gap-1 rounded border border-blue-300 bg-white px-2 font-bold text-blue-900 disabled:opacity-50"><Plus className="h-3.5 w-3.5" />برداشت از بانک</button>
      </div>
      <div className="mt-1.5 overflow-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[620px] text-[11px]">
          <thead className="bg-slate-100"><tr><th className="p-2 text-right">تاریخ</th><th>شماره سند</th><th>بانک</th><th>شرح</th><th>بدهکار</th><th>بستانکار</th><th>ارز</th></tr></thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{displayDate(row.date) || '—'}</td>
                <td className="text-center">{row.number || '—'}</td>
                <td className="text-center">{row.account || '—'}</td>
                <td className="text-right">{row.description || '—'}</td>
                <td className="text-center">{fmt(row.debit)}</td>
                <td className="text-center">{fmt(row.credit)}</td>
                <td className="text-center">{currencyLabel(row.currency)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="p-4 text-center text-slate-500">برای این محدوده گردش بانکی ثبت‌شده‌ای در دفتر کل وجود ندارد.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}