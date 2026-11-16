import React from 'react';
import { Link } from 'react-router-dom';
import { buildSummaryCards } from '@/lib/dashboardStats';
import { ArrowLeftRight, Repeat, Send, Download, Receipt, BookOpen, Landmark, FileText, ShoppingBag } from 'lucide-react';
import DashboardIdentityBar from '@/components/sarraaf/DashboardIdentityBar';
import DesktopSummaryCards from '@/components/sarraaf/DesktopSummaryCards';
import CurrencyRatesTable from '@/components/sarraaf/CurrencyRatesTable';
import DashboardCharts from '@/components/sarraaf/DashboardCharts';
import RecentTransactionsCard from '@/components/sarraaf/RecentTransactionsCard';
import DesktopSidePanel from '@/components/sarraaf/DesktopSidePanel';
import DesktopPlanPanel from '@/components/sarraaf/DesktopPlanPanel';

const GROUPS = [
  { title: 'تعاریف و دفاتر', icon: BookOpen, paths: ['/customers', '/agents', '/debtors', '/transfer-book', '/journal', '/general-ledger'] },
  { title: 'صندوق و بانک', icon: Landmark, paths: ['/cash', '/bank', '/currencies', '/convert'] },
  { title: 'عملیات صرافی', icon: ArrowLeftRight, paths: ['/dadogereft', '/trade', '/transfers/send', '/transfers/receive'] },
  { title: 'حسابداری و گزارشات', icon: FileText, paths: ['/reports', '/profit-loss', '/balance-sheet', '/reconciliation', '/receipt'] },
  { title: 'امکانات تکمیلی', icon: ShoppingBag, paths: ['/online-products', '/sarraaf-market', '/sarraaf-chat', '/chat', '/settings', '/assistant'] },
];

const QUICK_ACTIONS = [
  { label: 'معامله اسعار', path: '/trade', icon: Repeat, tone: 'from-violet-600 to-indigo-600' },
  { label: 'حواله دریافتی', path: '/transfers/receive', icon: Download, tone: 'from-emerald-600 to-teal-600' },
  { label: 'حواله ارسالی', path: '/transfers/send', icon: Send, tone: 'from-orange-500 to-amber-600' },
  { label: 'ثبت عملیات صرافی', path: '/dadogereft', icon: ArrowLeftRight, tone: 'from-blue-600 to-sky-600' },
  { label: 'ثبت دریافت', path: '/receipt', icon: Receipt, tone: 'from-rose-600 to-pink-600' },
];

export default function DesktopDashboard({ profile, features, userRole, paidSystemEnabled, currencies, curLoading, txs, txLoading, customers, custLoading, treasuryBalances, treasuryLoading, bankBalances, bankLoading, debtorCount, plan, links = [] }) {
  const cards = buildSummaryCards({
    txs, customers, treasuryBalances, bankBalances, debtorCount, currencies,
    loading: { bank: bankLoading, treasury: treasuryLoading, customers: custLoading, sent: txLoading, received: txLoading },
  });

  const usedPaths = new Set(GROUPS.flatMap(group => group.paths));
  const grouped = [
    ...GROUPS.map(group => ({
      title: group.title,
      entries: group.paths.map(path => links.find(link => link.path === path)).filter(Boolean),
    })),
    { title: 'سایر امکانات', entries: links.filter(link => !usedPaths.has(link.path)) },
  ].filter(group => group.entries.length);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#164f9d] bg-gradient-to-l from-[#073b83] via-[#1557a8] to-[#0b438f] px-4 py-3 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/15 p-2"><Receipt className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-extrabold">مرکز عملیات صرافی</h1>
              <p className="text-xs text-blue-100">داشبورد مدیریت حساب صراف</p>
            </div>
          </div>
          <span className="text-xs text-blue-100">{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}</span>
        </div>
      </div>

      <DashboardIdentityBar profile={profile} />
      <DesktopSummaryCards cards={cards} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {grouped.map(group => (
          <section key={group.title} className="overflow-hidden rounded-xl border border-[#b7cbe8] bg-gradient-to-b from-[#fdfefe] to-[#edf4ff] shadow-card">
            <div className="flex items-center justify-between border-b border-[#c4d5ee] bg-gradient-to-l from-[#d8e7fb] to-[#eef4fd] px-3 py-2"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#164f9d] shadow-sm"><group.icon className="h-4 w-4" /></span><h2 className="text-sm font-extrabold text-slate-800">{group.title}</h2></div><span className="rounded-full border border-blue-200 bg-white/80 px-2 py-0.5 text-[10px] font-bold text-blue-800">{group.entries.length}</span></div>
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {group.entries.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path} className="group flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-[#c6d5e9] bg-gradient-to-b from-white to-[#edf4ff] px-2 py-3 text-center text-slate-800 shadow-[0_2px_7px_rgba(28,74,130,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${link.gradient || 'from-blue-600 to-blue-700'} text-white shadow-md ring-1 ring-white/70 transition group-hover:scale-105`}><Icon className="h-5 w-5" strokeWidth={2.2} /></span>
                    <span className="text-xs font-bold leading-tight">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-blue-200 bg-white p-3 shadow-card">
        <h2 className="mb-2 text-sm font-extrabold text-slate-800">عملیات سریع</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.path + action.label} to={action.path} className="group flex min-h-[68px] items-center justify-center gap-2 rounded-xl border border-[#d0dced] bg-gradient-to-b from-white to-[#edf4ff] px-2 py-2 text-center text-xs font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${action.tone} text-white shadow-sm`}><Icon className="h-4 w-4" /></span>
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
        <div className="space-y-5 min-w-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CurrencyRatesTable currencies={currencies} isLoading={curLoading} />
            <DashboardCharts type="line" transactions={txs} isLoading={txLoading} />
          </div>
          <RecentTransactionsCard transactions={txs || []} isLoading={txLoading} />
        </div>
        <div className="space-y-4 min-w-0">
          <DesktopSidePanel currencies={currencies} features={features} profile={profile} userRole={userRole} paidSystemEnabled={paidSystemEnabled} />
          <DesktopPlanPanel {...plan} />
        </div>
      </div>
    </div>
  );
}
