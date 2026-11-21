// a1/components/v21/JalaliDateInput.jsx — ورودی تاریخ شمسی
// مقدار ذخیره‌شده ISO میلادی است اما کاربر تاریخ را شمسی می‌بیند و وارد می‌کند.
import React, { useEffect, useState } from 'react';
import { isoToJalaliText, jalaliToIso } from '@/a1/lib/jalali';

export default function JalaliDateInput({ value, onChange, className, placeholder = '۱۴۰۵/۰۸/۲۹', ariaLabel, id }) {
  const [text, setText] = useState(() => isoToJalaliText(value));

  useEffect(() => { setText(isoToJalaliText(value)); }, [value]);

  const commit = raw => {
    if (!String(raw).trim()) { setText(''); onChange(''); return; }
    const iso = jalaliToIso(raw);
    if (iso) { onChange(iso); setText(isoToJalaliText(iso)); return; }
    // تاریخ نامعتبر: مقدار قبلی برمی‌گردد تا سند با تاریخ نادرست ثبت نشود.
    setText(isoToJalaliText(value));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      dir="ltr"
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={event => setText(event.target.value)}
      onBlur={event => commit(event.target.value)}
      onKeyDown={event => { if (event.key === 'Enter') commit(event.currentTarget.value); }}
      className={className || 'h-9 w-full border border-slate-300 bg-white px-2 text-[11px] text-slate-800 focus:border-[#315e80]'}
    />
  );
}