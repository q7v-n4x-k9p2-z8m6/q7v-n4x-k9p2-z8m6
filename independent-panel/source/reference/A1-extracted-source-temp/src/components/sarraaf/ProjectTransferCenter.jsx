import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Download, FileArchive, FileJson, FolderTree, BookOpen,
  ShieldCheck, Loader2, CheckCircle2, AlertTriangle, Github
} from 'lucide-react';
import { createZip } from '@/lib/zipBuilder';
import schemaSnapshot from '@/data/project-transfer-schema.json';

const REPOSITORY = 'https://github.com/roohalla41-blip/-1';
const TREE_API = 'https://api.github.com/repos/roohalla41-blip/-1/git/trees/main?recursive=1';
const SOURCE_ARCHIVE = REPOSITORY + '/archive/refs/heads/main.zip';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function textBytes(value) {
  return new TextEncoder().encode(value);
}

function makeHandoffGuide(treeSha, fileCount) {
  return `# بسته انتقال پروژه حساب صراف

تاریخ تهیه: ${new Date().toISOString()}

## هویت پروژه
- مخزن: ${REPOSITORY}
- شاخه اصلی: main
- آخرین شناسه نقشه دریافت‌شده: ${treeSha}
- تعداد فایل‌های ثبت‌شده در نقشه: ${fileCount}
- پروژه مقصد: A1 — حساب صراف زنده

## فایل‌های این بسته
- database/project-transfer-schema.json: تصویر ساختار جدول‌های Supabase؛ بدون ردیف‌ها و اطلاعات واقعی.
- architecture/repository-map.json: نقشه فایل‌ها و پوشه‌های مخزن در زمان تهیه بسته.
- architecture/repository-map.md: نسخه خوانا از نقشه.
- این راهنما: دستور ادامه کار و محدودیت‌های ایمنی.

## دریافت سورس کامل
سورس کامل از آرشیو رسمی شاخه main دریافت می‌شود:
${SOURCE_ARCHIVE}

این آرشیو، فایل‌های ثبت‌شده در مخزن GitHub را شامل می‌شود. فایل‌های محیطی و رمزهای ورود را جداگانه و فقط از محل امن خودت نگهداری کن؛ هیچ رمز یا توکنی در این بسته قرار داده نشده است.

## پایگاه داده
- پروژه Supabase: ${schemaSnapshot.project_ref}
- تعداد جدول‌های ثبت‌شده در تصویر ساختار: ${schemaSnapshot.table_count}
- زمان ثبت تصویر ساختار: ${schemaSnapshot.captured_at}
- این فایل فقط metadata ساختار جدول‌ها، ستون‌ها، کلیدها، ارتباط‌ها و وضعیت RLS را نگه می‌دارد.
- هیچ ردیف واقعی، مشتری، تراکنش، رمز یا توکنی در آن قرار ندارد.
- این تصویر یک snapshot است و در صورت تغییر ساختار دیتابیس باید دوباره تهیه شود.

## قواعد ادامه توسعه A1
1. فقط روی مخزن roohalla41-blip/-1 و شاخه main کار شود.
2. دامنه و نسخه زنده بدون دستور جداگانه منتشر نشود.
3. هیچ SQL، جدول، تابع، RLS، حساب کاربری یا داده واقعی Supabase تغییر نکند.
4. اطلاعات واقعی مشتریان و تراکنش‌ها برای آزمایش استفاده نشود.
5. تمرکز توسعه فعلی: تکمیل پنل صراف بر اساس کد موجود و رفتارهای حسابداری موردنیاز؛ آزمایشگاه یا کاربر آزمایشی جدید ساخته نشود.
6. رمزها، کلیدهای API و توکن‌ها هرگز داخل سورس یا این بسته نوشته نشوند.

## شروع کار در گوشی دیگر
1. آرشیو سورس را از لینک بالا دانلود و استخراج کن.
2. همین بسته مستندات را نیز نگه دار.
3. در گفت‌وگوی جدید، این فایل راهنما و فایل‌های ZIP/JSON را ارسال کن.
4. درخواست کن ادامه توسعه از آخرین commit شاخه main انجام شود و ابتدا وضعیت مخزن بررسی شود؛ از ساخت شاخه جدید یا انتشار خودکار خودداری شود.
`;
}

