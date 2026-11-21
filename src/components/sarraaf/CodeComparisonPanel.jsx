import React, { useMemo, useState } from 'react';
import { FileCode2, GitCompareArrows, Upload, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function makeDiff(leftText, rightText) {
  const left = leftText.split(/\r?\n/);
  const right = rightText.split(/\r?\n/);
  const n = left.length;
  const m = right.length;

  if (n * m > 450000) {
    const rows = [];
    const max = Math.max(n, m);
    for (let i = 0; i < max; i += 1) {
      if (left[i] === right[i]) rows.push({ type: 'same', left: left[i] ?? '', right: right[i] ?? '', line: i + 1 });
      else {
        if (left[i] !== undefined) rows.push({ type: 'remove', left: left[i], line: i + 1 });
        if (right[i] !== undefined) rows.push({ type: 'add', right: right[i], line: i + 1 });
      }
    }
    return rows;
  }

  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i * width + j] = left[i] === right[j]
        ? 1 + table[(i + 1) * width + j + 1]
        : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      rows.push({ type: 'same', left: left[i], right: right[j], line: j + 1 });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      rows.push({ type: 'remove', left: left[i], line: i + 1 });
      i += 1;
    } else {
      rows.push({ type: 'add', right: right[j], line: j + 1 });
      j += 1;
    }
  }
  while (i < n) { rows.push({ type: 'remove', left: left[i], line: i + 1 }); i += 1; }
  while (j < m) { rows.push({ type: 'add', right: right[j], line: j + 1 }); j += 1; }
  return rows;
}

async function readFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return null;
  const parts = await Promise.all(files.map(file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`/* FILE: ${file.name} */\n${String(reader.result || '')}`);
    reader.onerror = () => reject(new Error(`خواندن فایل ${file.name} ناموفق بود.`));
    reader.readAsText(file);
  })));
  return parts.join('\n\n');
}

