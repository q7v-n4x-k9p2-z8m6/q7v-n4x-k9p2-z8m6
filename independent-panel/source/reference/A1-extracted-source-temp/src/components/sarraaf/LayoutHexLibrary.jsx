import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, Trash2, Copy, ExternalLink, RefreshCw, Images, Loader2 } from 'lucide-react';

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function functionUrl() {
  const base = String(supabase.supabaseUrl || '').replace(/\/+$/, '');
  if (!base) throw new Error('آدرس پروژه A1 تنظیم نشده است.');
  return base + '/functions/v1/hex-layout-upload';
}
async function libraryRequest(method, body) {
  let token = '';
  try { token = localStorage.getItem('auth_token') || ''; } catch {}
  if (!token) throw new Error('نشست سازنده پیدا نشد؛ دوباره وارد حساب سازنده شوید.');
  const headers = { apikey: supabase.supabaseKey, 'x-app-token': token };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(functionUrl(), { method, headers, body, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.error || 'ارتباط امن با کتابخانه HEX ناموفق بود.');
  return data;
}

export default function LayoutHexLibrary() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await libraryRequest('GET');
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (e) { setError(e.message || 'بارگذاری کتابخانه HEX ناموفق بود.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => {
    if (!file) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (next) => {
    setMessage(''); setError('');
    if (!next) { setFile(null); return; }
    if (!ACCEPTED_TYPES.includes(next.type)) { setError('فقط JPG، PNG، WEBP یا GIF مجاز است.'); return; }
    if (next.size <= 0 || next.size > MAX_BYTES) { setError('حجم عکس نباید بیشتر از ۸ مگابایت باشد.'); return; }
    setFile(next);
  };
  const uploadImage = async (event) => {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true); setError(''); setMessage('');
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('title', title.trim());
      const result = await libraryRequest('POST', form);
      setFile(null); setTitle('');
      setMessage(result.hex_code ? 'تصویر ' + result.hex_code + ' در A1 ذخیره شد.' : 'تصویر در A1 ذخیره شد.');
      await loadItems();
    } catch (e) { setError(e.message || 'ذخیره عکس انجام نشد.'); }
    finally { setUploading(false); }
  };
  const deleteItem = async (item) => {
    if (!window.confirm('عکس ' + item.hex_code + ' از کتابخانه HEX حذف شود؟')) return;
    setDeletingId(item.id); setError(''); setMessage('');
    try {
      const result = await libraryRequest('DELETE', JSON.stringify({ id: item.id }));
      setItems(current => current.filter(x => x.id !== item.id));
      setMessage(result.cleanup_pending ? 'رکورد ' + item.hex_code + ' حذف شد؛ پاک‌سازی فایل نیازمند بررسی است.' : item.hex_code + ' از A1 حذف شد.');
    } catch (e) { setError(e.message || 'حذف عکس ناموفق بود.'); }
    finally { setDeletingId(null); }
  };
  const copyUrl = async (url) => {
    try { await navigator.clipboard.writeText(url); setMessage('آدرس تصویر کپی شد.'); }
    catch { setError('کپی خودکار ممکن نشد؛ تصویر را باز و آدرس آن را کپی کن.'); }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2"><Images className="h-5 w-5 text-primary" /><div>
          <h3 className="font-bold text-sm">کتابخانه تصاویر مرجع HEX</h3>
          <p className="text-xs text-muted-foreground mt-1">تصاویر فقط در دیتابیس و فضای ذخیره‌سازی پروژه اصلی A1 ثبت می‌شوند.</p>
        </div></div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-6">این کتابخانه برای ذخیره تصاویر مرجع است و به‌تنهایی چیدمان اصلی برنامه را تغییر نمی‌دهد.</div>
        <form onSubmit={uploadImage} className="space-y-3">
          <div><label className="text-xs font-medium block mb-1.5">نام یا توضیح کوتاه (اختیاری)</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثلاً چیدمان حرفه‌ای داشبورد موبایل" maxLength={120} /></div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 cursor-pointer">
            <ImagePlus className="h-7 w-7 text-primary" />
            <span className="text-sm font-semibold">{file ? file.name : 'انتخاب عکس از گوشی یا لپ‌تاپ'}</span>
            <span className="text-[11px] text-muted-foreground">JPG · PNG · WEBP · GIF — حداکثر ۸ مگابایت</span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => chooseFile(e.target.files?.[0] || null)} />
          </label>
          {preview && <div className="rounded-xl overflow-hidden border border-border"><img src={preview} alt="پیش‌نمایش عکس" className="w-full max-h-72 object-contain" /><div className="p-2"><Button type="button" size="sm" variant="ghost" onClick={() => setFile(null)}>لغو انتخاب</Button></div></div>}
          <Button type="submit" className="w-full gap-2" disabled={!file || uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'در حال ذخیره عکس...' : 'ذخیره عکس در A1'}
          </Button>
        </form>
        {message && <p className="text-xs text-emerald-600" role="status">{message}</p>}
        {error && <p className="text-xs text-destructive break-words" role="alert">{error}</p>}
      </CardContent></Card>
      <Card><CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3"><div>
          <h4 className="font-bold text-sm">تصاویر ذخیره‌شده</h4><p className="text-xs text-muted-foreground">{items.length} تصویر در A1</p>
        </div><Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
          <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} /> تازه‌سازی
        </Button></div>
        {loading ? <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        : items.length === 0 ? <div className="py-8 text-center text-xs text-muted-foreground">هنوز عکسی در کتابخانه A1 ذخیره نشده است.</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{items.map(item =>
          <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <a href={item.image_url} target="_blank" rel="noreferrer"><img src={item.image_url} alt={item.title || item.hex_code} loading="lazy" className="w-full h-44 object-contain" /></a>
            <div className="p-3 space-y-2"><div className="flex justify-between gap-2">
              <span className="font-bold text-sm">{item.hex_code}</span><span className="text-[10px] text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : ''}</span>
            </div>{item.title && <p className="text-xs text-muted-foreground">{item.title}</p>}
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" className="flex-1 gap-1" onClick={() => copyUrl(item.image_url)}><Copy className="h-3.5 w-3.5" /> کپی آدرس</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => window.open(item.image_url, '_blank', 'noopener,noreferrer')}><ExternalLink className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => deleteItem(item)} disabled={deletingId === item.id}>
                {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div></div>
          </div>)}</div>}
      </CardContent></Card>
    </div>
  );
}