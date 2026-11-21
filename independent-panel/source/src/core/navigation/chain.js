// src/core/navigation/chain.js — قرارداد پیوند بین اسناد، دفتر کل و حساب‌ها
// هر سطر دفتر کل به حساب واقعی خودش وصل می‌شود (مشتری، نمایندگی، صندوق، بانک)؛
// سطرهای دیگر همان سند، طرف مقابل معامله را نشان می‌دهند. فقط خواندن است و هیچ سندی نمی‌سازد.

import { findSourceForLine } from '@/core/domain/statement';

export const ACCOUNT_KIND_MODULES = {
  customer: 'customerLedger',
  branch: 'branchLedger',
  cash: 'cash',
  bank: 'banks',
  chart: 'ledger',
};

export const ACCOUNT_KIND_LABELS = {
  customer: 'حساب مشتری',
  branch: 'حساب نمایندگی',
  cash: 'صندوق',
  bank: 'حساب بانکی',
  chart: 'حساب کدینگ',
};

const text = (value) => String(value ?? '').trim();

// عبارت‌های متنی حساب در اسناد: «صندوق: نام» و «بانک: شناسه»
export function parseAccountExpression(value) {
  const raw = text(value);
  if (!raw) return null;
  const cash = raw.match(/^صندوق:\s*(.+)$/);
  if (cash) return { kind: 'cash', key: text(cash[1]) };
  const bank = raw.match(/^بانک:\s*(.+)$/);
  if (bank) return { kind: 'bank', key: text(bank[1]) };
  return null;
}

const pickRecord = (list, id, names) => {
  if (!Array.isArray(list) || !list.length) return null;
  if (id) {
    const byId = list.find((item) => text(item.id) === text(id));
    if (byId) return byId;
  }
  const candidates = names.map(text).filter(Boolean);
  for (const candidate of candidates) {
    const found = list.find((item) => text(item.name) === candidate
      || text(item.bank_name) === candidate
      || text(item.account) === candidate);
    if (found) return found;
  }
  return null;
};

const link = (kind, record) => (record
  ? { kind, record, label: text(record.name) || text(record.bank_name) || text(record.account) || text(record.account_name), moduleId: ACCOUNT_KIND_MODULES[kind] }
  : null);

// حساب کدینگ: شناسه یا کد یا نام حساب در فهرست حساب‌ها
const chartLink = (data, id, names) => {
  const accounts = Array.isArray(data?.accounts) ? data.accounts : [];
  if (!accounts.length) return null;
  const byId = id ? accounts.find((item) => text(item.id) === text(id)) : null;
  const candidate = byId || names.map(text).filter(Boolean)
    .map((name) => accounts.find((item) => text(item.name) === name || text(item.code) === name || text(item.account_name) === name))
    .find(Boolean);
  if (!candidate) return null;
  return {
    kind: 'chart',
    record: candidate,
    label: [text(candidate.code), text(candidate.name) || text(candidate.account_name)].filter(Boolean).join(' — '),
    moduleId: ACCOUNT_KIND_MODULES.chart,
  };
};

// حساب یک سطر دفتر کل: اول شناسهٔ ثابت، بعد نام؛ اگر پیوند نبود null برمی‌گردد (هیچ حسابی حدس زده نمی‌شود)
export function lineAccountLink(data, line) {
  if (!line) return null;
  const type = text(line.accountType).toLowerCase();
  const id = text(line.accountId);
  const names = [line.account, line.cash, line.party];
  const expression = parseAccountExpression(line.account);

  const byExpression = () => {
    if (expression?.kind === 'cash') return link('cash', pickRecord(data?.cash, '', [expression.key]));
    if (expression?.kind === 'bank') return link('bank', pickRecord(data?.banks, expression.key, [expression.key]));
    return null;
  };

  if (type === 'customer') return link('customer', pickRecord(data?.customers, id, names)) || byExpression();
  if (type === 'cash') return link('cash', pickRecord(data?.cash, id, names)) || byExpression();
  if (type === 'bank') return link('bank', pickRecord(data?.banks, id, names)) || byExpression();
  if (type === 'branch' || type === 'origin') return link('branch', pickRecord(data?.branches, id, names)) || byExpression();
  // حساب‌های کدینگ (درآمد، مصرف، دارایی) سطر خودشان را در دفتر کل دارند
  if (type === 'suspense' || type === 'revenue' || type === 'expense' || type === 'asset' || type === 'liability' || type === 'equity') {
    return chartLink(data, id, names) || byExpression();
  }
  if (expression) return byExpression();
  if (line.partyType === 'customer') return link('customer', pickRecord(data?.customers, '', names));
  if (line.partyType === 'branch') return link('branch', pickRecord(data?.branches, '', names));
  return null;
}

