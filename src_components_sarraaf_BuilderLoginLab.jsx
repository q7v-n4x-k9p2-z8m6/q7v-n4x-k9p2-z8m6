import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { setAppTokenHeader } from '@/lib/supabaseDirectAuth';
import { normalizeRole, HOME_BY_ROLE } from '@/lib/rbac';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlaskConical, Store, UserCircle, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

export default function BuilderLoginLab() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('sarraaf');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Use the production login RPC without invoking the legacy password migration.
      // This creates the normal authenticated session but does not alter account credentials.
      const { data, error: rpcError } = await supabase.rpc('legacy_login', {
        p_identifier: identifier.trim(),
        p_password: password,
      });

      if (rpcError) throw new Error(rpcError.message || 'خطا در ارتباط با سرویس ورود');
      if (!data) throw new Error('پاسخی از سرویس ورود دریافت نشد');
      if (!data.success) {
        const messages = {
          user_not_found: 'حساب کاربری پیدا نشد',
          wrong_password: 'رمز عبور اشتباه است',
          user_inactive: 'این حساب غیرفعال است',
          too_many_attempts: 'تعداد تلاش‌ها زیاد است؛ بعداً دوباره امتحان کنید',
          profile_not_found: 'پروفایل حساب پیدا نشد',
        };
        throw new Error(messages[data.error] || 'ورود ناموفق بود');
      }

      const user = data.user;
      const role = normalizeRole(user?.role);
      const isCorrectRole = tab === 'customer'
        ? role === 'customer'
        : ['creator', 'admin', 'sarraaf', 'employee'].includes(role);

      if (!isCorrectRole) {
        setError(tab === 'customer'
          ? 'این حساب مشتری نیست؛ نوع ورود صراف را انتخاب کنید.'
          : 'این حساب صراف نیست؛ نوع ورود مشتری را انتخاب کنید.');
        setLoading(false);
        return;
      }

      if (!data.token || !user) throw new Error('اطلاعات نشست ورود کامل نیست');

      setAppTokenHeader(data.token);
      localStorage.setItem('auth_token', data.token);
      if (role === 'creator') {
        localStorage.removeItem('auth_user');
      } else {
        localStorage.setItem('auth_user', JSON.stringify({ ...user, role }));
      }
      localStorage.removeItem('default_password_alert');
      window.location.assign(HOME_BY_ROLE[role] || (role === 'customer' ? '/customer' : '/dashboard'));
    } catch (err) {
      setError(err.message || 'ورود آزمایشی ناموفق بود');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2"><FlaskConical className="h-5 w-5 text-primary" /></div>
            <div>
              <CardTitle className="text-base">آزمایشگاه ورود پنل‌ها</CardTitle>
              <CardDescription>ورود با حساب‌های آزمایشی موجود و مشاهده پنل واقعی هر نقش</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription className="text-xs leading-6">
              این بخش فقط برای سازنده اصلی نمایش داده می‌شود. ورود از مسیر احراز هویت واقعی برنامه انجام می‌شود؛ رمز عبور مهاجرت یا تغییر داده نمی‌شود و اطلاعات مالی یا حساب کاربر ویرایش نمی‌گردد.
            </AlertDescription>
          </Alert>

          <Tabs value={tab} onValueChange={(value) => { setTab(value); setError(''); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sarraaf" className="gap-2"><Store className="h-4 w-4" /> پنل صراف</TabsTrigger>
              <TabsTrigger value="customer" className="gap-2"><UserCircle className="h-4 w-4" /> پنل مشتری</TabsTrigger>
            </TabsList>
            <TabsContent value="sarraaf">
              <p className="mb-3 text-xs text-muted-foreground">نام کاربری و رمز حساب ساختگی صراف را وارد کنید.</p>
            </TabsContent>
            <TabsContent value="customer">
              <p className="mb-3 text-xs text-muted-foreground">نام کاربری و رمز حساب ساختگی مشتری را وارد کنید.</p>
            </TabsContent>
          </Tabs>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="builder-lab-identifier">نام کاربری / موبایل / ایمیل</Label>
              <Input id="builder-lab-identifier" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="شناسه حساب آزمایشی" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="builder-lab-password">رمز عبور</Label>
              <Input id="builder-lab-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="رمز عبور حساب آزمایشی" />
            </div>
            {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" className="w-full gap-2" disabled={loading || !identifier.trim() || !password}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? 'در حال بررسی اطلاعات ورود...' : tab === 'customer' ? 'ورود آزمایشی به پنل مشتری' : 'ورود آزمایشی به پنل صراف'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground leading-6">
        برای خروج از حساب آزمایشی از دکمه خروج همان پنل استفاده کنید تا نشست پاک شود و به صفحه ورود برگردید. این آزمایشگاه هیچ حساب تازه‌ای ایجاد نمی‌کند.
      </p>
    </div>
  );
}
