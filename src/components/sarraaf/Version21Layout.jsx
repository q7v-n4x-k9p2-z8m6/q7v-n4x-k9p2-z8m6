import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, Wallet, Landmark, ArrowLeftRight, Send, ScrollText,
  ClipboardList, Coins, FileSpreadsheet, BarChart3, Scale,
  MessagesSquare, Bot, ShoppingBag, Headphones,
  Construction, LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Production shell for version 21. All enabled items open existing, authenticated
// A1 routes; this component contains no demo records, local database, or mock CRUD.
const MODULES = [
  { id: 'home', label: 'میز کار', path: '/dashboard', icon: Home, group: 'عمومی', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'customers', label: 'تعریف مشتریان', path: '/customers', icon: Users, group: 'تعاریف و دفاتر', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'customerLedger', label: 'دفتر حساب مشتریان', pending: true, icon: ClipboardList, group: 'تعاریف و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'branches', label: 'تعریف نمایندگی‌ها', pending: true, icon: Construction, group: 'تعاریف و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'branchLedger', label: 'دفتر حساب نمایندگی‌ها', pending: true, icon: ClipboardList, group: 'تعاریف و دفاتر', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'cash', label: 'صندوق‌ها و موجودی', path: '/cash', icon: Wallet, group: 'صندوق و بانک', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'banks', label: 'بانک و چک', path: '/bank', icon: Landmark, group: 'صندوق و بانک', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'exchange', label: 'خرید و فروش اسعار', path: '/trade', icon: ArrowLeftRight, group: 'عملیات صرافی', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'remittance', label: 'دفتر حواله‌ها', path: '/transfers/send', icon: Send, group: 'عملیات صرافی', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', pending: true, icon: Wallet, group: 'عملیات صرافی', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'journal', label: 'دفتر روزنامچه', path: '/journal', icon: ScrollText, group: 'حسابداری', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'ledger', label: 'دفتر کل', path: '/general-ledger', icon: ClipboardList, group: 'حسابداری', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'accounts', label: 'کدینگ حساب‌ها', pending: true, icon: ClipboardList, group: 'حسابداری', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'currencies', label: 'تعریف اسعار', path: '/currencies', icon: Coins, group: 'تنظیمات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'reports', label: 'گزارش عملیات', path: '/reports', icon: FileSpreadsheet, group: 'گزارشات', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'profit', label: 'مفاد و زیان', path: '/profit-loss', icon: BarChart3, group: 'گزارشات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'balance', label: 'بیلانس عمومی', path: '/balance-sheet', icon: Scale, group: 'گزارشات', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'sarraafGroups', label: 'گروه و چت', path: '/chat', icon: MessagesSquare, group: 'امکانات تکمیلی', roles: ['creator', 'admin', 'sarraaf'] },
  { id: 'assistant', label: 'هوش مصنوعی', path: '/assistant', icon: Bot, group: 'امکانات تکمیلی', roles: ['creator', 'admin', 'sarraaf', 'employee'] },
  { id: 'products', label: 'محصولات آنلاین', path: '/online-products', icon: ShoppingBag, group: 'امکانات تکمیلی', roles: ['creator', 'admin', 'sarraaf'] },
];

const GROUPS = ['عمومی', 'تعاریف و دفاتر', 'صندوق و بانک', 'عملیات صرافی', 'حسابداری', 'گزارشات', 'تنظیمات', 'امکانات تکمیلی'];

function ModuleLink({ item, compact = false }) {
  const Icon = item.icon;
  if (item.pending) {
    return (
      <div aria-disabled="true" title="این بخش تا اتصال امن به اطلاعات واقعی غیرفعال است"
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 cursor-not-allowed ${compact ? 'min-w-max' : ''}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <span className="text-[10px] whitespace-nowrap">در حال اتصال</span>
      </div>
    );
  }
  return (
    <NavLink to={item.path} end={item.path === '/dashboard'}
      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${compact ? 'min-w-max' : ''} ${isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-200 hover:bg-white/10'}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Version21Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'user';
  const modules = MODULES.filter(item => item.roles.includes(role));
  const current = modules.find(item => item.path && (location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  const isAssistant = location.pathname === '/assistant';

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0 flex-col bg-slate-900 text-white print:hidden">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-lg font-extrabold">حساب صراف</div>
          <div className="mt-1 text-xs text-slate-400">هسته عملیاتی نسخه ۲۱</div>
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
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
            <div className="min-w-0">
              <div className="font-bold text-sm md:text-base">حساب صراف <span className="text-teal-700">· نسخه ۲۱</span></div>
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
          <nav className="lg:hidden flex gap-1 overflow-x-auto px-3 pb-3">
            {modules.filter(item => ['home', 'customers', 'cash', 'exchange', 'remittance', 'journal', 'ledger', 'reports'].includes(item.id)).map(item => <ModuleLink key={item.id} item={item} compact />)}
          </nav>
        </header>
        <main className="flex-1 min-w-0 p-3 md:p-5 xl:p-7">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] text-slate-500">
          نسخه ۲۱ · اطلاعات از حساب و دیتابیس اصلی A1 خوانده می‌شود؛ بخش‌های متصل‌نشده دادهٔ نمونه نمایش نمی‌دهند.
        </footer>
      </div>
    </div>
  );
}
