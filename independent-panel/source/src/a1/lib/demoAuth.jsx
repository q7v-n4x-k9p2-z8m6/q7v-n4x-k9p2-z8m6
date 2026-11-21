// a1/lib/demoAuth.jsx — نشست نمایشی A1
// قرارداد AuthContext سورس A1 حفظ شده است (user, isAuthenticated, isLoadingAuth, logout)
// اما هویت و نشست فقط محلی است: هیچ رمز، OTP، JWT یا درخواست احراز هویت ارسال نمی‌شود.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { seedIfEmpty, ensureDemoTransactions, DEMO_ACCOUNTS } from '@/a1/lib/seed';
import { SANDBOX_TOKEN_KEY, sandboxVerify } from '@/a1/lib/sandboxAuth';

const SESSION_KEY = 'a1_demo_session';
const AuthContext = createContext(null);

export const DemoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [seedError, setSeedError] = useState('');
  const authRevisionRef = React.useRef(0);

  useEffect(() => {
    let active = true;
    const authRevision = authRevisionRef.current;

    // آماده‌سازی داده‌های محلی در پس‌زمینه انجام می‌شود و نباید ورود/مسیر پنل را متوقف کند.
    (async () => {
      try {
        await seedIfEmpty();
        await ensureDemoTransactions(10);
      } catch (error) {
        if (active) setSeedError(error?.message || 'بارگذاری دادهٔ آزمایشی ناموفق بود.');
      }
    })();

    // ابتدا فقط نشست را بازیابی و اعتبارسنجی می‌کنیم؛ آماده‌سازی داده‌های نمایشی مستقل است.
    (async () => {
      const revisionAtStart = authRevision;
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw && active) {
          let session = JSON.parse(raw);
          if (session?.is_sandbox_session) {
            const token = localStorage.getItem(SANDBOX_TOKEN_KEY);
            if (!token) {
              session = null;
            } else {
              try {
                const verified = await sandboxVerify(token);
                if (authRevisionRef.current !== revisionAtStart) return;
                if (verified.user?.username !== '33333333' || verified.user?.role !== 'sarraaf' || verified.user?.status !== 'active') {
                  session = null;
                } else {
                  session = {
                    ...session,
                    id: String(verified.user.id),
                    full_name: verified.user.full_name || session.full_name,
                    role: 'sarraaf',
                    status: 'active',
                    // نشست پیش‌نمایش عمداً به داده‌های محلی DEMO-EX متصل است؛
                    // کد صرافی واقعی فقط در سمت سرور برای احراز هویت بررسی می‌شود.
                    exchange_code: 'DEMO-EX',
                  };
                }
              } catch (verifyError) {
                if (verifyError?.code !== 'network_error') session = null;
              }
            }
            if (!session) {
              localStorage.removeItem(SESSION_KEY);
              localStorage.removeItem(SANDBOX_TOKEN_KEY);
            } else {
              localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
          } else {
            const account = DEMO_ACCOUNTS.find(item => item.username === session?.username);
            if (session?.role === 'customer' && account?.customer_mobile) {
              session = {
                ...session,
                customer_mobile: session.customer_mobile || account.customer_mobile,
                customer_name: session.customer_name || account.customer_name,
              };
              localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
          }
          if (active && authRevisionRef.current === revisionAtStart && session) setUser(session);
        }
      } catch { /* نشست محلی نامعتبر است */ }
      finally {
        if (active && authRevisionRef.current === revisionAtStart) setIsLoadingAuth(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const signIn = useCallback((account) => {
    try { localStorage.removeItem(SANDBOX_TOKEN_KEY); } catch { /* storage optional */ }
    authRevisionRef.current += 1;
    const session = {
      id: account.username,
      username: account.username,
      full_name: account.full_name || account.username,
      role: account.role,
      customer_mobile: account.customer_mobile || null,
      customer_name: account.customer_name || null,
      exchange_code: 'DEMO-EX',
      is_demo_session: true,
    };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* storage optional */ }
    setUser(session);
    return session;
  }, []);

  const signInSandbox = useCallback((session, token) => {
    authRevisionRef.current += 1;
    try {
      localStorage.setItem(SANDBOX_TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      throw new Error('ذخیرهٔ نشست ورود در این مرورگر ممکن نشد.');
    }
    setUser(session);
    return session;
  }, []);

  const logout = useCallback((shouldRedirect = true) => {
    authRevisionRef.current += 1;
    try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(SANDBOX_TOKEN_KEY); } catch { /* storage optional */ }
    setUser(null);
    if (shouldRedirect) window.location.replace('/login');
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoadingAuth,
    seedError,
    accounts: DEMO_ACCOUNTS,
    signIn,
    signInSandbox,
    logout,
    navigateToLogin: () => window.location.replace('/login'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within DemoAuthProvider');
  return context;
};

export const HOME_BY_ROLE = {
  creator: '/builder',
  admin: '/dashboard',
  sarraaf: '/exchanger',
  employee: '/dashboard',
  customer: '/customer',
  user: '/',
};