export default function CodeComparisonPanel() {
  const [leftName, setLeftName] = useState('نسخه اول');
  const [rightName, setRightName] = useState('نسخه دوم');
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [instructions, setInstructions] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const counts = useMemo(() => {
    if (!rows) return { added: 0, removed: 0, changed: 0 };
    const added = rows.filter(row => row.type === 'add').length;
    const removed = rows.filter(row => row.type === 'remove').length;
    return { added, removed, changed: added + removed };
  }, [rows]);

  const compare = () => {
    setError('');
    if (!leftText.trim() || !rightText.trim()) {
      setError('برای هر دو طرف، کد یا نقشه را وارد یا بارگذاری کن.');
      return;
    }
    setRows(makeDiff(leftText, rightText));
  };

  const load = async (event, setter) => {
    try {
      const text = await readFiles(event.target.files);
      if (text !== null) setter(text);
      setRows(null);
      setError('');
    } catch (err) {
      setError(err.message || 'خواندن فایل ناموفق بود.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section dir="rtl" className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">مقایسه‌گر کد و نقشه ساختار</h3>
            <Badge variant="outline" className="mr-auto">مقایسه مستقل</Badge>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            دو نسخه، دو فایل یا دو نقشه ساختاری را وارد کن. این ابزار تفاوت‌های متنی را مشخص می‌کند؛ تفسیر هوشمند خطاها و اجرای بررسی AI پس از اتصال کلید فعال می‌شود.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-3">
              <label className="text-xs font-semibold">سمت اول · مبنا</label>
              <input value={leftName} onChange={event => setLeftName(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm" aria-label="نام نسخه اول" />
              <Textarea value={leftText} onChange={event => { setLeftText(event.target.value); setRows(null); }} rows={9} placeholder="کد، نقشه یا متن نسخه اول را اینجا قرار بده…" className="font-mono text-xs" />
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" /> بارگذاری یک یا چند فایل متنی برای نسخه اول
                <input type="file" multiple accept=".js,.jsx,.ts,.tsx,.json,.md,.txt,.html,.css,.sql,.yml,.yaml" className="sr-only" onChange={event => load(event, setLeftText)} />
              </label>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <label className="text-xs font-semibold">سمت دوم · نسخه مورد بررسی</label>
              <input value={rightName} onChange={event => setRightName(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm" aria-label="نام نسخه دوم" />
              <Textarea value={rightText} onChange={event => { setRightText(event.target.value); setRows(null); }} rows={9} placeholder="کد، نقشه یا متن نسخه دوم را اینجا قرار بده…" className="font-mono text-xs" />
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" /> بارگذاری یک یا چند فایل متنی برای نسخه دوم
                <input type="file" multiple accept=".js,.jsx,.ts,.tsx,.json,.md,.txt,.html,.css,.sql,.yml,.yaml" className="sr-only" onChange={event => load(event, setRightText)} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold">توضیحات و دستور مقایسه</label>
            <Textarea
              value={instructions}
              onChange={event => setInstructions(event.target.value)}
              rows={3}
              placeholder="مثلاً: خطاهای نسخه اول را نادیده بگیر؛ فقط خطاهای نسخه دوم را گزارش کن. یا: تغییرات مربوط به مسیر ورود را جداگانه توضیح بده."
            />
            <p className="text-[11px] leading-5 text-muted-foreground">دستور تو همراه نتیجه نگهداری و برای تفسیر هوشمند استفاده می‌شود. در این مرحله، مقایسه متنی خام انجام می‌شود و هنوز ادعای تشخیص معنایی خطاها نداریم.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={compare} className="gap-2"><GitCompareArrows className="h-4 w-4" /> مقایسه دو نسخه</Button>
            <Button type="button" variant="outline" onClick={() => { setLeftText(''); setRightText(''); setInstructions(''); setRows(null); setError(''); }}>پاک‌کردن ورودی‌ها</Button>
          </div>
          {error && <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}
        </CardContent>
      </Card>

      {rows && (
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold">نتیجه مقایسه</h3>
              <Badge variant="secondary">{counts.changed} خط متفاوت</Badge>
              <Badge variant="outline">+{counts.added} افزوده</Badge>
              <Badge variant="outline">−{counts.removed} حذف‌شده</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-muted/40 p-3 text-xs"><span className="font-semibold">{leftName || 'نسخه اول'}</span><p className="mt-1 text-muted-foreground">{leftText.split(/\r?\n/).length} خط</p></div>
              <div className="rounded-md bg-muted/40 p-3 text-xs"><span className="font-semibold">{rightName || 'نسخه دوم'}</span><p className="mt-1 text-muted-foreground">{rightText.split(/\r?\n/).length} خط</p></div>
            </div>
            {instructions.trim() && <div className="rounded-md border p-3 text-xs leading-6"><span className="font-semibold">دستور ثبت‌شده:</span> {instructions}</div>}
            <div className="max-h-[560px] overflow-auto rounded-lg border">
              <div className="min-w-[640px]">
                {rows.map((row, index) => (
                  <div key={index} className={`grid grid-cols-[42px_1fr] border-b last:border-b-0 font-mono text-[11px] leading-5 ${row.type === 'add' ? 'bg-emerald-500/10' : row.type === 'remove' ? 'bg-red-500/10' : 'bg-background'}`}>
                    <span className="select-none border-l px-2 py-1 text-left text-muted-foreground">{row.line}</span>
                    <span className="whitespace-pre-wrap break-all px-2 py-1" dir="ltr">{row.type === 'add' ? '+ ' + row.right : row.type === 'remove' ? '− ' + row.left : '  ' + row.left}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-6">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>این خروجی تفاوت خط‌به‌خط است، نه تشخیص قطعی خطا. برای اینکه عامل هوشمند علت تغییرات را تحلیل کند، دستور بالا را همراه دو نسخه به سرویس AI متصل می‌کنیم؛ اجرای کد یا اعمال اصلاحات خودکار در این بخش انجام نمی‌شود.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
