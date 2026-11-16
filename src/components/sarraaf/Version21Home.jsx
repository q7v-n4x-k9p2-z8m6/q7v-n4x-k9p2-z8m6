import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Home, Users, Wallet, BookOpen, BookText, Landmark, Building2,
  ArrowLeftRight, Send, Receipt, ScrollText, ClipboardList, ListChecks,
  Coins, FileSpreadsheet, BarChart3, Scale, MessagesSquare, Bot,
  ShoppingBag, Languages
} from 'lucide-react';

// The production home uses the same module set, labels, order and groups
// as the laptop-layout preview. No demo data or database access is used here.
const MODULES = [
  { id: 'home', label: 'میز کار', icon: Home, group: 'عمومی', path: '/dashboard', roles: ['creator','admin','sarraaf','employee'] },

  { id: 'customers', label: 'تعریف مشتریان', icon: Users, group: 'تعاریف و دفاتر', path: '/customers', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', icon: BookOpen, group: 'تعاریف و دفاتر', pending: true, roles: ['creator','admin','sarraaf'] },
  { id: 'branches', label: 'تعریف نمایندگی‌ها', icon: Building2, group: 'تعاریف و دفاتر', path: '/agents', roles: ['creator','admin','sarraaf'] },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', icon: BookText, group: 'تعاریف و دفاتر', pending: true, roles: ['creator','admin','sarraaf'] },

  { id: 'cash', label: 'صندوق‌ها و موجودی', icon: Wallet, group: 'صندوق و بانک', path: '/cash', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'banks', label: 'بانک و چک', icon: Landmark, group: 'صندوق و بانک', path: '/bank', roles: ['creator','admin','sarraaf'] },

  { id: 'exchange', label: 'خرید و فروش اسعار', icon: ArrowLeftRight, group: 'عملیات صرافی', path: '/trade', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'remittance', label: 'دفتر حواله‌ها', icon: Send, group: 'عملیات صرافی', path: '/transfer-book', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', icon: Receipt, group: 'عملیات صرافی', pending: true, roles: ['creator','admin','sarraaf'] },

  { id: 'journal', label: 'دفتر روزنامچه', icon: ScrollText, group: 'حسابداری', path: '/journal', roles: ['creator','admin','sarraaf'] },
  { id: 'ledger', label: 'دفتر کل', icon: ClipboardList, group: 'حسابداری', path: '/general-ledger', roles: ['creator','admin','sarraaf'] },
  { id: 'accounts', label: 'کدینگ حساب‌ها', icon: ListChecks, group: 'حسابداری', pending: true, roles: ['creator','admin','sarraaf'] },

  { id: 'currencies', label: 'تعریف اسعار', icon: Coins, group: 'تنظیمات', path: '/currencies', roles: ['creator','admin','sarraaf'] },
  { id: 'language', label: 'زبان برنامه', icon: Languages, group: 'تنظیمات', path: '/settings', roles: ['creator','admin','sarraaf','employee'] },

  { id: 'reports', label: 'گزارش عملیات', icon: FileSpreadsheet, group: 'گزارشات', path: '/reports', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'profit', label: 'مفاد و زیان', icon: BarChart3, group: 'گزارشات', path: '/profit-loss', roles: ['creator','admin','sarraaf'] },
  { id: 'balance', label: 'بیلانس عمومی', icon: Scale, group: 'گزارشات', path: '/balance-sheet', roles: ['creator','admin','sarraaf'] },

  { id: 'sarraafGroups', label: 'گروه و چت', icon: MessagesSquare, group: 'امکانات تکمیلی', path: '/chat', roles: ['creator','admin','sarraaf'] },
  { id: 'assistant', label: 'هوش مصنوعی', icon: Bot, group: 'امکانات تکمیلی', path: '/assistant', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'products', label: 'محصولات آنلاین', icon: ShoppingBag, group: 'امکانات تکمیلی', path: '/online-products', roles: ['creator','admin','sarraaf'] },
];

const GROUP_ORDER = [
  'عمومی', 'تعاریف و دفاتر', 'صندوق و بانک', 'عملیات صرافی',
  'حسابداری', 'تنظیمات', 'گزارشات', 'امکانات تکمیلی'
];

function ModuleTile({ item }) {
  const Icon = item.icon;
  const className = 'group flex min-h-[94px] flex-col items-center justify-center gap-2 border border-[#9aabb9] bg-gradient-to-b from-white to-[#edf2f6] px-2 py-3 text-center shadow-sm transition hover:border-[#47799d] hover:from-[#f7fbff] hover:to-[#dceaf4]';
  const content = (
    <>
      <span className="grid h-11 w-11 place-items-center rounded-sm border border-[#9eb2c2] bg-gradient-to-b from-[#f9fcff] to-[#d8e5ef] text-[#245777] shadow-sm group-hover:border-[#47799d]">
        <Icon className="h-6 w-6" />
      </span>
      <b className="text-[11px] font-semibold text-[#29465e]">{item.label}</b>
      {item.pending && <span className="text-[9px] text-amber-700">در حال آماده‌سازی</span>}
    </>
  );
  if (item.pending) {
    return <div key={item.id} aria-disabled="true" title="این بخش هنوز به عملیات واقعی متصل نشده است"
      className={className + ' cursor-not-allowed border-dashed bg-[#f1f3f4] opacity-65'}>{content}</div>;
  }
  return <Link key={item.id} to={item.path} className={className}>{content}</Link>;
}

export default function Version21Home() {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const [search, setSearch] = useState('');
  const visibleGroups = useMemo(() => {
    const allowed = MODULES.filter(item =>
      Array.isArray(item.roles) && item.roles.includes(role) &&
      item.label.toLocaleLowerCase('fa').includes(search.trim().toLocaleLowerCase('fa'))
    );
    return GROUP_ORDER.map(group => ({
      group,
      items: allowed.filter(item => item.group === group)
    })).filter(section => section.items.length > 0);
  }, [role, search]);

  return (
    <main dir="rtl" className="space-y-3 text-[#253746]">
      <section className="overflow-hidden border border-[#65798b] bg-[#eef1f4] shadow-md">
        <header className="flex min-h-9 items-center justify-between gap-3 bg-gradient-to-b from-[#315f80] to-[#173f5d] px-3 py-2 text-white">
          <b className="flex items-center gap-2 text-xs"><Home className="h-4 w-4" /> میز کار حساب صراف</b>
          <span className="text-[10px] text-blue-100">پنل عملیاتی صرافی · نسخه ۲۱</span>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-400 bg-gradient-to-b from-[#fdfefe] to-[#dce4ea] px-3 py-2">
          <span className="text-xs font-bold text-[#24496d]">دسترسی به بخش‌های حساب صراف</span>
          <input value={search} onChange={event => setSearch(event.target.value)}
            placeholder="جستجوی آیکون‌ها..." aria-label="جستجوی آیکون‌ها"
            className="h-8 w-full max-w-[240px] border border-slate-300 bg-white px-2 text-xs outline-none focus:border-[#47799d]" />
        </div>
        <div className="space-y-3 bg-[#f4f6f8] p-3">
          {visibleGroups.map(section => (
            <section key={section.group} className="border border-[#b6c4cf] bg-white/80 p-2">
              <h2 className="mb-2 border-b border-[#d2dce3] pb-2 text-xs font-bold text-[#24496d]">{section.group}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {section.items.map(item => <ModuleTile key={item.id} item={item} />)}
              </div>
            </section>
          ))}
          {!visibleGroups.length && <p className="p-6 text-center text-xs text-slate-500">آیکونی با این نام پیدا نشد.</p>}
        </div>
      </section>
    </main>
  );
}
