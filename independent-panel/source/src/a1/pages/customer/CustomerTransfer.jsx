// a1/pages/customer/CustomerTransfer.jsx — درخواست حوالهٔ مشتری (ساختار: src/pages/customer/CustomerTransfer.jsx)
// درخواست در جدول customer_transfer_requests همین دستگاه ثبت می‌شود؛ سند مالی ثبت نمی‌شود.
import React, { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';
import { insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PField, PLoading, PError, inputClass, money, today } from '@/a1/components/customer/PortalBits';

const EMPTY = { receiver_name: '', receiver_phone: '', destination: '', amount: '', currency: 'AFN', note: '' };

export default function CustomerTransfer() {
  const { loading, data, error } = usePortal();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async event => {
    event.preventDefault();
    if (!form.receiver_name.trim()) { setNotice('نام گیرنده الزامی است.'); return; }
    if (!(Number(form.amount) > 0)) { setNotice('مبلغ باید عدد مثبت باشد.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('customer_transfer_requests', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        customer_name: data.customer?.name || '',
        receiver_name: form.receiver_name,
        receiver_phone: form.receiver_phone,
        destination: form.destination,
        amount: Number(form.amount),
        currency: form.currency,
        note: form.note,
        request_date: today(),
        status: 'pending',
      });
      setForm(EMPTY);
      setNotice('درخواست حوالهٔ شما در همین دستگاه ثبت شد و در فهرست پایین دیده می‌شود.');
    } catch (err) {
      setNotice('ثبت درخواست انجام نشد: ' + (err?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  const requests = (data.transfers || []).filter(item => item.sender === data.customer?.name);

  return (
    <div className="space-y-3">
      <PCard title="ثبت درخواست حواله" note="این درخواست فقط در فضای نمایشی همین مرورگر ثبت می‌شود.">
        <form onSubmit={submit} className="grid gap-2.5 sm:grid-cols-2">
          <PField label="نام گیرنده *"><input value={form.receiver_name} onChange={e => setField('receiver_name', e.target.value)} className={inputClass} /></PField>
          <PField label="شماره تماس گیرنده"><input value={form.receiver_phone} onChange={e => setField('receiver_phone', e.target.value)} dir="ltr" className={inputClass} /></PField>
          <PField label="مقصد"><input value={form.destination} onChange={e => setField('destination', e.target.value)} className={inputClass} /></PField>
          <PField label="مبلغ *"><input value={form.amount} onChange={e => setField('amount', e.target.value)} inputMode="decimal" className={inputClass} /></PField>
          <PField label="ارز">
            <select value={form.currency} onChange={e => setField('currency', e.target.value)} className={inputClass}>
              {['AFN', 'USD', 'EUR', 'AED', 'PKR', 'IRR'].map(code => <option key={code}>{code}</option>)}
            </select>
          </PField>
          <PField label="یادداشت"><input value={form.note} onChange={e => setField('note', e.target.value)} className={inputClass} /></PField>
          <div className="sm:col-span-2 flex items-center justify-between border-t border-[#eef3f7] pt-2">
            {notice ? <span className="inline-flex items-center gap-1 text-[10.5px] text-emerald-700"><Check className="h-3.5 w-3.5" /> {notice}</span> : <span />}
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#164b87] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} ثبت درخواست
            </button>
          </div>
        </form>
      </PCard>

      <PCard title="حواله‌های من">
        {requests.length ? (
          <ul className="space-y-1.5 text-[11px]">
            {requests.map(item => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eef3f7] p-2">
                <span className="min-w-0 flex-1 truncate">{item.receiver} · {item.destination}</span>
                <span className="shrink-0 tabular-nums">{money(item.amount)} {item.currency}</span>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] text-amber-800">{item.status}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>حواله‌ای برای این مشتری ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}