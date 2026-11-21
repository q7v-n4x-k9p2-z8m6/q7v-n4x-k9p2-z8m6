// a1/pages/A1Login.jsx — صفحهٔ ورود نمایشی
// چیدمان و لحن صفحهٔ ورود A1 (src/pages/Login.jsx) حفظ شده است، اما ورود کاملاً محلی است:
// انتخاب مستقیم نقش (سازنده، مدیر صرافی، صراف، کارمند، مشتری) بدون رمز، ایمیل، پیامک، کد تأیید یا توکن.
import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck, Store, Coins, Briefcase, UserCircle, ChevronLeft } from 'lucide-react';
import { useAuth, HOME_BY_ROLE } from '@/a1/lib/demoAuth';

// هر نقش یک نشست آزمایشی مستقل دارد؛ نام کاربری فقط برای یافتن حساب محلی است و از کاربر پرسیده نمی‌شود.
const DEMO_ROLES = [
  { id: 'creator', username: 'demo-creator', title: 'سازنده', subtitle: 'پنل سازنده و تنظیمات اصلی', icon: ShieldCheck },
  { id: 'admin', username: 'demo-admin', title: 'مدیر صرافی', subtitle: 'میز کار صرافی با دسترسی کامل', icon: Store },
  { id: 'sarraaf', username: 'demo-sarraaf', title: 'صراف', subtitle: 'میز کار و عملیات صرافی', icon: Coins },
  { id: 'employee', username: 'demo-employee', title: 'کارمند', subtitle: 'میز کار با مجوزهای کارمند', icon: Briefcase },
  { id: 'customer', username: 'demo-customer', title: 'مشتری', subtitle: 'پنل مشتری', icon: UserCircle },
];

