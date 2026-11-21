// a1/components/RootEntry.jsx — ورود مستقیم به صفحهٔ نخست پروژه
// ریشهٔ برنامه «/» همیشه به صفحهٔ نخست واقعی می‌رسد: میز کار صراف برای کارکنان و
// پرتال مشتری برای نقش مشتری. صفحهٔ ورود (/login) و ورود آزمایشی (/login-demo) و
// پنل سازنده (/builder) مقصد دکمهٔ خانه نیستند.
// نشست نمایشی فقط محلی است: هیچ رمز، توکن یا درخواست احراز هویت ارسال نمی‌شود.
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/a1/lib/demoAuth';
import { DEMO_ACCOUNTS } from '@/a1/lib/seed';

const ENTRY_USERNAME = 'demo-admin';

// مسیر واقعی صفحهٔ نخست پروژه؛ منبع واحد مقصد خانه
export const FIRST_PAGE = '/dashboard';

export const homePageFor = (role) => (role === 'customer' ? '/customer' : FIRST_PAGE);

export default function RootEntry() {
  const { user, isLoadingAuth, signIn } = useAuth();

  useEffect(() => {
    if (isLoadingAuth || user) return;
    const account = DEMO_ACCOUNTS.find((item) => item.username === ENTRY_USERNAME);
    if (account) signIn(account);
  }, [isLoadingAuth, user, signIn]);

  if (user) return <Navigate to={homePageFor(user.role)} replace />;

  return (
    <div
      dir="rtl"
      lang="fa"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f3f7fc] text-sm text-[#24496d]"
    >
      <Loader2 className="h-6 w-6 animate-spin text-[#164b87]" />
      <p className="m-0">در حال ورود به میز کار…</p>
    </div>
  );
}