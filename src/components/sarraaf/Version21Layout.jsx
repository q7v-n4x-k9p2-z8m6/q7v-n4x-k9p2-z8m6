import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText,
  ClipboardList, Coins, FileSpreadsheet, BarChart3, Scale,
  MessagesSquare, Bot, ShoppingBag, Headphones, Construction, LogOut,
  BookOpen, Building2, Receipt, Calculator, ArrowDownUp, Network,
  Settings, FileSearch, CalendarDays, ShieldCheck, Files, ClipboardCheck,
  Banknote, CircleDollarSign, FolderKanban, Handshake, Activity, Bell,
  Database, BriefcaseBusiness, FileCheck, ChartNoAxesCombined, Landmark as TreasuryIcon
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Version 21 production shell: one A1 data/authentication layer, responsive
// navigation, and no demo records or local database.
const MODULES = [
  { id: 'home', label: 'میز کار', path: '/dashboard', icon: Home, group: 'عمومی', roles: ['creator','admin','sarraaf','employee'] },

  { id: 'customers', label: 'مشتریان', path: '/customers', icon: Users, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', pending: true, icon: BookOpen, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },
  { id: 'agents', label: 'نمایندگی‌ها', path: '/agents', icon: Building2, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', pending: true, icon: ClipboardList, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },
  { id: 'internalBranches', label: 'شعب داخلی', pending: true, icon: Construction, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },

  { id: 'cash', label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'banks', label: 'بانک و چک', path: '/bank', icon: Landmark, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },
  { id: 'dadogereft', label: 'داد و گرفت', path: '/dadogereft', icon: Handshake, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'trade', label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'sendTransfer', label: 'حواله ارسالی', path: '/transfers/send', icon: Send, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'receiveTransfer', label: 'حواله دریافتی', path: '/transfers/receive', icon: ArrowDownUp, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'transferBook', label: 'دفتر حواله‌ها', path: '/transfer-book', icon: ScrollText, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', pending: true, icon: Receipt, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },
  { id: 'convert', label: 'تبدیل اسعار', path: '/convert', icon: ArrowDownUp, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'treasury', label: 'خزانه‌داری', pending: true, icon: TreasuryIcon, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },
  { id: 'interexchange', label: 'حساب‌های بین‌صرافی', pending: true, icon: Network, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },

  { id: 'journal', label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'journalEntry', label: 'ثبت سند حسابداری', path: '/journal-entry', icon: FileSpreadsheet, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'ledger', label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'chartAccounts', label: 'کدینگ حساب‌ها', pending: true, icon: Calculator, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'subsidiaryLedger', label: 'دفتر معین و تفصیلی', pending: true, icon: BookOpen, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'trialBalance', label: 'تراز آزمایشی', pending: true, icon: Scale, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'debitCredit', label: 'جمع بدهکاری و بستانکاری', pending: true, icon: ChartNoAxesCombined, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'balanceSheet', label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'reconciliation', label: 'مغایرت‌گیری', path: '/reconciliation', icon: FileSearch, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'profit', label: 'مفاد و زیان', path: '/profit-loss', icon: BarChart3, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'cashFlow', label: 'گردش وجوه نقد', pending: true, icon: Banknote, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'debtors', label: 'بدهکاران', path: '/debtors', icon: CircleDollarSign, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'receivablePayable', label: 'دریافتنی‌ها و پرداختنی‌ها', pending: true, icon: Activity, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'fixedAssets', label: 'دارایی‌های ثابت', pending: true, icon: Building2, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'budgets', label: 'بودجه و مراکز هزینه', pending: true, icon: FolderKanban, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'fiscalPeriods', label: 'دوره‌های مالی و بستن حساب‌ها', pending: true, icon: CalendarDays, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },

  { id: 'currencies', label: 'تعریف اسعار', path: '/currencies', icon: Coins, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'agencyNetwork', label: 'شبکه نمایندگی‌ها', path: '/agency-network', icon: Network, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'marketRates', label: 'نرخ بازار صراف‌ها', pending: true, icon: ChartNoAxesCombined, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'chat', label: 'گروه و چت صراف‌ها', path: '/chat', icon: MessagesSquare, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'market', label: 'بازار صراف‌ها', path: '/sarraaf-market', icon: ShoppingBag, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'sarraafChat', label: 'چت صراف‌ها', path: '/sarraaf-chat', icon: MessagesSquare, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'multiCompany', label: 'مدیریت چندشرکتی', pending: true, icon: Building2, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },

  { id: 'reports', label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'onlineProducts', label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf'] },
  { id: 'support', label: 'پشتیبانی', path: '/support', icon: Headphones, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'assistant', label: 'هوش مصنوعی', path: '/assistant', icon: Bot, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'settings', label: 'تنظیمات', path: '/settings', icon: Settings, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'paymentGateway', label: 'درگاه پرداخت', path: '/payment-gateway', icon: FileCheck, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf'] },

  { id: 'auditLog', label: 'ردپای حسابرسی', pending: true, icon: ClipboardCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'documents', label: 'مرکز اسناد', pending: true, icon: Files, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'approvals', label: 'گردش تأییدها', pending: true, icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'kyc', label: 'احراز هویت مشتری', pending: true, icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'compliance', label: 'کنترل داخلی و تطبیق', pending: true, icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'backup', label: 'پشتیبان‌گیری و بازیابی', path: '/backup', icon: Database, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'notifications', label: 'اعلان‌ها', path: '/notifications', icon: Bell, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf','employee'] },
];

const GROUPS = [
  'عمومی', 'طرف‌حساب‌ها و نمایندگی‌ها', 'صندوق، بانک و عملیات',
  'حسابداری و دفاتر', 'ارز، شبکه و ارتباطات', 'گزارش‌ها و خدمات', 'امنیت و اسناد'
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
  backup: 'home', notifications: 'home'
};

function ModuleLink({ item, compact = false }) {
  const Icon = item.icon;
  if (item.pending) {
    return (
      <div aria-disabled="true" title="این بخش تا اتصال امن به اطلاعات واقعی غیرفعال است"
        className={compact
          ? 'flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-1 py-2 text-center text-[10px] text-slate-500'
          : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed'}>
        <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} />
        <span className={compact ? 'leading-tight' : 'flex-1'}>{item.label}</span>
        {!compact && <span className="text-[10px] whitespace-nowrap">در حال اتصال</span>}
      </div>
    );
  }
  return (
    <NavLink to={item.id === 'debtors' ? '/debtors' : (item.id === 'home' ? '/dashboard' : '/dashboard?module=' + (WORKSPACE_TARGETS[item.id] || 'home'))} end={item.id === 'home'}
      className={({ isActive }) => compact
        ? `flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center text-[10px] leading-tight transition-all ${isActive ? 'border-blue-300 bg-blue-50 text-blue-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'}`
        : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${isActive ? 'bg-gradient-to-l from-blue-700 to-blue-600 text-white shadow-md' : 'text-slate-200 hover:bg-white/10'}`}>
      <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Version21Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // A1 stores exchange owners with role='exchange'; the v21 navigation uses 'sarraaf'.
  // Normalize the persisted role so legitimate exchanger accounts retain their modules.
  const role = user?.role === 'exchange' ? 'sarraaf' : (user?.role || 'user');
  const modules = MODULES.filter(item => Array.isArray(item.roles) && item.roles.includes(role));
  const current = modules.find(item => item.path && (location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  const isAssistant = location.pathname === '/assistant';
  // The shared preview account is identified narrowly; no other tenant sees this notice.
  const isSharedDemoAccount = String(user?.username || '') === '22222222' || String(user?.id ?? user?.user_id ?? '') === '107';

  return (
    <div dir="rtl" className="v21-app-shell min-h-screen bg-[#f3f7fc] text-slate-900 flex">
      {location.pathname !== '/dashboard' && <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col bg-gradient-to-b from-[#102b4c] via-[#12385f] to-[#0e2745] text-white print:hidden">
        <div className="px-5 py-5 border-b border-white/10 bg-gradient-to-br from-[#12365f] to-[#174f86]">
          <div className="text-lg font-extrabold">حساب صراف</div>
          <div className="mt-1 text-xs text-slate-400">مدیریت حساب صراف</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {GROUPS.map(group => {
            const items = modules.filter(item => item.group === group);
            if (!items.length) return null;
            return <section key={group}>
              <h2 className="px-3 mb-1 text-[11px] font-semibold text-slate-400">{group}</h2>
              <div className="space-y-1">{items.map(item => <ModuleLink key={item.id} item={item} />)}</div>
            </section>;
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="px-3 pb-2 text-xs text-slate-300 truncate">{user?.full_name || user?.username || 'حساب کاربری'}</div>
          <button onClick={() => logout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10">
            <LogOut className="h-4 w-4" /> خروج از حساب
          </button>
        </div>
      </aside>}

      <div className="min-w-0 flex-1 flex flex-col">
        {location.pathname !== '/dashboard' && <header className="sticky top-0 z-30 bg-gradient-to-l from-white to-[#edf4fd] border-b border-[#d5e2f0] shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
            <div className="min-w-0">
              <div className="font-bold text-sm md:text-base">حساب صراف</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{current?.label || (isAssistant ? 'هوش مصنوعی' : 'پنل عملیاتی صرافی')} · {user?.full_name || user?.username || ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/support')} className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-2 text-xs hover:bg-slate-50">
                <Headphones className="h-4 w-4" /> پشتیبانی
              </button>
              <button onClick={() => logout()} className="lg:hidden rounded-lg border p-2" aria-label="خروج">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>}
        {isSharedDemoAccount && (
          <section role="status" aria-label="اطلاعیه حساب کاربری" className="mx-3 mt-3 md:mx-5 xl:mx-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-bold text-sm">این حساب کاربری برای امتحان و آشنایی با امکانات برنامه است.</div>
                <p className="mt-1 text-xs leading-6 text-amber-900">برای استفاده مستقل از برنامه، حساب کاربری واقعی خود را بسازید.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout(false);
                  navigate('/register?tab=sarraaf', { replace: true });
                }}
                className="shrink-0 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                ساخت حساب کاربری واقعی
              </button>
            </div>
          </section>
        )}
        <main className="flex-1 min-w-0 p-3 md:p-5 xl:p-7">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500">
          حساب صراف
        </footer>
      </div>
    </div>
  );
}
