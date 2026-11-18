import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Version21SandboxHome from '@/components/sarraaf/Version21SandboxHome';
import Version21SandboxAuth, { readSandboxSession, verifySandboxSession, clearSandboxSession } from '@/components/sarraaf/Version21SandboxAuth';
import Version21SandboxCustomer from '@/components/sarraaf/Version21SandboxCustomer';
import { setSandboxTenantId } from '@/components/sarraaf/Version21SandboxAdapter';
import { setSandboxUiTenant } from '@/components/sarraaf/Version21SandboxLocalStore';
import '@/index.css';

function SandboxApp() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const existing = readSandboxSession();
    if (!existing) { setChecking(false); return; }
    verifySandboxSession(existing).then(valid => {
      if (!active) return;
      if (valid) setSession(valid);
      else clearSandboxSession();
      setChecking(false);
    }).catch(() => {
      if (!active) return;
      clearSandboxSession();
      setChecking(false);
    });
    return () => { active = false; };
  }, []);

  if (checking) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-sm text-slate-600">در حال بررسی نشست آزمایشی…</div>;
  if (!session) return <Version21SandboxAuth onAuthenticated={setSession} />;

  const tenantId = session.user?.id || session.username;
  setSandboxTenantId(tenantId, session.user?.role);
  setSandboxUiTenant(tenantId);

  const logout = () => { clearSandboxSession(); setSession(null); };
  if (session.user?.role === 'customer') {
    return <Version21SandboxCustomer user={session.user} onLogout={logout} />;
  }
  if (session.user?.role === 'sarraaf') {
    return <div className="min-h-screen bg-slate-100 p-2 sm:p-3">
      <div className="mx-auto mb-2 flex max-w-screen-2xl justify-between rounded-lg border bg-white px-3 py-2 text-xs">
        <span>حساب آزمایشی: {session.user?.full_name || session.username} — داده‌های این حساب جدا است.</span>
        <button onClick={logout} className="font-bold text-rose-700">خروج</button>
      </div>
      <Version21SandboxHome />
    </div>;
  }
  clearSandboxSession();
  return <Version21SandboxAuth onAuthenticated={setSession} />;
}

const root = document.getElementById('sandbox-root');
if (root) createRoot(root).render(<BrowserRouter><SandboxApp /></BrowserRouter>);
