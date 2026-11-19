import { supabase } from '@/lib/supabaseClient';
import { getExchangeCode } from '@/lib/supabaseApi';
import { resolveSessionUserId } from './Version21DemoRules';

const DEMO_USERS = {
  107: { username: '22222222', exchangeCode: 'EX-261019-9B2573C5' },
  114: { username: '33333333', exchangeCode: 'EX-261028-27497E95' },
};

function sessionUser() {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null') || {}; }
  catch { return {}; }
}

async function requireDemoSession() {
  const user = sessionUser();
  const userId = Number(resolveSessionUserId(user, localStorage.getItem('auth_token') || '') || 0);
  const exchangeCode = getExchangeCode();
  const expected = DEMO_USERS[userId];
  if (!expected || exchangeCode !== expected.exchangeCode) {
    throw new Error('این عملیات فقط برای یکی از دو حساب نمایشی مجاز است.');
  }
  const { data, error } = await supabase.from('users')
    .select('id,username,role,status')
    .eq('id', userId)
    .eq('username', expected.username)
    .maybeSingle();
  if (error) throw new Error('اعتبارسنجی حساب نمایشی ناموفق بود: ' + error.message);
  if (!data || data.status !== 'active' || !['exchange','sarraaf'].includes(String(data.role).toLowerCase())) {
    throw new Error('حساب نمایشی فعال و معتبر نیست؛ عملیات متوقف شد.');
  }
  return { userId, exchangeCode };
}

export async function loadDemoPreviewRecords() {
  const ctx = await requireDemoSession();
  const [fixed, temporary] = await Promise.all([
    supabase.from('demo_preview_records').select('id,module_key,record_kind,payload,created_at,expires_at')
      .eq('exchange_code', ctx.exchangeCode).eq('owner_user_id', ctx.userId).eq('record_kind', 'sample')
      .order('module_key').order('record_key'),
    supabase.from('demo_preview_records').select('id,module_key,record_kind,payload,created_at,expires_at')
      .eq('exchange_code', ctx.exchangeCode).eq('owner_user_id', ctx.userId).eq('record_kind', 'temporary')
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
  ]);
  if (fixed.error) throw new Error('بارگذاری اطلاعات ثابت نمایشی ناموفق بود: ' + fixed.error.message);
  if (temporary.error) throw new Error('بارگذاری اطلاعات موقت ناموفق بود: ' + temporary.error.message);
  return [...(fixed.data || []), ...(temporary.data || [])].map(row => ({
    ...row,
    _demoPreview: true,
    _demoFixed: row.record_kind === 'sample',
    _demoRecordId: row.id,
    _demoModule: row.module_key,
  }));
}

export async function saveDemoPreviewRecord(moduleKey, payload, recordId = null) {
  const ctx = await requireDemoSession();
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
    const { data, error } = await supabase.from('demo_preview_records')
      .update({ payload: cleanPayload })
      .eq('id', recordId).eq('exchange_code', ctx.exchangeCode)
      .eq('owner_user_id', ctx.userId).eq('record_kind', 'temporary')
      .select('id').maybeSingle();
    if (error) throw new Error('ویرایش رکورد موقت ناموفق بود: ' + error.message);
    if (!data) throw new Error('رکورد ثابت است یا زمان نگهداری آن پایان یافته؛ ویرایش مجاز نیست.');
    return { id: data.id, expiresInSeconds: null };
  }
  const recordKey = globalThis.crypto?.randomUUID?.() || ('tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from('demo_preview_records').insert({
    exchange_code: ctx.exchangeCode,
    owner_user_id: ctx.userId,
    module_key: moduleKey,
    record_key: recordKey,
    record_kind: 'temporary',
    payload: cleanPayload,
    created_by_user_id: ctx.userId,
    expires_at: expiresAt,
  }).select('id,expires_at').single();
  if (error) throw new Error('ذخیره موقت در دیتابیس ناموفق بود: ' + error.message);
  return { id: data.id, expiresAt: data.expires_at };
}

export async function deleteDemoPreviewRecord(recordId) {
  const ctx = await requireDemoSession();
  const { data, error } = await supabase.from('demo_preview_records')
    .delete()
    .eq('id', recordId).eq('exchange_code', ctx.exchangeCode)
    .eq('owner_user_id', ctx.userId).eq('record_kind', 'temporary')
    .select('id').maybeSingle();
  if (error) throw new Error('حذف رکورد موقت ناموفق بود: ' + error.message);
  if (!data) throw new Error('رکورد ثابت است یا زمان نگهداری آن پایان یافته؛ حذف مجاز نیست.');
  return { deleted: true };
}
