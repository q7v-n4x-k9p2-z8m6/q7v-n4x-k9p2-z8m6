// a1/pages/PendingSource.jsx — مسیرهای A1 که کد آن‌ها هنوز به پیش‌نمایش منتقل نشده است
// هدف: هیچ رابط ساختگی جای صفحهٔ واقعی ساخته نشود؛ منبع دقیق هر مسیر شفاف اعلام می‌شود.
import React from 'react';
import { FileCode2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PendingSource({ title, source, note }) {
  return (
    <section dir="rtl" lang="fa" className="rounded-2xl border border-[#d5e2f0] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <FileCode2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold text-[#102b4c]">{title}</h1>
          <p className="mt-1 text-[11.5px] leading-6 text-slate-600">
            این مسیر در سورس A1 وجود دارد، اما کد صفحهٔ آن هنوز منتقل نشده است.
            {note ? ` ${note}` : ''}
          </p>
          {source ? (
            <p className="mt-2 break-all rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-700" dir="ltr">
              {source}
            </p>
          ) : null}
          <Link to="/dashboard" className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#164b87]">
            <ArrowLeft className="h-3.5 w-3.5" /> بازگشت به میز کار
          </Link>
        </div>
      </div>
    </section>
  );
}