// a1/components/v21/AdaptiveLayoutPanel.jsx — گزارش تشخیصی موتور چیدمان
// فقط برای توسعه‌دهنده و آزمایش: در حالت DEV یا با ?diag=1 در آدرس نمایش داده می‌شود.
import React, { useState } from 'react';
import { Ruler, X } from 'lucide-react';

const MODE_LABELS = {
  compact: 'فضای کوچک عمودی',
  'wide-compact': 'فضای کوچک افقی',
  'compact-desktop': 'پوستهٔ دسکتاپ با فضای کم',
  desktop: 'پوستهٔ دسکتاپ',
  'wide-desktop': 'پوستهٔ دسکتاپ عریض',
};

const DENSITY_LABELS = { dense: 'فشرده', compact: 'نیمه‌فشرده', touch: 'لمسی', comfortable: 'راحت' };

export default function AdaptiveLayoutPanel({ space, layout }) {
  const [open, setOpen] = useState(false);

  const devEnabled = typeof window !== 'undefined'
    && (import.meta.env.DEV || new URLSearchParams(window.location.search).has('diag'));
  if (!devEnabled) return null;

  const row = (label, value) => (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-1.5">
      <span className="text-slate-500">{label}</span>
      <b className="text-left font-semibold text-slate-800" dir="ltr">{value}</b>
    </div>
  );

  return (
    <div className="a1-diag print:hidden" dir="rtl">
      <button type="button" onClick={() => setOpen(v => !v)} className="a1-diag-toggle" aria-expanded={open} title="گزارش تشخیصی چیدمان (فقط توسعه‌دهنده)">
        <Ruler className="h-4 w-4" />
        <span>{space.width}×{space.height}</span>
      </button>

      {open && (
        <section className="a1-diag-panel" role="dialog" aria-label="گزارش تشخیصی چیدمان">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
            <b className="text-[12px] text-slate-800">موتور چیدمان خودتنظیم‌گر</b>
            <button type="button" onClick={() => setOpen(false)} aria-label="بستن گزارش" className="rounded-md border border-slate-200 p-1 text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </header>

          <div className="max-h-[52vh] overflow-y-auto px-3 py-2 text-[11px] leading-5">
            <p className="mb-2 rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-600">
              این پنل در نسخهٔ منتشرشده برای کاربران نمایش داده نمی‌شود.
            </p>

            <b className="mb-1 block text-[11px] text-slate-700">فضای واقعی</b>
            {row('فضای قابل استفاده', `${space.width} × ${space.height}`)}
            {row('پنجرهٔ مرورگر', `${space.outerWidth} × ${space.outerHeight}`)}
            {row('نمایشگر', `${space.screenWidth} × ${space.screenHeight}`)}
            {row('جهت', space.orientation === 'landscape' ? 'افقی' : 'عمودی')}
            {row('نسبت عرض به ارتفاع', space.aspectRatio)}
            {row('تراکم پیکسلی', `${space.dpr}x`)}
            {row('ارتفاع گرفته‌شده توسط مرورگر', `${space.browserChrome}px`)}
            {row('اختلاف پنجره با نمایشگر', `${space.screenLost}px`)}

            <b className="mb-1 mt-3 block text-[11px] text-slate-700">تصمیم موتور</b>
            {row('چیدمان', MODE_LABELS[layout.mode] || layout.mode)}
            {row('پوسته', layout.chrome === 'desktop' ? 'دسکتاپ' : 'فضای کوچک')}
            {row('چگالی', DENSITY_LABELS[layout.density] || layout.density)}
            {row('جدول', layout.table === 'table' ? 'جدول کامل' : 'کارت‌های صفحهٔ کوچک')}
            {row('نوار ابزار', layout.toolbar === 'top-rail' ? 'بالای صفحه' : 'پایین صفحه')}
            {row('ستون میان‌برها', layout.columns.rail)}
            {row('ستون گروه‌ها', `${layout.columns.groups} × ${layout.columns.groupRows}`)}
            {row('ستون کاشی‌ها', layout.columns.tiles)}
            {row('ستون فرم‌ها', layout.columns.form)}
            {row('ستون کارت رکورد', layout.columns.cards)}
            {row('اندازهٔ آیکون', `${layout.sizes.icon}px`)}
            {row('اندازهٔ نوشته', `${layout.sizes.label}px`)}
            {row('فاصلهٔ بخش‌ها', `${layout.sizes.gap}px`)}
            {row('پیمایش میان‌برها', layout.railScroll ? 'افقی' : 'بدون سرریز')}
            {row('نوار عملیات ثابت', layout.chrome === 'compact' ? 'فعال' : 'غیرفعال')}

            <b className="mb-1 mt-3 block text-[11px] text-slate-700">دلیل محاسباتی</b>
            <ul className="list-disc space-y-1 pr-4 text-[10px] leading-5 text-slate-600">
              {layout.reasons.map(reason => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}