// a1/components/Fields.jsx — انتقال اجزای ورودی A1 از src/components/sarraaf/Fields.jsx
// تغییر سازگاری: انتخابگر ورقِ A1 با عنصر select بومی جایگزین شده تا وابستگی اضافی وارد نشود.
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toEnglishDigits } from '@/a1/lib/format';

export const DEFAULT_CURRENCIES = [
  { code: 'AFN', name: 'افغانی', type: 'fiat', sort_order: 0, is_active: true },
  { code: 'USD', name: 'دالر امریکایی', type: 'fiat', sort_order: 1, is_active: true },
  { code: 'EUR', name: 'یورو', type: 'fiat', sort_order: 2, is_active: true },
  { code: 'AED', name: 'درهم امارات', type: 'fiat', sort_order: 3, is_active: true },
  { code: 'PKR', name: 'کلدار پاکستانی', type: 'fiat', sort_order: 4, is_active: true },
  { code: 'IRR', name: 'تومان ایران', type: 'fiat', sort_order: 5, is_active: true },
];

export function Field({ label, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <Label className="mb-1 block">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
    </div>
  );
}

export function AmountInput({ value, onChange, placeholder = 'مبلغ', disabled }) {
  const [display, setDisplay] = useState(value ? new Intl.NumberFormat('en-US').format(value) : '');

  useEffect(() => {
    const formatted = value ? new Intl.NumberFormat('en-US').format(value) : '';
    setDisplay(formatted);
  }, [value]);

  const handle = (event) => {
    const raw = toEnglishDigits(event.target.value).replace(/[^\d.]/g, '');
    setDisplay(raw ? new Intl.NumberFormat('en-US').format(parseFloat(raw)) : '');
    onChange(raw ? parseFloat(raw) : 0);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handle}
      placeholder={placeholder}
      disabled={disabled}
      className="font-mono text-left"
    />
  );
}

function sortCurrencies(list) {
  return [...list].sort((a, b) => {
    if (a.code === 'AFN') return -1;
    if (b.code === 'AFN') return 1;
    if (a.code === 'USD') return -1;
    if (b.code === 'USD') return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

export function CurrencySelect({ value, onChange, currencies, disabled }) {
  const list = sortCurrencies((currencies && currencies.length > 0 ? currencies : DEFAULT_CURRENCIES).filter((c) => c.is_active !== false));

  return (
    <select
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">انتخاب ارز</option>
      {list.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.code}{currency.name && currency.name !== currency.code ? ` — ${currency.name}` : ''}
        </option>
      ))}
    </select>
  );
}