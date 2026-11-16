import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText, ClipboardList, BookText, ListChecks, Bot, Languages,
  Coins, FileSpreadsheet, BarChart3, Scale, MessagesSquare, ShoppingBag,
  Handshake, Receipt, Network, Settings, BookOpen, Building2, Construction,
  ArrowDownUp, FileSearch, Headphones, Calculator, Plus, Pencil, Trash2,
  RefreshCw, Printer, Search, BriefcaseBusiness, BookCheck, ChartNoAxesCombined,
  CalendarDays, ShieldCheck, ClipboardCheck, Files, BadgeDollarSign, GitBranch,
  Banknote, CircleDollarSign, Landmark as TreasuryIcon, FolderKanban,
  CircleHelp, ArrowLeftRight as ExchangeIcon, ChevronDown
} from 'lucide-react';

const SECTIONS = [
  { title: 'تعاریف و دفاتر', items: [
    { label: 'تعریف مشتریان', path: '/customers', icon: Users, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'دفتر حساب مشتریان', pending: true, icon: BookOpen, roles: ['creator','admin','sarraaf'] },
    { label: 'تعریف نمایندگی‌ها', path: '/agents', icon: Building2, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر حساب نمایندگی‌ها', pending: true, icon: BookText, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'صندوق و بانک', items: [
    { label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'بانک و چک', path: '/bank', icon: Landmark, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'عملیات صرافی', items: [
    { label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'دفتر حواله‌ها', path: '/transfer-book', icon: Send, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'مصارف و پرداخت‌ها', pending: true, icon: Receipt, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'حسابداری و گزارشات', items: [
    { label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, roles: ['creator','admin','sarraaf'] },
    { label: 'کدینگ حساب‌ها', pending: true, icon: ListChecks, roles: ['creator','admin','sarraaf'] },
    { label: 'تعریف اسعار', path: '/currencies', icon: Coins, roles: ['creator','admin','sarraaf'] },
    { label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'مفاد و زیان', path: '/profit-loss', icon: BarChart3, roles: ['creator','admin','sarraaf'] },
    { label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'امکانات تکمیلی · اسکلت اولیه', items: [
    { label: 'گروه و چت', path: '/chat', icon: MessagesSquare, roles: ['creator','admin','sarraaf'] },
    { label: 'هوش مصنوعی', path: '/assistant', icon: Bot, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'تنظیمات', items: [
    { label: 'زبان برنامه', pending: true, icon: Languages, roles: ['creator','admin','sarraaf','employee'] },
  ]},
];

const NAV_MENUS = [
  { label: 'فایل', items: [
    { label: 'پشتیبان‌گیری', path: '/backup' },
    { label: 'بازیابی پشتیبان', path: '/backup' },
    { label: 'چاپ صفحه', action: 'print' },
  ]},
  { label: 'تعاریف', items: [
    { label: 'مشتریان', path: '/customers' },
    { label: 'نمایندگی‌ها', path: '/agents' },
    { label: 'صندوق‌ها', path: '/cash' },
    { label: 'بانک و چک', path: '/bank' },
    { label: 'اسعار', path: '/currencies' },
    { label: 'کدینگ حساب‌ها', path: '/enterprise/accounts' },
  ]},
  { label: 'عملیات', items: [
    { label: 'دخل و خرج صندوق', path: '/cash' },
    { label: 'خرید و فروش اسعار', path: '/trade' },
    { label: 'دفتر حواله‌ها', path: '/transfer-book' },
    { label: 'مصارف و پرداخت‌ها', path: '/enterprise/expenses' },
  ]},
  { label: 'حسابات', items: [
    { label: 'دفتر روزنامچه', path: '/journal' },
    { label: 'دفتر کل', path: '/general-ledger' },
    { label: 'دفتر حساب مشتریان', path: '/dadogereft' },
    { label: 'دفتر حساب نمایندگی‌ها', path: '/agency-network' },
  ]},
  { label: 'گزارشات', items: [
    { label: 'گزارش عملیات', path: '/reports' },
    { label: 'مفاد و زیان', path: '/profit-loss' },
    { label: 'بیلانس عمومی', path: '/balance-sheet' },
  ]},
  { label: 'تنظیمات', items: [
    { label: 'تنظیمات برنامه', path: '/settings' },
    { label: 'زبان برنامه', path: '/settings' },
    { label: 'پشتیبانی', path: '/support' },
  ]},
  { label: 'امکانات تکمیلی', items: [
    { label: 'گروه و چت', path: '/chat' },
    { label: 'هوش مصنوعی', path: '/assistant' },
    { label: 'محصولات آنلاین', path: '/online-products' },
  ]},
];

function Shortcut({ item }) {
  const Icon = item.icon;
  const body = (
    <>
      <span className="grid h-10 w-10 place-items-center border border-[#a9bdcc] bg-gradient-to-b from-[#f9fcff] to-[#d8e5ef] text-[#245777]">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-center text-[11px] font-semibold text-[#29465e]">{item.label}</span>
      {item.pending && <span className="text-[10px] text-amber-700">در حال اتصال</span>}
    </>
  );
  const className = 'flex min-h-[98px] flex-col items-center justify-center gap-1.5 border border-[#c2d0da] bg-gradient-to-b from-white to-[#edf3f7] p-2 text-center shadow-[0_1px_2px_rgba(20,50,70,.08)]';
  return item.pending
    ? <div key={item.label} aria-disabled="true" className={className + ' cursor-not-allowed border-dashed bg-[#f1f3f4] opacity-65'}>{body}</div>
    : <Link key={item.label} to={item.path} className={className + ' transition hover:border-[#47799d] hover:bg-[#e4f0f7] focus:outline-none focus:ring-2 focus:ring-[#47799d]'}>{body}</Link>;
}

export default function Version21Home() {
  const { user } = useAuth();
  const role = user?.role || 'user';
  const name = user?.full_name || user?.username || 'کاربر';
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState('');
  const normalizedSearch = search.trim().toLocaleLowerCase('fa');
  const visibleSections = useMemo(() => SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      Array.isArray(item.roles) && item.roles.includes(role) &&
      (!normalizedSearch || item.label.toLocaleLowerCase('fa').includes(normalizedSearch))
    ),
  })).filter(section => section.items.length), [role, normalizedSearch]);

  return (
    <main dir="rtl" className="space-y-4">
      <section className="overflow-hidden border border-[#8ca5b8] bg-gradient-to-b from-[#f8fbfd] to-[#e5edf3] shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#9db1c1] bg-gradient-to-b from-[#386b91] to-[#17466c] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-white/40 bg-white/10"><Calculator className="h-5 w-5" /></span>
            <div>
              <h1 className="text-base font-extrabold">حساب صراف · نسخه ۲۱</h1>
              <p className="mt-1 text-[11px] text-blue-100">میز کار یکپارچه حسابداری و مدیریت مالی</p>
            </div>
          </div>
          <div className="border border-white/30 bg-white/10 px-3 py-2 text-xs">حساب فعال: {name}</div>
        </header>

        <nav className="relative z-30 flex flex-wrap items-center gap-0.5 border-b border-[#b7c5cf] bg-gradient-to-b from-white to-[#dce5eb] px-2 py-1">
          {NAV_MENUS.map(menu => (
            <div key={menu.label} className="relative">
              <button type="button" onClick={() => setOpenMenu(openMenu === menu.label ? '' : menu.label)} className={'flex items-center gap-1 px-3 py-2 text-xs text-[#294b65] hover:bg-white ' + (openMenu === menu.label ? 'bg-white font-bold text-blue-900' : '')}>
                {menu.label}<ChevronDown className="h-3 w-3" />
              </button>
              {openMenu === menu.label && (
                <div className="absolute right-0 top-full z-50 min-w-[190px] border border-[#9aabb9] bg-white py-1 shadow-xl">
                  {menu.items.map(item => item.action === 'print' ? (
                    <button key={item.label} type="button" onClick={() => { setOpenMenu(''); window.print(); }} className="block w-full px-3 py-2 text-right text-xs text-[#294b65] hover:bg-blue-50">{item.label}</button>
                  ) : (
                    <Link key={item.label} to={item.path} onClick={() => setOpenMenu('')} className="block px-3 py-2 text-xs text-[#294b65] hover:bg-blue-50">{item.label}</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="border-b border-[#b7c5cf] bg-[#e7eef3] p-3">
          <label className="mx-auto flex min-h-9 max-w-[360px] items-center gap-2 border border-[#b7c8d4] bg-white px-3 text-[#526779]">
            <Search className="h-4 w-4 shrink-0" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="جستجوی بخش‌ها..." className="w-full bg-transparent text-xs outline-none" />
          </label>
        </div>



        <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-2">
          {visibleSections.map(section => (
            <section key={section.title} className="border border-[#b5c4cf] bg-white/75 p-2">
              <h2 className="mb-2 border-b border-[#d2dce3] pb-2 text-xs font-bold text-[#24496d]">{section.title}</h2>
              <div className="grid grid-cols-2 gap-2">{section.items.map(item => <Shortcut key={item.label} item={item} />)}</div>
            </section>
          ))}
          {!visibleSections.length && <p className="col-span-full p-6 text-center text-sm text-slate-500">بخشی با این نام پیدا نشد.</p>}
        </div>

        <section className="mx-3 mb-3 border border-[#b5c4cf] bg-white/80 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-[#24496d]">ساختار جمع بدهکاری و بستانکاری</h2>
            <span className="text-[10px] text-amber-700">نمای ساختاری؛ هنوز به دفاتر مالی متصل نیست</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-xs">
              <thead><tr className="bg-[#e7eef3] text-[#294b65]"><th className="border border-[#c7d3dc] p-2 text-right">ارز</th><th className="border border-[#c7d3dc] p-2">مجموع بدهکار</th><th className="border border-[#c7d3dc] p-2">مجموع بستانکار</th></tr></thead>
              <tbody>
                <tr><td className="border border-[#d4dde4] p-2 font-semibold">دلار (USD)</td><td className="border border-[#d4dde4] p-2 text-center">—</td><td className="border border-[#d4dde4] p-2 text-center">—</td></tr>
                <tr><td className="border border-[#d4dde4] p-2 font-semibold">افغانی (AFN)</td><td className="border border-[#d4dde4] p-2 text-center">—</td><td className="border border-[#d4dde4] p-2 text-center">—</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">جمع هر ارز جداگانه محاسبه می‌شود؛ ارزهای متفاوت با یکدیگر جمع نمی‌شوند.</p>
        </section>

        <footer className="flex flex-wrap justify-between gap-2 border-t border-[#b7c5cf] bg-[#dfe7ed] px-3 py-2 text-[10px] text-[#526779]">
          <span>محیط کاری نسخه ۲۱</span>
          <span>یک منطق و یک مجموعه داده برای موبایل و لپ‌تاپ</span>
          <span>ماژول‌های متصل‌نشده غیرفعال‌اند</span>
        </footer>
      </section>
    </main>
  );
}
