// a1/shell/A1Layout.jsx — پوستهٔ A1
// فهرست ماژول‌ها، گروه‌ها، آیکون‌ها، پوستهٔ سایدبار، نوار موبایل و صفحهٔ «همه بخش‌ها»
// مستقیماً از reference/A1-extracted-source-temp/src/components/sarraaf/Version21Layout.jsx منتقل شده است.
// تنها تغییر سازگاری: مقصد ماژول‌ها به محلی که در این پیش‌نمایش وجود دارد هدایت می‌شود.
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  House, Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText,
  ClipboardList, Coins, FileSpreadsheet, ChartNoAxesColumn, Scale,
  MessagesSquare, Bot, ShoppingBag, Headphones, Construction, LogOut, MoreHorizontal, X,
  BookOpen, Building2, Receipt, Calculator, ArrowDownUp, Network,
  Settings, FileSearch, CalendarDays, ShieldCheck, Files, ClipboardCheck,
  Banknote, CircleDollarSign, FolderKanban, Handshake, Activity, Bell,
  Database, FileCheck,
} from 'lucide-react';
import { useAuth } from '@/a1/lib/demoAuth';
import LayoutModeBadge from '@/a1/components/v21/LayoutModeBadge';
import useMobileShell from '@/a1/hooks/useMobileShell';
import MobileWorkspace from '@/a1/mobile/MobileWorkspace';

