import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText, ClipboardList,
  Coins, FileSpreadsheet, BarChart3, Scale, MessagesSquare, ShoppingBag,
  Handshake, Receipt, Network, Settings, BookOpen, Building2, Construction,
  ArrowDownUp, FileSearch, Headphones, Calculator, Plus, Pencil, Trash2,
  RefreshCw, Printer, Search, BriefcaseBusiness, BookCheck, ChartNoAxesCombined,
  CalendarDays, ShieldCheck, ClipboardCheck, Files, BadgeDollarSign, GitBranch,
  Banknote, CircleDollarSign, Landmark as TreasuryIcon, FolderKanban, Languages,
  CircleHelp, ArrowLeftRight as ExchangeIcon
} from 'lucide-react';

const OPERATION_TOOLS = [
  { label: 'جدید', icon: Plus, disabled: true },
  { label: 'ویرایش', icon: Pencil, disabled: true },
  { label: 'حذف', icon: Trash2, disabled: true },
  { label: 'تازه‌سازی', icon: RefreshCw, action: 'refresh' },
  { label: 'چاپ', icon: Printer, action: 'print' },
];

const ACCOUNTING_SHORTCUTS = [
  { label: 'طرف‌حساب‌ها', path: '/customers', icon: Users },
  { label: 'فهرست مشتریان', path: '/customers', icon: ClipboardList },
  { label: 'دفتر مشتریان', pending: true, icon: BookOpen },
  { label: 'صندوق‌ها', path: '/cash', icon: Wallet },
  { label: 'بانک‌ها', path: '/bank', icon: Landmark },
  { label: 'نمایندگی‌ها', path: '/agents', icon: Building2 },
  { label: 'حواله‌ها', path: '/transfers/send', icon: Send },
  { label: 'سرمایه‌گذاری', pending: true, icon: BriefcaseBusiness },
];

