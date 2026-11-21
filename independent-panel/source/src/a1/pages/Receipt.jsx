// a1/pages/Receipt.jsx — رسید سند (ساختار: src/pages/Receipt.jsx سورس A1)
// سند و ردیف‌های آن از جدول‌های محلی documents و ledger_entries خوانده می‌شود.
import React, { useState } from 'react';
import { Printer, ReceiptText, Search } from 'lucide-react';
import { all } from '@/a1/lib/db';

const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value) || 0);

export default function Receipt() {
  const [number, setNumber] = useState('');
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState('');

  const search = async event => {
    event.preventDefault();
    const term = number.trim();
    if (!term) { setNotice('شمارهٔ سند را وارد کنید.'); return; }
    setNotice('');
    const [documents, entries] = await Promise.all([all('documents'), all('ledger_entries')]);
    const doc = documents.find(row => String(row.doc_number || '').trim() === term);
    if (!doc) { setResult(null); setNotice('سندی با این شماره در همین دستگاه پیدا نشد.'); return; }
    setResult({ doc, lines: entries.filter(row => String(row.document_id) === String(doc.id) && !row.deleted) });
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3 print:hidden">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><ReceiptText className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">رسید سند</h1>
          <p className="text-[10px] text-slate-500">جستجو بر اساس شمارهٔ سند در جدول‌های محلی</p>
        </div>
      </header>

      <form onSubmit={search} className="flex gap-1.5 print:hidden">
        <input value={number} onChange={e => setNumber(e.target.value)} placeholder="مثلاً DV-00001" dir="ltr" className="h-9 w-full rounded-lg border border-[#d5e2f0] bg-white px-2 text-[12px]" />
        <button type="submit" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#164b87] px-3 text-[11px] font-bold text-white"><Search className="h-4 w-4" /> جستجو</button>
      </form>

      {notice ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10.5px] text-amber-900 print:hidden">{notice}</p> : null}

      {result ? (
        <section className="space-y-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
          <div className="flex items-center justify-between gap-2 border-b border-[#eef3f7] pb-2">
            <div>
              <b className="block text-[12px] text-[#1e4776]">سند {result.doc.doc_number}</b>
              <small className="text-[10px] text-slate-500">{result.doc.doc_type || '—'} · {String(result.doc.created_at || '').slice(0, 10)} · {result.doc.currency || 'AFN'}</small>
            </div>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] px-2.5 py-1.5 text-[10.5px] print:hidden"><Printer className="h-3.5 w-3.5" /> چاپ</button>
          </div>
          {result.doc.description ? <p className="text-[11px] text-slate-600">{result.doc.description}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[11px]">
              <thead className="bg-[#edf4fb] text-[#102b4c]">
                <tr><th className="p-2 text-right">حساب</th><th className="p-2">بدهکار</th><th className="p-2">بستانکار</th><th className="p-2">ارز</th></tr>
              </thead>
              <tbody>
                {result.lines.length ? result.lines.map(row => (
                  <tr key={row.id} className="border-t border-[#eef3f7]">
                    <td className="p-2 text-right">{row.account_name || row.account_type || '—'}</td>
                    <td className="p-2 text-center tabular-nums">{money(row.debit)}</td>
                    <td className="p-2 text-center tabular-nums">{money(row.credit)}</td>
                    <td className="p-2 text-center">{row.currency || 'AFN'}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="p-4 text-center text-slate-500">ردیفی برای این سند ثبت نشده است.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-500">جمع مبلغ سند: <b className="tabular-nums">{money(result.doc.amount)} {result.doc.currency || 'AFN'}</b></p>
        </section>
      ) : null}
    </div>
  );
}