function buildMapMarkdown(tree) {
  const files = tree.filter((item) => item.type === 'blob').map((item) => item.path).sort();
  const dirs = [...new Set(files.flatMap((path) => {
    const parts = path.split('/');
    return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join('/') + '/');
  }))].sort();
  const extCounts = {};
  for (const path of files) {
    const name = path.split('/').pop();
    const match = name.match(/\.[^.]+$/);
    const ext = match ? match[0].toLowerCase() : '(بدون پسوند)';
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  }
  return { files, dirs, extCounts };
}

export default function ProjectTransferCenter() {
  const [mapLoading, setMapLoading] = useState(false);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [mapInfo, setMapInfo] = useState('');
  const [error, setError] = useState('');

  const fetchRepositoryMap = async () => {
    const response = await fetch(TREE_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('دریافت نقشه از GitHub ناموفق بود: HTTP ' + response.status);
    const result = await response.json();
    if (result.truncated) throw new Error('GitHub نقشه را ناقص برگرداند؛ خروجی کامل ساخته نشد.');
    const summary = buildMapMarkdown(result.tree || []);
    return {
      generated_at: new Date().toISOString(),
      repository: REPOSITORY,
      branch: 'main',
      commit: result.sha,
      file_count: summary.files.length,
      directory_count: summary.dirs.length,
      extension_counts: summary.extCounts,
      directories: summary.dirs,
      files: summary.files,
    };
  };

  const handleMapDownload = async () => {
    setMapLoading(true);
    setError('');
    setMapInfo('');
    try {
      const map = await fetchRepositoryMap();
      const markdown = [
        '# نقشه ساختار مخزن حساب صراف',
        '',
        '- مخزن: ' + map.repository,
        '- شاخه: ' + map.branch,
        '- commit: ' + map.commit,
        '- تعداد فایل‌ها: ' + map.file_count,
        '- تعداد پوشه‌ها: ' + map.directory_count,
        '',
        '## پوشه‌ها',
        ...map.directories.map((path) => '- ' + path),
        '',
        '## فایل‌ها',
        ...map.files.map((path) => '- ' + path),
      ].join('\n');
      downloadBlob(new Blob([JSON.stringify(map, null, 2)], { type: 'application/json;charset=utf-8' }), 'hisab-sarraf-repository-map.json');
      downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), 'hisab-sarraf-repository-map.md');
      setMapInfo(map.file_count + ' فایل و ' + map.directory_count + ' پوشه از commit ' + map.commit.slice(0, 10));
    } catch (e) {
      setError(e.message || 'ساخت نقشه ناموفق بود.');
    } finally {
      setMapLoading(false);
    }
  };

  const handleDocumentationBundle = async () => {
    setBundleLoading(true);
    setError('');
    setMapInfo('');
    try {
      const map = await fetchRepositoryMap();
      const guide = makeHandoffGuide(map.commit, map.file_count);
      const mapMarkdown = [
        '# نقشه ساختار مخزن حساب صراف',
        '',
        '- مخزن: ' + map.repository,
        '- شاخه: ' + map.branch,
        '- commit: ' + map.commit,
        '- تعداد فایل‌ها: ' + map.file_count,
        '- تعداد پوشه‌ها: ' + map.directory_count,
        '',
        '## پوشه‌ها',
        ...map.directories.map((path) => '- ' + path),
        '',
        '## فایل‌ها',
        ...map.files.map((path) => '- ' + path),
      ].join('\n');
      const zip = createZip([
        { name: 'README-ادامه-پروژه.md', data: textBytes(guide) },
        { name: 'database/project-transfer-schema.json', data: textBytes(JSON.stringify(schemaSnapshot, null, 2)) },
        { name: 'architecture/repository-map.json', data: textBytes(JSON.stringify(map, null, 2)) },
        { name: 'architecture/repository-map.md', data: textBytes(mapMarkdown) },
      ]);
      downloadBlob(zip, 'hisab-sarraf-transfer-documents.zip');
      setMapInfo('بسته مستندات آماده شد: ' + map.file_count + ' فایل در نقشه؛ commit ' + map.commit.slice(0, 10));
    } catch (e) {
      setError(e.message || 'ساخت بسته مستندات ناموفق بود.');
    } finally {
      setBundleLoading(false);
    }
  };

  const downloadSchema = () => {
    downloadBlob(
      new Blob([JSON.stringify(schemaSnapshot, null, 2)], { type: 'application/json;charset=utf-8' }),
      'hisab-sarraf-live-table-structure-snapshot.json'
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4" dir="rtl">
      <div className="space-y-2">
        <h2 className="text-lg font-bold">بسته انتقال و ادامه توسعه پروژه</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          خروجی‌های لازم برای انتقال پروژه حساب صراف به گوشی یا محیط توسعه دیگر. این بخش فقط فایل دانلود می‌کند و هیچ داده‌ای را در برنامه یا پایگاه داده تغییر نمی‌دهد.
        </p>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>حفاظت از اطلاعات واقعی</AlertTitle>
        <AlertDescription className="text-xs leading-6">
          خروجی ساختار دیتابیس فقط شامل نام جدول‌ها، ستون‌ها، نوع داده، کلیدها، ارتباط‌ها و وضعیت RLS است؛ ردیف‌های مشتریان، تراکنش‌ها، کاربران، رمزها و توکن‌ها صادر نمی‌شوند.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h3 className="text-sm font-semibold">۱. سورس کامل پروژه</h3>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            دریافت آرشیو رسمی تمام فایل‌های ثبت‌شده در مخزن A1، از شاخه main. مخزن عمومی GitHub است و دانلود از خود GitHub انجام می‌شود.
          </p>
          <Button className="w-full gap-2" onClick={() => window.open(SOURCE_ARCHIVE, '_blank', 'noopener,noreferrer')}>
            <Download className="h-4 w-4" />
            دانلود ZIP سورس کامل از GitHub
          </Button>
          <a className="block break-all text-xs text-primary underline" href={REPOSITORY} target="_blank" rel="noreferrer">
            مشاهده مخزن و تاریخچه commitها
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">۲. ساختار واقعی جدول‌های پایگاه داده</h3>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            snapshot فقط‌خواندنی از ۶۲ جدول و ۸۵۸ ستون که در تاریخ {new Date(schemaSnapshot.captured_at).toLocaleString('fa-IR')} از پروژه متصل خوانده شده است. این فایل شامل داده‌های داخل جدول‌ها نیست.
          </p>
          <Button variant="outline" className="w-full gap-2" onClick={downloadSchema}>
            <Download className="h-4 w-4" />
            دانلود ساختار ۶۲ جدول (JSON)
          </Button>
          <p className="text-[10px] text-muted-foreground">
            این snapshot مربوط به زمان تهیه آن است؛ اگر بعداً ساختار دیتابیس تغییر کند باید snapshot تازه تهیه شود.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">۳. نقشه کامل فایل‌ها و پوشه‌ها</h3>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            نقشه در لحظه از GitHub دریافت می‌شود و شامل مسیر فایل‌ها، پوشه‌ها، تعداد و نوع فایل‌ها و شناسه commit است.
          </p>
          <Button variant="outline" className="w-full gap-2" onClick={handleMapDownload} disabled={mapLoading || bundleLoading}>
            {mapLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            دانلود نقشه فایل‌ها (JSON و Markdown)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">۴. بسته راهنمای ادامه کار در گوشی دیگر</h3>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            یک ZIP مستقل شامل ساختار دیتابیس، نقشه کامل مخزن و راهنمای فارسی هویت پروژه، قواعد ایمنی و روش شروع ادامه توسعه.
          </p>
          <Button className="w-full gap-2" onClick={handleDocumentationBundle} disabled={mapLoading || bundleLoading}>
            {bundleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            دانلود بسته مستندات انتقال
          </Button>
        </CardContent>
      </Card>

      {mapInfo && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>خروجی آماده شد</AlertTitle>
          <AlertDescription className="text-xs">{mapInfo}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ساخت خروجی ناموفق بود</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-center text-[10px] leading-5 text-muted-foreground">
        پروژه: A1 · حساب صراف · مخزن roohalla41-blip/-1 · شاخه main
        <br />
        این ابزار هیچ SQL اجرا نمی‌کند، هیچ حساب یا رکوردی نمی‌سازد و چیزی را روی دامنه منتشر نمی‌کند.
      </p>
    </div>
  );
}
