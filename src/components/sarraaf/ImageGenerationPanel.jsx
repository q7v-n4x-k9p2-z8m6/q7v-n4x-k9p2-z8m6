import React, { useState } from 'react';
import { Download, ImagePlus, LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabaseConfig } from '@/lib/supabaseConfig';

const FUNCTION_PATH = '/functions/v1/builder-image-generator';

function getToken() {
  try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
}

export default function ImageGenerationPanel({ role }) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState('medium');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState('');

  const generate = async (event) => {
    event?.preventDefault?.();
    const description = prompt.trim();
    if (!description || busy) return;
    if (role !== 'creator') {
      setError('این ابزار فقط برای سازنده اصلی فعال است.');
      return;
    }
    const token = getToken();
    if (!token) {
      setError('نشست سازنده پیدا نشد. دوباره وارد پنل سازنده شوید.');
      return;
    }
    setBusy(true);
    setError('');
    setImage('');
    try {
      const { url, key } = getSupabaseConfig();
      if (!url) throw new Error('نشانی سرویس سوپابیس پیکربندی نشده است.');
      const headers = { 'Content-Type': 'application/json', 'x-app-token': token };
      if (key) {
        headers.apikey = key;
        headers.Authorization = 'Bearer ' + key;
      }
      const response = await fetch(String(url).replace(/\/+$/, '') + FUNCTION_PATH, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: description, size, quality }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status !== 'ok' || !result.imageBase64) {
        throw new Error(result.error || 'تصویر ساخته نشد؛ اتصال سرویس را بررسی کنید.');
      }
      setImage('data:image/png;base64,' + result.imageBase64);
    } catch (err) {
      setError(err?.message || 'ارتباط با سرویس تولید تصویر برقرار نشد.');
    } finally {
      setBusy(false);
    }
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = 'hisab-sarraf-ai-image.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="space-y-4" dir="rtl">
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2"><ImagePlus className="h-5 w-5 text-primary" /></div>
            <div>
              <h2 className="text-base font-bold">تولید تصویر با هوش مصنوعی</h2>
              <p className="text-xs text-muted-foreground">توضیحت را بنویس؛ تصویر، آیکون یا طرح گرافیکی بساز.</p>
            </div>
            <Badge variant="outline" className="mr-auto">ابزار مستقل</Badge>
          </div>
          <form onSubmit={generate} className="space-y-3">
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="مثلاً: یک آیکون حرفه‌ای برای بخش خزانه‌داری حساب صراف، با سبک هماهنگ با رابط فارسی..." rows={5} maxLength={1200} disabled={busy} className="resize-y" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs">
                <span className="font-semibold">ابعاد تصویر</span>
                <select value={size} onChange={(event) => setSize(event.target.value)} disabled={busy} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="1024x1024">مربع — ۱۰۲۴ × ۱۰۲۴</option>
                  <option value="1536x1024">افقی — ۱۵۳۶ × ۱۰۲۴</option>
                  <option value="1024x1536">عمودی — ۱۰۲۴ × ۱۵۳۶</option>
                </select>
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-semibold">کیفیت</span>
                <select value={quality} onChange={(event) => setQuality(event.target.value)} disabled={busy} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="low">اقتصادی</option>
                  <option value="medium">استاندارد</option>
                  <option value="high">بالا</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy || !prompt.trim()} className="gap-2">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? 'در حال ساخت تصویر…' : 'ساخت تصویر'}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => { setPrompt(''); setImage(''); setError(''); }}>پاک‌کردن</Button>
              <span className="text-[11px] text-muted-foreground">حداکثر ۱۲۰۰ نویسه برای توضیحات</span>
            </div>
          </form>
          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-muted-foreground" /><h3 className="text-sm font-bold">پیش‌نمایش تصویر</h3></div>
          {image ? (
            <>
              <div className="overflow-hidden rounded-lg border bg-muted/20"><img src={image} alt="تصویر ساخته‌شده با هوش مصنوعی" className="mx-auto block max-h-[620px] max-w-full object-contain" /></div>
              <Button type="button" variant="outline" onClick={downloadImage} className="gap-2"><Download className="h-4 w-4" /> دریافت تصویر</Button>
            </>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/10 p-5 text-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">هنوز تصویری ساخته نشده است</p>
              <p className="max-w-md text-xs leading-6 text-muted-foreground">پس از ثبت کلید سرویس تصویرساز در Secret سوپابیس، خروجی اینجا نمایش داده می‌شود.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-6">
        <p className="font-semibold">حفاظت از کلید و اطلاعات</p>
        <p>فقط توضیح تصویر به سرویس تصویرساز فرستاده می‌شود؛ کلید API در مرورگر یا کد سایت قرار نمی‌گیرد. تصویر در این مرحله فقط در همین نشست نمایش داده می‌شود و در پایگاه داده حساب صراف ذخیره نمی‌شود.</p>
      </div>
    </section>
  );
}