export default function A1Login() {
  const { accounts, signIn, isAuthenticated, isLoadingAuth, user, seedError } = useAuth();
  const [pending, setPending] = useState('');
  const navigate = useNavigate();

  if (!isLoadingAuth && isAuthenticated && user) {
    return <Navigate to={HOME_BY_ROLE[user.role] || '/dashboard'} replace />;
  }

  const enter = (account) => {
    if (!account) return;
    setPending(account.username);
    signIn(account);
    navigate(HOME_BY_ROLE[account.role] || '/dashboard', { replace: true });
  };

  const handleLogin = (role) => enter(accounts.find((item) => item.username === role.username));
  const customerAccounts = accounts.filter((item) => item.role === 'customer');

  return (
    <main dir="rtl" lang="fa" className="a1-login">
      <style>{`
        .a1-login {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(38, 91, 91, .26), transparent 44%),
            linear-gradient(145deg, #0b1420 0%, #101b29 52%, #0b111b 100%);
          color: #eef3f5;
          font-family: Tahoma, Arial, sans-serif;
        }
        .a1-login__shell { width: 100%; max-width: 430px; animation: a1-enter .45s ease both; }
        @keyframes a1-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .a1-eyebrow {
          display: inline-flex; margin: 0 auto 14px; padding: 6px 13px;
          border: 1px solid rgba(198, 166, 93, .26); border-radius: 999px;
          background: rgba(198, 166, 93, .07); color: #d8c18b; font-size: 11px; letter-spacing: .3px;
        }
        .a1-title { margin: 0 0 6px; color: #f3e6c3; font-size: clamp(21px, 5vw, 25px); line-height: 1.5; font-weight: 800; }
        .a1-sub { margin: 0 0 18px; color: #a9bccb; font-size: 12.5px; line-height: 2; }
        .a1-card {
          border: 1px solid rgba(255, 255, 255, .1); border-radius: 20px;
          background: rgba(15, 26, 39, .78); padding: 16px; box-shadow: 0 22px 60px rgba(0, 0, 0, .32);
        }
        .a1-card__head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px; color: #8fa4b6; font-size: 11px; font-weight: 700;
        }
        .a1-roles { display: grid; gap: 8px; }
        .a1-role {
          display: flex; width: 100%; align-items: center; gap: 11px;
          padding: 11px 13px; border-radius: 14px; cursor: pointer;
          border: 1px solid rgba(255, 255, 255, .1); background: rgba(255, 255, 255, .04);
          color: #eef3f5; font-family: inherit; text-align: right;
          transition: border-color .18s, background .18s, transform .18s;
        }
        .a1-role:hover:not(:disabled) { border-color: rgba(198, 166, 93, .5); background: rgba(198, 166, 93, .08); transform: translateX(-2px); }
        .a1-role:disabled { cursor: progress; opacity: .7; }
        .a1-role__icon {
          display: grid; place-items: center; flex: 0 0 auto;
          width: 36px; height: 36px; border-radius: 11px;
          background: rgba(198, 166, 93, .12); color: #dcc48c;
          border: 1px solid rgba(198, 166, 93, .22);
        }
        .a1-role__body { min-width: 0; flex: 1; }
        .a1-role__body b { display: block; font-size: 13px; }
        .a1-role__body small { display: block; margin-top: 4px; color: #8fa4b6; font-size: 11px; }
        .a1-role__go { flex: 0 0 auto; color: #8fa4b6; }
        .a1-note {
          margin-top: 14px; border-radius: 14px; border: 1px dashed rgba(198, 166, 93, .32);
          padding: 11px 13px; color: #cbb887; font-size: 11px; line-height: 2;
        }
        @keyframes a1-spin { to { transform: rotate(360deg); } }
      `}</style>

      <section className="a1-login__shell">
        <div style={{ textAlign: 'center' }}>
          <span className="a1-eyebrow">نسخهٔ نمایشی محلی — بدون احراز هویت</span>
          <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10 }}>
            <div style={{
              width: 62, height: 62, display: 'grid', placeItems: 'center', borderRadius: '50%',
              background: 'radial-gradient(circle at 34% 28%, #f0dc9e, #c6a65d 58%, #8f7434)',
              color: '#1b2a38', fontWeight: 800, fontSize: 22,
              boxShadow: '0 10px 26px rgba(198, 166, 93, .22)',
            }}>ص</div>
          </div>
          <h1 className="a1-title">حساب صراف</h1>
          <p className="a1-sub">برای ورود آزمایشی یکی از نقش‌ها را انتخاب کنید؛ بدون نام کاربری، رمز، ایمیل یا کد تأیید.</p>
        </div>

        <div className="a1-card">
          <div className="a1-card__head">
            <span>انتخاب نقش</span>
            <span>{DEMO_ROLES.length} نقش</span>
          </div>

          <div className="a1-roles">
            {DEMO_ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  className="a1-role"
                  onClick={() => handleLogin(role)}
                  disabled={Boolean(pending)}
                  aria-label={`ورود آزمایشی به نقش ${role.title}`}
                >
                  <span className="a1-role__icon"><Icon style={{ width: 18, height: 18 }} /></span>
                  <span className="a1-role__body">
                    <b>{role.title}</b>
                    <small>{role.subtitle}</small>
                  </span>
                  {pending === role.username
                    ? <Loader2 style={{ width: 16, height: 16, animation: 'a1-spin 1s linear infinite', color: '#dcc48c' }} />
                    : <ChevronLeft className="a1-role__go" style={{ width: 16, height: 16 }} />}
                </button>
              );
            })}
          </div>

          {customerAccounts.length > 0 && (
            <div style={{ marginTop: 12, borderTop: '1px dashed rgba(255,255,255,.12)', paddingTop: 10 }}>
              <div className="a1-card__head" style={{ marginBottom: 8 }}>
                <span>حساب‌های مشتری نمایشی</span>
                <span>هر حساب فقط پروندهٔ خودش</span>
              </div>
              <div className="a1-roles">
                {customerAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    className="a1-role"
                    onClick={() => enter(account)}
                    disabled={Boolean(pending)}
                    aria-label={`ورود نمایشی به پروندهٔ ${account.customer_name || account.full_name}`}
                  >
                    <span className="a1-role__icon"><UserCircle style={{ width: 18, height: 18 }} /></span>
                    <span className="a1-role__body">
                      <b>{account.customer_name || account.full_name}</b>
                      <small>{account.customer_mobile} · پروندهٔ مستقل</small>
                    </span>
                    {pending === account.username
                      ? <Loader2 style={{ width: 16, height: 16, animation: 'a1-spin 1s linear infinite', color: '#dcc48c' }} />
                      : <ChevronLeft className="a1-role__go" style={{ width: 16, height: 16 }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="a1-note">
            این حالت فقط برای بررسی ساختار است: هیچ حساب واقعی ساخته نمی‌شود، اطلاعات هویتی درخواست نمی‌شود و داده‌ها تنها در مرورگر همین دستگاه (IndexedDB) می‌مانند. احراز هویت واقعی برای مرحلهٔ بعد حفظ شده است.
          </div>

          {seedError ? (
            <p style={{ marginTop: 10, color: '#fca5a5', fontSize: 11.5, lineHeight: 2 }}>
              آماده‌سازی دادهٔ آزمایشی ناموفق بود: {seedError}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}