import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Globe, ShoppingCart, Bot, Users, BookText, CreditCard, ArrowLeftRight,
  Wallet, Send, Landmark, User, BookOpen, Building2, Receipt, ClipboardList,
  FileText, BarChart3, Settings, Languages, PlusCircle, MinusCircle, Printer,
  Save, Pencil, Trash2, CalendarDays, Banknote, ShieldCheck,
} from 'lucide-react';

const MENUS = [
  { label: 'فایل', paths: ['/'] },
  { label: 'تعریف', paths: ['/customers', '/agents'] },
  { label: 'عملیات', paths: ['/trade', '/dadogereft', '/cash', '/transfer-book'] },
  { label: 'حسابات', paths: ['/journal', '/general-ledger'] },
  { label: 'گزارشات', paths: ['/reports', '/profit-loss', '/balance-sheet'] },
  { label: 'تنظیمات', paths: ['/settings'] },
  { label: 'امکانات تکمیلی', paths: ['/online-products', '/sarraaf-chat', '/assistant'] },
];

const TOOLBAR = [
  [Home, 'میزکار', '/'],
  [Globe, 'زبان برنامه', null],
  [ShoppingCart, 'محصولات آنلاین', '/online-products'],
  [Bot, 'هوش مصنوعی', '/assistant'],
  [Users, 'گروه و چت', '/sarraaf-chat'],
  [BookText, 'دفتر روزنامه', '/journal'],
  [CreditCard, 'مصارف و پرداخت‌ها', '/receipt'],
  [ArrowLeftRight, 'خرید و فروش اسعار', '/trade'],
  [Wallet, 'صندوق‌ها و موجودی', '/cash'],
  [Send, 'دفتر حواله‌ها', '/transfer-book'],
  [Landmark, 'بانک و چک چک', '/bank'],
  [Building2, 'دفتر حساب نمایندگی‌ها', '/agents'],
  [User, 'تعریف مشتریان', '/customers'],
  [BookOpen, 'دفتر حساب مشتریان', '/customers'],
];

const PANELS = [
  { title: 'تعاریف و دفاتر', items: [[Users, 'تعریف مشتریان', '/customers'], [BookOpen, 'دفتر حساب مشتریان', '/customers'], [Building2, 'دفتر حساب نمایندگی‌ها', '/agents']] },
  { title: 'صندوق و بانک', items: [[Wallet, 'صندوق‌ها و موجودی', '/cash'], [Landmark, 'بانک و چک چک', '/bank'], [Send, 'دفتر حواله‌ها', '/transfer-book']] },
  { title: 'عملیات صرافی', items: [[ArrowLeftRight, 'خرید و فروش اسعار', '/trade'], [Receipt, 'مصارف و پرداخت‌ها', '/receipt'], [Banknote, 'عملیات صندوق', '/cash']] },
  { title: 'حسابداری و گزارشات', items: [[BookText, 'دفتر روزنامه', '/journal'], [ClipboardList, 'دفتر کل', '/general-ledger'], [FileText, 'دفتر متفرقه', null]] },
  { title: 'امکانات تکمیلی', items: [[ShoppingCart, 'محصولات آنلاین', '/online-products'], [Users, 'گروه و چت', '/sarraaf-chat'], [Bot, 'هوش مصنوعی', '/assistant']] },
  { title: 'تنظیمات', items: [[Settings, 'تنظیمات برنامه', '/settings'], [Languages, 'زبان برنامه', null], [ShieldCheck, 'مدیریت دسترسی', null]] },
];

const QUICK = [
  [PlusCircle, 'ثبت دخل صندوق', '/cash'],
  [MinusCircle, 'ثبت خرج صندوق', '/cash'],
  [Send, 'حواله ارسالی', '/transfers/send'],
  [Send, 'حواله دریافتی', '/transfers/receive'],
  [ArrowLeftRight, 'معامله اسعار', '/trade'],
];

const number = value => new Intl.NumberFormat('fa-IR').format(Number(value) || 0);

