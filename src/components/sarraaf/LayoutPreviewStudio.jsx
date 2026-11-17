import React from 'react';
import { Monitor, Smartphone, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileLayoutPreview from '@/components/sarraaf/MobileLayoutPreview';
import CreatorPreviewLab from '@/components/sarraaf/CreatorPreviewLab';

export default function LayoutPreviewStudio() {
  return (
    <section dir="rtl" className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">آزمایشگاه چیدمان</h2>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          دو نمای موبایل و لپ‌تاپ در یک محیط مستقل. این بخش فقط با داده‌های آزمایشی محلی کار می‌کند و به اطلاعات واقعی صرافی یا دیتابیس متصل نیست.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>محیط آزمایشی محلی · بدون تغییر در اطلاعات اصلی</span>
        </div>
      </div>

      <Tabs defaultValue="laptop" dir="rtl" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted p-1">
          <TabsTrigger value="laptop" className="min-h-11 gap-2 text-xs">
            <Monitor className="h-4 w-4" />
            چیدمان لپ‌تاپ
          </TabsTrigger>
          <TabsTrigger value="mobile" className="min-h-11 gap-2 text-xs">
            <Smartphone className="h-4 w-4" />
            چیدمان موبایل
          </TabsTrigger>
        </TabsList>
        <TabsContent value="laptop" className="mt-4 min-w-0">
          <CreatorPreviewLab />
        </TabsContent>
        <TabsContent value="mobile" className="mt-4 min-w-0">
          <MobileLayoutPreview />
        </TabsContent>
      </Tabs>
    </section>
  );
}
