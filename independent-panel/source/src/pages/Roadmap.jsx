import React, { useMemo, useState } from 'react';
import { Map, Search, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { useRecords } from '@/hooks/useRecords';
import { AMBIGUITIES, CAPABILITY_MAP, STATUS_META } from '@/lib/roadmap';
import { num } from '@/lib/format';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: '', label: 'همه' },
  { key: 'done', label: 'پیاده‌شده' },
  { key: 'partial', label: 'نمونهٔ نمایشی' },
  { key: 'design', label: 'فقط طراحی' },
  { key: 'pending', label: 'باقی‌مانده' },
];

export default function Roadmap() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const { items: documents } = useRecords('Document');
  const { items: entries } = useRecords('LedgerEntry');

  const rows = useMemo(() => {
    const term = search.trim();
    return CAPABILITY_MAP.filter((item) => (filter ? item.status === filter : true)).filter((item) =>
      term ? [item.area, item.capability, item.where, item.a1].some((field) => String(field).includes(term)) : true
    );
  }, [filter, search]);

  const counts = useMemo(
    () =>
      CAPABILITY_MAP.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {
        done: 0,
        partial: 0,
        design: 0,
        pending: 0,
      }),
    []
  );

  const grouped = useMemo(() => {
    const map = new Map();
    rows.forEach((item) => {
      if (!map.has(item.area)) map.set(item.area, []);
      map.get(item.area).push(item);
    });
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="وضعیت و نگاشت"
        description="هر قابلیت سورس A1 در ساختار جدید کجا قرار گرفته و چه وضعیتی دارد. این گزارش صادقانه است: هر بخش ناقص، ناقص علامت خورده."
        icon={Map}
        badge={`${num(CAPABILITY_MAP.length)} قابلیت بررسی‌شده`}
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(filter === key ? '' : key)}
            className={cn(
              'card-flat flex items-center justify-between px-3 py-2 text-right transition-colors',
              filter === key && 'ring-1 ring-primary/40'
            )}
          >
            <span className="text-[11.5px] font-bold text-foreground/80">{meta.label}</span>
            <StatusBadge label={num(counts[key] || 0)} tone={meta.tone} />
          </button>
        ))}
      </div>

      <SectionCard
        title="نگاشت قابلیت‌ها"
        actions={
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جستجو در قابلیت‌ها"
                className="h-8 w-40 rounded-lg border border-input bg-background pr-7 pl-2 text-[11.5px] outline-none focus:ring-1 focus:ring-ring sm:w-56"
              />
            </div>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-[11px]"
            >
              {FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          {grouped.map(([area, items]) => (
            <div key={area}>
              <p className="mb-1.5 text-[11px] font-extrabold text-primary">{area}</p>
              <div className="overflow-hidden rounded-lg border border-border/70">
                {items.map((item, index) => (
                  <div
                    key={`${area}-${index}`}
                    className="grid gap-1 border-b border-border/50 px-2.5 py-2 last:border-0 sm:grid-cols-[1.4fr_1.2fr_0.8fr_1.4fr] sm:items-center"
                  >
                    <div>
                      <p className="text-[11.5px] font-bold text-foreground">{item.capability}</p>
                      <p className="text-[9.5px] text-muted-foreground">{item.a1}</p>
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      <span className="sm:hidden">محل جدید: </span>
                      {item.where}
                    </div>
                    <div>
                      <StatusBadge label={STATUS_META[item.status].label} tone={STATUS_META[item.status].tone} />
                    </div>
                    <p className="text-[10px] leading-5 text-muted-foreground">{item.risk}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!grouped.length ? <p className="text-[11.5px] text-muted-foreground">موردی با این فیلتر یافت نشد.</p> : null}
        </div>
      </SectionCard>

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="ابهام‌ها و تعارض‌های تصمیم" description="تصمیم‌های نیازمند تأیید شما پیش از ادغام">
          <div className="space-y-2">
            {AMBIGUITIES.map((item) => (
              <div key={item.title} className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                <p className="flex items-center gap-1 text-[11.5px] font-bold text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5" /> {item.title}
                </p>
                <p className="mt-1 text-[10.5px] leading-5 text-amber-900/80">{item.detail}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="وضعیت داده این محیط" description="شمارش واقعی رکوردهای ثبت‌شده">
          <div className="space-y-1.5 text-[11.5px]">
            <div className="flex items-center justify-between border-b border-border/50 py-1">
              <span className="text-muted-foreground">اسناد مالی</span>
              <span className="num font-bold">{num(documents.length)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 py-1">
              <span className="text-muted-foreground">ردیف‌های دفتر</span>
              <span className="num font-bold">{num(entries.length)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">وضعیت اتصال پایگاه دادهٔ واقعی</span>
              <StatusBadge label="قطع" tone="slate" />
            </div>
          </div>
          <p className="mt-2 text-[10.5px] leading-6 text-muted-foreground">
            هدف این نسخه، ارائهٔ اسکلت قابل بررسی و قابل انتقال است؛ نه جایگزینی برنامهٔ اصلی. هیچ داده‌ای از صرافی
            واقعی در این محیط وارد نشده است.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}