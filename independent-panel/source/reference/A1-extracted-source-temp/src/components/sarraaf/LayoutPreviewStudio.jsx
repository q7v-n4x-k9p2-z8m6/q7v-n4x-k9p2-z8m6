import React from 'react';
import { Monitor, Smartphone, ShieldCheck, Layers3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileLayoutPreview from '@/components/sarraaf/MobileLayoutPreview';
import ComputerLayoutPreview from '@/components/sarraaf/ComputerLayoutPreview';
import LayoutDesignCatalog from '@/components/sarraaf/LayoutDesignCatalog';
import PdfLayoutSandboxPage from '@/components/sarraaf/PdfLayoutSandboxPage';

export default function LayoutPreviewStudio() {
  return (
    <section dir="rtl" className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">آزمایشگاه چیدمان</h2>
        </div>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          مجموعه طرح‌های شماره‌دار موبایل و لپ‌تاپ برای مقایسه و انتخاب در آینده. این فضا آزمایشی است و هیچ طرحی را روی محیط عملیاتی اعمال نمی‌کند.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>۲۰ طرح مستقل · داده‌های ساختگی · بدون اتصال به اطلاعات واقعی یا دیتابیس</span>
        </div>
      </div>

      <Tabs defaultValue="pdf-layout" dir="rtl" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-2 bg-muted p-1">
          <TabsTrigger value="pdf-layout" className="min-h-11 gap-2 text-xs">
            <Monitor className="h-4 w-4" />
            صفحه مطابق PDF
          </TabsTrigger>
          <TabsTrigger value="catalog" className="min-h-11 gap-2 text-xs">
            <Layers3 className="h-4 w-4" />
            طرح‌های شماره‌دار
          </TabsTrigger>
          <TabsTrigger value="previous" className="min-h-11 gap-2 text-xs">
            <Monitor className="h-4 w-4" />
            پیش‌نمایش‌های قبلی
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pdf-layout" className="mt-4 min-w-0">
          <PdfLayoutSandboxPage />
        </TabsContent>
        <TabsContent value="catalog" className="mt-4 min-w-0">
          <LayoutDesignCatalog />
        </TabsContent>
        <TabsContent value="previous" className="mt-4 min-w-0">
          <Tabs defaultValue="old-laptop" dir="rtl" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted p-1">
              <TabsTrigger value="old-laptop" className="min-h-10 gap-2 text-xs">
                <Monitor className="h-4 w-4" />
                چیدمان لپ‌تاپ قبلی
              </TabsTrigger>
              <TabsTrigger value="old-mobile" className="min-h-10 gap-2 text-xs">
                <Smartphone className="h-4 w-4" />
                چیدمان موبایل قبلی
              </TabsTrigger>
            </TabsList>
            <TabsContent value="old-laptop" className="mt-4 min-w-0">
              <ComputerLayoutPreview />
            </TabsContent>
            <TabsContent value="old-mobile" className="mt-4 min-w-0">
              <MobileLayoutPreview />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </section>
  );
}
