import React, { useState } from 'react';
import { getSupabaseConfig } from '@/lib/supabaseConfig';

const SESSION_KEY = 'hisab_sarraf_sandbox_auth_v1';
const ALLOWED = { '33333333': 'sarraaf' };

async function callSandboxAuth(payload) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/functions/v1/sarraf-preview-readonly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.key,
      Authorization: `Bearer ${config.key}`
    },
    body: JSON.stringify(payload)
  });
  let data = null;
  try { data = await response.json(); } catch {}
  if (!response.ok && !data) throw new Error('ارتباط با سرویس احراز هویت برقرار نشد.');
  return data || { success: false, error: 'auth_failed' };
}

export function readSandboxSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function saveSandboxSession(value) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(value)); } catch {}
}
export function clearSandboxSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
export function sandboxTenantId() {
  const session = readSandboxSession();
  return String(session?.user?.id || session?.username || 'anonymous');
}

export async function verifySandboxSession(session) {
  if (!session?.token || !session?.user) return null;
  try {
    const data = await callSandboxAuth({ action: 'verify', token: session.token });
    if (!data?.success || !data?.user) return null;
    const username = String(data.user.username || '');
    const expectedRole = ALLOWED[username];
    if (!expectedRole || data.user.role !== expectedRole || username !== String(session.username || '')) return null;
    return { ...session, username, user: data.user };
  } catch {
    return null;
  }
}


export async function authenticateSandboxCredentials(username, password) {
  const normalized = String(username || '').trim();
  const expectedRole = ALLOWED[normalized];
  if (!expectedRole) throw new Error('این حساب در فهرست کاربران مجاز محیط آزمایشی نیست.');
  if (!password) throw new Error('رمز عبور را وارد کنید.');

  const data = await callSandboxAuth({ action: 'login', username: normalized, password });
  if (!data?.success || !data?.user || !data?.token) {
    const messages = {
      invalid_credentials: 'نام کاربری یا رمز عبور اشتباه است.',
      wrong_password: 'رمز عبور اشتباه است.',
      user_not_found: 'حساب کاربری پیدا نشد.',
      user_inactive: 'این حساب غیرفعال است.',
      too_many_attempts: 'تلاش‌های ناموفق زیاد است؛ بعداً دوباره امتحان کنید.',
      sandbox_access_denied: 'این حساب اجازه ورود به محیط آزمایشی را ندارد.'
    };
    throw new Error(messages[data?.error] || 'ورود انجام نشد؛ اطلاعات حساب را بررسی کنید.');
  }

  const actualUsername = String(data.user.username || '');
  if (actualUsername !== normalized || data.user.role !== expectedRole) {
    throw new Error('نقش یا شناسه این حساب با دسترسی آزمایشی تعریف‌شده مطابقت ندارد.');
  }

  const session = {
    username: normalized,
    token: data.token,
    user: data.user,
    authenticatedAt: new Date().toISOString()
  };
  saveSandboxSession(session);
  return session;
}

export default function Version21SandboxAuth({ onAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const normalized = username.trim();
    const expectedRole = ALLOWED[normalized];
    if (!expectedRole) { setError('این حساب در فهرست کاربران مجاز محیط آزمایشی نیست.'); return; }
    if (!password) { setError('رمز عبور را وارد کنید.'); return; }
    setBusy(true);
    try {
      const data = await callSandboxAuth({ action: 'login', username: normalized, password });
      if (!data?.success || !data?.user || !data?.token) {
        const messages = {
          invalid_credentials: 'نام کاربری یا رمز عبور اشتباه است.',
          wrong_password: 'رمز عبور اشتباه است.',
          user_not_found: 'حساب کاربری پیدا نشد.',
          user_inactive: 'این حساب غیرفعال است.',
          too_many_attempts: 'تلاش‌های ناموفق زیاد است؛ بعداً دوباره امتحان کنید.',
          sandbox_access_denied: 'این حساب اجازه ورود به محیط آزمایشی را ندارد.'
        };
        throw new Error(messages[data?.error] || 'ورود انجام نشد؛ اطلاعات حساب را بررسی کنید.');
      }
      const actualUsername = String(data.user.username || '');
      if (actualUsername !== normalized || data.user.role !== expectedRole) {
        throw new Error('نقش یا شناسه این حساب با دسترسی آزمایشی تعریف‌شده مطابقت ندارد.');
      }
      const session = {
        username: normalized,
        token: data.token,
        user: data.user,
        authenticatedAt: new Date().toISOString()
      };
      saveSandboxSession(session);
      onAuthenticated(session);
    } catch (err) {
      setError(err?.message || 'ورود ناموفق بود.');
    } finally {
      setPassword('');
      setBusy(false);
    }
  };

  return <main dir="rtl" className="min-h-screen w-full flex items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl space-y-4">
      <div className="text-center">
        <div className="text-xs font-bold text-amber-700">محیط مستقل آزمایشی</div>
        <h1 className="mt-2 text-2xl font-black text-slate-800">ورود به حساب صراف</h1>
        <p className="mt-2 text-sm leading-7 text-slate-500">با نام کاربری و رمز حساب موجود وارد شوید. این محیط اطلاعات صرافی آزمایشی شما را فقط برای مشاهده می‌خواند؛ هیچ عملیات مالی در سرور ثبت نمی‌شود.</p>
      </div>
      <label className="block text-sm font-semibold text-slate-700">نام کاربری
        <input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 h-12 w-full rounded-xl border px-3 text-left" dir="ltr" required />
      </label>
      <label className="block text-sm font-semibold text-slate-700">رمز عبور
        <input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border px-3" required />
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white disabled:opacity-50">{busy ? 'در حال بررسی…' : 'ورود به محیط آزمایشی'}</button>
      <p className="text-center text-xs text-slate-400">ورود فقط برای حساب آزمایشی 33333333 فعال است.</p>
    </form>
  </main>;
}
