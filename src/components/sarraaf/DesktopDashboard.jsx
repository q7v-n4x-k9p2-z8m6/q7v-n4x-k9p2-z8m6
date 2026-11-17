import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight, Repeat, Send, Download, Receipt, BookOpen, Landmark,
  FileText, ShoppingBag, Users, Wallet, RefreshCw, CalendarDays,
  Home, Bot, MessageSquare, Settings, Banknote, ChevronDown,
} from 'lucide-react';

const GROUPS = [
  { title: 'تعاریف و دفاتر', icon: BookOpen, paths: ['/customers', '/agents', '/debtors', '/transfer-book', '/journal', '/general-ledger'] },
  { title: 'صندوق و بانک', icon: Landmark, paths: ['/cash', '/bank', '/currencies', '/convert'] },
  { title: 'عملیات صرافی', icon: ArrowLeftRight, paths: ['/dadogereft', '/trade', '/transfers/send', '/transfers/receive'] },
  { title: 'حسابداری و گزارشات', icon: FileText, paths: ['/reports', '/profit-loss', '/balance-sheet', '/reconciliation', '/receipt'] },
  { title: 'امکانات تکمیلی', icon: ShoppingBag, paths: ['/online-products', '/sarraaf-market', '/sarraaf-chat', '/chat', '/assistant'] },
  { title: 'تنظیمات', icon: Settings, paths: ['/settings'] },
];

const QUICK_ACTIONS = [
  { label: 'معامله اسعار', path: '/trade', icon: Repeat },
  { label: 'حواله دریافتی', path: '/transfers/receive', icon: Download },
  { label: 'حواله ارسالی', path: '/transfers/send', icon: Send },
  { label: 'ثبت عملیات صرافی', path: '/dadogereft', icon: ArrowLeftRight },
  { label: 'ثبت دریافت', path: '/receipt', icon: Receipt },
];

const TOP_ICONS = [
  { path: '/customers', icon: Users, label: 'دفتر حساب مشتریان' },
  { path: '/agents', icon: Users, label: 'تعریف نمایندگی‌ها' },
  { path: '/debtors', icon: Wallet, label: 'دفتر حساب بدهکاران' },
  { path: '/bank', icon: Landmark, label: 'بانک و چک' },
  { path: '/transfer-book', icon: ArrowLeftRight, label: 'دفتر حواله‌ها' },
  { path: '/cash', icon: Banknote, label: 'صندوق‌ها و موجودی' },
  { path: '/trade', icon: Repeat, label: 'خرید و فروش اسعار' },
  { path: '/receipt', icon: Receipt, label: 'مصارف و پرداخت‌ها' },
  { path: '/journal', icon: FileText, label: 'دفتر روزنامچه' },
  { path: '/sarraaf-chat', icon: MessageSquare, label: 'گروه و چت' },
  { path: '/assistant', icon: Bot, label: 'هوش مصنوعی' },
  { path: '/online-products', icon: ShoppingBag, label: 'محصولات آنلاین' },
  { path: '/settings', icon: Settings, label: 'تنظیمات' },
];

const number = value => new Intl.NumberFormat('fa-IR').format(Number(value) || 0);