// همهٔ حساب‌های یک سند از سطرهای همان سند در دفتر کل (هر حساب یک‌بار)
export function documentAccountLinks(data, documentId) {
  if (!documentId) return [];
  const seen = new Set();
  const result = [];
  (data?.transactions || [])
    .filter((line) => text(line.documentId) === text(documentId))
    .forEach((line) => {
      const found = lineAccountLink(data, line);
      if (!found) return;
      const key = found.kind + '::' + text(found.record.id);
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ ...found, line });
    });
  return result;
}

// حسابِ طرف مقابل همان سند برای یک سطر (همه به‌جز خودِ سطر)
export function counterAccountLinks(data, line) {
  const own = lineAccountLink(data, line);
  return documentAccountLinks(data, line?.documentId)
    .filter((item) => !own || item.kind !== own.kind || text(item.record.id) !== text(own.record.id));
}

// حساب‌های مرتبط یک رکورد عملیاتی (حواله، معامله، مصرف، روزنامچه) از سند خودش
export function recordAccountLinks(data, record) {
  return documentAccountLinks(data, record?.documentId);
}

// رکورد مبدأ یک سند: حواله/انتقال، معاملهٔ اسعار، مصرف یا سند روزنامچه؛
// اگر هیچ رکورد عملیاتی پیدا نشد، خود سند برگردانده می‌شود تا زنجیره قطع نشود.
// تطبیق سند به رکورد عملیاتی همان قاعدهٔ مشترک گردش حساب است و اینجا تکرار نمی‌شود.
const SOURCE_LABELS = { remittance: 'حواله', exchange: 'معاملهٔ اسعار', expenses: 'مصرف', journal: 'سند روزنامچه' };

const operationOfDocument = (data, documentId) => {
  const found = findSourceForLine(data, { documentId });
  return SOURCE_LABELS[found.module] && found.record
    ? { moduleId: found.module, record: found.record, label: SOURCE_LABELS[found.module], number: text(found.record.number) }
    : null;
};

export function documentSource(data, documentId, documentNumber) {
  const id = text(documentId);
  if (id) {
    const operation = operationOfDocument(data, id);
    if (operation) return operation;
    const document = (data?.reports || []).find((row) => text(row.documentId || row.id) === id) || null;
    if (document) return { moduleId: 'reports', record: document, label: text(document.type) || 'سند', number: text(document.number) };
  }
  // اگر ردیف شناسهٔ سند نداشت، همان سند از روی شمارهٔ چاپ‌شده‌اش پیدا می‌شود تا زنجیره قطع نشود.
  const number = text(documentNumber);
  if (!number) return null;
  const byNumber = (data?.reports || []).find((row) => text(row.number) === number) || null;
  if (!byNumber) return null;
  const operation = operationOfDocument(data, byNumber.documentId || byNumber.id);
  if (operation) return operation;
  return { moduleId: 'reports', record: byNumber, label: text(byNumber.type) || 'سند', number: text(byNumber.number) };
}

// آدرس یک حساب برای ناوبری: مسیر فهرست + شناسهٔ حساب
export function accountRoute(kind, record) {
  const moduleId = ACCOUNT_KIND_MODULES[kind];
  if (!moduleId || !record) return null;
  return { moduleId, kind, record };
}