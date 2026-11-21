// a1/lib/v21Posting.js — تحریر اتمیک اسناد و سطرهای دفتر داخل یک تراکنش IndexedDB
// این ماژول هیچ اتصال مستقیمی به base44 یا Supabase ندارد و فقط روی handleهای writeTx کار می‌کند.
import { validateBalancedLines, number, documentDateTimestamp } from './v21Rules';
import { seriesPrefix, seriesNumber } from './documentSeries';
import { isReversalDocument } from './v21PostingGuards.js';

const nowIso = () => new Date().toISOString();

// شمارهٔ بعدی فقط میان اسناد همان سری شمرده می‌شود؛ هر نوع سند پیوستگی فهرست خودش را دارد.
function nextNumberFrom(rows, prefix) {
  const numbers = rows
    .map(row => String(row.doc_number || ''))
    .filter(value => value.startsWith(prefix + '-'))
    .map(value => Number(value.slice(prefix.length + 1)) || 0);
  return seriesNumber(prefix, (numbers.length ? Math.max(...numbers) : 0) + 1);
}

async function documentLines(handles, documentId) {
  const rows = await handles.ledger_entries.getAll();
  return rows.filter(row => Number(row.document_id) === Number(documentId) && !row.deleted);
}

// ثبت سند دوطرفه + سطرهای دفتر + سابقهٔ فعالیت، همه در همان تراکنش جاری.
export async function postDocumentInTx(handles, payload) {
  const {
    doc_type, currency, amount, fee = 0, fee_currency, description = '',
    related_type = 'none', related_id = null, related_name = '', lines,
    transfer_id = null, exchange_code = '', customer_side, counter_type, counter_id,
    pair_currency, pair_amount, rate, registered_by = '', registered_by_user_id = null,
    client_operation_id = '', date, created_at, source_doc_type = '', reverses_document_id = null,
    settlement_id = null,
  } = payload;

  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error('سند باید حداقل دو سطر بدهکار و بستانکار داشته باشد.');
  }
  validateBalancedLines(lines, 'ثبت سند');

  const documents = await handles.documents.getAll();
  const docNumber = nextNumberFrom(documents, seriesPrefix(doc_type));
  const stamp = created_at || (date ? documentDateTimestamp(date) : nowIso());
  const day = String(stamp).slice(0, 10);

  const documentId = await handles.documents.add({
    doc_number: docNumber,
    doc_type,
    source_doc_type: source_doc_type || null,
    reverses_document_id: reverses_document_id || null,
    currency,
    amount: number(amount) || 0,
    fee: number(fee) || 0,
    fee_currency: fee_currency || (Number(fee) ? currency : ''),
    description,
    related_type,
    related_id,
    related_name,
    transfer_id,
    exchange_code,
    customer_side: customer_side || null,
    counter_type: counter_type || null,
    counter_id: counter_id || null,
    pair_currency: pair_currency || null,
    pair_amount: pair_amount ?? null,
    rate: rate || null,
    registered_by,
    registered_by_user_id,
    client_operation_id: String(client_operation_id || '') || null,
    settlement_id: settlement_id || null,
    deleted: false,
    reversed: false,
    status: 'posted',
    date: day,
    created_at: stamp,
  });

  for (const [index, line] of lines.entries()) {
    await handles.ledger_entries.add({
      document_id: documentId,
      doc_number: docNumber,
      doc_type,
      description: line.description || description,
      account_type: line.account_type,
      account_id: line.account_id != null ? String(line.account_id) : '',
      account_name: line.account_name || '',
      currency: line.currency || currency,
      debit: number(line.debit) || 0,
      credit: number(line.credit) || 0,
      side: number(line.debit) ? 'debit' : 'credit',
      amount: number(line.debit) || number(line.credit) || 0,
      related_type,
      related_id,
      transfer_id,
      exchange_code,
      registered_by,
      registered_by_user_id,
      settlement_id: settlement_id || null,
      deleted: false,
      version: 1,
      doc_line_no: index + 1,
      date: day,
      created_at: stamp,
    });
  }

  await handles.audit_logs.add({
    action: 'create',
    entity_type: 'document',
    entity_id: String(documentId),
    description: `ثبت سند ${docNumber} (${doc_type})`,
    actor_name: registered_by || 'کاربر آزمایشی',
    exchange_code,
    created_at: stamp,
  });

  return { id: documentId, doc_number: docNumber };
}

