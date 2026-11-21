// a1/pages/Support.jsx — پشتیبانی صرافی (ساختار: src/pages/SarraafSupport.jsx سورس A1)
import React, { useCallback, useEffect, useState } from 'react';
import { Headphones, Loader2, Send } from 'lucide-react';
import { all, insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

export default function Support() {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  const [form, setForm] = useState({ subject: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const user = currentUser();
      const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
      const rows = (await all('support_tickets')).filter(row => !row.exchange_code || row.exchange_code === code);
      setState({ loading: false, rows, error: '' });
    } catch (error) {
      setState({ loading: false, rows: [], error: error?.message || 'بارگذاری تیکت‌ها ناموفق بود.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async event => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { setNotice('موضوع و متن پیام الزامی است.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('support_tickets', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        subject: form.subject, message: form.message, status: 'open',
        created_by_name: user?.full_name || 'کاربر',
      });
      setForm({ subject: '', message: '' });
      setNotice('تیکت ثبت شد.');
      await load();
    } catch (error) {
      setNotice('ثبت تیکت انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><Headphones className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">پشتیبانی</h1>
          <p className="text-[10px] text-slate-500">تیکت‌ها در جدول support_tickets همین دستگاه ذخیره می‌شوند.</p>
        </div>
      </header>

      <section className="rounded-xl border border-[#c9d7e3] bg-white p-3">
        <form onSubmit={submit} className="space-y-2">
          <input value={form.subject} onChange={event => setForm(prev => ({ ...prev, subject: event.target.value }))} placeholder="موضوع"
            className="h-9 w-full rounded-lg border border-[#c9d7e3] px-2 text-[12px] outline-none focus:border-[#1e4776]" />
          <textarea value={form.message} onChange={event => setForm(prev => ({ ...prev, message: event.target.value }))} rows={3} placeholder="متن پیام"
            className="w-full rounded-lg border border-[#c9d7e3] p-2 text-[12px] outline-none focus:border-[#1e4776]" />
          <div className="flex items-center justify-between">
            {notice ? <span className="text-[10.5px] text-emerald-700">{notice}</span> : <span />}
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e4776] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} ارسال
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        {state.loading ? <p className="p-6 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-6 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.rows.length ? <p className="p-6 text-center text-[11px] text-slate-500">تیکتی ثبت نشده است.</p>
              : (
                <ul className="divide-y divide-[#eef3f7]">
                  {state.rows.map(ticket => (
                    <li key={ticket.id} className="p-3 text-[11px]">
                      <b className="block text-[#1e4776]">{ticket.subject || 'بدون موضوع'}</b>
                      <span className="mt-0.5 block text-slate-600">{ticket.message}</span>
                      <span className="mt-1 block text-[9px] text-slate-400">{ticket.status === 'open' ? 'باز' : 'بسته'}</span>
                    </li>
                  ))}
                </ul>
              )}
      </section>
    </div>
  );
}