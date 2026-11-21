// a1/components/v21/transactions/TransactionsArchitecture.jsx
// نمای معماری مرکز معاملات: بخش‌ها، مدل نمایشی، منابع، ضدتکرار و مرز مالکیت.
// فقط مستندات درون‌برنامه‌ای است؛ هیچ داده‌ای نمی‌خواند، نمی‌نویسد و تغییر نمی‌دهد.
import React from 'react';
import {
  Layers, Table2, Database, ShieldCheck, GitBranch, ArrowLeftRight, ListChecks, Flag,
} from 'lucide-react';
import {
  CENTER_PARTS, DISPLAY_MODEL, SOURCES, DEDUP_RULES,
  OWNERSHIP, STATUS_BRIDGE, OPEN_GAPS, FUTURE_STEPS,
} from '@/a1/data/transactionsArchitecture';

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-2.5">
      <div className="mb-2 flex items-center gap-1.5 border-b border-border/60 pb-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <h2 className="text-[11px] font-extrabold text-primary">{title}</h2>
        {subtitle && <span className="ms-auto text-[9px] text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

export default function TransactionsArchitecture() {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-[10px] leading-5 text-sky-900">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          این بخش سند معماری است، نه عملیات. مرکز معاملات فقط می‌خواند و تجمیع می‌کند؛ ثبت و تغییر هر سند
          در ماژول مبدأ انجام می‌شود. هیچ پایگاه داده، اتصال بیرونی یا ساختار جدیدی در این مرحله ساخته نمی‌شود.
        </p>
      </div>

      <Section icon={Layers} title="بخش‌های مرکز معاملات" subtitle="۸ بخش">
        <div className="grid gap-1.5 sm:grid-cols-2">
          {CENTER_PARTS.map(part => (
            <div key={part.key} className="rounded-lg border border-border bg-secondary/30 p-2">
              <b className="block text-[11px] text-foreground">{part.title}</b>
              <p className="mt-0.5 text-[10px] leading-5 text-muted-foreground">{part.purpose}</p>
              <p className="mt-0.5 text-[9px] leading-4 text-slate-500">{part.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Table2} title="مدل نمایشی مشترک" subtitle="قرارداد فیلدها">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-right text-[10px]">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-1 font-bold">فیلد</th>
                <th className="py-1 font-bold">عنوان</th>
                <th className="py-1 font-bold">منبع و توضیح</th>
                <th className="py-1 font-bold">الزامی</th>
              </tr>
            </thead>
            <tbody>
              {DISPLAY_MODEL.map(row => (
                <tr key={row.field} className="border-b border-border/40 last:border-0">
                  <td className="py-1 font-mono text-[9px] text-slate-600" dir="ltr">{row.field}</td>
                  <td className="py-1 font-bold text-foreground">{row.label}</td>
                  <td className="py-1 leading-5 text-muted-foreground">{row.hint}</td>
                  <td className="py-1 text-muted-foreground">{row.required ? 'بله' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section icon={Database} title="منبع هر نوع معامله" subtitle="۱۰ نوع سند">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-[10px]">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-1 font-bold">نوع سند</th>
                <th className="py-1 font-bold">ماژول مالک</th>
                <th className="py-1 font-bold">کلید یکتا</th>
                <th className="py-1 font-bold">وضعیت اتصال</th>
                <th className="py-1 font-bold">توضیح</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map(item => (
                <tr key={item.title} className="border-b border-border/40 last:border-0">
                  <td className="py-1 font-bold text-foreground">{item.title}</td>
                  <td className="py-1 text-muted-foreground">{item.owner}</td>
                  <td className="py-1 font-mono text-[9px] text-slate-600" dir="ltr">{item.keyPattern}</td>
                  <td className="py-1">
                    <span className={'inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-bold ' + (
                      item.state === 'ready'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    )}>
                      {item.state === 'ready' ? 'نگاشت نمایشی' : 'در انتظار اتصال'}
                    </span>
                  </td>
                  <td className="py-1 leading-5 text-muted-foreground">
                    {item.note}
                    {item.ownerModule && (
                      <span className="mt-0.5 block text-[9px] text-slate-500">
                        بازگشت: {item.ownerModule} · شناسهٔ نمایشی: {item.uniqueId}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-2 lg:grid-cols-2">
        <Section icon={GitBranch} title="قواعد ضدتکرار" subtitle="۵ قاعده">
          <ol className="space-y-1.5">
            {DEDUP_RULES.map((rule, index) => (
              <li key={rule.title} className="flex gap-1.5 rounded-lg border border-border bg-secondary/30 p-2">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <b className="block text-[10px] text-foreground">{rule.title}</b>
                  <p className="text-[9px] leading-5 text-muted-foreground">{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section icon={ArrowLeftRight} title="مرز مالکیت" subtitle="خواندن در مرکز، نوشتن در مبدأ">
          <div className="space-y-1.5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2">
              <b className="block text-[10px] text-emerald-900">مرکز معاملات</b>
              <ul className="mt-1 space-y-0.5 text-[9px] leading-5 text-emerald-900/90">
                {OWNERSHIP.center.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <b className="block text-[10px] text-slate-800">ماژول مبدأ</b>
              <ul className="mt-1 space-y-0.5 text-[9px] leading-5 text-slate-700">
                {OWNERSHIP.source.map(item => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      <Section icon={ListChecks} title="پل وضعیت مبدأ و نمایش" subtitle="وضعیت اصلی حفظ می‌شود">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-right text-[10px]">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-1 font-bold">برچسب نمایشی</th>
                <th className="py-1 font-bold">نمونهٔ وضعیت مبدأ</th>
                <th className="py-1 font-bold">معنا</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_BRIDGE.map(row => (
                <tr key={row.label} className="border-b border-border/40 last:border-0">
                  <td className="py-1 font-bold text-foreground">{row.label}</td>
                  <td className="py-1 text-muted-foreground">{row.samples}</td>
                  <td className="py-1 leading-5 text-muted-foreground">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[9px] text-muted-foreground">
          متن وضعیت اصلی در جزئیات هر سند نمایش داده می‌شود؛ برچسب مشترک فقط برای فیلتر و شمارش است.
        </p>
      </Section>

      <div className="grid gap-2 lg:grid-cols-2">
        <Section icon={Flag} title="مسیر یکپارچه‌سازی" subtitle="بدون تغییر پایگاه داده">
          <ol className="space-y-1">
            {FUTURE_STEPS.map(item => (
              <li key={item.step} className="flex gap-1.5 rounded-lg border border-border bg-secondary/30 px-2 py-1.5">
                <span className="text-[10px] font-bold text-primary">{item.step}</span>
                <div className="min-w-0">
                  <b className="block text-[10px] text-foreground">{item.title}</b>
                  <p className="text-[9px] leading-5 text-muted-foreground">{item.body}</p>
                </div>
                <span className={'ms-auto shrink-0 self-start rounded-full border px-1.5 py-0.5 text-[9px] font-bold ' + (
                  item.state === 'done'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : item.state === 'next'
                      ? 'border-blue-200 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                )}>
                  {item.state === 'done' ? 'انجام‌شده' : item.state === 'next' ? 'مرحلهٔ بعد' : 'بعدتر'}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section icon={ShieldCheck} title="شکاف‌های شناخته‌شده" subtitle="بدون تصمیم ساختاری">
          <ul className="space-y-1">
            {OPEN_GAPS.map(item => (
              <li key={item} className="rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-1 text-[9px] leading-5 text-amber-900">
                {item}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}