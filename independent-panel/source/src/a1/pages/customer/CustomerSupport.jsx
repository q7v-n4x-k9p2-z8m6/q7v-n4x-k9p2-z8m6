// a1/pages/customer/CustomerSupport.jsx — پشتیبانی مشتری (جدول support_tickets)
import React, { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';
import { insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PField, PLoading, PError, inputClass } from '@/a1/components/customer/PortalBits';

export default function CustomerSupport() {
  const { loading, data, error } = usePortal();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const submit = async event => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) { setNotice('موضوع و متن پیام الزامی است.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('support_tickets', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        subject: form.subject, message: form.message, status: 'open',
        created_by_name: data.customer?.name || 'مشتری نمایشی',
      });
      setForm({ subject: '', message: '' });
      setNotice('پیام شما ثبت شد. برای دیدن آن، پنل را دوباره باز کنید.');
    } catch (err) {
      setNotice('ثبت پیام انجام نشد: ' + (err?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <PCard title="ارسال پیام به پشتیبانی" note="پیام در جدول support_tickets همین دستگاه ثبت می‌شود.">
        <form onSubmit={submit} className="space-y-2.5">
          <PField label="موضوع *">
            <input value={form.subject} onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} className={inputClass} />
          </PField>
          <PField label="متن پیام *">
            <textarea value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))} rows={3}
              className="w-full rounded-lg border border-[#d5e2f0] bg-white p-2 text-[12px] outline-none focus:border-[#164b87]" />
          </PField>
          <div className="flex items-center justify-between">
            {notice ? <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700"><Check className="h-3.5 w-3.5" /> {notice}</span> : <span />}
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#164b87] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} ارسال
            </button>
          </div>
        </form>
      </PCard>

      <PCard title="تیکت‌های من">
        {(data.tickets || []).length ? (
          <ul className="space-y-1.5 text-[11px]">
            {(data.tickets || []).map(ticket => (
              <li key={ticket.id} className="rounded-lg border border-[#eef3f7] p-2">
                <b className="block text-[#102b4c]">{ticket.subject || 'بدون موضوع'}</b>
                <span className="mt-0.5 block text-slate-600">{ticket.message}</span>
                <span className="mt-1 block text-[9px] text-slate-400">{ticket.status === 'open' ? 'باز' : 'بسته'}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>تیکتی ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}