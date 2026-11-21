// a1/components/v21/forms/ReversalDialog.jsx — ابطال سند با ثبت سند معکوس و علت اجباری
import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

export default function ReversalDialog({ open, title, detail, saving, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  const valid = reason.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-3" role="presentation" onClick={onCancel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="ابطال سند"
        className="w-full max-w-md overflow-hidden border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white">
          <b className="text-xs">{title || 'ابطال سند با ثبت سند معکوس'}</b>
          <button type="button" onClick={onCancel} aria-label="بستن"><X className="h-4 w-4" /></button>
        </header>
        <div className="space-y-3 p-4 text-[11px] leading-6">
          <p className="text-slate-700">
            هیچ سندی حذف نمی‌شود. برای سند اصلی و همهٔ اسناد وابسته (مانند کمیشن) سند معکوس ثبت می‌شود و اثر مالی صفر می‌گردد.
          </p>
          {detail ? <div className="border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-600">{detail}</div> : null}
          <label className="block space-y-1">
            <span className="font-semibold text-[#24496d]">علت ابطال (الزامی)</span>
            <textarea
              value={reason}
              onChange={event => setReason(event.target.value)}
              rows={3}
              className="w-full border border-slate-300 bg-white p-2 text-[11px]"
              placeholder="مثلاً: اشتباه در مبلغ حواله"
            />
          </label>
          {!valid ? <p className="text-[10px] text-amber-700">علت ابطال باید حداقل سه نویسه باشد.</p> : null}
          <div className="flex justify-end gap-2 border-t pt-2">
            <button
              type="button"
              onClick={() => onConfirm(reason.trim())}
              disabled={!valid || saving}
              className="flex items-center gap-1 border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />{saving ? 'در حال ابطال...' : 'ثبت سند معکوس'}
            </button>
            <button type="button" onClick={onCancel} disabled={saving} className="border bg-white px-4 py-2 text-xs disabled:opacity-50">انصراف</button>
          </div>
        </div>
      </section>
    </div>
  );
}