function DashboardTile({ icon: Icon, label, path, byPath, compact = false }) {
  const link = path === '/' ? true : Boolean(path && byPath.has(path));
  const className = `flex min-w-0 flex-col items-center justify-center gap-1.5 border border-[#cad8ee] bg-[#f7f9fd] px-1 text-center font-bold text-[#14213d] transition ${compact ? 'h-[78px] text-[12px]' : 'h-[96px] text-[13px]'} ${link ? 'hover:border-blue-400 hover:bg-blue-50' : 'cursor-not-allowed opacity-50'}`;
  const contents = <><Icon className={compact ? 'h-5 w-5 shrink-0 text-[#1f4e9f]' : 'h-6 w-6 shrink-0 text-[#1f4e9f]'} /><span className="leading-5">{label}</span></>;
  return link ? <Link to={path} className={className}>{contents}</Link> : <div className={className} aria-disabled="true" title="این گزینه هنوز فعال نیست">{contents}</div>;
}

function MenuEntry({ path, byPath }) {
  const link = path === '/' || byPath.has(path);
  const label = path === '/' ? 'میزکار' : byPath.get(path)?.label || path;
  return link
    ? <Link to={path} className="block rounded px-3 py-2 text-right text-xs text-slate-700 hover:bg-blue-50">{label}</Link>
    : <span aria-disabled="true" className="block cursor-not-allowed rounded px-3 py-2 text-right text-xs text-slate-400">{label} — غیرفعال</span>;
}

