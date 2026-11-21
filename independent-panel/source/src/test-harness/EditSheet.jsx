// test-harness/EditSheet.jsx — فرم ویرایش داخل محیط آزمون
// مقادیر فقط در حافظهٔ همین تب ذخیره می‌شوند؛ هیچ درخواست یا ذخیره‌سازی‌ای انجام نمی‌شود.
import React, { useState } from 'react';
import { X, Save, Lock } from 'lucide-react';

export default function EditSheet({ title, note, fields, onCancel, onSave }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.key, field.value ?? ''])));
  const [error, setError] = useState('');

  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    try {
      onSave(values);
    } catch (failure) {
      setError(failure?.message || 'ذخیره انجام نشد.');
    }
  };

  return (
    <div className="th-sheet" role="presentation" onClick={onCancel}>
      <form
        className="th-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <header className="th-sheet__head">
          <b>{title}</b>
          <button type="button" className="th-sheet__close" onClick={onCancel} aria-label="بستن">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="th-sheet__body">
          {fields.map((field) => (
            <label key={field.key} className="th-sheet__row">
              <span>{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea
                  rows={2}
                  value={values[field.key]}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              ) : field.type === 'select' ? (
                <select value={values[field.key]} onChange={(event) => set(field.key, event.target.value)}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  inputMode={field.type === 'number' ? 'decimal' : undefined}
                  value={values[field.key]}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              )}
            </label>
          ))}

          {error ? <p className="th-sheet__error">{error}</p> : null}
          {note ? (
            <p className="th-sheet__note">
              <Lock className="h-3.5 w-3.5" />
              {note}
            </p>
          ) : null}
        </div>

        <div className="th-sheet__actions">
          <button type="submit" className="th-btn">
            <Save className="h-4 w-4" />
            ذخیره در این تب
          </button>
          <button type="button" className="th-btn th-btn--ghost" onClick={onCancel}>انصراف</button>
        </div>
      </form>
    </div>
  );
}