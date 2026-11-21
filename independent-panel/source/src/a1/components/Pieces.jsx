// a1/components/Pieces.jsx
// انتقال اجزای مشترک A1 از src/components/sarraaf/Pieces.jsx
// تغییر سازگاری: رنگ‌های success/warning که در پیکربندی A1 تعریف شده بودند
// با معادل‌های موجود (emerald/amber) نگاشته شده‌اند تا همان ظاهر بازتولید شود.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronRight } from 'lucide-react';

export function PageHeader({ title, subtitle, icon: Icon, actions, children, showBack }) {
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split('/').filter(Boolean);
  const isChildPage = segments.length > 1;
  const shouldShowBack = showBack ?? isChildPage;

  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#d3e0ef] bg-gradient-to-l from-white to-[#f0f6ff] px-3 py-3 shadow-sm md:flex-wrap md:px-4">
      <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">
        {shouldShowBack && (
          <button type="button" onClick={() => navigate(-1)} aria-label="بازگشت"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted transition-colors hover:bg-muted/80">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1558a5] to-[#347ed0] text-white shadow-md ring-1 ring-white/70 lg:h-11 lg:w-11">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight text-foreground lg:text-xl">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 md:flex-wrap">{actions}</div>}
      {children}
    </div>
  );
}

export function SectionCard({ title, icon: Icon, children, className, actions }) {
  return (
    <Card className={cn('overflow-hidden rounded-xl border border-[#d5e1ef] bg-white shadow-[0_3px_14px_rgba(24,64,112,0.07)]', className)}>
      {(title || Icon) && (
        <div className="flex items-center justify-between border-b border-[#d9e5f2] bg-gradient-to-l from-[#eaf2fd] to-[#f6f9ff] px-4 py-3 lg:px-5 lg:py-3.5">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
            )}
            {title && <h3 className="text-sm font-semibold text-foreground lg:text-base">{title}</h3>}
          </div>
          {actions}
        </div>
      )}
      <CardContent className="p-4 lg:p-5">{children}</CardContent>
    </Card>
  );
}

export function StatCard({ label, value, sub, icon: Icon, gradient }) {
  return (
    <Card className="overflow-hidden rounded-xl border border-white/30 shadow-[0_4px_14px_rgba(25,60,100,0.12)]">
      <CardContent className={cn('relative p-3.5 text-white lg:p-5', gradient && `bg-gradient-to-br ${gradient}`)}>
        <div className="mb-1.5 flex items-start justify-between lg:mb-3">
          <span className="text-[11px] font-medium leading-tight opacity-90 lg:text-sm">{label}</span>
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 lg:h-9 lg:w-9">
              <Icon className="h-4 w-4 opacity-90 lg:h-5 lg:w-5" />
            </div>
          )}
        </div>
        <p className="text-xl font-bold leading-tight tracking-tight lg:text-2xl">{value}</p>
        {sub && <p className="mt-0.5 text-xs opacity-75 lg:text-sm">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function BalanceCard({ label, amounts, accent = 'text-primary' }) {
  return (
    <Card className="overflow-hidden rounded-xl border border-[#d5e1ef] bg-gradient-to-b from-white to-[#f5f9ff] shadow-sm">
      <CardContent className="p-4 lg:p-5">
        <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
        {Object.entries(amounts).length === 0 ? (
          <p className="text-sm font-semibold text-muted-foreground">۰</p>
        ) : (
          <div className="space-y-1.5 lg:space-y-2">
            {Object.entries(amounts).map(([currency, value]) => (
              <div key={currency} className="flex items-center justify-between">
                <span className={cn('text-sm font-bold tabular-nums lg:text-lg', accent)}>
                  {new Intl.NumberFormat('en-US').format(Math.round(value || 0))}
                </span>
                <span className="text-xs font-medium text-muted-foreground lg:text-sm">{currency}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status, labels, variant }) {
  const tone = variant || (
    status === 'active' || status === 'paid' || status === 'approved' || status === 'completed'
      ? 'success'
      : status === 'pending' || status === 'registered'
        ? 'warning'
        : status === 'cancelled' || status === 'rejected' || status === 'suspended'
          ? 'destructive'
          : 'secondary'
  );
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
      tone === 'success' && 'bg-emerald-100 text-emerald-700',
      tone === 'warning' && 'bg-amber-100 text-amber-700',
      tone === 'destructive' && 'bg-rose-100 text-rose-700',
      tone === 'secondary' && 'bg-muted text-muted-foreground',
    )}>
      {labels?.[status] || status}
    </span>
  );
}

export function EditedBadge({ edited }) {
  if (!edited) return null;
  return (
    <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
      ویرایش‌شده
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="mt-1 max-w-[220px] text-xs text-muted-foreground/70">{description}</p>}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function TransactionRow({ tx, onClick, labels }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-2 rounded-xl border border-[#e0e9f3] bg-white px-3 py-3 shadow-[0_1px_4px_rgba(30,64,110,0.04)] transition-all lg:px-4 lg:py-3.5',
        onClick && 'cursor-pointer hover:border-border hover:bg-muted/50',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">{labels?.[tx.type] || tx.type}</span>
            <EditedBadge edited={tx.edited} />
          </div>
          {tx.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{tx.description}</p>}
        </div>
      </div>
      <div className="shrink-0 text-left">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {new Intl.NumberFormat('en-US').format(Math.round(tx.amount || 0))}
        </p>
        <p className="text-xs text-muted-foreground">{tx.currency}</p>
      </div>
    </div>
  );
}