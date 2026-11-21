import React, { useMemo, useState } from 'react';
import { FlaskConical, ShieldCheck, ClipboardList, AlertTriangle, Bot, Send, Clock3, CheckCircle2, LockKeyhole, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabaseConfig } from '@/lib/supabaseConfig';

const FUNCTION_PATH = '/functions/v1/builder-ai-assistant';

function getToken() {
  try { return localStorage.getItem('auth_token') || ''; } catch { return ''; }
}

const EXAMPLES = [
  'تمام بخش‌های صندوق را از نظر نمایش، فرم‌ها و مسیرهای مرتبط بررسی کن.',
  'مسیر ایجاد مشتری تا مشاهده دفتر حساب او را به سناریوهای آزمایشی تقسیم کن.',
  'چیدمان پنل صراف را در موبایل، تبلت و لپ‌تاپ بررسی‌پذیر کن.',
  'مجوزهای نقش‌های مختلف را به‌صورت فقط‌خواندنی ممیزی کن.',
];

export default function TestingAgentPanel({ projectSnapshot = [], role }) {
  const [goal, setGoal] = useState('');
  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const snapshot = useMemo(
    () => (Array.isArray(projectSnapshot) ? projectSnapshot.slice(0, 100) : []),
    [projectSnapshot]
  );

  const createPlan = async (event) => {
    event?.preventDefault?.();
    const request = goal.trim();
    if (!request || planning) return;
    if (role !== 'creator') {
      setError('این ابزار فقط برای حساب سازندهٔ اصلی فعال است.');
      return;
    }
    const token = getToken();
    if (!token) {
      setError('نشست سازنده پیدا نشد. دوباره وارد پنل سازنده شوید.');
      return;
    }

    setPlanning(true);
    setError('');
    setPlan('');
    try {
      const { url, key } = getSupabaseConfig();
      if (!url) throw new Error('نشانی سرویس هوش مصنوعی پیکربندی نشده است.');
      const headers = { 'Content-Type': 'application/json', 'x-app-token': token };
      if (key) {
        headers.apikey = key;
        headers.Authorization = `Bearer ${key}`;
      }
      const response = await fetch(String(url).replace(/\/+$/, '') + FUNCTION_PATH, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: [
            'در نقش برنامه‌ریز آزمون نرم‌افزار برای حساب صراف پاسخ بده.',
            'فقط یک برنامه آزمایش دقیق و مرحله‌بندی‌شده تهیه کن؛ هیچ عملیاتی را اجرا نکن.',
            'از ساختار و فهرست ماژول‌های ارائه‌شده استفاده کن و سناریوها را با پیش‌شرط، مراحل، نتیجه مورد انتظار و اولویت بنویس.',
            'حالت پیش‌فرض فقط‌خواندنی است. هر سناریوی نیازمند ثبت/ویرایش/حذف را جداگانه علامت‌گذاری کن و تا تأیید صریح اجرا نشود.',
            'هیچ‌گاه اطلاعات واقعی کاربران، حساب‌های مالی، اسناد یا تراکنش‌های محیط زنده را هدف آزمایش قرار نده.',
            'درخواست کاربر: ' + request,
          ].join('\n'),
          context: [],
          projectSnapshot: snapshot,
          requestSnapshot: {
            feature: 'testing_agent',
            purpose: 'test_planning_only',
            executionEnabled: false,
            browserRunner: 'not_connected',
            defaultMode: 'read_only',
            liveDataMutationAllowed: false,
            externalSideEffectsAllowed: false,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status === 'error' || data.status === 'not_configured') {
        throw new Error(data.error || data.reply || `پاسخ سرور دریافت نشد (کد ${response.status}).`);
      }
      if (data.status !== 'ok' || typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('پاسخ برنامه‌ریزی از سرویس هوش مصنوعی معتبر نبود.');
      }
      const answer = data.reply.trim();
      setPlan(answer);
      setHistory(previous => [{
        id: Date.now(),
        goal: request,
        status: 'برنامه تهیه شد؛ اجرا نشده',
        createdAt: new Date().toLocaleString(),
        plan: answer,
      }, ...previous].slice(0, 8));
    } catch (err) {
      setError(err?.message || 'تهیه برنامه آزمایش ناموفق بود.');
    } finally {
      setPlanning(false);
    }
  };

  return (
    <section dir="rtl" className="mx-auto w-full max-w-6xl space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold">عامل هوشمند آزمایش</h2>
              <p className="text-xs text-muted-foreground">محیط مستقل آزمایش در پنل سازنده · متصل به همان هوش مصنوعی موجود</p>
            </div>
            <Badge variant="outline" className="gap-1"><Bot className="h-3.5 w-3.5" /> برنامه‌ریز هوشمند</Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />
              <p className="text-sm font-semibold">حفاظت از داده‌ها</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">هیچ تستی روی اطلاعات واقعی کاربران یا اسناد مالی اجرا نمی‌شود.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <ClipboardList className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">تهیه سناریو</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">هوش مصنوعی فعلی ساختار برنامه را مبنا قرار می‌دهد و مراحل آزمون را پیشنهاد می‌کند.</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <MonitorPlay className="mb-2 h-5 w-5 text-amber-600" />
              <p className="text-sm font-semibold">اجرای مرورگر</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">موتور خودکار مرورگر هنوز متصل نیست؛ اجرای تست فعلاً غیرفعال است.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold">دستور آزمایش را بنویسید</h3>
            <p className="mt-1 text-xs text-muted-foreground">مثلاً بنویسید: «تمام بخش‌های صندوق را آزمایش کن». ابتدا فقط برنامه و سناریوها تهیه می‌شوند.</p>
          </div>
          <form onSubmit={createPlan} className="space-y-3">
            <Textarea
              value={goal}
              onChange={event => setGoal(event.target.value)}
              placeholder="چه بخشی یا چه مسیر کاری باید آزمایش شود؟"
              rows={4}
              className="resize-y"
              disabled={planning}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={planning || !goal.trim()} className="gap-2">
                {planning ? <Clock3 className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                {planning ? 'در حال تهیه برنامه…' : 'تهیه برنامه آزمایش'}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setGoal(''); setPlan(''); setError(''); }} disabled={planning}>
                پاک‌کردن
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">دستورهای نمونه</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(example => (
                <Button key={example} type="button" variant="outline" size="sm" className="h-auto whitespace-normal text-right text-xs leading-5" onClick={() => setGoal(example)} disabled={planning}>
                  {example}
                </Button>
              ))}
            </div>
          </div>
          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">برنامه آزمایش</h3>
          </div>
          {plan ? (
            <div className="rounded-lg border bg-muted/20 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                برنامه از هوش مصنوعی دریافت شد؛ هیچ تستی اجرا نشده است.
              </div>
              <div className="whitespace-pre-wrap break-words text-sm leading-7">{plan}</div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-5 text-center text-xs leading-6 text-muted-foreground">پس از ارسال دستور، سناریوها و مراحل پیشنهادی در این قسمت نمایش داده می‌شوند.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-bold">سوابق این نشست</h3>
            <span className="mr-auto text-xs text-muted-foreground">{history.length} برنامه</span>
          </div>
          {history.length ? history.map(item => (
            <div key={item.id} className="rounded-lg border p-3 space-y-1">
              <p className="text-sm font-semibold">{item.goal}</p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{item.createdAt}</span>
                <span>·</span>
                <span>{item.status}</span>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => { setGoal(item.goal); setPlan(item.plan); }}>
                مشاهده برنامه
              </Button>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground">هنوز برنامه‌ای در این نشست تهیه نشده است.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-6">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">محدودیت و قاعده ایمنی</p>
          <p>این نسخه فقط برنامه‌ریزی هوشمند را انجام می‌دهد. برای اجرای واقعی، باید runner مرورگر به محیط آزمایشی جداگانه متصل شود. هیچ اتصال یا نوشتنی به دیتابیس زنده، حساب کاربران یا سرویس‌های بیرونی از این صفحه انجام نمی‌شود.</p>
        </div>
      </div>
    </section>
  );
}
