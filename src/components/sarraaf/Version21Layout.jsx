import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText,
  ClipboardList, Coins, FileSpreadsheet, BarChart3, Scale,
  MessagesSquare, Bot, ShoppingBag, Headphones, Construction, LogOut, MoreHorizontal, X,
  BookOpen, Building2, Receipt, Calculator, ArrowDownUp, Network,
  Settings, FileSearch, CalendarDays, ShieldCheck, Files, ClipboardCheck,
  Banknote, CircleDollarSign, FolderKanban, Handshake, Activity, Bell,
  Database, BriefcaseBusiness, FileCheck, ChartNoAxesCombined, Landmark as TreasuryIcon
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useFeatures, useSarraafProfile } from '@/lib/useSarraaf';
import { usePaidSystemEnabled } from '@/lib/usePaidSystem';
import { useUpgrade } from '@/lib/UpgradeContext';
import { getFeatureStatus, isFeatureEnabled } from '@/lib/features';
import { isFeatureAccessible } from '@/lib/permissions';

// Version 21 production shell: one A1 data/authentication layer, responsive
// navigation, and no demo records or local database.
function detectDesktopSiteMode() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const uaMobile = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(ua);
  const touch = (navigator.maxTouchPoints || 0) > 0 || window.matchMedia?.('(pointer: coarse)').matches;
  const screenWidth = window.screen?.width || window.innerWidth;
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const uaDataMobile = navigator.userAgentData?.mobile;
  return ((uaDataMobile === true || uaMobile) && viewportWidth > 767 && touch && screenWidth <= 900) || (!uaMobile && touch && screenWidth <= 900 && viewportWidth > 767);
}


