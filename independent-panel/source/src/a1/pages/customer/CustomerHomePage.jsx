// a1/pages/customer/CustomerHomePage.jsx — خانهٔ مشتری (ساختار: src/pages/customer/CustomerHome.jsx)
import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Smartphone, Globe, Gamepad2, Send, Landmark, Package, MessageSquare, Bell, UserCircle, ClipboardList, Headphones } from 'lucide-react';
import { usePortal } from '@/a1/lib/portalData';
import { displayDate } from '@/core/domain/dates';
import { PCard, PEmpty, PLoading, PError, money } from '@/a1/components/customer/PortalBits';

const SECTIONS = [
  { path: '/customer/wallet', label: 'کیف پول من', icon: Wallet },
  { path: '/customer/recharge', label: 'شارژ و اینترنت', icon: Smartphone, updating: true },
  { path: '/customer/afghan5', label: 'افغان۵', icon: Globe },
  { path: '/customer/games', label: 'بازی‌ها', icon: Gamepad2, updating: true },
  { path: '/customer/transfer', label: 'ارسال پول', icon: Send },
  { path: '/customer/account', label: 'حساب من با صراف', icon: Landmark },
  { path: '/customer/orders', label: 'سفارش‌ها', icon: Package },
  { path: '/customer/messages', label: 'پیام‌ها', icon: MessageSquare },
  { path: '/customer/shop', label: 'فروشگاه', icon: ClipboardList },
  { path: '/customer/notifications', label: 'اعلان‌ها', icon: Bell },
  { path: '/customer/support', label: 'پشتیبانی', icon: Headphones },
  { path: '/customer/profile', label: 'پروفایل', icon: UserCircle },
];

export default function CustomerHomePage() {
  const { loading, data, error } = usePortal();
  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const totalDebit = (data.balances || []).filter(item => item.balance > 0).reduce((sum, item) => sum + item.balance, 0);
  const pendingOrders = (data.orders || []).filter(item => ['pending', 'processing', 'در انتظار'].includes(item.status)).length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-l from-[#164b87] to-[#276bb2] p-4 text-white shadow-sm">
        <h1 className="text-base font-extrabold">سلام {data.customer?.name || 'مشتری'} 👋</h1>
        <p className="mt-1 text-[11px] text-white/80">پنل مشتری حساب صراف — نسخهٔ ۲۱ (دادهٔ نمایشی محلی)</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white">
          <span className="block text-[10px] opacity-90">ماندهٔ بدهکار</span>
          <b className="mt-1 block text-base tabular-nums">{money(totalDebit)}</b>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 p-3 text-white">
          <span className="block text-[10px] opacity-90">سفارش‌های فعال</span>
          <b className="mt-1 block text-base tabular-nums">{money(pendingOrders)}</b>
        </div>
      </div>

      <PCard title="امکانات">
        <div className="grid grid-cols-3 gap-2">
          {SECTIONS.map(section => {
            const Icon = section.icon;
            return (
              <Link key={section.path} to={section.path}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-[#e3edf6] bg-white p-2.5 text-center transition hover:border-[#164b87]/40 hover:bg-blue-50/40">
                <span className={'grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#276bb2] to-[#164b87] text-white ' + (section.updating ? 'opacity-60' : '')}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10.5px] font-bold leading-tight text-[#102b4c]">{section.label}</span>
                {section.updating ? <span className="text-[9px] leading-tight text-amber-600">در حال به‌روزرسانی</span> : null}
              </Link>
            );
          })}
        </div>
      </PCard>

      <PCard title="آخرین گردش حساب">
        {(data.lines || []).length ? (
          <ul className="space-y-1 text-[11px]">
            {(data.lines || []).slice(-5).reverse().map(line => (
              <li key={line.id} className="flex items-center justify-between gap-2 border-b border-[#eef3f7] py-1.5">
                <span className="min-w-0 flex-1 truncate">{line.description || line.type}</span>
                <span className="shrink-0 text-slate-400">{displayDate(line.date)}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>گردشی برای این مشتری ثبت نشده است.</PEmpty>}
      </PCard>
    </div>
  );
}