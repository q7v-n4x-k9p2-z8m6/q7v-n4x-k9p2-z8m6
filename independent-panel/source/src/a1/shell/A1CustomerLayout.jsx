// a1/shell/A1CustomerLayout.jsx — پوستهٔ پنل مشتری در A1
// مبنا: reference/A1-extracted-source-temp/src/components/CustomerLayout.jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  House, Wallet, Send, ClipboardList, UserCircle, MoreHorizontal, X, LogOut,
  Smartphone, Globe, Gamepad2, Landmark, Package, MessageSquare, Bell, Headphones,
  ShoppingBag, ArrowDownToLine,
} from 'lucide-react';
import { useAuth } from '@/a1/lib/demoAuth';

const CUSTOMER_TABS = [
  { to: '/customer', label: 'خانه', icon: House },
  { to: '/customer/wallet', label: 'کیف پول', icon: Wallet },
  { to: '/customer/transfer', label: 'حواله', icon: Send },
  { to: '/customer/orders', label: 'سفارش‌ها', icon: ClipboardList },
  { to: '/customer/account', label: 'حساب', icon: UserCircle },
];

// همهٔ بخش‌های پنل مشتری، هم‌ساخت با فهرست صفحه‌های سورس A1
const CUSTOMER_SECTIONS = [
  { to: '/customer/wallet', label: 'کیف پول من', icon: Wallet },
  { to: '/customer/account', label: 'حساب من با صراف', icon: Landmark },
  { to: '/customer/transfer', label: 'ارسال پول', icon: Send },
  { to: '/customer/withdraw', label: 'برداشت', icon: ArrowDownToLine },
  { to: '/customer/orders', label: 'سفارش‌ها', icon: Package },
  { to: '/customer/shop', label: 'فروشگاه', icon: ShoppingBag },
  { to: '/customer/recharge', label: 'شارژ و اینترنت', icon: Smartphone },
  { to: '/customer/afghan5', label: 'افغان۵', icon: Globe },
  { to: '/customer/games', label: 'بازی‌ها', icon: Gamepad2 },
  { to: '/customer/messages', label: 'پیام‌ها', icon: MessageSquare },
  { to: '/customer/notifications', label: 'اعلان‌ها', icon: Bell },
  { to: '/customer/support', label: 'پشتیبانی', icon: Headphones },
  { to: '/customer/profile', label: 'پروفایل', icon: UserCircle },
];

export default function A1CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const open = path => { setMenuOpen(false); navigate(path); };

  return (
    <div dir="rtl" lang="fa" className="flex min-h-screen flex-col bg-[#f3f7fc] text-slate-900 font-[Tahoma,Arial,sans-serif]">
      <header className="sticky top-0 z-30 border-b border-[#d5e2f0] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <div>
            <div className="text-[13px] font-extrabold text-[#102b4c]">حساب صراف</div>
            <div className="text-[10.5px] text-slate-500">پنل مشتری — نسخهٔ نمایشی</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">دادهٔ دمو</span>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="همهٔ امکانات مشتری"
              className="rounded-lg border border-[#d5e2f0] p-2 text-[#164b87]">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => logout()} aria-label="خروج" className="rounded-lg border border-[#d5e2f0] p-2 text-[#164b87]">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-3 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#d5e2f0] bg-white/95 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-1.5 backdrop-blur" aria-label="ناوبری مشتری">
        {CUSTOMER_TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/customer'}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-semibold ${isActive ? 'text-[#164b87]' : 'text-slate-500'}`}>
              <Icon className="h-5 w-5" />
              {tab.label}
            </NavLink>
          );
        })}
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-3" role="presentation" onClick={() => setMenuOpen(false)}>
          <section role="dialog" aria-modal="true" aria-label="همهٔ امکانات مشتری"
            className="max-h-[85dvh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={event => event.stopPropagation()}>
            <header className="flex items-center justify-between border-b border-[#eef3f7] px-4 py-3">
              <b className="text-[13px] text-[#102b4c]">همهٔ امکانات</b>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="بستن"><X className="h-4 w-4" /></button>
            </header>
            <div className="max-h-[70dvh] divide-y divide-[#eef3f7] overflow-y-auto">
              {CUSTOMER_SECTIONS.map(section => {
                const Icon = section.icon;
                const active = location.pathname === section.to;
                return (
                  <button key={section.to} type="button" onClick={() => open(section.to)}
                    className={'flex w-full items-center gap-3 px-4 py-3 text-right text-[12px] ' + (active ? 'bg-blue-50 font-bold text-[#164b87]' : 'text-slate-700')}>
                    <Icon className="h-4 w-4 shrink-0 text-[#164b87]" />
                    <span className="flex-1">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}