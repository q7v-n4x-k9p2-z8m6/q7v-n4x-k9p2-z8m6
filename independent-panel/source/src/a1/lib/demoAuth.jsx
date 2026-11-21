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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await seedIfEmpty();
        await ensureDemoTransactions(10);
      } catch (error) {
        if (active) setSeedError(error?.message || 'بارگذاری دادهٔ آزمایشی ناموفق بود.');
      }
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
                if (verified.user?.username !== '33333333' || verified.user?.role !== 'sarraaf' || verified.user?.status !== 'active') {
                  session = null;
                } else {
                  session = {
                    ...session,
                    id: String(verified.user.id),
                    full_name: verified.user.full_name || session.full_name,
                    role: 'sarraaf',
                    status: 'active',
                    exchange_code: verified.exchange?.exchange_code || session.exchange_code,
                  };
                }
              } catch (verifyError) {
                // هنگام قطعی شبکه، نشست محلیِ همین پیش‌نمایش حفظ می‌شود؛ پاسخ رد/انقضا نشست را پاک می‌کند.
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
            // نشست‌های قدیمی مشتری فاقد اتصال پرونده بودند؛ اتصال از حساب نمایشی تکمیل می‌شود.
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
          if (session) setUser(session);
        }
      } catch { /* نشست محلی نامعتبر است */ }
      if (active) setIsLoadingAuth(false);
    })();
    return () => { active = false; };
  }, []);

  const signIn = useCallback((account) => {
    try { localStorage.removeItem(SANDBOX_TOKEN_KEY); } catch { /* storage optional */ }
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