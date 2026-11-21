// a1/components/v21/LayoutModeBadge.jsx — نمایش ساختار فعال (گوشی / تبلت / لپ‌تاپ)
// متن تشخیصی کوچک برای اینکه کاربر ببیند در این لحظه کدام چیدمان بارگذاری شده است.
import React from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';
import useAdaptiveLayout from '@/a1/hooks/useAdaptiveLayout';

export default function LayoutModeBadge({ compact = false }) {
  const { space, layout } = useAdaptiveLayout();

  const isDesktop = layout.chrome === 'desktop';
  const isTablet = !isDesktop && space.width >= 600;
  const label = isDesktop ? 'ساختار لپ‌تاپ' : isTablet ? 'ساختار تبلت' : 'ساختار گوشی';
  const Icon = isDesktop ? Monitor : isTablet ? Tablet : Smartphone;
  const tone = isDesktop
    ? 'border-blue-200 bg-blue-50 text-blue-900'
    : isTablet
      ? 'border-violet-200 bg-violet-50 text-violet-900'
      : 'border-emerald-200 bg-emerald-50 text-emerald-900';

  if (compact) {
    return (
      <span
        className={'inline-flex shrink-0 items-center gap-1 rounded border px-1 py-0 text-[8.5px] font-bold leading-tight ' + tone}
        title={`عرض ${space.width}px و ارتفاع ${space.height}px — حالت ${layout.mode}`}
      >
        <Icon className="h-2.5 w-2.5" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={'mt-1 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ' + tone}
      title={`عرض ${space.width}px و ارتفاع ${space.height}px — حالت ${layout.mode}`}
    >
      <Icon className="h-3 w-3" />
      {label}
      <span className="font-normal opacity-75">· {space.width}×{space.height}px</span>
    </span>
  );
}