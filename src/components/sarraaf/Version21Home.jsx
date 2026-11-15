import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText, ClipboardList,
  Coins, FileSpreadsheet, BarChart3, Scale, MessagesSquare, ShoppingBag,
  Handshake, Receipt, Network, Settings, BookOpen, Building2, Construction,
  ArrowDownUp, FileSearch, Headphones, Calculator
} from 'lucide-react';

const SECTIONS = [
  { title: 'میز کار و تعاریف', items: [
    { label: 'مشتریان', path: '/customers', icon: Users, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'دفتر حساب مشتریان', pending: true, icon: BookOpen, roles: ['creator','admin','sarraaf'] },
    { label: 'نمایندگی‌ها', path: '/agents', icon: Building2, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر حساب نمایندگی‌ها', pending: true, icon: Construction, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'صندوق، بانک و عملیات', items: [
    { label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'بانک و چک', path: '/bank', icon: Landmark, roles: ['creator','admin','sarraaf'] },
    { label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'حواله‌ها', path: '/transfers/send', icon: Send, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'داد و گرفت', path: '/dadogereft', icon: Handshake, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'مصارف و پرداخت‌ها', pending: true, icon: Receipt, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'حسابداری و گزارش‌ها', items: [
    { label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, roles: ['creator','admin','sarraaf'] },
    { label: 'کدینگ حساب‌ها', pending: true, icon: Calculator, roles: ['creator','admin','sarraaf'] },
    { label: 'تعریف اسعار', path: '/currencies', icon: Coins, roles: ['creator','admin','sarraaf'] },
    { label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'مفاد و زیان', path: '/profit-loss', icon: BarChart3, roles: ['creator','admin','sarraaf'] },
    { label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, roles: ['creator','admin','sarraaf'] },
    { label: 'مغایرت‌گیری', path: '/reconciliation', icon: FileSearch, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'امکانات تکمیلی', items: [
    { label: 'گروه و چت صراف‌ها', path: '/chat', icon: MessagesSquare, roles: ['creator','admin','sarraaf'] },
    { label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, roles: ['creator','admin','sarraaf'] },
    { label: 'پشتیبانی', path: '/support', icon: Headphones, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'تنظیمات', path: '/settings', icon: Settings, roles: ['creator','admin','sarraaf','employee'] },
  ]},
];

export default function Version21Home() {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const name = user?.full_name || user?.username || 'کاربر';
  return (
    <div dir="rtl" className="space-y-5">
      <section className="overflow-hidden border border-[#8ca5b8] bg-gradient-to-b from-[#f8fbfd] to-[#e5edf3] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#9db1c1] bg-gradient-to-b from-[#386b91] to-[#17466c] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-white/40 bg-white/10"><Calculator className="h-5 w-5"/></span>
            <div><h1 className="text-base font-extrabold">حساب صراف · نسخه ۲۱</h1><p className="mt-1 text-[11px] text-blue-100">میز کار و مرکز دسترسی عملیات حسابداری</p></div>
          </div>
          <div className="border border-white/30 bg-white/10 px-3 py-2 text-xs">حساب فعال: {name}</div>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(section => {
            const items = section.items.filter(item => item.roles.includes(role));
            if (!items.length) return null;
            return <section key={section.title} className="border border-[#b5c4cf] bg-white/70 p-2">
              <h2 className="mb-2 border-b border-[#d2dce3] pb-2 text-xs font-bold text-[#24496d]">{section.title}</h2>
              <div className="grid grid-cols-2 gap-2">
                {items.map(item => {
                  const Icon = item.icon;
                  const tile = <><span className="grid h-10 w-10 place-items-center border border-[#a9bdcc] bg-gradient-to-b from-[#f9fcff] to-[#d8e5ef] text-[#245777]"><Icon className="h-5 w-5"/></span><span className="text-center text-[10px] font-semibold text-[#29465e]">{item.label}</span>{item.pending && <span className="text-[9px] text-amber-700">در حال اتصال</span>}</>;
                  return item.pending
                    ? <div key={item.label} aria-disabled="true" className="flex min-h-[94px] cursor-not-allowed flex-col items-center justify-center gap-1 border border-dashed border-[#c6cdd2] bg-[#f1f3f4] opacity-65">{tile}</div>
                    : <Link key={item.label} to={item.path} className="flex min-h-[94px] flex-col items-center justify-center gap-1 border border-[#c2d0da] bg-gradient-to-b from-white to-[#edf3f7] p-2 shadow-[0_1px_2px_rgba(20,50,70,.08)] transition hover:border-[#47799d] hover:bg-[#e4f0f7] focus:outline-none focus:ring-2 focus:ring-[#47799d]">{tile}</Link>;
                })}
              </div>
            </section>;
          })}
        </div>
        <footer className="flex flex-wrap justify-between gap-2 border-t border-[#b7c5cf] bg-[#dfe7ed] px-3 py-2 text-[10px] text-[#526779]">
          <span>محیط عملیاتی نسخه ۲۱</span><span>اطلاعات از حساب و دیتابیس اصلی A1 خوانده می‌شود</span><span>بخش‌های متصل‌نشده غیرفعال‌اند</span>
        </footer>
      </section>
    </div>
  );
}
