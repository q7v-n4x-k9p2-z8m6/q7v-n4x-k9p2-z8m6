// a1/components/v21/access/AddEmployeeCard.jsx — فرم افزودن کارمند (فقط پیش‌نمایش محلی)
import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AddEmployeeCard({ onAdd }) {
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [message, setMessage] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage('نام کارمند برای پیش‌نمایش لازم است.');
      return;
    }
    onAdd({ name: form.name.trim(), mobile: form.mobile.trim() });
    setForm({ name: '', mobile: '' });
    setMessage('فقط پیش‌نمایش: ردیف نمایشی اضافه شد و هیچ حسابی ساخته یا ذخیره نشد.');
  };

  return (
    <section className="rounded-xl border border-[#c9d7e3] bg-white">
      <header className="border-b border-[#e2eaf1] bg-[#f2f7fb] px-3 py-2">
        <b className="text-xs text-[#1e4776]">افزودن کارمند جدید</b>
        <p className="mt-0.5 text-[9.5px] text-slate-500">در این مرحله فرم فقط برای نمایش چیدمان است.</p>
      </header>

      <form onSubmit={submit} className="grid gap-2 p-3 sm:grid-cols-2">
        <label className="space-y-1 text-[10.5px]">
          <span className="text-slate-600">نام و تخلص</span>
          <input
            value={form.name}
            onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
            placeholder="نام کارمند نمایشی"
            className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2 text-[11px] outline-none focus:border-[#1e4776]"
          />
        </label>
        <label className="space-y-1 text-[10.5px]">
          <span className="text-slate-600">شماره تماس</span>
          <input
            value={form.mobile}
            onChange={event => setForm(prev => ({ ...prev, mobile: event.target.value }))}
            placeholder="۰۷۰۰ ۰۰۰ ۰۰۰"
            dir="ltr"
            className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2 text-[11px] outline-none focus:border-[#1e4776]"
          />
        </label>
        <label className="space-y-1 text-[10.5px]">
          <span className="text-slate-600">نقش</span>
          <input value="کارمند همین صرافی" readOnly className="h-9 w-full rounded-lg border border-[#e2eaf1] bg-[#f5f9fc] px-2 text-[11px] text-slate-500" />
        </label>
        <label className="space-y-1 text-[10.5px]">
          <span className="text-slate-600">صرافی</span>
          <input value="صرافی نمایشی (بدون اتصال واقعی)" readOnly className="h-9 w-full rounded-lg border border-[#e2eaf1] bg-[#f5f9fc] px-2 text-[11px] text-slate-500" />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
          <span className="text-[9.5px] leading-5 text-slate-500">{message}</span>
          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-[#1e4776] px-3 py-1.5 text-[11px] font-bold text-white">
            <Plus className="h-3.5 w-3.5" /> افزودن به پیش‌نمایش
          </button>
        </div>
      </form>
    </section>
  );
}