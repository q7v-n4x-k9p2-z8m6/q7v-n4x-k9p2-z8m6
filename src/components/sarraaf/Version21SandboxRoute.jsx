import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Version21SandboxHome from './Version21SandboxHome';
import {
  readSandboxSession,
  verifySandboxSession,
  clearSandboxSession
} from './Version21SandboxAuth';
import { setSandboxTenantId } from './Version21SandboxAdapter';
import { setSandboxUiTenant } from './Version21SandboxLocalStore';

export default function Version21SandboxRoute() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const existing = readSandboxSession();
    if (!existing) {
      setChecking(false);
      return () => { active = false; };
    }
    verifySandboxSession(existing).then(valid => {
      if (!active) return;
      if (
        valid &&
        String(valid.username) === '33333333' &&
        valid.user?.role === 'sarraaf' &&
        valid.user?.status === 'active'
      ) {
        setSandboxTenantId(valid.user.id || valid.username, valid.user.role);
        setSandboxUiTenant(valid.user.id || valid.username);
        setSession(valid);
      } else {
        clearSandboxSession();
      }
      setChecking(false);
    }).catch(() => {
      if (!active) return;
      clearSandboxSession();
      setChecking(false);
    });
    return () => { active = false; };
  }, []);

  const logout = () => {
    clearSandboxSession();
    setSession(null);
    navigate('/login', { replace: true });
  };

  if (checking) {
    return <div dir="rtl" className="min-h-screen flex items-center justify-center text-sm text-slate-600">در حال بررسی دسترسی آزمایشی…</div>;
  }
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-100 p-2 sm:p-3">
      <div className="mx-auto mb-2 flex max-w-screen-2xl justify-between rounded-lg border bg-white px-3 py-2 text-xs">
        <span>حساب آزمایشی: {session.user?.full_name || session.username} — اطلاعات این محیط جدا از داده‌های واقعی است.</span>
        <button onClick={logout} className="font-bold text-rose-700">خروج</button>
      </div>
      <Version21SandboxHome />
    </div>
  );
}
