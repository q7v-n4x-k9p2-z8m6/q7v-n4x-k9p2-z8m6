import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUPS = [
  ['داشبورد', ['dashboard', 'customers', 'trade', 'dadogereft', 'cash', 'bank', 'receipt']],
  ['حواله', ['transfer_send', 'transfer_receive', 'transfer_book']],
  ['مالی و حسابداری', ['reports', 'profit_loss', 'debtors', 'journal', 'general_ledger', 'balance_sheet', 'reconciliation']],
  ['بازار و نرخ', ['currencies', 'sarraaf_market', 'convert']],
  ['امکانات کسب‌وکار', ['agents', 'agency_network', 'online_products', 'payment_gateway', 'sarraaf_chat', 'chat_groups']],
  ['سیستم', ['settings', 'backup', 'support']],
];

export default function WorkspaceNavigation({ items }) {
  const { pathname } = useLocation();
  const activePath = items.filter(item => pathname === item.path || pathname.startsWith(item.path + '/')).sort((a, b) => b.path.length - a.path.length)[0]?.path;
  return (
    <nav aria-label="منوی اصلی صراف" className="w-full overflow-x-auto bg-[#e8eef8] px-2 py-2">
      <div className="flex min-w-max items-stretch gap-2">
        {GROUPS.map(([title, keys]) => {
          const entries = keys.map(key => items.find(item => item.featureKey === key)).filter(Boolean);
          if (!entries.length) return null;
          return (
            <section key={title} className="flex min-w-[104px] flex-col items-center gap-1 rounded-xl border border-blue-100 bg-white/80 px-2 py-1.5 shadow-sm">
              <h2 className="text-[10px] font-bold text-[#244f83] whitespace-nowrap">{title}</h2>
              <div className="flex items-center justify-center gap-1">
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
                        'flex min-w-[66px] max-w-[82px] flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 text-center transition-colors',
                        active
                          ? 'border-blue-400 bg-blue-100 text-blue-900 shadow-sm'
                          : 'border-transparent text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                      )}
                    >
                      <Icon className="h-5 w-5 text-[#1456a0]" strokeWidth={2} />
                      <span className="text-[10px] font-semibold leading-tight">{item.label}</span>
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