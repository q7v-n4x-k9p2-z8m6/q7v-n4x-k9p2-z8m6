// a1/pages/customer/CustomerWithdraw.jsx — درخواست برداشت (جدول wallet_withdrawal_requests)
import React, { useState } from 'react';
import { Wallet, Loader2, Check } from 'lucide-react';
import { insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PField, PLoading, PError, inputClass, money, today } from '@/a1/components/customer/PortalBits';

export default function CustomerWithdraw() {
  const { loading, data, error } = usePortal();
  const [form, setForm] = useState({ amount: '', currency: 'AFN', note: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const submit = async event => {
    event.preventDefault();
    if (!(Number(form.amount) > 0)) { setNotice('مبلغ باید عدد مثبت باشد.'); return; }
    setSaving(true);
    try {
      const user = currentUser();
      await insert('wallet_withdrawal_requests', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        customer_name: data.customer?.name || '',
        amount: Number(form.amount), currency: form.currency, note: form.note,
        request_date: today(), status: 'pending',
      });
      setForm({ amount: '', currency: 'AFN', note: '' });
      setNotice('درخواست برداشت ثبت شد.');
    } catch (err) {
      setNotice('ثبت درخواست انجام نشد: ' + (err?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <PCard title="درخواست برداشت" note="این درخواست فقط در همین دستگاه نمایشی ثبت می‌شود.">
        <form onSubmit={submit} className="grid gap-2.5 sm:grid-cols-2">
          <PField label="مبلغ *"><input value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} inputMode="decimal" className={inputClass} /></PField>
          <PField label="ارز">
            <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))} className={inputClass}>
              {['AFN', 'USD', 'EUR', 'AED'].map(code => <option key={code}>{code}</option>)}
            </select>
          </PField>
          <PField label="یادداشت"><input value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} className={inputClass} /></PField>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#164b87] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />} ثبت درخواست
            </button>
          </div>
          {notice ? <p className="sm:col-span-2 inline-flex items-center gap-1 text-[10.5px] text-emerald-700"><Check className="h-3.5 w-3.5" /> {notice}</p> : null}
        </form>
      </PCard>

      <PCard title="درخواست‌های قبلی">
        {(data.withdrawals || []).length ? (
          <ul className="space-y-1.5 text-[11px]">
            {(data.withdrawals || []).map(item => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eef3f7] p-2">
                <span className="tabular-nums">{money(item.amount)} {item.currency}</span>
                <span className="text-[9px] text-slate-500">{item.status}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>درخواستی ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}