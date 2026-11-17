import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ImagePlus, RefreshCw, Trash2, Images, Loader2 } from 'lucide-react';

const BUCKET = 'layout-hex-references';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function HexLayoutReferenceLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const { toast } = useToast();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('layout_hex_references')
        .select('id,title,description,storage_path,original_filename,mime_type,file_size,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      toast({
        title: 'بارگذاری کتابخانه ناموفق بود',
        description: error.message || 'دسترسی سازنده به کتابخانه HEX تأیید نشد.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      toast({ title: 'ابتدا یک تصویر انتخاب کنید', variant: 'destructive' });
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: 'فرمت تصویر پشتیبانی نمی‌شود', description: 'فقط JPG، PNG، WebP و GIF مجاز است.', variant: 'destructive' });
      return;
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      toast({ title: 'حجم تصویر نامعتبر است', description: 'حداکثر حجم مجاز ۱۰ مگابایت است.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100) || 'reference-image';
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const storagePath = `references/${uniqueId}-${safeName}`;
    try {
      // The Edge Function verifies the app's HMAC token server-side, then
      // performs the HEX-only Storage upload and metadata insert.
      const appToken = localStorage.getItem('auth_token');
      if (!appToken) {
        throw new Error('نشست امن سازنده پیدا نشد. لطفاً دوباره وارد حساب سازنده شوید.');
      }
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('title', title.trim() || file.name);
      formData.append('description', description.trim());
      const { data, error } = await supabase.functions.invoke('hex-layout-upload', {
        body: formData,
        headers: { 'x-app-token': appToken },
      });
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'بارگذاری امن تصویر انجام نشد.');
      }

      setTitle('');
      setDescription('');
      setFile(null);
      const input = document.getElementById('hex-reference-file');
      if (input) input.value = '';
      await loadItems();
      toast({ title: 'تصویر به کتابخانه HEX اضافه شد' });
    } catch (error) {
      if (uploaded) {
        await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
      }
      toast({
        title: 'ذخیره تصویر انجام نشد',
        description: error.message || 'اتصال امن یا مجوز سازنده را بررسی کنید.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`تصویر «${item.title}» از کتابخانه آزمایشی حذف شود؟`)) return;
    setDeletingId(item.id);
    try {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([item.storage_path]);
      if (storageError) throw storageError;

      const { error: rowError } = await supabase
        .from('layout_hex_references')
        .delete()
        .eq('id', item.id);
      if (rowError) throw rowError;

      setItems(current => current.filter(entry => entry.id !== item.id));
      toast({ title: 'تصویر آزمایشی حذف شد' });
    } catch (error) {
      toast({
        title: 'حذف تصویر ناموفق بود',
        description: error.message || 'مجوز سازنده یا اتصال را بررسی کنید.',
        variant: 'destructive',
      });
      await loadItems();
    } finally {
      setDeletingId(null);
    }
  };

  const publicUrl = (storagePath) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return data?.publicUrl || '';
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm">کتابخانه تصاویر مرجع HEX</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            تصاویر فقط برای نمونه‌سازی و الهام‌گرفتن از چیدمان هستند؛ به حساب‌ها، کاربران یا تراکنش‌های مالی متصل نمی‌شوند.
          </p>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="hex-reference-title" className="text-xs font-medium">عنوان تصویر (اختیاری)</label>
              <input id="hex-reference-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120}
                placeholder="مثلاً چیدمان صفحه اصلی موبایل" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="hex-reference-description" className="text-xs font-medium">توضیحات (اختیاری)</label>
              <textarea id="hex-reference-description" value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={1000}
                placeholder="نکته‌هایی که باید از این تصویر بررسی شوند..." className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y" />
            </div>
            <div className="space-y-1">
              <label htmlFor="hex-reference-file" className="text-xs font-medium">انتخاب تصویر</label>
              <input id="hex-reference-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-xs file:ml-2 file:rounded-md file:border file:bg-muted file:px-3 file:py-2" />
              <p className="text-[11px] text-muted-foreground">JPG، PNG، WebP یا GIF — حداکثر ۱۰ مگابایت</p>
              {file && <p className="text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>
            <Button type="submit" disabled={uploading || !file} className="w-full gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              {uploading ? 'در حال بارگذاری امن...' : 'افزودن تصویر به کتابخانه'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm">تصاویر ذخیره‌شده</h3>
              <p className="text-xs text-muted-foreground">{items.length} تصویر مرجع</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={loadItems} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تازه‌سازی
            </Button>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              هنوز تصویری بارگذاری نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(item => (
                <div key={item.id} className="overflow-hidden rounded-lg border bg-card">
                  <a href={publicUrl(item.storage_path)} target="_blank" rel="noreferrer" className="block bg-muted">
                    <img src={publicUrl(item.storage_path)} alt={item.title} loading="lazy" className="w-full h-44 object-contain" />
                  </a>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-semibold break-words">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{item.description}</p>}
                    <p className="text-[10px] text-muted-foreground break-all">{item.original_filename || item.storage_path}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : ''}</span>
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="gap-1">
                        {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
