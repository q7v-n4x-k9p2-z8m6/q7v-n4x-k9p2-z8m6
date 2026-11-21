// src/core/registry/validate.js — بررسی یکپارچگی رجیستری ۲۵ بخش
// فقط دادهٔ دامنه‌ای؛ در محیط توسعه اجرا می‌شود تا ناهماهنگی فرم/فیلد/ناوبری زود پیدا شود.
import { CORE_MODULES, HOME_GROUPS, MORE_ONLY } from './modules.js';
import { MASTER_FORMS } from './masterForms.js';
import { SCHEMAS } from './schemas.js';
import { buildDraft } from '../domain/posting.js';

export function validateRegistry() {
  const errors = [];
  let checked = 0;

  const ids = CORE_MODULES.map((item) => item.id);
  checked += 1;
  if (new Set(ids).size !== ids.length) errors.push('شناسهٔ تکراری در فهرست بخش‌ها وجود دارد.');
  if (CORE_MODULES.length !== 25) errors.push(`تعداد بخش‌ها باید ۲۵ باشد؛ اکنون ${CORE_MODULES.length} است.`);

  CORE_MODULES.forEach((item) => {
    checked += 1;
    if (!item.section) errors.push(`بخش ${item.id} بخش مجوز ندارد.`);
    if (!item.label) errors.push(`بخش ${item.id} برچسب ندارد.`);
  });

  const nav = new Set([...HOME_GROUPS.flatMap((group) => group.ids), ...MORE_ONLY]);
  CORE_MODULES.filter((item) => item.id !== 'home').forEach((item) => {
    checked += 1;
    if (!nav.has(item.id)) errors.push(`بخش ${item.id} در ناوبری موبایل جایی ندارد.`);
  });

  CORE_MODULES.filter((item) => item.kind === 'master').forEach((item) => {
    checked += 1;
    const form = MASTER_FORMS[item.id];
    if (!form) { errors.push(`فرم تعریف برای ${item.id} وجود ندارد.`); return; }
    if (!form.fields?.length) errors.push(`فرم ${item.id} فیلد ندارد.`);
    const formKeys = (form.fields || []).map((field) => field.key).join(',');
    const desktopKeys = (SCHEMAS[item.id]?.fields || []).map((field) => field[0]).join(',');
    if (formKeys !== desktopKeys) errors.push(`فیلدهای موبایل و لپ‌تاپ ${item.id} یکسان نیستند.`);
  });

  CORE_MODULES.filter((item) => item.kind === 'posting').forEach((item) => {
    checked += 1;
    const draft = buildDraft(item.id, null, {}, { cash: [], accounts: [] });
    if (!draft || !Object.keys(draft).length) errors.push(`فرم ثبت ${item.id} پیش‌نویس نمی‌سازد.`);
  });

  return { checked, errors };
}