const MODULES = [
  { id: 'home', label: 'میز کار', path: '/dashboard', icon: House, group: 'عمومی', roles: ['creator', 'admin', 'sarraaf', 'employee'] },

  { id: 'customers', label: 'مشتریان', path: '/customers', icon: Users, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', icon: BookOpen, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'agents', label: 'نمایندگی‌ها', path: '/agents', icon: Building2, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', icon: ClipboardList, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'internalBranches', label: 'شعب داخلی', icon: Construction, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator', 'admin', 'sarraaf'] },

  { id: 'cash', label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'banks', label: 'بانک و چک', path: '/bank', icon: Landmark, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'dadogereft', label: 'داد و گرفت', path: '/dadogereft', icon: Handshake, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'trade', label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'sendTransfer', label: 'حواله ارسالی', path: '/transfers/send', icon: Send, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'receiveTransfer', label: 'حواله دریافتی', path: '/transfers/receive', icon: ArrowDownUp, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'transferBook', label: 'دفتر حواله‌ها', path: '/transfer-book', icon: ScrollText, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', icon: Receipt, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'convert', label: 'تبدیل اسعار', path: '/convert', icon: ArrowDownUp, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'treasury', label: 'خزانه‌داری', icon: Landmark, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'interexchange', label: 'حساب‌های بین‌صرافی', icon: Network, group: 'صندوق، بانک و عملیات', roles: ['creator', 'admin', 'sarraaf'] },

  { id: 'journal', label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'journalEntry', label: 'ثبت سند حسابداری', path: '/journal-entry', icon: FileSpreadsheet, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'ledger', label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'chartAccounts', label: 'کدینگ حساب‌ها', icon: Calculator, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'subsidiaryLedger', label: 'دفتر معین و تفصیلی', icon: BookOpen, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'trialBalance', label: 'تراز آزمایشی', icon: Scale, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'debitCredit', label: 'جمع بدهکاری و بستانکاری', icon: ChartNoAxesColumn, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'balanceSheet', label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'reconciliation', label: 'مغایرت‌گیری', path: '/reconciliation', icon: FileSearch, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'profit', label: 'مفاد و زیان', path: '/profit-loss', icon: ChartNoAxesColumn, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'cashFlow', label: 'گردش وجوه نقد', icon: Banknote, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'debtors', label: 'بدهکاران', path: '/debtors', icon: CircleDollarSign, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'transactions', label: 'مرکز معاملات', path: '/transactions', icon: ArrowLeftRight, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'receivablePayable', label: 'دریافتنی‌ها و پرداختنی‌ها', icon: Activity, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'fixedAssets', label: 'دارایی‌های ثابت', icon: Building2, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'budgets', label: 'بودجه و مراکز هزینه', icon: FolderKanban, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'fiscalPeriods', label: 'دوره‌های مالی و بستن حساب‌ها', icon: CalendarDays, group: 'حسابداری و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },

  { id: 'currencies', label: 'تعریف اسعار', path: '/currencies', icon: Coins, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'agencyNetwork', label: 'شبکه نمایندگی‌ها', path: '/agency-network', icon: Network, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'marketRates', label: 'نرخ بازار صراف‌ها', icon: ChartNoAxesColumn, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'chat', label: 'گروه و چت صراف‌ها', path: '/chat', icon: MessagesSquare, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'market', label: 'بازار صراف‌ها', path: '/sarraaf-market', icon: ShoppingBag, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'sarraafChat', label: 'چت صراف‌ها', path: '/sarraaf-chat', icon: MessagesSquare, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'multiCompany', label: 'مدیریت چندشرکتی', icon: Building2, group: 'ارز، شبکه و ارتباطات', roles: ['creator', 'admin', 'sarraaf'] },

  { id: 'reports', label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, group: 'گزارش‌ها و خدمات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'onlineProducts', label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, group: 'گزارش‌ها و خدمات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'support', label: 'پشتیبانی', path: '/support', icon: Headphones, group: 'گزارش‌ها و خدمات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'assistant', label: 'هوش مصنوعی', path: '/assistant', icon: Bot, group: 'گزارش‌ها و خدمات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'settings', label: 'تنظیمات', path: '/settings', icon: Settings, group: 'گزارش‌ها و خدمات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'paymentGateway', label: 'درگاه پرداخت', path: '/payment-gateway', icon: FileCheck, group: 'گزارش‌ها و خدمات', roles: ['creator', 'admin', 'sarraaf'] },

  { id: 'management', label: 'مرکز مدیریت', path: '/management', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'auditLog', label: 'ردپای حسابرسی', icon: ClipboardCheck, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'documents', label: 'مرکز اسناد', icon: Files, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'approvals', label: 'گردش تأییدها', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'kyc', label: 'احراز هویت مشتری', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'compliance', label: 'کنترل داخلی و تطبیق', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'backup', label: 'پشتیبان‌گیری و بازیابی', path: '/backup', icon: Database, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'notifications', label: 'اعلان‌ها', path: '/notifications', icon: Bell, group: 'امنیت و اسناد', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
];

const GROUPS = [
  'عمومی', 'طرف‌حساب‌ها و نمایندگی‌ها', 'صندوق، بانک و عملیات',
  'حسابداری و دفاتر', 'ارز، شبکه و ارتباطات', 'گزارش‌ها و خدمات', 'امنیت و اسناد',
];

const WORKSPACE_TARGETS = {
  home: 'home', customers: 'customers', customerLedger: 'customerLedger',
  agents: 'branches', branchLedger: 'branchLedger', internalBranches: 'branches',
  cash: 'cash', banks: 'banks', dadogereft: 'customerLedger',
  trade: 'exchange', sendTransfer: 'remittance', receiveTransfer: 'remittance',
  transferBook: 'remittance', expenses: 'expenses', convert: 'exchange',
  treasury: 'cash', interexchange: 'branchLedger', journal: 'journal',
  journalEntry: 'journal', ledger: 'ledger', chartAccounts: 'accounts',
  subsidiaryLedger: 'ledger', trialBalance: 'balance', debitCredit: 'balance',
  balanceSheet: 'balance', reconciliation: 'reports', profit: 'profit',
  cashFlow: 'reports', debtors: 'customerLedger', receivablePayable: 'customerLedger',
  fixedAssets: 'accounts', budgets: 'expenses', fiscalPeriods: 'reports',
  currencies: 'currencies', agencyNetwork: 'branches', marketRates: 'exchange',
  chat: 'sarraafGroups', market: 'products', sarraafChat: 'sarraafGroups',
  multiCompany: 'branches', reports: 'reports', onlineProducts: 'products',
  support: 'home', assistant: 'assistant', settings: 'home',
  paymentGateway: 'products', auditLog: 'reports', documents: 'reports',
  approvals: 'reports', kyc: 'customers', compliance: 'reports',
  backup: 'home', notifications: 'home',
};

function moduleTarget(item) {
  if (item.path) return item.path;
  return '/dashboard?module=' + (WORKSPACE_TARGETS[item.id] || 'home');
}

function isCurrent(item, location) {
  if (item.path) {
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  }
  return location.pathname === '/dashboard'
    && new URLSearchParams(location.search).get('module') === (WORKSPACE_TARGETS[item.id] || 'home');
}

function ModuleLink({ item, compact = false, onNavigate, location }) {
  const Icon = item.icon;
  const current = isCurrent(item, location);
  const className = compact
    ? `flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] leading-tight transition-all ${
      current
        ? 'border-[#164b87] bg-gradient-to-br from-[#164b87] to-[#2767a5] text-white shadow-md'
        : 'border-[#d5e2f0] bg-white text-[#24496d] shadow-sm hover:border-blue-300 hover:bg-blue-50'
    }`
    : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
      current ? 'bg-gradient-to-l from-blue-700 to-blue-600 text-white shadow-md' : 'text-slate-200 hover:bg-white/10'
    }`;
  return (
    <NavLink to={moduleTarget(item)} end={item.id === 'home'} onClick={onNavigate} className={className}>
      <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function A1Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // زیر ۷۶۸ پیکسل، میزکار پوستهٔ مستقل موبایل را نشان می‌دهد؛ چیدمان لپ‌تاپ دست‌نخورده می‌ماند.
  const mobileShell = useMobileShell();

  const role = user?.role === 'exchange' ? 'sarraaf' : (user?.role || 'user');
  const modules = MODULES.filter((item) => Array.isArray(item.roles) && item.roles.includes(role));
  const current = modules.find((item) => item.path && (location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  const isDashboard = location.pathname === '/dashboard';

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname, location.search]);

  if (isDashboard && mobileShell) return <MobileWorkspace />;

  return (
    <div dir="rtl" lang="fa" className="v21-app-shell min-h-screen bg-[#f3f7fc] text-slate-900 flex font-[Tahoma,Arial,sans-serif]">
      {!isDashboard && (
        <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col bg-gradient-to-b from-[#102b4c] via-[#12385f] to-[#0e2745] text-white print:hidden">
          <div className="px-5 py-5 border-b border-white/10 bg-gradient-to-br from-[#12365f] to-[#174f86]">
            <div className="text-lg font-extrabold">حساب صراف</div>
            <div className="mt-1 text-xs text-slate-400">مدیریت حساب صراف</div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="فهرست ماژول‌های حساب صراف">
            {GROUPS.map((group) => {
              const items = modules.filter((item) => item.group === group);
              if (!items.length) return null;
              return (
                <section key={group}>
                  <h2 className="px-3 mb-1 text-[11px] font-semibold text-slate-400">{group}</h2>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <ModuleLink key={item.id} item={item} location={location} />
                    ))}
                  </div>
                </section>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-3">
            <div className="px-3 pb-2 text-xs text-slate-300 truncate">{user?.full_name || user?.username || 'حساب کاربری'}</div>
            <button type="button" onClick={() => logout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10">
              <LogOut className="h-4 w-4" /> خروج از حساب
            </button>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#d5e2f0] bg-white/95 backdrop-blur print:hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-1 md:px-5">
            <div className="flex min-w-0 items-center gap-2">
              {!isDashboard && (
                <button type="button" onClick={() => setMobileNavOpen(true)} className="lg:hidden rounded-lg border border-[#d5e2f0] p-2 text-[#164b87]" aria-label="همه بخش‌ها">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[10.5px] font-extrabold text-[#102b4c]">{current?.label || (isDashboard ? 'میز کار' : 'حساب صراف')}</div>
                <div className="truncate text-[9px] text-slate-500">صرافی نمایشی — دادهٔ ساختگی محلی</div>
              </div>
              <LayoutModeBadge compact />
            </div>
            <div className="flex items-center gap-2">
              {(role === 'creator' || role === 'admin') && (
                <button type="button" onClick={() => navigate('/builder')} className="hidden rounded-lg border border-[#d5e2f0] px-3 py-1.5 text-[11px] font-semibold text-[#164b87] sm:block">
                  پنل سازنده
                </button>
              )}
              <button type="button" onClick={() => navigate('/dashboard')} className="hidden rounded-lg border border-[#d5e2f0] px-3 py-1.5 text-[11px] font-semibold text-[#164b87] sm:block">
                میز کار
              </button>
              <button type="button" onClick={() => logout()} className="rounded-lg border border-[#d5e2f0] p-2 text-[#164b87] lg:hidden" aria-label="خروج">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 px-2 py-3 pb-24 sm:p-3 md:p-5 lg:pb-5">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500">
          حساب صراف
        </footer>

        {!isDashboard && (
          <>
            <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-2 border-t border-[#d5e2f0] bg-white/95 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-6px_24px_rgba(16,43,76,0.10)] backdrop-blur lg:hidden" aria-label="ناوبری سریع برنامه">
              {['home', 'customers', 'cash'].map((id) => {
                const item = modules.find((entry) => entry.id === id);
                return item ? <ModuleLink key={id} item={item} compact location={location} /> : null;
              })}
              <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="همه بخش‌های برنامه"
                className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-[#d5e2f0] bg-[#f3f7fc] px-2 py-2 text-[11px] font-semibold text-[#164b87] shadow-sm">
                <MoreHorizontal className="h-5 w-5" /><span>همه بخش‌ها</span>
              </button>
            </nav>

            {mobileNavOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-[2px] sm:items-center sm:p-4"
                role="presentation" onClick={() => setMobileNavOpen(false)}>
                <section role="dialog" aria-modal="true" aria-label="همه بخش‌های حساب صراف"
                  className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#d5e2f0] bg-[#f3f7fc] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}>
                  <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div>
                      <b className="text-sm text-slate-900">همه بخش‌های حساب صراف</b>
                      <p className="mt-1 text-[11px] text-slate-500">دسترسی بر اساس نقش و مجوز حساب شما</p>
                    </div>
                    <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="بستن فهرست" className="rounded-lg border border-slate-200 p-2 text-slate-600">
                      <X className="h-5 w-5" />
                    </button>
                  </header>
                  <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" aria-label="فهرست کامل ماژول‌ها">
                    {GROUPS.map((group) => {
                      const items = modules.filter((item) => item.group === group);
                      if (!items.length) return null;
                      return (
                        <section key={group} className="rounded-xl border border-[#d5e2f0] bg-white p-3 shadow-sm">
                          <h2 className="mb-2 text-[11px] font-bold text-slate-500">{group}</h2>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                            {items.map((item) => (
                              <ModuleLink key={item.id} item={item} compact location={location} onNavigate={() => setMobileNavOpen(false)} />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </nav>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}