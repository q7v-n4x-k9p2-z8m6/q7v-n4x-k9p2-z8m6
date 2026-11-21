// a1/lib/v21Demo.js — رکوردهای موقت فضای نمایشی
// معادل Version21DemoAdapter.js سورس A1، اما روی IndexedDB محلی و بدون Supabase.
import { all, insert, update, remove } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from './v21Session';

function sessionUser() {
  return currentUser() || {};
}

export async function loadDemoPreviewRecords() {
  const user = sessionUser();
  const rows = await all('demo_preview_records');
  return rows
    .filter(row => String(row.owner_user_id || '') === String(user.id || ''))
    .map(row => ({
      ...row,
      _demoPreview: true,
      _demoFixed: row.record_kind === 'sample',
      _demoRecordId: row.id,
      _demoModule: row.module_key,
    }));
}

export async function saveDemoPreviewRecord(moduleKey, payload, recordId = null) {
  const user = sessionUser();
  if (!moduleKey || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('اطلاعات رکورد برای ذخیره معتبر نیست.');
  }
  const cleanPayload = { ...payload };
  delete cleanPayload.id;
  delete cleanPayload._demoPreview;
  delete cleanPayload._demoFixed;
  delete cleanPayload._demoRecordId;
  delete cleanPayload._demoModule;
  if (recordId) {
    await update('demo_preview_records', Number(recordId), { payload: cleanPayload });
    return { id: recordId };
  }
  const saved = await insert('demo_preview_records', {
    exchange_code: user.exchange_code || DEMO_EXCHANGE_CODE,
    owner_user_id: user.id,
    module_key: moduleKey,
    record_key: globalThis.crypto?.randomUUID?.() || `tmp-${Date.now()}`,
    record_kind: 'temporary',
    payload: cleanPayload,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  return { id: saved.id };
}

export async function deleteDemoPreviewRecord(recordId) {
  await remove('demo_preview_records', Number(recordId));
  return { deleted: true };
}