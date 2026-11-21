// a1/components/v21/FiscalPeriodsPanel.jsx — دوره‌های مالی: تعریف، فهرست و بستن دوره
// فقط نمایش و ارسال درخواست است؛ اعتبارسنجی نهایی و ثبت در لایهٔ نوشتن انجام می‌شود.
import React, { useState } from 'react';
import { CalendarDays, Lock, Pencil, Plus, RotateCcw, ShieldCheck } from 'lucide-react';
import JalaliDateInput from './JalaliDateInput';
import { formatTableDate } from './DataTable';
import { periodIsClosed } from '@/a1/lib/fiscalPeriods';

const emptyDraft = () => ({ id: '', code: '', name: '', start_date: '', end_date: '', description: '' });

export default function FiscalPeriodsPanel({ rows = [], canCreate, canClose, saving, onCreate, onClose }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const set = (key, value) => setDraft(current => ({ ...current, [key]: value }));

  const submit = async () => {
    if (saving) return;
    setError('');
    setNotice('');
    const result = await onCreate(draft);
    if (!result?.ok) { setError(result?.message || 'ثبت دورهٔ مالی انجام نشد.'); return; }
    setDraft(emptyDraft());
    setNotice('دورهٔ مالی ثبت شد.');
  };

  const result_line = row => `بازه: ${formatTableDate(row.start_date)} تا ${formatTableDate(row.end_date)}`;

  // ویرایش فقط برای دورهٔ باز در دسترس است؛ دورهٔ بسته‌شده در لایهٔ نوشتن هم قابل تغییر نیست.
  const edit = row => {
    setError('');
    setNotice('');
    setDraft({
      id: row.id,
      code: row.period_code || '',
      name: row.period_name || '',
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      description: row.description || '',
    });
  };

  const close = async row => {
    if (saving) return;
    setError('');
    setNotice('');
    if (!window.confirm(`دورهٔ «${row.period_name || row.period_code}» بسته شود؟ پس از بستن، سندهایی که تاریخشان در این بازه باشد ثبت یا ویرایش نمی‌شوند.\n${result_line(row)}`)) return;
    const result = await onClose(row);
    if (!result?.ok) { setError(result?.message || 'بستن دوره انجام نشد.'); return; }
    setNotice('دورهٔ مالی بسته شد.');
  };

  const list = [...rows].sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || '')));

  return (
    <section dir="rtl" aria-label="دوره‌های مالی" className="space-y-3">
      <header className="flex flex-wrap items-center gap-2 border-b-2 border-[#315e80] pb-2">
        <CalendarDays className="h-4 w-4 text-[#315e80]" />
        <div className="min-w-0 flex-1">
          <div className="text-[9px] text-slate-500">سیستم حسابداری / دوره‌های مالی</div>
          <h2 className="truncate text-xs font-bold text-[#24496d]">دوره‌های مالی</h2>
        </div>
        <span className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-600">
          تعداد دوره‌ها: <b>{rows.length.toLocaleString('fa-IR')}</b>
        </span>
      </header>

      <div className="border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2 text-[10px] leading-5 text-slate-700">
        با بستن یک دوره، تاریخ بستن و نام بسته‌کننده روی همان دوره ثبت می‌شود و از آن پس ثبت یا ویرایش هر سندی که تاریخش داخل بازهٔ آن دوره باشد متوقف می‌شود.
      </div>

      {canCreate ? (
        <div className="border border-slate-300 bg-white p-3">
          <b className="mb-2 block text-[11px] text-[#24496d]">{draft.id ? 'ویرایش دورهٔ مالی باز' : 'تعریف دورهٔ مالی جدید'}</b>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[10px]">
              <span className="block font-semibold text-[#24496d]">کد دوره</span>
              <input value={draft.code} onChange={event => set('code', event.target.value)} placeholder="۱۴۰۵-۰۱" className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px]" />
            </label>
            <label className="space-y-1 text-[10px]">
              <span className="block font-semibold text-[#24496d]">نام دوره</span>
              <input value={draft.name} onChange={event => set('name', event.target.value)} placeholder="سال مالی ۱۴۰۵" className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px]" />
            </label>
            <label className="space-y-1 text-[10px]">
              <span className="block font-semibold text-[#24496d]">تاریخ شروع</span>
              <JalaliDateInput value={draft.start_date} onChange={value => set('start_date', value)} ariaLabel="تاریخ شروع دوره" />
            </label>
            <label className="space-y-1 text-[10px]">
              <span className="block font-semibold text-[#24496d]">تاریخ پایان</span>
              <JalaliDateInput value={draft.end_date} onChange={value => set('end_date', value)} ariaLabel="تاریخ پایان دوره" />
            </label>
            <label className="space-y-1 text-[10px] sm:col-span-2">
              <span className="block font-semibold text-[#24496d]">توضیحات (اختیاری)</span>
              <input value={draft.description} onChange={event => set('description', event.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px]" />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={submit} disabled={saving} className="flex items-center gap-1 border border-blue-300 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-900 disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />{saving ? 'در حال ثبت...' : draft.id ? 'ثبت ویرایش دوره' : 'ثبت دورهٔ مالی'}
            </button>
            <button type="button" onClick={() => { setDraft(emptyDraft()); setError(''); }} disabled={saving} className="flex items-center gap-1 border bg-white px-3 py-2 text-[11px] disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" />{draft.id ? 'انصراف از ویرایش' : 'پاک‌کردن فرم'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div role="alert" className="border border-rose-300 bg-rose-50 px-3 py-2 text-[10px] leading-5 text-rose-900">{error}</div> : null}
      {notice && !error ? <div role="status" className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] leading-5 text-emerald-900">{notice}</div> : null}

      {list.length ? (
        <div className="space-y-1.5">
          {list.map(row => {
            const closed = periodIsClosed(row);
            return (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
                <div className="min-w-0">
                  <b className="block text-[11px] text-[#24496d]">{row.period_name || 'دورهٔ مالی'} <span className="text-slate-500">· {row.period_code}</span></b>
                  <span className="mt-0.5 block text-[10px] text-slate-600">{result_line(row)}</span>
                  {closed ? (
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-rose-800">
                      <span className="flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 font-bold"><Lock className="h-3 w-3" />بسته</span>
                      <span>تاریخ بستن: <b>{row.closed_at ? formatTableDate(row.closed_at) : 'ثبت نشده'}</b></span>
                      <span>بسته‌کننده: <b>{row.closed_by || 'ثبت نشده'}</b></span>
                    </span>
                  ) : <span className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800"><ShieldCheck className="h-3 w-3" />باز</span>}
                </div>
                {closed ? null : (
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {canCreate ? (
                      <button type="button" onClick={() => edit(row)} disabled={saving} className="flex items-center gap-1 border border-blue-300 bg-blue-50 px-2.5 py-2 text-[10px] font-bold text-blue-900 disabled:opacity-50">
                        <Pencil className="h-3.5 w-3.5" />ویرایش
                      </button>
                    ) : null}
                    {canClose ? (
                      <button type="button" onClick={() => close(row)} disabled={saving} className="flex items-center gap-1 border border-rose-300 bg-rose-50 px-2.5 py-2 text-[10px] font-bold text-rose-800 disabled:opacity-50">
                        <Lock className="h-3.5 w-3.5" />بستن دوره
                      </button>
                    ) : <span className="text-[10px] text-slate-500">برای بستن دوره مجوز ندارید</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-[11px] text-slate-500">هنوز دورهٔ مالی ثبت نشده است؛ با فرم بالا اولین دوره را تعریف کنید.</p>
      )}
    </section>
  );
}