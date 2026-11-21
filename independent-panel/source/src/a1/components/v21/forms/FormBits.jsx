// a1/components/v21/forms/FormBits.jsx — عناصر مشترک فرم‌های حسابداری میز کار
import React from 'react';
import JalaliDateInput from '@/a1/components/v21/JalaliDateInput';

export function Labeled({ label, hint, error, wide, children }) {
  return (
    <label className={'space-y-1 text-[11px]' + (wide ? ' sm:col-span-2' : '')}>
      <span className={'block font-semibold ' + (error ? 'text-rose-700' : 'text-[#24496d]')}>{label}</span>
      <span className={error ? 'block border-r-2 border-rose-500 pr-1' : 'block'}>{children}</span>
      {error ? <span className="block text-[10px] font-bold leading-4 text-rose-700">{error}</span> : null}
      {!error && hint ? <span className="block text-[10px] leading-4 text-slate-500">{hint}</span> : null}
    </label>
  );
}

// رقم‌های فارسی و عربی به رقم لاتین تبدیل می‌شوند؛ کادر عددیِ مرورگر این رقم‌ها را
// نادیده می‌گرفت و فیلد مبلغ هنگام تایپ مقدار نادرست یا خالی نشان می‌داد.
const latinDigits = value => String(value ?? '')
  .replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x06f0))
  .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x0660))
  .replace(/٫/g, '.');

// مبلغ فقط رقم و یک ممیز اعشار می‌پذیرد؛ ممیز دوم و نویسه‌های ناخواسته حذف می‌شوند
// تا کادر مبلغ هنگام تایپ سریع، مقدار درهم‌ریخته نشان ندهد.
const amountDigits = value => latinDigits(value)
  .replace(/[^\d.]/g, '')
  .replace(/^(\d*\.?\d*).*$/, '$1');

export function TextInput({ value, onChange, type = 'text', placeholder = '' }) {
  if (type === 'date') {
    return <JalaliDateInput value={value} onChange={onChange} />;
  }
  if (type === 'number') {
    return (
      <input
        type="text"
        inputMode="decimal"
        dir="ltr"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={event => onChange(amountDigits(event.target.value))}
        className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px] tabular-nums text-slate-800 outline-none focus:border-[#315e80]"
      />
    );
  }
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px] text-slate-800 outline-none focus:border-[#315e80]"
    />
  );
}

export function SelectBox({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value ?? ''}
      onChange={event => onChange(event.target.value)}
      className="h-9 w-full border border-slate-300 bg-white px-2 text-[11px] text-slate-800 outline-none focus:border-[#315e80]"
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

export function FormNotice({ tone = 'info', children }) {
  const toneClass = tone === 'warning'
    ? 'border-amber-300 bg-amber-50 text-amber-900'
    : tone === 'error'
      ? 'border-rose-300 bg-rose-50 text-rose-900'
      : 'border-slate-300 bg-slate-50 text-slate-700';
  return <div className={'border px-3 py-2 text-[10px] leading-5 ' + toneClass}>{children}</div>;
}

export function FormFooter({ saving, disabled = false, onCancel, onSave, saveLabel = 'ثبت سند', canSaveNew = true }) {
  // «در حال ثبت...» فقط وقتی نشان داده می‌شود که ثبت واقعاً در جریان باشد؛
  // نبودِ اعتبارسنجی فرم نباید دکمه را شبیه حالت ذخیره و غیرفعال جلوه بدهد.
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t bg-slate-100 p-3">
      <button
        type="button"
        onClick={() => onSave(false)}
        disabled={saving || disabled}
        className="border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900 disabled:opacity-50"
      >
        {saving ? 'در حال ثبت...' : saveLabel}
      </button>
      {canSaveNew ? (
        <button
          type="button"
          onClick={() => onSave(true)}
          disabled={saving || disabled}
          className="border bg-white px-4 py-2 text-xs disabled:opacity-50"
        >
          ثبت و جدید
        </button>
      ) : null}
      <button type="button" onClick={onCancel} disabled={saving} className="border bg-white px-4 py-2 text-xs disabled:opacity-50">
        انصراف
      </button>
    </div>
  );
}