const SECTIONS = [
  { title: 'طرف‌حساب‌ها و ساختار سازمانی', items: [
    { label: 'مشتریان', path: '/customers', icon: Users, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'دفتر حساب مشتریان', pending: true, icon: BookOpen, roles: ['creator','admin','sarraaf'] },
    { label: 'نمایندگی‌ها', path: '/agents', icon: Building2, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر حساب نمایندگی‌ها', pending: true, icon: BookCheck, roles: ['creator','admin','sarraaf'] },
    { label: 'شعب داخلی', pending: true, icon: GitBranch, roles: ['creator','admin','sarraaf'] },
    { label: 'طرف‌حساب‌ها', path: '/customers', icon: Handshake, roles: ['creator','admin','sarraaf','employee'] },
  ]},
  { title: 'صندوق، بانک و عملیات', items: [
    { label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'بانک و چک', path: '/bank', icon: Landmark, roles: ['creator','admin','sarraaf'] },
    { label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'حواله‌های ارسالی و دریافتی', path: '/transfers/send', icon: Send, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'داد و گرفت', path: '/dadogereft', icon: Handshake, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'مصارف و پرداخت‌ها', pending: true, icon: Receipt, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر حواله‌ها', path: '/transfer-book', icon: ScrollText, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'تبدیل اسعار', path: '/convert', icon: ArrowDownUp, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'خزانه‌داری', pending: true, icon: TreasuryIcon, roles: ['creator','admin','sarraaf'] },
    { label: 'حساب‌های بین‌صرافی', pending: true, icon: ExchangeIcon, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'حسابداری و دفاتر', items: [
    { label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, roles: ['creator','admin','sarraaf'] },
    { label: 'ثبت سند حسابداری', path: '/journal-entry', icon: FileSpreadsheet, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, roles: ['creator','admin','sarraaf'] },
    { label: 'کدینگ حساب‌ها', pending: true, icon: Calculator, roles: ['creator','admin','sarraaf'] },
    { label: 'دفتر معین و تفصیلی', pending: true, icon: BookOpen, roles: ['creator','admin','sarraaf'] },
    { label: 'تراز آزمایشی', pending: true, icon: Scale, roles: ['creator','admin','sarraaf'] },
    { label: 'جمع بدهکاری و بستانکاری', pending: true, icon: ChartNoAxesCombined, roles: ['creator','admin','sarraaf'] },
    { label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, roles: ['creator','admin','sarraaf'] },
    { label: 'مغایرت‌گیری', path: '/reconciliation', icon: FileSearch, roles: ['creator','admin','sarraaf'] },
    { label: 'مفاد و زیان', path: '/profit-loss', icon: BarChart3, roles: ['creator','admin','sarraaf'] },
    { label: 'گردش وجوه نقد', pending: true, icon: Banknote, roles: ['creator','admin','sarraaf'] },
    { label: 'بدهکاران', path: '/debtors', icon: CircleDollarSign, roles: ['creator','admin','sarraaf'] },
    { label: 'حساب‌های دریافتنی و پرداختنی', pending: true, icon: BadgeDollarSign, roles: ['creator','admin','sarraaf'] },
    { label: 'دارایی‌های ثابت', pending: true, icon: Building2, roles: ['creator','admin','sarraaf'] },
    { label: 'بودجه‌بندی و مراکز هزینه', pending: true, icon: FolderKanban, roles: ['creator','admin','sarraaf'] },
    { label: 'دوره‌های مالی و بستن حساب‌ها', pending: true, icon: CalendarDays, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'ارز، شبکه و ارتباطات', items: [
    { label: 'تعریف اسعار', path: '/currencies', icon: Coins, roles: ['creator','admin','sarraaf'] },
    { label: 'شبکه نمایندگی‌ها', path: '/agency-network', icon: Network, roles: ['creator','admin','sarraaf'] },
    { label: 'نرخ بازار صراف‌ها', pending: true, icon: ChartNoAxesCombined, roles: ['creator','admin','sarraaf'] },
    { label: 'گروه و چت صراف‌ها', path: '/chat', icon: MessagesSquare, roles: ['creator','admin','sarraaf'] },
    { label: 'بازار صراف‌ها', path: '/sarraaf-market', icon: ShoppingBag, roles: ['creator','admin','sarraaf'] },
    { label: 'چت صراف‌ها', path: '/sarraaf-chat', icon: MessagesSquare, roles: ['creator','admin','sarraaf'] },
    { label: 'مدیریت چندشرکتی', pending: true, icon: Building2, roles: ['creator','admin','sarraaf'] },
  ]},
  { title: 'گزارش‌ها و خدمات', items: [
    { label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, roles: ['creator','admin','sarraaf'] },
    { label: 'پشتیبانی', path: '/support', icon: Headphones, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'دستیار هوشمند', path: '/assistant', icon: CircleHelp, roles: ['creator','admin','sarraaf','employee'] },
    { label: 'تنظیمات', path: '/settings', icon: Settings, roles: ['creator','admin','sarraaf','employee'] },
  ]},
  { title: 'امنیت، کنترل و اسناد', items: [
    { label: 'ردپای حسابرسی', pending: true, icon: ClipboardCheck, roles: ['creator','admin','sarraaf'] },
    { label: 'مرکز اسناد', pending: true, icon: Files, roles: ['creator','admin','sarraaf'] },
    { label: 'گردش تأییدها', pending: true, icon: ShieldCheck, roles: ['creator','admin','sarraaf'] },
    { label: 'احراز هویت و شناخت مشتری', pending: true, icon: ShieldCheck, roles: ['creator','admin','sarraaf'] },
    { label: 'کنترل‌های داخلی و تطبیق', pending: true, icon: ShieldCheck, roles: ['creator','admin','sarraaf'] },
  ]},
];

function ToolButton({ item }) {
  const Icon = item.icon;
  const onClick = item.action === 'refresh'
    ? () => window.location.reload()
    : item.action === 'print'
      ? () => window.print()
      : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={item.disabled}
      title={item.disabled ? 'پس از انتخاب یک بخش یا سند فعال می‌شود' : item.label}
      className="inline-flex min-h-9 items-center justify-center gap-1.5 border border-[#b7c8d4] bg-gradient-to-b from-white to-[#e8eff4] px-3 text-xs font-semibold text-[#294b65] hover:border-[#5b87a4] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </button>
  );
}

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
  const normalizedSearch = search.trim().toLocaleLowerCase('fa');
  const visibleSections = useMemo(() => SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.roles.includes(role) &&
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

        <div className="hidden lg:block sticky top-0 z-20 space-y-2 border-b border-[#b7c5cf] bg-[#e7eef3] p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="ml-2 text-xs font-bold text-[#24496d]">عملیات:</span>
            {OPERATION_TOOLS.map(item => <ToolButton key={item.label} item={item} />)}
            <label className="mr-auto flex min-h-9 min-w-[180px] flex-1 items-center gap-2 border border-[#b7c8d4] bg-white px-2 text-[#526779] sm:max-w-[280px]">
              <Search className="h-4 w-4 shrink-0" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="جستجوی بخش‌ها..." className="w-full bg-transparent text-xs outline-none" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="ml-2 text-xs font-bold text-[#24496d]">دسترسی سریع حسابداری:</span>
            {ACCOUNTING_SHORTCUTS.filter(item => item.roles.includes(role)).map(item => {
              const Icon = item.icon;
              return item.pending
                ? <span key={item.label} className="inline-flex min-h-8 items-center gap-1.5 border border-dashed border-[#bdc8cf] bg-[#f2f4f5] px-2.5 text-[11px] text-[#657785]" title="در حال اتصال"><Icon className="h-3.5 w-3.5" />{item.label}</span>
                : <Link key={item.label} to={item.path} className="inline-flex min-h-8 items-center gap-1.5 border border-[#b7c8d4] bg-white px-2.5 text-[11px] font-semibold text-[#294b65] hover:border-[#5b87a4]"><Icon className="h-3.5 w-3.5" />{item.label}</Link>;
            })}
          </div>
        </div>

        <div className="space-y-3 border-b border-[#b7c5cf] bg-[#e7eef3] p-3 lg:hidden">
          <div className="grid grid-cols-3 gap-2">
            {OPERATION_TOOLS.map(item => <ToolButton key={item.label} item={item} />)}
          </div>
          <label className="flex min-h-11 items-center gap-2 border border-[#b7c8d4] bg-white px-3 text-[#526779]">
            <Search className="h-4 w-4 shrink-0" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="جستجوی بخش‌ها..." className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div>
            <h2 className="mb-2 text-xs font-bold text-[#24496d]">دسترسی سریع حسابداری</h2>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNTING_SHORTCUTS.filter(item => item.roles.includes(role)).map(item => {
                const Icon = item.icon;
                const content = <><Icon className="h-4 w-4" /><span>{item.label}</span></>;
                return item.pending
                  ? <div key={item.label} className="flex min-h-11 items-center justify-center gap-2 border border-dashed border-[#bdc8cf] bg-[#f2f4f5] px-2 text-center text-xs text-[#657785]">{content}</div>
                  : <Link key={item.label} to={item.path} className="flex min-h-11 items-center justify-center gap-2 border border-[#b7c8d4] bg-white px-2 text-center text-xs font-semibold text-[#294b65]">{content}</Link>;
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
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
