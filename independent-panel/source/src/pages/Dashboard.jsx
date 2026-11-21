import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  Banknote,
  Send,
  Users,
  TrendingUp,
  ArrowUpLeft,
  Wallet,
  ShieldCheck,
  Map,
} from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import StatCard from '@/components/ui-kit/StatCard';
import SectionCard from '@/components/ui-kit/SectionCard';
import DataTable from '@/components/ui-kit/DataTable';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { useRecords, useLedger } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { DOC_TYPES } from '@/lib/accounting/chart';
import { nativeBalances, profitAndLoss, customerBalances } from '@/lib/accounting/queries';
import { num, dec, faDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { to: '/trade', label: 'ثبت معامله', icon: ArrowLeftRight, permission: 'trade.post' },
  { to: '/cash', label: 'دخل و خرج صندوق', icon: Banknote, permission: 'cash.post' },
  { to: '/transfers', label: 'حواله جدید', icon: Send, permission: 'transfers.post' },
  { to: '/customers', label: 'مشتری جدید', icon: Users, permission: 'customers.manage' },
];

export default function Dashboard() {
  const { role, roleLabel, can } = useRole();
  const { items: documents, loading: docLoading } = useRecords('Document');
  const { items: customers } = useRecords('Customer');
  const { items: transfers } = useRecords('Transfer');
  const { entries } = useLedger();

  const stats = useMemo(() => {
    const pnl = profitAndLoss(entries);
    const balances = nativeBalances(entries.filter((entry) => entry.account_type === 'safe'));
    const safesValue = entries.reduce((sum, entry) => {
      if (entry.account_type !== 'safe') return sum;
      return sum + (entry.side === 'debit' ? Number(entry.value) : -Number(entry.value));
    }, 0);
    const openTransfers = transfers.filter((item) => ['pending', 'processing'].includes(item.status)).length;
    const debtors = customerBalances(entries).filter((row) => row.value < 0).length;
    return {
      pnl,
      safeCount: balances.length,
      safesValue,
      openTransfers,
      debtors,
    };
  }, [entries, transfers]);

  const recent = useMemo(
    () =>
      documents
        .slice()
        .sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)))
        .slice(0, 6),
    [documents]
  );

  const safeRows = useMemo(
    () =>
      nativeBalances(entries.filter((entry) => entry.account_type === 'safe')).map((row) => ({
        id: row.key,
        name: row.account_name,
        balances: row.balances,
      })),
    [entries]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={`میزکار ${roleLabel}`}
        description="نمای کلی وضعیت صرافی بر پایهٔ اسناد ثبت‌شده در همین محیط آزمایشی. هیچ داده‌ای از صرافی واقعی در این برنامه وجود ندارد."
        icon={Wallet}
        badge="داده نمایشی"
        actions={
          <Link
            to="/roadmap"
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground/80 transition-colors hover:bg-secondary"
          >
            <Map className="h-3.5 w-3.5" />
            وضعیت پیاده‌سازی
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="مشتریان ثبت‌شده" value={num(customers.length)} hint={`${num(stats.debtors)} مشتری بدهکار`} icon={Users} tone="sky" />
        <StatCard label="ارزش موجودی صندوق‌ها" value={`${dec(stats.safesValue)} AFN`} hint={`${num(stats.safeCount)} صندوق فعال`} icon={Wallet} tone="emerald" />
        <StatCard label="حواله‌های باز" value={num(stats.openTransfers)} hint="در انتظار یا در جریان" icon={Send} tone="amber" />
        <StatCard label="سود ثبت‌شده دوره" value={`${dec(stats.pnl.profit)} AFN`} hint={`درآمد ${dec(stats.pnl.income)} / هزینه ${dec(stats.pnl.expense)}`} icon={TrendingUp} tone="violet" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.filter((action) => can(action.permission)).map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-secondary/60"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.9} />
              </span>
              <span className="flex-1 text-[12px] font-bold text-foreground">{action.label}</span>
              <ArrowUpLeft className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SectionCard
          title="آخرین اسناد"
          description="همهٔ اسناد از لایهٔ حسابداری دوطرفه ثبت می‌شوند"
          className="lg:col-span-2"
          actions={
            <Link to="/journal" className="text-[11px] font-bold text-primary hover:underline">
              دفتر روزنامه
            </Link>
          }
        >
          <DataTable
            rows={recent}
            empty={{ title: docLoading ? 'در حال بارگذاری…' : 'هنوز سندی ثبت نشده', description: 'از «ثبت معامله» یا «دخل و خرج صندوق» شروع کنید.' }}
            columns={[
              {
                key: 'doc_number',
                label: 'شماره سند',
                render: (row) => <span className="num font-bold">{row.doc_number}</span>,
              },
              {
                key: 'doc_type',
                label: 'نوع',
                render: (row) => (
                  <StatusBadge
                    label={DOC_TYPES[row.doc_type]?.label || row.doc_type}
                    tone={DOC_TYPES[row.doc_type]?.tone || 'slate'}
                  />
                ),
              },
              { key: 'date', label: 'تاریخ', render: (row) => faDate(row.date) },
              {
                key: 'amount',
                label: 'مبلغ',
                render: (row) => (
                  <span className="num">
                    {dec(row.amount)} <span className="text-[10px] text-muted-foreground">{row.currency}</span>
                  </span>
                ),
              },
              {
                key: 'base_value',
                label: 'ارزش پایه',
                hideOnMobile: true,
                render: (row) => <span className="num">{dec(row.base_value)} AFN</span>,
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="موجودی صندوق‌ها" description="بر پایهٔ ردیف‌های دفتر">
          {safeRows.length ? (
            <div className="flex flex-col gap-1.5">
              {safeRows.map((safe) => (
                <div key={safe.id} className="flex items-center justify-between rounded-lg border border-border/70 px-2.5 py-2">
                  <span className="text-[12px] font-bold text-foreground">{safe.name}</span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {Object.entries(safe.balances).map(([currency, amount]) => (
                      <span
                        key={currency}
                        className={cn(
                          'num rounded-md px-1.5 py-0.5 text-[10.5px] font-bold',
                          amount < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {dec(amount)} {currency}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px] leading-6 text-muted-foreground">
              هنوز صندوقی با گردش مالی ثبت نشده است. از تنظیمات، صندوق تعریف کنید.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="وضعیت این نسخه" description="خلاصهٔ صادقانه از آنچه پیاده شده و آنچه باقی مانده">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5">
            <p className="flex items-center gap-1 text-[11.5px] font-bold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" /> پیاده‌شده
            </p>
            <p className="mt-1 text-[10.5px] leading-5 text-emerald-900/80">
              ثبت معامله، صندوق، حواله، مشتریان، دفتر روزنامه، دفتر کل، تراز آزمایشی و ابطال سند با سند معکوس.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
            <p className="text-[11.5px] font-bold text-amber-800">نمونهٔ نمایشی</p>
            <p className="mt-1 text-[10.5px] leading-5 text-amber-900/80">
              کاربران و نقش‌ها شبیه‌سازی شده‌اند؛ داده‌ها نمونه و قابل پاک‌سازی هستند.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-2.5">
            <p className="text-[11.5px] font-bold text-foreground/80">باقی‌مانده</p>
            <p className="mt-1 text-[10.5px] leading-5 text-muted-foreground">
              احراز هویت واقعی، اتصال پایگاه داده، پرداخت، پیامک و بکاپ. جزئیات در صفحهٔ وضعیت و نگاشت.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}