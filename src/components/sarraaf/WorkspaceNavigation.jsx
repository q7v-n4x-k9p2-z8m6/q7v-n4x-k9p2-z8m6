import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const GROUPS = [
  ['داشبورد', ['dashboard', 'customers', 'trade', 'dadogereft', 'cash', 'bank', 'receipt']],
  ['حواله', ['transfer_send', 'transfer_receive', 'transfer_book']],
  ['مالی و حسابداری', ['reports', 'profit_loss', 'debtors', 'journal', 'general_ledger', 'balance_sheet', 'reconciliation']],
  ['بازار و نرخ', ['currencies', 'sarraaf_market', 'convert']],
  ['امکانات کسب‌وکار', ['agents', 'agency_network', 'online_products', 'payment_gateway', 'sarraaf_chat', 'chat_groups']],
  ['حسابداری سازمانی', ['chart_of_accounts', 'subsidiary_ledger', 'trial_balance', 'cash_flow', 'cost_centers', 'fiscal_periods', 'period_close', 'fixed_assets', 'accounts_receivable', 'accounts_payable', 'budgets', 'treasury', 'intercompany', 'multi_company', 'kyc', 'compliance', 'audit_log', 'document_center', 'approvals', 'fx_exposure', 'tax', 'standards', 'aml_screening', 'fx_revaluation', 'consolidation', 'internal_controls', 'data_governance']],
  ['سیستم', ['settings', 'backup', 'support', 'assistant']],
];

const GROUP_TONES = [
  ['from-blue-600 to-sky-600', 'border-blue-200', 'text-blue-800'],
  ['from-emerald-600 to-teal-600', 'border-emerald-200', 'text-emerald-800'],
  ['from-violet-600 to-indigo-600', 'border-violet-200', 'text-violet-800'],
  ['from-amber-500 to-orange-600', 'border-amber-200', 'text-amber-800'],
  ['from-rose-600 to-pink-600', 'border-rose-200', 'text-rose-800'],
  ['from-slate-600 to-slate-700', 'border-slate-200', 'text-slate-700'],
  ['from-cyan-600 to-blue-600', 'border-cyan-200', 'text-cyan-800'],
];

export default function WorkspaceNavigation({ items }) {
  const { pathname } = useLocation();
  const activePath = items.filter(item => pathname === item.path || pathname.startsWith(item.path + '/')).sort((a, b) => b.path.length - a.path.length)[0]?.path;
  return (
    <nav aria-label="منوی اصلی صراف" className="w-full overflow-x-auto bg-gradient-to-b from-[#eaf1fc] to-[#dce8f8] px-2 py-2">
      <div className="flex min-w-max items-start gap-2">
        {GROUPS.map(([title, keys], groupIndex) => {
          const [iconTone, borderTone, titleTone] = GROUP_TONES[groupIndex % GROUP_TONES.length];
          const entries = keys.map(key => items.find(item => item.featureKey === key)).filter(Boolean);
          if (!entries.length) return null;
          return (
            <section key={title} className={`flex max-h-[184px] min-w-[148px] max-w-[420px] flex-col gap-1.5 overflow-hidden rounded-xl border ${borderTone} bg-gradient-to-b from-white to-[#edf4ff] p-2 shadow-sm`}>
              <h2 className={`flex items-center justify-center rounded-lg bg-white/80 px-1 py-1.5 text-[11px] font-extrabold ${titleTone}`}><span className={`mr-1 inline-block h-2 w-2 rounded-full bg-gradient-to-br ${iconTone}`} />{title}</h2>
              <div className="flex flex-wrap items-center justify-center gap-1 overflow-y-auto">
                {entries.map(item => {
                  const Icon = item.icon;
                  const active = item.path === activePath;
                  return (
                    <Link
                      key={item.featureKey}
                      to={item.path}
                      aria-current={active ? 'page' : undefined}
                      title={item.label}
                      className={cn(
                        'flex min-h-[66px] min-w-[68px] max-w-[82px] flex-col items-center justify-center gap-1.5 rounded-xl border border-transparent px-1.5 py-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm',
                        active
                          ? 'border-[#7da6df] bg-gradient-to-b from-[#dceaff] to-[#c8ddfa] text-[#0b3f88] shadow-sm'
                          : 'text-slate-700 hover:border-blue-200 hover:bg-white/90'
                      )}
                    >
                      <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${iconTone} text-white shadow-sm ring-1 ring-white/70`}><Icon className="h-4 w-4" strokeWidth={2.1} /></span>
                      <span className="text-[10px] font-bold leading-tight">{item.label}</span>
                      {item.featureStatus === 'updating' && <span className="text-[8px] text-amber-700">به‌روزرسانی</span>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}