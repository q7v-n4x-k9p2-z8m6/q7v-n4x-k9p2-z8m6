import React from 'react';
import { Link } from 'react-router-dom';
import { buildSummaryCards } from '@/lib/dashboardStats';
import { ArrowLeftRight, Repeat, Send, Download, Banknote, Receipt } from 'lucide-react';
import DashboardIdentityBar from '@/components/sarraaf/DashboardIdentityBar';
import DesktopSummaryCards from '@/components/sarraaf/DesktopSummaryCards';
import CurrencyRatesTable from '@/components/sarraaf/CurrencyRatesTable';
import DashboardCharts from '@/components/sarraaf/DashboardCharts';
import RecentTransactionsCard from '@/components/sarraaf/RecentTransactionsCard';
import DesktopSidePanel from '@/components/sarraaf/DesktopSidePanel';
import DesktopPlanPanel from '@/components/sarraaf/DesktopPlanPanel';

const GROUPS = [
  { title: 'تعاریف و دفاتر', paths: ['/customers', '/agents', '/debtors', '/transfer-book', '/journal', '/general-ledger'] },
  { title: 'صندوق و بانک', paths: ['/cash', '/bank', '/currencies', '/convert'] },
  { title: 'عملیات صرافی', paths: ['/dadogereft', '/trade', '/transfers/send', '/transfers/receive'] },
  { title: 'حسابداری و گزارشات', paths: ['/reports', '/profit-loss', '/balance-sheet', '/reconciliation', '/receipt'] },
  { title: 'امکانات تکمیلی', paths: ['/online-products', '/sarraaf-market', '/sarraaf-chat', '/chat', '/settings', '/assistant'] },
];

const QUICK_ACTIONS = [
  { label: 'معامله اسعار', path: '/trade', icon: Repeat },
  { label: 'حواله دریافتی', path: '/transfers/receive', icon: Download },
  { label: 'حواله ارسالی', path: '/transfers/send', icon: Send },
  { label: 'ثبت عملیات صرافی', path: '/dadogereft', icon: ArrowLeftRight },
  { label: 'ثبت دریافت', path: '/receipt', icon: Receipt },
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
      <div className="rounded-xl border border-blue-200 bg-gradient-to-l from-[#174b88] to-[#2866aa] px-4 py-3 text-white shadow-sm">
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
          <section key={group.title} className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-card">
            <h2 className="border-b border-blue-100 bg-gradient-to-l from-blue-100 to-slate-50 px-3 py-2 text-sm font-extrabold text-slate-800">{group.title}</h2>
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {group.entries.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.path} to={link.path} className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-gradient-to-b from-white to-blue-50/60 px-2 py-2 text-center text-slate-800 transition hover:border-blue-300 hover:bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-700" strokeWidth={2.1} />
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
              <Link key={action.path + action.label} to={action.path} className="flex min-h-[62px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[#f5f8fd] px-2 py-2 text-center text-xs font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50">
                <Icon className="h-5 w-5 shrink-0 text-blue-700" />
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
          <DesktopSidePanel currencies={currencies} />
          <DesktopPlanPanel {...plan} />
        </div>
      </div>
    </div>
  );
}
