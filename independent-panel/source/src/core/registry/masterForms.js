// src/core/registry/masterForms.js — فرم‌های تعریف، ساخته‌شده از جدول واحد SCHEMAS
// چیدمان‌ها نباید فهرست فیلد جداگانه داشته باشند؛ هر فیلد فقط یک منبع دارد.
import { CURRENCIES, SCHEMAS, MASTER_FORM_MODULES } from './schemas.js';
import { currencyLabel } from '../domain/currencies.js';

// نکته‌های نمایشی مخصوص چیدمان موبایل (متن راهنما و گزینه‌های وابسته به داده)
const FIELD_HINTS = {
  customers: { opening: 'مثبت = بدهکار، منفی = بستانکار' },
};

const DYNAMIC_OPTIONS = {
  accounts: { parentId: 'parent', currency: 'optionalCurrency' },
};

const currencyOptions = CURRENCIES.map((code) => ({ value: code, label: currencyLabel(code) }));

function optionsFor(key, rawOptions) {
  if (!rawOptions || !rawOptions.length) return [];
  if (key === 'currency') return currencyOptions;
  return rawOptions;
}

export function buildMasterForm(moduleId) {
  const schema = SCHEMAS[moduleId];
  if (!schema) return null;
  const hints = FIELD_HINTS[moduleId] || {};
  const dynamic = DYNAMIC_OPTIONS[moduleId] || {};
  return {
    title: schema.title,
    fields: schema.fields.map(([key, label, type, options]) => ({
      key,
      label,
      type,
      options: type === 'select' && !dynamic[key] ? optionsFor(key, options) : [],
      hint: hints[key],
      dynamic: dynamic[key],
    })),
  };
}

export const MASTER_FORMS = Object.fromEntries(
  MASTER_FORM_MODULES.map((moduleId) => [moduleId, buildMasterForm(moduleId)])
);

export const isMasterForm = (moduleId) => Boolean(MASTER_FORMS[moduleId]);