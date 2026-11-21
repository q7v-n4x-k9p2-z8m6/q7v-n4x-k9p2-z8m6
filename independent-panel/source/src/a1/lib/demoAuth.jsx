// a1/lib/demoAuth.jsx — نشست نمایشی A1
// قرارداد AuthContext سورس A1 حفظ شده است (user, isAuthenticated, isLoadingAuth, logout)
// اما هویت و نشست فقط محلی است: هیچ رمز، OTP، JWT یا درخواست احراز هویت ارسال نمی‌شود.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { seedIfEmpty, ensureDemoTransactions, DEMO_ACCOUNTS } from '@/a1/lib/seed';

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
          // نشست‌های قدیمی مشتری فاقد اتصال پرونده بودند؛ اتصال از حساب نمایشی تکمیل می‌شود.
          const stored = JSON.parse(raw);
          const account = DEMO_ACCOUNTS.find(item => item.username === stored?.username);
          const session = stored?.role === 'customer' && account?.customer_mobile
            ? {
              ...stored,
              customer_mobile: stored.customer_mobile || account.customer_mobile,
              customer_name: stored.customer_name || account.customer_name,
            }
            : stored;
          if (session !== stored) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          setUser(session);
        }
      } catch { /* نشست محلی نامعتبر است */ }
      if (active) setIsLoadingAuth(false);
    })();
    return () => { active = false; };
  }, []);

  const signIn = useCallback((account) => {
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

  const logout = useCallback((shouldRedirect = true) => {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* storage optional */ }
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