const MODULES = [
  { id: 'home', label: 'میز کار', path: '/dashboard', icon: Home, group: 'عمومی', roles: ['creator','admin','sarraaf','employee'] },

  { id: 'customers', label: 'مشتریان', path: '/customers', icon: Users, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', icon: BookOpen, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },
  { id: 'agents', label: 'نمایندگی‌ها', path: '/agents', icon: Building2, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', icon: ClipboardList, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },
  { id: 'internalBranches', label: 'شعب داخلی', icon: Construction, group: 'طرف‌حساب‌ها و نمایندگی‌ها', roles: ['creator','admin','sarraaf'] },

  { id: 'cash', label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'banks', label: 'بانک و چک', path: '/bank', icon: Landmark, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },
  { id: 'dadogereft', label: 'داد و گرفت', path: '/dadogereft', icon: Handshake, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'trade', label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'sendTransfer', label: 'حواله ارسالی', path: '/transfers/send', icon: Send, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'receiveTransfer', label: 'حواله دریافتی', path: '/transfers/receive', icon: ArrowDownUp, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'transferBook', label: 'دفتر حواله‌ها', path: '/transfer-book', icon: ScrollText, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', icon: Receipt, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },
  { id: 'convert', label: 'تبدیل اسعار', path: '/convert', icon: ArrowDownUp, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'treasury', label: 'خزانه‌داری', icon: TreasuryIcon, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },
  { id: 'interexchange', label: 'حساب‌های بین‌صرافی', icon: Network, group: 'صندوق، بانک و عملیات', roles: ['creator','admin','sarraaf'] },

  { id: 'journal', label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'journalEntry', label: 'ثبت سند حسابداری', path: '/journal-entry', icon: FileSpreadsheet, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'ledger', label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'chartAccounts', label: 'کدینگ حساب‌ها', icon: Calculator, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'subsidiaryLedger', label: 'دفتر معین و تفصیلی', icon: BookOpen, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'trialBalance', label: 'تراز آزمایشی', icon: Scale, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'debitCredit', label: 'جمع بدهکاری و بستانکاری', icon: ChartNoAxesCombined, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'balanceSheet', label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'reconciliation', label: 'مغایرت‌گیری', path: '/reconciliation', icon: FileSearch, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'profit', label: 'مفاد و زیان', path: '/profit-loss', icon: BarChart3, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'cashFlow', label: 'گردش وجوه نقد', icon: Banknote, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'debtors', label: 'بدهکاران', path: '/debtors', icon: CircleDollarSign, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'receivablePayable', label: 'دریافتنی‌ها و پرداختنی‌ها', icon: Activity, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'fixedAssets', label: 'دارایی‌های ثابت', icon: Building2, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'budgets', label: 'بودجه و مراکز هزینه', icon: FolderKanban, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },
  { id: 'fiscalPeriods', label: 'دوره‌های مالی و بستن حساب‌ها', icon: CalendarDays, group: 'حسابداری و دفاتر', roles: ['creator','admin','sarraaf'] },

  { id: 'currencies', label: 'تعریف اسعار', path: '/currencies', icon: Coins, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'agencyNetwork', label: 'شبکه نمایندگی‌ها', path: '/agency-network', icon: Network, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'marketRates', label: 'نرخ بازار صراف‌ها', icon: ChartNoAxesCombined, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'chat', label: 'گروه و چت صراف‌ها', path: '/chat', icon: MessagesSquare, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'market', label: 'بازار صراف‌ها', path: '/sarraaf-market', icon: ShoppingBag, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'sarraafChat', label: 'چت صراف‌ها', path: '/sarraaf-chat', icon: MessagesSquare, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },
  { id: 'multiCompany', label: 'مدیریت چندشرکتی', icon: Building2, group: 'ارز، شبکه و ارتباطات', roles: ['creator','admin','sarraaf'] },

  { id: 'reports', label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'onlineProducts', label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf'] },
  { id: 'support', label: 'پشتیبانی', path: '/support', icon: Headphones, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'assistant', label: 'هوش مصنوعی', path: '/assistant', icon: Bot, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'settings', label: 'تنظیمات', path: '/settings', icon: Settings, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf','employee'] },
  { id: 'paymentGateway', label: 'درگاه پرداخت', path: '/payment-gateway', icon: FileCheck, group: 'گزارش‌ها و خدمات', roles: ['creator','admin','sarraaf'] },

  { id: 'auditLog', label: 'ردپای حسابرسی', icon: ClipboardCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'documents', label: 'مرکز اسناد', icon: Files, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'approvals', label: 'گردش تأییدها', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'kyc', label: 'احراز هویت مشتری', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'compliance', label: 'کنترل داخلی و تطبیق', icon: ShieldCheck, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'backup', label: 'پشتیبان‌گیری و بازیابی', path: '/backup', icon: Database, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf'] },
  { id: 'notifications', label: 'اعلان‌ها', path: '/notifications', icon: Bell, group: 'امنیت و اسناد', roles: ['creator','admin','sarraaf','employee'] },
];

// Keep shell navigation status aligned with FeatureGate and the shared feature catalog.
const MODULE_FEATURE_KEYS = {
  home: 'dashboard', customers: 'customers', customerLedger: 'accounts_receivable',
  agents: 'agents', branchLedger: 'agents', internalBranches: 'agency_network',
  cash: 'cash', banks: 'bank', dadogereft: 'dadogereft', trade: 'trade',
  sendTransfer: 'transfers', receiveTransfer: 'transfers', transferBook: 'transfer_book',
  expenses: 'cash', convert: 'convert', treasury: 'treasury', interexchange: 'intercompany',
  journal: 'journal', journalEntry: 'journal', ledger: 'general_ledger',
  chartAccounts: 'chart_of_accounts', subsidiaryLedger: 'subsidiary_ledger',
  trialBalance: 'trial_balance', debitCredit: 'trial_balance', balanceSheet: 'balance_sheet',
  reconciliation: 'reconciliation', profit: 'profit_loss', cashFlow: 'cash_flow',
  debtors: 'debtors', receivablePayable: 'accounts_payable', fixedAssets: 'fixed_assets',
  budgets: 'budgets', fiscalPeriods: 'period_close', currencies: 'currencies',
  agencyNetwork: 'agency_network', marketRates: 'sarraaf_market', chat: 'sarraaf_chat',
  market: 'sarraaf_market', sarraafChat: 'sarraaf_chat', multiCompany: 'multi_company',
  reports: 'reports', onlineProducts: 'online_products', support: 'support',
  assistant: 'assistant', settings: 'settings', paymentGateway: 'payment_gateway',
  auditLog: 'audit_log', documents: 'document_center', approvals: 'approvals', kyc: 'kyc',
  compliance: 'compliance', backup: 'backup', notifications: 'notifications',
};

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

function ModuleLink({ item, compact = false, features = [], profile, profileLoading = false, paidSystemEnabled, paidSystemLoading = false, openUpgrade, onNavigate }) {
  const Icon = item.icon;
  const location = useLocation();
  const featureKey = item.featureKey || MODULE_FEATURE_KEYS[item.id];
  const featureStatus = featureKey ? getFeatureStatus(features || [], featureKey) : 'active';
  const featureDisabled = featureKey ? !isFeatureEnabled(features || [], featureKey) || featureStatus === 'disabled' : false;
  const featureUpdating = featureStatus === 'updating';
  const isSystemAdmin = ['creator', 'admin'].includes(String(profile?.role || '').toLowerCase());
  const tierLocked = Boolean(featureKey && profile && !profileLoading && !paidSystemLoading && !isSystemAdmin && paidSystemEnabled !== false &&
    !isFeatureAccessible(features || [], featureKey, profile, paidSystemEnabled));
  if (featureDisabled || featureUpdating || tierLocked) {
    return tierLocked ? (
        <button type="button" title="برای دسترسی، سطح اشتراک را ارتقا دهید" aria-label={item.label + ' — ارتقای اشتراک'}
          onClick={() => { onNavigate?.(); openUpgrade?.(featureKey); }}
          className={compact
            ? 'flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-2 py-2 text-center text-[11px] font-semibold text-blue-900 shadow-sm'
            : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-200 hover:bg-white/10'}>
          <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} />
          <span className={compact ? 'leading-tight' : 'flex-1 text-right'}>{item.label}</span>
          <span className="text-[10px] whitespace-nowrap">{compact ? 'قفل' : 'ارتقای اشتراک'}</span>
        </button>
      ) : (
        <div aria-disabled="true" title={featureUpdating ? 'این قابلیت در حال تکمیل است' : 'این قابلیت غیرفعال است'}
          className={compact
            ? 'flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2 py-2 text-center text-[11px] text-slate-500'
            : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed'}>
          <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} />
          <span className={compact ? 'leading-tight' : 'flex-1'}>{item.label}</span>
          {!compact && <span className="text-[10px] whitespace-nowrap">{featureUpdating ? 'در حال تکمیل' : 'غیرفعال'}</span>}
        </div>
    );
  }
  return (
    <NavLink to={item.id === 'debtors' ? '/debtors' : (item.id === 'home' ? '/dashboard' : '/dashboard?module=' + (WORKSPACE_TARGETS[item.id] || 'home'))} end={item.id === 'home'} onClick={onNavigate}
      className={() => {
        const isCurrent = item.id === 'debtors'
          ? location.pathname === '/debtors'
          : item.id === 'home'
            ? location.pathname === '/dashboard' && !location.search
            : location.pathname === '/dashboard' && new URLSearchParams(location.search).get('module') === (WORKSPACE_TARGETS[item.id] || 'home');
        return compact
          ? `flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] leading-tight transition-all ${isCurrent ? 'border-[#164b87] bg-gradient-to-br from-[#164b87] to-[#2767a5] text-white shadow-md' : 'border-[#d5e2f0] bg-white text-[#24496d] shadow-sm hover:border-blue-300 hover:bg-blue-50'}`
          : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${isCurrent ? 'bg-gradient-to-l from-blue-700 to-blue-600 text-white shadow-md' : 'text-slate-200 hover:bg-white/10'}`;
      }}>
      <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4 shrink-0'} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Version21Layout() {
  const { user, logout } = useAuth();
  const { data: features = [] } = useFeatures();
  const { data: profile, isLoading: profileLoading } = useSarraafProfile(user?.id);
  const { data: paidSystemEnabled, isLoading: paidSystemLoading } = usePaidSystemEnabled();
  const { openUpgrade } = useUpgrade();
  const accessProfile = { ...(profile || user || {}), role: user?.role || profile?.role };
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopSiteMode, setDesktopSiteMode] = useState(detectDesktopSiteMode);
  useEffect(() => { const update = () => setDesktopSiteMode(detectDesktopSiteMode()); window.addEventListener('resize', update); window.addEventListener('orientationchange', update); return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); }; }, []);
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
      {location.pathname !== '/dashboard' && <aside className={`${desktopSiteMode ? "flex" : "hidden lg:flex"} w-64 shrink-0 h-screen sticky top-0 flex-col bg-gradient-to-b from-[#102b4c] via-[#12385f] to-[#0e2745] text-white print:hidden`}>
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
              <div className="space-y-1">{items.map(item => <ModuleLink key={item.id} item={item} features={features} profile={accessProfile} profileLoading={profileLoading} paidSystemEnabled={paidSystemEnabled} paidSystemLoading={paidSystemLoading} openUpgrade={openUpgrade} />)}</div>
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
        {location.pathname !== '/dashboard' && <header className="sticky top-0 z-30 border-b border-[#d5e2f0] bg-gradient-to-l from-white to-[#edf4fd] pt-[env(safe-area-inset-top)] shadow-sm">
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
        <main className="flex-1 min-w-0 px-2 py-3 pb-24 sm:p-3 md:p-5 xl:p-7 lg:pb-5">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500">
          حساب صراف
        </footer>
        {location.pathname !== '/dashboard' && !desktopSiteMode && (
          <>
            <nav className="v21-route-mobile-dock fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-2 border-t border-[#d5e2f0] bg-white/95 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] shadow-[0_-6px_24px_rgba(16,43,76,0.10)] backdrop-blur lg:hidden" aria-label="ناوبری سریع برنامه">
              {['home','customers','cash'].map(id => {
                const item = modules.find(entry => entry.id === id);
                return item ? <ModuleLink key={id} item={item} compact features={features} profile={accessProfile} profileLoading={profileLoading} paidSystemEnabled={paidSystemEnabled} paidSystemLoading={paidSystemLoading} openUpgrade={openUpgrade} /> : null;
              })}
              <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="همه بخش‌های برنامه" className="v21-route-more flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-[#d5e2f0] bg-[#f3f7fc] px-2 py-2 text-[11px] font-semibold text-[#164b87] shadow-sm">
                <MoreHorizontal className="h-5 w-5" /><span>همه بخش‌ها</span>
              </button>
            </nav>
            {mobileNavOpen && (
              <div className="v21-route-mobile-overlay fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-2 backdrop-blur-[2px] sm:items-center sm:p-4" role="presentation" onClick={() => setMobileNavOpen(false)}>
                <section role="dialog" aria-modal="true" aria-label="همه بخش‌های حساب صراف" className="v21-route-mobile-sheet flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#d5e2f0] bg-[#f3f7fc] shadow-2xl" onClick={event => event.stopPropagation()}>
                  <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div><b className="text-sm text-slate-900">همه بخش‌های حساب صراف</b><p className="mt-1 text-[11px] text-slate-500">دسترسی بر اساس نقش و مجوز حساب شما</p></div>
                    <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="بستن فهرست" className="rounded-lg border border-slate-200 p-2 text-slate-600"><X className="h-5 w-5"/></button>
                  </header>
                  <nav className="v21-route-mobile-groups min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" aria-label="فهرست کامل ماژول‌ها">
                    {GROUPS.map(group => {
                      const items = modules.filter(item => item.group === group);
                      if (!items.length) return null;
                      return <section key={group} className="v21-route-mobile-group rounded-xl border border-[#d5e2f0] bg-white p-3 shadow-sm">
                        <h2>{group}</h2>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">{items.map(item => <ModuleLink key={item.id} item={item} compact features={features} profile={accessProfile} profileLoading={profileLoading} paidSystemEnabled={paidSystemEnabled} paidSystemLoading={paidSystemLoading} openUpgrade={openUpgrade} onNavigate={() => setMobileNavOpen(false)} />)}</div>
                      </section>;
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
