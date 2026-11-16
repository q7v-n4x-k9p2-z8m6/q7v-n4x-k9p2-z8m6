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

export default function WorkspaceNavigation({ items }) {
  const { pathname } = useLocation();
  const activePath = items.filter(item => pathname === item.path || pathname.startsWith(item.path + '/')).sort((a, b) => b.path.length - a.path.length)[0]?.path;
  return (
    <nav aria-label="منوی اصلی صراف" className="w-full overflow-x-auto bg-[#e8eef8] px-2 py-2">
      <div className="flex min-w-max items-start gap-2">
        {GROUPS.map(([title, keys]) => {
          const entries = keys.map(key => items.find(item => item.featureKey === key)).filter(Boolean);
          if (!entries.length) return null;
          return (
            <section key={title} className="flex max-h-[150px] min-w-[128px] max-w-[420px] flex-col gap-1 overflow-hidden rounded-xl border border-blue-100 bg-white/90 p-1.5 shadow-sm">
              <h2 className="px-1 text-center text-[10px] font-bold text-[#244f83]">{title}</h2>
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
                        'flex min-h-[58px] min-w-[64px] max-w-[76px] flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center transition-colors',
                        active
                          ? 'border-blue-400 bg-blue-100 text-blue-900 shadow-sm'
                          : 'border-transparent text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                      )}
                    >
                      <Icon className="h-5 w-5 text-[#1456a0]" strokeWidth={2} />
                      <span className="text-[9px] font-semibold leading-tight">{item.label}</span>
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