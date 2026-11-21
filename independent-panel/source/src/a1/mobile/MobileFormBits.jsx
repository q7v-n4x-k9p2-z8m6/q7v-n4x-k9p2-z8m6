// a1/mobile/MobileFormBits.jsx — اجزای مشترک فرم‌های موبایل
import React from 'react';
import { ChevronDown } from 'lucide-react';

export function MobileField({ label, hint, children }) {
  return (
    <label className="a1m-field">
      <span className="a1m-field__label">{label}</span>
      {children}
      {hint ? <small className="a1m-field__hint">{hint}</small> : null}
    </label>
  );
}

export function MobileInput({ type = 'text', value, onChange, placeholder, min, step, inputMode }) {
  return (
    <input
      className="a1m-input"
      type={type}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      inputMode={inputMode}
    />
  );
}

export function MobileSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="a1m-select">
      <select className="a1m-input" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const item = typeof option === 'object' ? option : { value: option, label: option };
          return <option key={String(item.value)} value={item.value}>{item.label}</option>;
        })}
      </select>
      <ChevronDown className="a1m-select__icon" />
    </div>
  );
}

export function MobileNote({ tone = 'warning', children }) {
  const className = tone === 'info' ? 'a1m-note a1m-note--info' : tone === 'error' ? 'a1m-note a1m-note--error' : 'a1m-note';
  return <p className={className}>{children}</p>;
}