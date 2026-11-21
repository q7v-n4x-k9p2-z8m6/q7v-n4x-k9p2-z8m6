import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FlaskConical, Globe2, Wallet } from 'lucide-react';
import { useRole } from '@/lib/role-context';
import { useI18n } from '@/lib/i18n';
import { ROLE_ORDER, ROLES } from '@/lib/rbac';
import { APP_META } from '@/lib/config';

export default function TopBar() {
  const { role, setRole } = useRole();
  const { lang, setLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (role === 'customer' && location.pathname !== '/portal') {
      navigate('/portal', { replace: true });
    }
    if (role !== 'customer' && location.pathname === '/portal') {
      navigate('/', { replace: true });
    }
  }, [role, location.pathname, navigate]);

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/95 backdrop-blur-md safe-top">
      <div className="flex items-center gap-2 px-3 py-2 sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2 lg:hidden">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-[13px] font-extrabold leading-tight">
              {t('app.name')}
            </span>
            <span className="block truncate text-[9.5px] text-muted-foreground">{t('app.edition')}</span>
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
          <span className="chip border border-amber-200 bg-amber-50 text-amber-800">
            <FlaskConical className="h-3 w-3" />
            {t('label.demo')}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {APP_META.buildStage} — داده‌های نمایشی، بدون اتصال به پایگاه دادهٔ واقعی
          </span>
        </div>

        <div className="mr-auto flex items-center gap-1.5 lg:mr-0">
          <button
            type="button"
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            className="flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-2 text-[11px] font-bold text-foreground/80 transition-colors hover:bg-secondary"
            title="زبان رابط"
          >
            <Globe2 className="h-3.5 w-3.5" />
            {lang === 'fa' ? 'فا' : 'EN'}
          </button>

          <label className="flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1">
            <span className="hidden text-[10px] text-muted-foreground sm:inline">{t('label.role')}</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="max-w-[104px] bg-transparent text-[11px] font-bold text-foreground outline-none sm:max-w-none"
            >
              {ROLE_ORDER.map((key) => (
                <option key={key} value={key}>
                  {ROLES[key].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}