export default function DesktopDashboard({
  profile, features, userRole, paidSystemEnabled, currencies, curLoading,
  txs, txLoading, customers, custLoading, treasuryBalances, treasuryLoading,
  bankBalances, bankLoading, debtorCount, plan, links = [],
}) {
  const byPath = new Map(links.map(link => [link.path, link]));
  const groups = GROUPS.map(group => ({
    ...group,
    entries: group.paths.map(path => byPath.get(path)).filter(Boolean),
  })).filter(group => group.entries.length);
  const usedPaths = new Set(GROUPS.flatMap(group => group.paths));
  const extras = links.filter(link => !usedPaths.has(link.path));
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = (txs || []).filter(tx => tx.date === today).length;
  const cashCount = treasuryLoading ? '…' : number((treasuryBalances || []).length);
  const bankCount = bankLoading ? '…' : number(new Set((bankBalances || []).map(row => row.bank_id ?? row.bank_name)).size);
  const customerCount = custLoading ? '…' : number((customers || []).length);
  const operationCount = txLoading ? '…' : number(todayCount);
  const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date());
  const topLinks = TOP_ICONS.map(item => ({ ...item, link: byPath.get(item.path) })).filter(item => item.link);
  const quickLinks = QUICK_ACTIONS.map(item => ({ ...item, link: byPath.get(item.path) })).filter(item => item.link);

  return (
    <div dir="rtl" className="space-y-3 rounded-xl bg-[#e8eef8] p-2 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl bg-gradient-to-l from-[#06377c] to-[#1557a5] px-4 py-2 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/50 bg-white/10"><Home className="h-5 w-5" /></span>
          <strong className="text-sm">حساب صراف — مرکز عملیات</strong>
        </div>
        <span className="text-xs text-blue-100">نسخه دسکتاپ</span>
      </div>

      <nav aria-label="منوهای اصلی" className="flex flex-wrap items-center justify-start gap-1 rounded-lg border border-[#c2d1e6] bg-[#f4f7fc] px-3 py-2 text-xs font-bold text-[#173e70] shadow-sm">
        {GROUPS.map(group => (
          <details key={group.title} className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-1.5 hover:bg-blue-100">
              {group.title}<ChevronDown className="h-3 w-3" />
            </summary>
            <div className="absolute right-0 top-full z-30 mt-1 min-w-48 rounded-md border border-blue-200 bg-white p-1 shadow-xl">
              {group.paths.map(path => {
                const link = byPath.get(path);
                if (!link) return null;
                const Icon = link.icon;
                return <Link key={path} to={path} className="flex items-center gap-2 rounded px-3 py-2 text-right text-xs text-slate-700 hover:bg-blue-50"><Icon className="h-4 w-4 text-blue-700" />{link.label}</Link>;
              })}
            </div>
          </details>
        ))}
      </nav>

      <div className="grid grid-cols-4 gap-1 rounded-lg border border-[#bdcde4] bg-[#f5f8fd] p-1.5 sm:grid-cols-6 xl:grid-cols-12">
        {topLinks.map(({ path, icon: Icon, label, link }) => (
          <Link key={path} to={path} title={label} className="flex min-h-[76px] min-w-0 flex-col items-center justify-center gap-1 rounded-md border border-[#d1dced] bg-gradient-to-b from-white to-[#e9f0fb] px-1 py-2 text-center text-[10px] font-bold text-[#173e70] shadow-sm transition hover:border-blue-400 hover:bg-blue-50">
            <Icon className="h-5 w-5 text-[#1557a5]" />
            <span className="leading-tight">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gradient-to-l from-[#174b91] to-[#2865ad] px-4 py-3 text-white shadow-sm">
        <Home className="h-7 w-7" />
        <h1 className="text-lg font-extrabold">مرکز عملیات صرافی</h1>
        <div className="flex items-center gap-2 text-xs text-blue-50"><CalendarDays className="h-5 w-5" />{date}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          { label: 'تعداد مشتریان', value: customerCount, icon: Users },
          { label: 'صندوق‌های تعریف‌شده', value: cashCount, icon: Wallet },
          { label: 'عملیات امروز', value: operationCount, icon: RefreshCw },
          { label: 'حساب‌های بانکی', value: bankCount, icon: Landmark },
        ].map(card => {
          const Icon = card.icon;
          return <section key={card.label} className="flex min-h-[78px] items-center justify-between rounded-lg border border-[#b9cbe5] bg-gradient-to-b from-[#f9fbff] to-[#e7effb] px-4 py-3 shadow-sm">
            <div><h2 className="text-xs font-extrabold text-[#173e70]">{card.label}</h2><b className="mt-2 block text-base tabular-nums text-slate-800">{card.value}</b></div>
            <Icon className="h-7 w-7 text-[#1557a5]" />
          </section>;
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        {groups.map(group => {
          const Icon = group.icon;
          return <section key={group.title} className="overflow-hidden rounded-lg border border-[#b9cbe5] bg-gradient-to-b from-[#f8fbff] to-[#e8f0fc] shadow-sm">
            <div className="border-b border-[#c2d3eb] bg-gradient-to-l from-[#d6e5fa] to-[#eef4fd] px-3 py-2 text-sm font-extrabold text-[#173e70]">{group.title}</div>
            <div className="grid grid-cols-2 gap-1 p-1.5">
              {group.entries.map(link => {
                const TileIcon = link.icon;
                return <Link key={link.path} to={link.path} className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-md border border-[#cfdaea] bg-gradient-to-b from-white to-[#edf3fc] px-2 py-2 text-center text-xs font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md">
                  <TileIcon className="h-6 w-6 text-[#1557a5]" strokeWidth={2.2} />
                  <span className="leading-tight">{link.label}</span>
                </Link>;
              })}
            </div>
          </section>;
        })}
        {extras.length > 0 && <section className="overflow-hidden rounded-lg border border-[#b9cbe5] bg-white shadow-sm">
          <div className="border-b border-[#c2d3eb] bg-[#e4eefb] px-3 py-2 text-sm font-extrabold text-[#173e70]">سایر امکانات</div>
          <div className="grid grid-cols-2 gap-1 p-1.5">{extras.map(link => {const Icon=link.icon;return <Link key={link.path} to={link.path} className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-md border border-[#cfdaea] bg-[#f8fbff] p-2 text-center text-xs font-bold"><Icon className="h-5 w-5 text-blue-700"/>{link.label}</Link>;})}</div>
        </section>}
      </div>

      <section className="overflow-hidden rounded-lg border border-[#b9cbe5] bg-[#f0f5fd] shadow-sm">
        <h2 className="border-b border-[#c2d3eb] bg-gradient-to-l from-[#d6e5fa] to-[#eef4fd] px-3 py-2 text-sm font-extrabold text-[#173e70]">عملیات سریع</h2>
        <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3 xl:grid-cols-5">
          {quickLinks.map(action => {
            const Icon = action.icon;
            return <Link key={action.path + action.label} to={action.path} className="flex min-h-[62px] items-center justify-center gap-2 rounded-md border border-[#c6d5e9] bg-gradient-to-b from-white to-[#eaf1fc] px-2 py-2 text-center text-xs font-extrabold text-[#173e70] shadow-sm transition hover:border-blue-400 hover:shadow-md">
              <Icon className="h-5 w-5 text-[#1557a5]" /><span>{action.label}</span>
            </Link>;
          })}
        </div>
      </section>
    </div>
  );
}