export default function DesktopDashboard({
  txs, txLoading, customers, custLoading, treasuryBalances, treasuryLoading,
  bankBalances, bankLoading, links = [], desktopRequestedOnPhone = false,
}) {
  const byPath = new Map(links.map(link => [link.path, link]));
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (txs || []).filter(tx => tx.date === today).length;
  const cashCount = treasuryLoading ? '…' : number((treasuryBalances || []).length);
  const customerCount = custLoading ? '…' : number((customers || []).length);
  const operationCount = txLoading ? '…' : number(todayCount);
  const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date());

  return (
    <div dir="rtl" data-dashboard-layout="pdf-desktop" className="w-full min-w-0 max-w-full space-y-3 overflow-x-hidden rounded-xl bg-[#e9eff8] p-2 text-[#14213d]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#c8d5e8] bg-[#f4f6fa] px-4 text-[12px]">
        <span className="font-bold">حساب صراف</span><span>نسخه ۲۱</span>
      </div>

      <nav aria-label="منوهای اصلی" className="flex min-h-11 flex-wrap items-center justify-start gap-x-6 gap-y-2 border border-[#c8d5e8] bg-[#f7f9fc] px-3 py-2 text-[13px] font-bold">
        {MENUS.map(menu => (
          <details key={menu.label} className="group relative">
            <summary className="flex cursor-pointer list-none items-center rounded px-1 py-1 hover:bg-blue-100">{menu.label}</summary>
            <div className="absolute right-0 top-full z-30 mt-1 min-w-48 rounded-md border border-blue-200 bg-white p-1 shadow-xl">
              {menu.paths.map(path => <MenuEntry key={path} path={path} byPath={byPath} />)}
            </div>
          </details>
        ))}
      </nav>

      <div className="grid min-w-0 grid-cols-4 gap-1 border-b border-[#c8d5e8] bg-[#f0f4fa] px-2 py-1 sm:grid-cols-7 xl:grid-cols-14" style={desktopRequestedOnPhone ? { gridTemplateColumns: "repeat(14,minmax(0,1fr))" } : undefined}>
        {TOOLBAR.map(([Icon, label, path], index) => (
          <DashboardTile key={label + index} icon={Icon} label={label} path={path} byPath={byPath} compact />
        ))}
      </div>

      <main className="flex min-w-0 flex-col gap-3 p-1 sm:p-[10px]">
        <header className="grid min-h-[55px] min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md bg-[#285aa7] px-3 py-2 text-white sm:px-4">
          <div className="flex min-w-0 items-center gap-2 text-[11px] sm:text-[14px]"><CalendarDays className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" /><span className="truncate">{date}</span></div>
          <h1 className="text-center text-base font-bold sm:text-[23px]">مرکز عملیات صرافی</h1>
          <Home className="h-6 w-6 justify-self-end sm:h-7 sm:w-7" />
        </header>

        <div className="grid min-w-0 grid-cols-2 gap-2 xl:grid-cols-4" style={desktopRequestedOnPhone ? { gridTemplateColumns: "repeat(4,minmax(0,1fr))" } : undefined}>
          {[
            { label: 'تعداد مشتریان', value: customerCount, icon: Users },
            { label: 'صندوق‌های تعریف‌شده', value: cashCount, icon: Wallet },
            { label: 'عملیات امروز', value: operationCount, icon: ArrowLeftRight },
            { label: 'مفاد معاملات', value: '—', icon: BarChart3 },
          ].map(card => {
            const Icon = card.icon;
            return <section key={card.label} className="flex min-h-[78px] min-w-0 flex-col justify-center gap-2 border border-[#c4d3ec] bg-[#f8fafe] px-3 py-2 sm:px-4">
              <div className="flex min-w-0 items-center gap-2 text-xs font-bold sm:text-[14px]"><Icon className="h-5 w-5 shrink-0 text-[#1f4e9f]" /><span>{card.label}</span></div>
              <div className="text-center text-lg tabular-nums">{card.value}</div>
            </section>;
          })}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[.84fr_1fr_1fr]" style={desktopRequestedOnPhone ? { gridTemplateColumns: ".84fr 1fr 1fr", gridTemplateRows: "144px 124px" } : undefined}>
          {PANELS.map((panel, index) => (
            <section key={panel.title} className="flex min-w-0 flex-col overflow-hidden border border-[#c4d3ec] bg-[#eef3fb]">
              <h3 className={`flex shrink-0 items-center bg-[#cbdcf5] px-3 font-bold text-[#14213d] ${index < 3 ? 'h-[40px] text-[16px]' : 'h-[35px] text-[14px]'}`}>{panel.title}</h3>
              <div className="grid min-w-0 flex-1 grid-cols-3 items-stretch gap-1 p-1">
                {panel.items.map(([Icon, label, path], itemIndex) => <DashboardTile key={label + itemIndex} icon={Icon} label={label} path={path} byPath={byPath} compact={index >= 3} />)}
              </div>
            </section>
          ))}
        </div>

        <section className="flex min-h-[125px] min-w-0 flex-col border border-[#c4d3ec] bg-[#e6ecf5] p-2">
          <h3 className="mb-2 text-[14px] font-bold">عملیات سریع</h3>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" style={desktopRequestedOnPhone ? { gridTemplateColumns: "repeat(5,minmax(0,1fr))" } : undefined}>
            {QUICK.map(([Icon, label, path]) => <DashboardTile key={label} icon={Icon} label={label} path={path} byPath={byPath} compact />)}
          </div>
        </section>
      </main>

      <footer className="flex min-h-[43px] shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#cad8ee] bg-[#eef2f8] px-3 py-2 text-[12px]">
        <div className="flex items-center gap-4 text-slate-400" aria-label="گزینه‌های غیرفعال">
          <span className="flex items-center gap-1"><Save className="h-4 w-4" />ثبت</span>
          <span className="flex items-center gap-1"><Pencil className="h-4 w-4" />ویرایش</span>
          <span className="flex items-center gap-1"><Trash2 className="h-4 w-4" />حذف</span>
          <span className="flex items-center gap-1"><Printer className="h-4 w-4" />چاپ</span>
        </div>
        <div className="flex items-center gap-3 whitespace-nowrap"><span>کاربر اصلی</span><i className="h-4 w-px bg-[#9aa8c0]" /><span>{date}</span><i className="h-4 w-px bg-[#9aa8c0]" /><span>نسخه ۲۱</span></div>
      </footer>
    </div>
  );
}