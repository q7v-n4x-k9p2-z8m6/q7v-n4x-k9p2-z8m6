// src/components/sections/SectionPage.jsx — نوار یکپارچهٔ هر بخش
// یک الگوی واحد برای همهٔ ۲۵ بخش در هر دو پوسته: شناسهٔ بخش، شاخص‌های همان بخش
// و بلوک‌های مرتبطِ همان بخش که در همان صفحه نمایش داده می‌شوند (بدون تکرار فهرست اصلی).
// فقط نمایش است؛ هیچ داده‌ای نمی‌نویسد.
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { SECTION_GROUP_LABELS } from '@/core/sections/sectionPage';

// بلوک‌های گردشی که جایشان در صفحه‌های دفتر حساب است، نه در صفحه‌های تعریف.
const DEFINITION_LEDGER_BLOCKS = ['customer-accounting', 'branch-accounting', 'cash-accounting', 'bank-accounting'];

const toneClass = (badge) => {
  if (!badge) return '';
  if (['فعال', 'قطعی', 'تسویه', 'موفق', 'محاسبه‌شده', 'تعریف‌شده', 'دارای سند'].includes(badge)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['بدهکار', 'ابطال شده', 'غیرفعال', 'قفل'].includes(badge)) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (['بستانکار', 'موقت', 'نیازمند بررسی', 'باز', 'نامشخص', 'سند ندارد'].includes(badge)) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

export default function SectionPage({ model, icon: Icon, onOpenRow }) {
  const [tab, setTab] = useState('');
  if (!model) return null;

  // در صفحه‌های تعریف (مشتریان، نمایندگی‌ها، صندوق‌ها، بانک‌ها) بدنهٔ صفحه همان فهرست تعریف است؛
  // بلوک گردش حساب نباید بالای آن بنشیند تا صفحه با دفتر حساب اشتباه گرفته نشود.
  const related = (model.blocks || []).filter(
    (block) => !block.primary && !DEFINITION_LEDGER_BLOCKS.includes(block.key),
  );
  // با باز شدن بخش، اولین بلوکی که داده دارد نشان داده می‌شود تا پیام «موردی برای نمایش نیست»
  // با اطلاعاتی که پایین همان صفحه نمایش داده می‌شود ناهماهنگ نباشد.
  const current = related.find((block) => block.key === tab)
    || related.find((block) => (block.rows || []).length)
    || related[0] || null;

  return (
    <section dir="rtl" aria-label={`صفحهٔ یکپارچهٔ ${model.label}`} className="card-flat mb-2 p-2.5 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-secondary text-primary">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <b className="flex items-center gap-1.5 text-[12px] font-extrabold text-foreground sm:text-[13px]">
              <span className="truncate">{model.label}</span>
            </b>
            <span className="mt-0.5 block text-[9px] text-muted-foreground sm:text-[10px]">
              صفحهٔ یکپارچهٔ این بخش · {SECTION_GROUP_LABELS[model.group] || 'بخش‌های حساب صراف'}
            </span>
          </div>
        </div>
        {model.metrics?.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {model.metrics.map((metric) => (
              <span
                key={metric.key}
                className={
                  'flex max-w-full flex-wrap items-baseline gap-1 rounded-lg border px-2 py-1 text-[9px] sm:text-[10px] '
                  + (metric.tone === 'debt'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : metric.tone === 'credit'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-border/70 bg-muted/50 text-muted-foreground')
                }
              >
                {metric.label}
                <b className={'num min-w-0 break-words text-[11px] font-extrabold sm:text-[12px] ' + (metric.tone ? '' : 'text-foreground')}>{metric.value}</b>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {related.length ? (
        <>
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {related.map((block) => (
              <button
                key={block.key}
                type="button"
                onClick={() => setTab(block.key)}
                className={
                  'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1 text-[9px] font-bold sm:text-[10px] ' +
                  (current && current.key === block.key
                    ? 'border-primary/40 bg-primary text-primary-foreground'
                    : 'border-border/70 bg-card text-muted-foreground')
                }
              >
                {block.label}
                <span className="num text-[9px] opacity-80">{(block.rows || []).length}</span>
              </button>
            ))}
          </div>

          <div className="mt-1.5 grid gap-1">
            {(current?.rows || []).length ? current.rows.map((row) => {
              // هر سطر، وقتی مقصدش معلوم باشد، همان سند/حساب واقعی خودش را باز می‌کند
              // (فهرست جدول زیر فقط برای جزئیات کامل است).
              const RowTag = onOpenRow ? 'button' : 'div';
              return (
                <RowTag
                  key={row.id}
                  type={onOpenRow ? 'button' : undefined}
                  onClick={onOpenRow ? () => onOpenRow(row) : undefined}
                  className={'w-full rounded-xl border border-border/60 bg-background/60 px-2 py-1.5 text-right ' + (onOpenRow ? 'hover:border-primary/40 hover:bg-primary/5' : '')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <b className="block truncate text-[10px] font-bold text-foreground sm:text-[11px]">{row.title}</b>
                      {row.sub ? <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{row.sub}</span> : null}
                    </div>
                    {row.badge ? (
                      <span className={'shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] ' + toneClass(row.badge)}>{row.badge}</span>
                    ) : null}
                  </div>
                  {row.meta?.length ? (
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground">
                      {row.meta.map(([label, value]) => (
                        <span key={label} className="whitespace-nowrap">
                          {label}: <b className="num font-bold text-foreground">{value}</b>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </RowTag>
              );
            }) : (
              <p className="rounded-xl border border-dashed border-border/70 px-2 py-2 text-[10px] text-muted-foreground">{current?.empty || 'موردی برای نمایش نیست.'}</p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 px-2 py-1.5 text-[9px] text-muted-foreground sm:text-[10px]">
          <ChevronLeft className="h-3 w-3 shrink-0" />
          همهٔ اطلاعات این بخش و سوابقش در همین صفحه، در فهرست زیر نمایش داده می‌شود.
        </p>
      )}
    </section>
  );
}