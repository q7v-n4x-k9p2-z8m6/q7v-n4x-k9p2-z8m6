import React from 'react';
import CreatorPreviewLab from '@/components/sarraaf/CreatorPreviewLab';

export default function MobileLayoutPreview() {
  return (
    <div dir="rtl" className="space-y-3">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs leading-6 text-blue-950">
        این پیش‌نمایش از آیکون‌ها و بخش‌های موجود در برنامه حساب صراف استفاده می‌کند. عملیات آزمایشی فقط در حافظه محلی همین مرورگر ذخیره می‌شوند؛ هیچ اتصال یا تغییری در دیتابیس، حساب‌ها یا سوابق واقعی انجام نمی‌شود.
      </div>
      <CreatorPreviewLab mobileMode />
      <style>{`
        .creator-mobile-lab .creator-preview-device { height: min(82vh, 820px); min-height: 620px; }
        .creator-mobile-lab .creator-preview-menus > div { min-width: 0; }
        .creator-mobile-lab .creator-preview-menus > div > button { width: 100%; border: 1px solid #d3dfeb; border-radius: 9px; }
        .creator-mobile-lab .creator-preview-menus [class*="absolute"] { max-width: calc(100vw - 52px); }
        .creator-mobile-lab .creator-preview-workspace > aside button { min-height: 68px; touch-action: manipulation; }
        .creator-mobile-lab button, .creator-mobile-lab input, .creator-mobile-lab select, .creator-mobile-lab textarea { touch-action: manipulation; }
        .creator-mobile-lab .creator-preview-device main { overscroll-behavior: contain; }
        .creator-mobile-lab .creator-preview-device table { font-size: 11px; }
        .creator-mobile-lab .creator-preview-device input, .creator-mobile-lab .creator-preview-device select { min-height: 42px; }
        @media (max-width: 380px) {
          .creator-mobile-lab .creator-preview-menus { grid-template-columns: 1fr 1fr; }
          .creator-mobile-lab .creator-preview-device { min-height: 600px; }
        }
      `}</style>
    </div>
  );
}