// ابطال: سند معکوس کامل، بدون حذف سطرهای اصلی.
export async function reverseDocumentInTx(handles, documentId, { reason = '', registeredBy = '', exchangeCode = '', registeredByUserId = null } = {}) {
  const document = await handles.documents.get(Number(documentId));
  if (!document) throw new Error('سند برای ابطال پیدا نشد.');
  if (isReversalDocument(document)) throw new Error('سند معکوس خودش قابل ابطال نیست؛ عملیات تکراری متوقف شد.');
  if (String(document.exchange_code || '') !== String(exchangeCode || '')) throw new Error('این سند متعلق به صرافی فعال نیست؛ ابطال متوقف شد.');
  if (document.deleted) throw new Error('سند حذف‌شده قابل ابطال نیست.');
  if (document.reversed) throw new Error(`سند ${document.doc_number} قبلاً ابطال شده است.`);

  const reasonText = String(reason || '').trim();
  if (reasonText.length < 3) throw new Error('علت ابطال باید نوشته شود و حداقل سه نویسه باشد.');

  const lines = await documentLines(handles, documentId);
  if (!lines.length) throw new Error('سطر دفتری برای این سند پیدا نشد؛ ابطال متوقف شد.');

  const mirrored = lines.map(line => ({
    account_type: line.account_type,
    account_id: line.account_id,
    account_name: line.account_name,
    currency: line.currency,
    debit: number(line.credit) || 0,
    credit: number(line.debit) || 0,
    description: `ابطال ${document.doc_number}`,
  }));

  const reversal = await postDocumentInTx(handles, {
    doc_type: 'reversal',
    source_doc_type: document.doc_type,
    reverses_document_id: document.id,
    currency: document.currency,
    amount: document.amount,
    description: `ابطال سند ${document.doc_number} — ${reasonText}`,
    related_type: document.related_type,
    related_id: document.related_id,
    related_name: document.related_name,
    transfer_id: document.transfer_id,
    exchange_code: document.exchange_code || exchangeCode,
    registered_by: registeredBy,
    registered_by_user_id: registeredByUserId,
    lines: mirrored,
  });

  await handles.documents.put({
    ...document,
    reversed: true,
    reversed_date: nowIso(),
    reversed_by: registeredBy,
    reverse_reason: reasonText,
    status: 'reversed',
    reversed_of: reversal.doc_number,
    updated_at: nowIso(),
  });

  await handles.audit_logs.add({
    action: 'reverse',
    entity_type: 'document',
    entity_id: String(documentId),
    description: `ابطال سند ${document.doc_number} — ${reasonText}`,
    reason: reasonText,
    actor_name: registeredBy || 'کاربر آزمایشی',
    exchange_code: document.exchange_code || exchangeCode,
    created_at: nowIso(),
  });

  return reversal;
}

// ویرایش سند: سطرهای قبلی حذف نمی‌شوند؛ با نسخهٔ جدید جایگزین و در سابقه حفظ می‌شوند.
export async function replaceDocumentLinesInTx(handles, documentId, { lines, description, amount, currency, user = '', note = '', exchangeCode = '', date } = {}) {
  const document = await handles.documents.get(Number(documentId));
  if (!document) throw new Error('سند برای ویرایش پیدا نشد.');
  if (String(document.exchange_code || '') !== String(exchangeCode || '')) throw new Error('این سند متعلق به صرافی فعال نیست؛ ویرایش متوقف شد.');
  if (document.reversed) throw new Error('سند ابطال‌شده قابل ویرایش نیست.');
  if (document.deleted) throw new Error('سند حذف‌شده قابل ویرایش نیست.');
  validateBalancedLines(lines, 'ویرایش سند');

  const allLines = (await handles.ledger_entries.getAll()).filter(row => Number(row.document_id) === Number(documentId));
  const activeLines = allLines.filter(row => !row.deleted);
  const version = allLines.reduce((top, row) => Math.max(top, number(row.version) || 1), 1) + 1;
  const stamp = nowIso();
  const day = date ? documentDateTimestamp(date).slice(0, 10) : String(document.date || document.created_at || stamp).slice(0, 10);

  for (const line of activeLines) {
    await handles.ledger_entries.put({
      ...line,
      deleted: true,
      deleted_date: stamp,
      deleted_by_name: user,
      edit_note: note || 'جایگزینی با ویرایش نسخهٔ ۲۱',
    });
  }

  for (const [index, line] of lines.entries()) {
    await handles.ledger_entries.add({
      document_id: Number(documentId),
      doc_number: document.doc_number,
      doc_type: document.doc_type,
      description: line.description || description || document.description,
      account_type: line.account_type,
      account_id: line.account_id != null ? String(line.account_id) : '',
      account_name: line.account_name || '',
      currency: line.currency || currency || document.currency,
      debit: number(line.debit) || 0,
      credit: number(line.credit) || 0,
      side: number(line.debit) ? 'debit' : 'credit',
      amount: number(line.debit) || number(line.credit) || 0,
      related_type: document.related_type || 'none',
      related_id: document.related_id || null,
      transfer_id: document.transfer_id || null,
      exchange_code: document.exchange_code,
      registered_by: user,
      deleted: false,
      version,
      doc_line_no: index + 1,
      date: day,
      created_at: document.created_at || stamp,
    });
  }

  await handles.documents.put({
    ...document,
    description: description || document.description,
    amount: number(amount) || document.amount,
    currency: currency || document.currency,
    date: day,
    edited: true,
    edited_date: stamp,
    edited_by_name: user,
    edit_note: note || 'ویرایش نسخهٔ ۲۱',
    updated_at: stamp,
  });

  await handles.audit_logs.add({
    action: 'update',
    entity_type: 'document',
    entity_id: String(documentId),
    description: `ویرایش سند ${document.doc_number} — نسخهٔ ${version}`,
    old_values: { lines: activeLines.length },
    new_values: { lines: lines.length, version },
    actor_name: user || 'کاربر آزمایشی',
    exchange_code: document.exchange_code,
    created_at: stamp,
  });

  return { id: Number(documentId), version };
}

export async function assertNoDuplicateOperation(handles, clientOperationId) {
  const operationId = String(clientOperationId || '').trim();
  if (!operationId) return;
  const documents = await handles.documents.getAll();
  if (documents.some(row => String(row.client_operation_id || '') === operationId)) {
    throw new Error('این عملیات قبلاً ثبت شده است؛ برای جلوگیری از ثبت تکراری متوقف شد.');
  }
}