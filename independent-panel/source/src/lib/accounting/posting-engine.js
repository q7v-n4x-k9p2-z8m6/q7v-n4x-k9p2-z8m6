import { base44 } from '@/api/base44Client';
import { validateBalanced } from '@/lib/accounting/postings';

const DOC_PREFIX = {
  trade_buy: 'BUY',
  trade_sell: 'SEL',
  receive: 'RCV',
  pay: 'PAY',
  cash_in: 'CIN',
  cash_out: 'COUT',
  expense: 'EXP',
  transfer_out: 'TRO',
  transfer_in: 'TRI',
  conversion: 'CNV',
  journal: 'JRN',
  opening: 'OPN',
};

function stamp(date) {
  return String(date || new Date().toISOString().slice(0, 10)).replaceAll('-', '');
}

async function generateDocNumber(docType, date) {
  const prefix = DOC_PREFIX[docType] || 'DOC';
  const day = stamp(date);
  const count = await base44.entities.Document.count({ date });
  return `${prefix}-${day}-${String(count + 1).padStart(4, '0')}`;
}

async function logAudit({ actor, action, entityType, entityId, title, description }) {
  try {
    await base44.entities.AuditLog.create({
      actor_name: actor?.name || 'کاربر آزمایشی',
      actor_role: actor?.role || 'admin',
      action,
      entity_type: entityType,
      entity_id: entityId || '',
      title: title || '',
      description: description || '',
    });
  } catch (error) {
    // ثبت رویداد نباید عملیات مالی را متوقف کند
    console.warn('audit log failed', error);
  }
}

/**
 * هستهٔ ثبت سند: سند + ردیف‌های دفتر + رویداد.
 * پیش از هر نوشتن، توازن بدهکار و بستانکار بررسی می‌شود.
 */
export async function postDocument({ doc, lines, actor }) {
  const check = validateBalanced(lines);
  if (!check.balanced) {
    throw new Error(`سند متوازن نیست؛ اختلاف ${check.diff} در ارز پایه`);
  }

  const docNumber = doc.doc_number || (await generateDocNumber(doc.doc_type, doc.date));
  const created = await base44.entities.Document.create({
    ...doc,
    doc_number: docNumber,
    status: 'posted',
    registered_by_name: actor?.name || 'کاربر آزمایشی',
  });

  try {
    await base44.entities.LedgerEntry.bulkCreate(
      lines.map((entry) => ({
        ...entry,
        document_id: created.id,
        doc_number: docNumber,
        doc_type: doc.doc_type,
        date: doc.date,
      }))
    );
  } catch (error) {
    await base44.entities.Document.delete(created.id);
    throw error;
  }

  await logAudit({
    actor,
    action: 'create',
    entityType: 'Document',
    entityId: created.id,
    title: `${docNumber} — ${doc.doc_type}`,
    description: doc.description || '',
  });

  return created;
}

/**
 * ابطال سند با صدور سند معکوس (بدون حذف ردیف‌های دفتر)
 */
export async function reverseDocument(documentId, actor, reason) {
  const doc = await base44.entities.Document.get(documentId);
  const entries = await base44.entities.LedgerEntry.filter({ document_id: documentId });
  if (!entries.length) throw new Error('ردیف دفتری برای این سند یافت نشد');
  if (doc.status === 'reversed') throw new Error('این سند قبلاً ابطال شده است');

  const reversalNumber = await generateDocNumber(doc.doc_type, doc.date);
  const reversal = await base44.entities.Document.create({
    doc_type: doc.doc_type,
    date: doc.date,
    currency: doc.currency,
    amount: doc.amount,
    rate: doc.rate,
    pair_currency: doc.pair_currency,
    pair_amount: doc.pair_amount,
    fee: doc.fee,
    fee_currency: doc.fee_currency,
    customer_id: doc.customer_id,
    customer_name: doc.customer_name,
    counter_type: doc.counter_type,
    counter_id: doc.counter_id,
    counter_name: doc.counter_name,
    base_value: doc.base_value,
    doc_number: reversalNumber,
    status: 'posted',
    reversed_of: doc.doc_number,
    registered_by_name: actor?.name || 'کاربر آزمایشی',
    description: `سند معکوس ${doc.doc_number}${reason ? ` — ${reason}` : ''}`,
  });

  await base44.entities.LedgerEntry.bulkCreate(
    entries.map((entry) => ({
      document_id: reversal.id,
      doc_number: reversalNumber,
      doc_type: doc.doc_type,
      date: doc.date,
      account_type: entry.account_type,
      account_id: entry.account_id,
      account_name: entry.account_name,
      currency: entry.currency,
      side: entry.side === 'debit' ? 'credit' : 'debit',
      amount: entry.amount,
      value: entry.value,
      rate: entry.rate,
      description: `معکوس — ${entry.description || ''}`,
    }))
  );

  await base44.entities.Document.update(documentId, { status: 'reversed' });

  await logAudit({
    actor,
    action: 'reverse',
    entityType: 'Document',
    entityId: documentId,
    title: `ابطال ${doc.doc_number}`,
    description: reason || '',
  });

  return reversal;
}

export { logAudit, generateDocNumber };