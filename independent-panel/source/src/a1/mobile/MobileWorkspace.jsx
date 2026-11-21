// a1/mobile/MobileWorkspace.jsx — پوستهٔ مستقل موبایل حساب صراف (زیر ۷۶۸ پیکسل)
// ناوبری، فهرست بخش‌ها، فرم‌ها و گزارش‌ها همه با دادهٔ ساختگی فقط‌حافظه‌ای کار می‌کنند.
// هیچ خواندن یا نوشتنی روی دیتابیس، Supabase، IndexedDB، localStorage یا سرویس بیرونی انجام نمی‌شود.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Info, X } from 'lucide-react';
import { useAuth } from '@/a1/lib/demoAuth';
import { canModuleActionId, canViewModuleId } from '@/a1/lib/permissions';
import { MobileDemoProvider, useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { MOBILE_MODULES, TABS, moduleById } from '@/a1/mobile/mobileModules';
import { DEMO_EMPLOYEE_PERMISSIONS, CURRENCIES } from '@/a1/mobile/demoData';
import MobileHome from '@/a1/mobile/MobileHome';
import { OpsScreen, AccountsScreen } from '@/a1/mobile/MobileTabScreens';
import MobileMoreScreen from '@/a1/mobile/MobileMoreScreen';
import MobileModuleScreen from '@/a1/mobile/MobileModuleScreen';
import MobileFormSheet from '@/a1/mobile/MobileFormSheet';
import '@/a1/mobile/mobile-shell.css';

function DemoDialog({ kind, onClose, demo, notify, onOpenUsers }) {
  const language = demo.data.settings?.language || 'فارسی';

  return (
    <div
      className="a1m-sheet"
      role="dialog"
      aria-modal="true"
      aria-label={kind === 'settings' ? 'تنظیمات محلی' : 'راهنمای حساب صراف'}
      style={{ background: 'rgba(11, 39, 66, 0.55)' }}
      onClick={onClose}
    >
      <section
        className="a1m-sheet"
        style={{ position: 'absolute', insetInline: 0, bottom: 0, maxHeight: '78dvh', borderRadius: '18px 18px 0 0', overflow: 'hidden', animation: 'a1m-rise .22s ease-out' }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="a1m-sheet__head">
          <span className="a1m-sheet__title">{kind === 'settings' ? 'تنظیمات محلی' : 'راهنمای حساب صراف'}</span>
          <button type="button" className="a1m-sheet__close" onClick={onClose} aria-label="بستن"><X className="h-4 w-4" /></button>
        </header>
        <div className="a1m-sheet__body">
          {kind === 'settings' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <p style={{ fontSize: 11, color: '#5c748a', lineHeight: 1.9 }}>
                تنظیمات این نسخه فقط نمایشی است؛ تغییرات در همین حافظه می‌مانند و جایی ذخیره نمی‌شوند.
              </p>
              <div>
                <b style={{ fontSize: 11 }}>زبان برنامه</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                  {['فارسی', 'دری', 'English', 'العربية'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={'a1m-badge' + (language === item ? ' a1m-badge--blue' : '')}
                      style={{ padding: '7px 10px', fontSize: 10 }}
                      onClick={() => demo.updateSettings({ language: item })}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <b style={{ fontSize: 11 }}>ارزهای نمایشی</b>
                <p style={{ marginTop: 5, fontSize: 10, color: '#7c90a5', lineHeight: 1.8 }}>{CURRENCIES.join(' · ')}</p>
              </div>
              <button
                type="button"
                className="a1m-btn"
                onClick={async () => { await demo.restore(); notify('اطلاعات از موتور محلی دوباره خوانده شد.', 'success'); onClose(); }}
              >
                تازه‌سازی از موتور محلی
              </button>
              <button
                type="button"
                className="a1m-btn"
                onClick={() => { onClose(); onOpenUsers(); }}
              >
                مدیریت کاربران و دسترسی‌ها
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 9, fontSize: 11, lineHeight: 1.95, color: '#3d5873' }}>
              <p>۱. از چهار تب پایین جابه‌جا شوید: میزکار، عملیات، حسابات و بیشتر.</p>
              <p>۲. هر کاشی یا ردیف، بخش مورد نظر را با همان فرم‌ها و همان فیلدهای نسخهٔ لپ‌تاپ باز می‌کند.</p>
              <p>۳. ثبت، ویرایش و حذف در این نسخه فقط نمای نمایشی را تغییر می‌دهند و با بارگذاری مجدد صفحه پاک می‌شوند.</p>
              <p>۴. هفت بخش (دفتر نمایندگی‌ها، نرخ روز، اسعار، سوابق، خطاها، بیلانس و زبان) فقط در تب «بیشتر» است.</p>
              <p>۵. هیچ داده‌ای از دیتابیس خوانده نمی‌شود و هیچ سرویس بیرونی فراخوانی نمی‌گردد.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MobileShell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const demo = useMobileDemo();

  const [tab, setTab] = useState('home');
  const [activeModule, setActiveModule] = useState(() => {
    const requested = searchParams.get('module');
    return MOBILE_MODULES.some((item) => item.id === requested) ? requested : null;
  });
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState(null);
  const [dialog, setDialog] = useState('');
  const timer = useRef(null);

  // نقش و مجوز از همان دادهٔ موتور خوانده می‌شود که میزکار دسکتاپ استفاده می‌کند؛
  // قاعدهٔ بررسی هم همان تابع مشترک core/domain/access است.
  const role = demo.data?.role || user?.role || '';
  const permissions = Array.isArray(demo.data?.permissions) && demo.data.permissions.length
    ? demo.data.permissions
    : (String(role).toLowerCase() === 'employee' ? DEMO_EMPLOYEE_PERMISSIONS : []);

  const canView = useCallback((id) => canViewModuleId(role, permissions, id), [role, permissions]);
  const canAction = useCallback((id, action) => canModuleActionId(role, permissions, id, action), [role, permissions]);

  const notify = useCallback((message, tone = 'info') => {
    setNotice({ message, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(null), 4200);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const openModule = (id) => {
    if (!canView(id)) { notify('مجوز مشاهده این بخش برای حساب شما فعال نیست.', 'error'); return; }
    setActiveModule(id);
    setSearchParams(id === 'home' ? {} : { module: id }, { replace: true });
  };

  const closeModule = () => {
    setActiveModule(null);
    setSearchParams({}, { replace: true });
  };

  const openForm = (module, defaults = {}, record = null) => {
    if (!canAction(module, record ? 'edit' : 'create')) {
      notify('مجوز این عملیات برای حساب شما فعال نیست.', 'error');
      return;
    }
    setForm({ module, record, defaults });
  };

  const goTab = (key) => {
    setActiveModule(null);
    setTab(key);
    if (searchParams.get('module')) setSearchParams({}, { replace: true });
  };

  const handleAction = (action) => {
    switch (action) {
      case 'transactions': navigate('/transactions'); break;
      case 'support': navigate('/support'); break;
      case 'settings': setDialog('settings'); break;
      case 'help': setDialog('help'); break;
      case 'backup': notify('پشتیبان‌گیری در این دمو فقط نمایشی است؛ هیچ فایلی ساخته نمی‌شود.', 'info'); break;
      case 'restore': demo.restore(); notify('اطلاعات از موتور محلی دوباره خوانده شد.', 'success'); break;
      case 'reset': demo.clear(); notify('فقط بخش‌های نمایشی پاک شد؛ مشتریان و اسناد حسابداری دست‌نخورده ماندند.', 'success'); break;
      case 'cashIn': openForm('cashFlow', { kind: 'دخل' }); break;
      case 'cashOut': openForm('cashFlow', { kind: 'خرج' }); break;
      default: notify('این گزینه در نمای نمایشی فعال نیست.', 'info');
    }
  };

  const visibleModule = activeModule && canView(activeModule) ? activeModule : null;
  const userName = user?.full_name || user?.username || 'کاربر نمایشی';

  if (demo.status !== 'ready') {
    const failed = demo.status === 'error';
    return (
      <div className="a1m-root" dir="rtl">
        <div className="a1m-shell">
          <main className="a1m-main" style={{ display: 'grid', placeItems: 'center', minHeight: '62dvh', padding: 24 }}>
            <div style={{ display: 'grid', gap: 10, textAlign: 'center', maxWidth: 320 }}>
              <b style={{ fontSize: 13, color: '#0c213a' }}>{failed ? 'بارگذاری اطلاعات صرافی ناموفق بود' : 'در حال خواندن اطلاعات صرافی…'}</b>
              <span style={{ fontSize: 11, lineHeight: 1.9, color: '#5c748a' }}>
                {failed ? demo.error : 'همهٔ مشتریان، اسناد و مانده‌ها از همان موتور محلی لپ‌تاپ خوانده می‌شوند.'}
              </span>
              {failed ? <button type="button" className="a1m-btn" onClick={demo.retry}>تلاش دوباره</button> : null}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="a1m-root" dir="rtl">
      <div className="a1m-shell">
        <main className="a1m-main">
          {visibleModule ? (
            <MobileModuleScreen
              moduleId={visibleModule}
              onBack={closeModule}
              onOpenForm={openForm}
              notify={notify}
              canCreate={canAction(visibleModule, 'create')}
              canEdit={canAction(visibleModule, 'edit')}
              canDelete={canAction(visibleModule, 'delete')}
            />
          ) : tab === 'home' ? (
            <MobileHome
              canView={canView}
              canAction={canAction}
              onOpenModule={openModule}
              onOpenForm={openForm}
              onOpenMore={() => setTab('more')}
              userName={userName}
            />
          ) : tab === 'ops' ? (
            <OpsScreen canView={canView} canAction={canAction} onOpenModule={openModule} onOpenForm={openForm} onNavigate={navigate} />
          ) : tab === 'accounts' ? (
            <AccountsScreen canView={canView} onOpenModule={openModule} />
          ) : (
            <MobileMoreScreen canView={canView} onOpenModule={openModule} onAction={handleAction} />
          )}
        </main>

        <nav className="a1m-tabbar" aria-label="ناوبری موبایل حساب صراف">
          {TABS.map((item) => {
            const Icon = item.icon;
            const current = !visibleModule && tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={'a1m-tab' + (current ? ' is-active' : '')}
                aria-current={current ? 'page' : undefined}
                onClick={() => goTab(item.key)}
              >
                <Icon />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {form ? <MobileFormSheet form={form} onClose={() => setForm(null)} notify={notify} /> : null}

      {notice ? (
        <div className={'a1m-toast' + (notice.tone === 'error' ? ' a1m-toast--error' : notice.tone === 'success' ? ' a1m-toast--success' : '')} role="status">
          {notice.tone === 'success' ? <Check className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          <span style={{ flex: 1 }}>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="بستن اعلان"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}

      {dialog ? (
        <DemoDialog
          kind={dialog}
          onClose={() => setDialog('')}
          demo={demo}
          notify={notify}
          onOpenUsers={() => navigate('/settings?tab=users')}
        />
      ) : null}
    </div>
  );
}

export default function MobileWorkspace() {
  return (
    <MobileDemoProvider>
      <MobileShell />
    </MobileDemoProvider>
  );
}