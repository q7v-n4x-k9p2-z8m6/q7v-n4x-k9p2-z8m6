import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorPreviewLab from '@/components/sarraaf/CreatorPreviewLab';
import {
  readSandboxSession,
  verifySandboxSession,
  clearSandboxSession,
} from '@/components/sarraaf/Version21SandboxAuth';

export default function SandboxSarrafLabRoute() {
  const navigate = useNavigate();
  const [access, setAccess] = useState('checking');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const session = readSandboxSession();
      if (!session || session.username !== '33333333' || session.user?.role !== 'sarraaf') {
        clearSandboxSession();
        if (active) {
          setAccess('denied');
          navigate('/login', { replace: true });
        }
        return;
      }

      const verified = await verifySandboxSession(session);
      if (!active) return;

      if (!verified || verified.username !== '33333333' || verified.user?.role !== 'sarraaf') {
        clearSandboxSession();
        setAccess('denied');
        navigate('/login', { replace: true });
        return;
      }

      setAccess('granted');
    };

    verify().catch(() => {
      if (!active) return;
      clearSandboxSession();
      setAccess('denied');
      navigate('/login', { replace: true });
    });

    return () => { active = false; };
  }, [navigate]);

  if (access !== 'granted') {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-center text-sm text-slate-600">
          {access === 'checking' ? 'در حال بررسی مجوز ورود…' : 'دسترسی تأیید نشد؛ در حال بازگشت به ورود…'}
        </div>
      </main>
    );
  }

  return <CreatorPreviewLab />;
}
