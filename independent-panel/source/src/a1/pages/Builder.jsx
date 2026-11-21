// a1/pages/Builder.jsx — پنل سازنده (مبنای ساختار: src/pages/BuilderPanel.jsx در سورس A1)
// تب‌ها، گروه‌بندی و نام بخش‌ها حفظ شده‌اند؛ منبع داده همان ۶۲ جدول محلی است.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Server, LayoutGrid, Users, Wallet, MessageSquare, Store, Database, RefreshCw,
  Download, ShieldCheck, AlertTriangle, Check, X, Settings, Power,
} from 'lucide-react';
import { all, insert, update } from '@/a1/lib/db';
import { useAuth } from '@/a1/lib/demoAuth';

const TABS = [
  { value: 'system', label: 'نمای کلی', icon: Server },
  { value: 'structure', label: 'ساختار و ماژول‌ها', icon: LayoutGrid },
  { value: 'access', label: 'کاربران و دسترسی', icon: Users },
  { value: 'finance', label: 'مالی و پلن‌ها', icon: Wallet },
  { value: 'communication', label: 'ارتباطات', icon: MessageSquare },
  { value: 'services', label: 'خدمات و فروش', icon: Store },
  { value: 'tools', label: 'ابزار و نگهداری', icon: Database },
];

const BACKUP_TABLES = [
  'exchanges', 'users', 'customers', 'safes', 'bank_accounts', 'rates', 'origins',
  'chart_of_accounts', 'documents', 'ledger_entries', 'transfers', 'conversions',
  'feature_settings', 'app_settings', 'audit_logs', 'support_tickets', 'online_products',
];

const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value ?? 0) || 0);

function Panel({ title, note, children }) {
  return (
    <section className="rounded-xl border border-[#c9d7e3] bg-white">
      <header className="border-b border-[#e2eaf1] bg-[#f2f7fb] px-3 py-2">
        <b className="text-xs text-[#1e4776]">{title}</b>
        {note ? <p className="mt-1 text-[10px] leading-5 text-slate-500">{note}</p> : null}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return <p className="py-4 text-center text-[11px] text-slate-500">{children}</p>;
}

export default function Builder() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('system');
  const [state, setState] = useState({ loading: true, tables: {}, error: '' });
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const names = ['exchanges', 'users', 'user_permissions', 'customers', 'documents', 'ledger_entries', 'transfers', 'feature_settings', 'pricing_plans', 'plan_quotas', 'payment_records', 'support_tickets', 'audit_logs', 'error_reports', 'backup_records', 'online_products', 'charge_orders', 'referrals'];
      const rows = await Promise.all(names.map(name => all(name)));
      const tables = {};
      names.forEach((name, index) => { tables[name] = rows[index] || []; });
      setState({ loading: false, tables, error: '' });
    } catch (error) {
      setState({ loading: false, tables: {}, error: error?.message || 'بارگذاری اطلاعات پنل سازنده ناموفق بود.' });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tables = state.tables;
  const exchange = (tables.exchanges || [])[0] || null;
  const counts = useMemo(() => ([
    ['مشتریان', (tables.customers || []).length],
    ['کاربران', (tables.users || []).length],
    ['اسناد', (tables.documents || []).length],
    ['سطرهای دفتر کل', (tables.ledger_entries || []).length],
    ['حواله‌ها', (tables.transfers || []).length],
    ['محصولات آنلاین', (tables.online_products || []).length],
  ]), [tables]);

  const toggleFeature = async row => {
    const next = row.status === 'active' ? 'disabled' : 'active';
    setSaving(true);
    try {
      await update('feature_settings', row.id, { status: next });
      await insert('audit_logs', { action: 'settings', entity_type: 'feature_settings', entity_id: String(row.id), description: `تغییر وضعیت ${row.feature_key} به ${next}`, actor_name: user?.full_name || 'سازنده' });
      await load();
      setNotice(`وضعیت «${row.feature_key}» به ${next === 'active' ? 'فعال' : 'غیرفعال'} تغییر کرد.`);
    } catch (error) {
      setNotice('تغییر وضعیت انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  const runBackup = async () => {
    setSaving(true);
    try {
      const payload = {};
      let size = 0;
      for (const name of BACKUP_TABLES) {
        payload[name] = await all(name);
        size += JSON.stringify(payload[name]).length;
      }
      const blob = new Blob([JSON.stringify({ version: 21, createdAt: new Date().toISOString(), data: payload }, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'hisab-sarraf-v21-backup.json';
      link.click();
      URL.revokeObjectURL(link.href);
      await insert('backup_records', {
        exchange_code: exchange?.exchange_code || 'DEMO-EX',
        user_name: user?.full_name || 'سازنده',
        type: 'manual', status: 'success', file_name: 'hisab-sarraf-v21-backup.json',
        size_bytes: size, entity_types: BACKUP_TABLES,
        record_counts: Object.fromEntries(Object.entries(payload).map(([key, rows]) => [key, rows.length])),
      });
      await load();
      setNotice('فایل پشتیبان محلی ساخته شد و در سابقهٔ پشتیبان‌گیری ثبت شد.');
    } catch (error) {
      setNotice('پشتیبان‌گیری انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setSaving(false); }
  };

  const renderTab = () => {
    if (tab === 'system') {
      return (
        <div className="space-y-3">
          <Panel title="صرافی فعال" note="اطلاعات از جدول exchanges همین دستگاه خوانده می‌شود.">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-[#e2eaf1] bg-[#f8fbfd] p-3 text-[11px]">
                <b className="block text-sm text-[#1e4776]">{exchange?.exchange_name || exchange?.name || 'صرافی نمایشی'}</b>
                <span className="mt-1 block text-slate-500">کد صرافی: {exchange?.exchange_code || 'DEMO-EX'}</span>
                <span className="block text-slate-500">پلن: {exchange?.plan || 'free'} · وضعیت: {exchange?.status || 'active'}</span>
              </div>
              <div className="rounded-lg border border-[#e2eaf1] bg-[#f8fbfd] p-3 text-[11px]">
                <span className="block text-slate-500">سهمیه: {money(exchange?.quota_used)} از {money(exchange?.quota_limit)}</span>
                <span className="mt-1 block text-slate-500">نوع داده: نمایشی و محلی (IndexedDB)</span>
                <button onClick={() => navigate('/main-settings')} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-blue-900">
                  <Settings className="h-3.5 w-3.5" /> تنظیمات اصلی
                </button>
              </div>
            </div>
          </Panel>
          <Panel title="شمارش ساختار">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {counts.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#e2eaf1] bg-white p-3">
                  <span className="block text-[10px] text-slate-500">{label}</span>
                  <b className="text-base tabular-nums text-[#1e4776]">{money(value)}</b>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      );
    }

    if (tab === 'structure') {
      return (
        <Panel title="ماژول‌های برنامه" note="هر ماژول از جدول feature_settings خوانده می‌شود؛ تغییر وضعیت در همان جدول ثبت می‌گردد.">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(tables.feature_settings || []).map(row => (
              <button key={row.id} type="button" onClick={() => toggleFeature(row)} disabled={saving}
                className={'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[11px] ' + (row.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-slate-50 text-slate-600')}>
                <span className="font-bold">{row.feature_key}</span>
                <span className="inline-flex items-center gap-1">
                  <Power className="h-3.5 w-3.5" />
                  {row.status === 'active' ? 'فعال' : 'غیرفعال'}
                </span>
              </button>
            ))}
            {!(tables.feature_settings || []).length && <Empty>ماژولی ثبت نشده است.</Empty>}
          </div>
        </Panel>
      );
    }

    if (tab === 'access') {
      return (
        <div className="space-y-3">
          <Panel title="کاربران (جدول users)" note="کاربران این فهرست همان نشست‌های آزمایشی محلی هستند.">
            <div className="overflow-auto">
              <table className="w-full min-w-[420px] text-[11px]">
                <thead className="bg-[#edf3f9] text-[#1e4776]"><tr><th className="p-2 text-right">نام</th><th className="p-2">نام کاربری</th><th className="p-2">نقش</th><th className="p-2">وضعیت</th></tr></thead>
                <tbody>
                  {(tables.users || []).map(row => (
                    <tr key={row.id} className="border-t border-[#eef3f7]">
                      <td className="p-2 font-semibold">{row.full_name || row.username}</td>
                      <td className="p-2 text-center" dir="ltr">{row.username}</td>
                      <td className="p-2 text-center">{row.role}</td>
                      <td className="p-2 text-center">{row.is_active === false ? 'غیرفعال' : 'فعال'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(tables.users || []).length && <Empty>کاربری ثبت نشده است.</Empty>}
            </div>
          </Panel>
          <Panel title="مجوزهای ثبت‌شده (جدول user_permissions)">
            <div className="flex flex-wrap gap-1.5">
              {(tables.user_permissions || []).map(row => (
                <span key={row.id} className="rounded-md border border-[#d9e5ef] bg-[#f5f9fc] px-2 py-1 text-[10px] text-[#2a5477]">
                  {row.user_id} · {row.section}
                </span>
              ))}
              {!(tables.user_permissions || []).length && <Empty>مجوزی ثبت نشده است.</Empty>}
            </div>
          </Panel>
        </div>
      );
    }

    if (tab === 'finance') {
      return (
        <div className="space-y-3">
          <Panel title="پلن‌ها و تعرفه‌ها" note="جدول‌های pricing_plans و plan_quotas.">
            <div className="overflow-auto">
              <table className="w-full min-w-[380px] text-[11px]">
                <thead className="bg-[#edf3f9] text-[#1e4776]"><tr><th className="p-2 text-right">پلن</th><th className="p-2">قیمت</th><th className="p-2">مدت</th></tr></thead>
                <tbody>
                  {(tables.pricing_plans || []).map(row => (
                    <tr key={row.id} className="border-t border-[#eef3f7]">
                      <td className="p-2 font-semibold">{row.plan_name || row.name || row.plan || '—'}</td>
                      <td className="p-2 text-center tabular-nums">{money(row.price)} {row.currency || 'AFN'}</td>
                      <td className="p-2 text-center">{row.duration_days ? `${money(row.duration_days)} روز` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(tables.pricing_plans || []).length && <Empty>پلنی در این نسخهٔ نمایشی ثبت نشده است.</Empty>}
            </div>
          </Panel>
          <Panel title="سابقهٔ پرداخت">
            {(tables.payment_records || []).length
              ? <ul className="space-y-1 text-[11px]">{(tables.payment_records || []).map(row => <li key={row.id} className="flex justify-between border-b border-[#eef3f7] py-1"><span>{row.user_name || '—'}</span><span>{row.plan} · {row.payment_status}</span></li>)}</ul>
              : <Empty>پرداختی ثبت نشده است.</Empty>}
          </Panel>
        </div>
      );
    }

    if (tab === 'communication') {
      return (
        <div className="space-y-3">
          <Panel title="تیکت‌های پشتیبانی">
            {(tables.support_tickets || []).length
              ? <ul className="space-y-1.5 text-[11px]">{(tables.support_tickets || []).map(row => (
                <li key={row.id} className="rounded-lg border border-[#e2eaf1] p-2">
                  <b className="block">{row.subject || 'بدون عنوان'}</b>
                  <span className="mt-1 block text-slate-500">{row.status === 'open' ? 'باز' : 'بسته'}</span>
                </li>
              ))}</ul>
              : <Empty>تیکتی ثبت نشده است.</Empty>}
          </Panel>
          <Panel title="سوابق فعالیت">
            {(tables.audit_logs || []).length
              ? <ul className="space-y-1 text-[11px]">{(tables.audit_logs || []).slice().reverse().slice(0, 12).map(row => (
                <li key={row.id} className="flex justify-between gap-2 border-b border-[#eef3f7] py-1"><span>{row.description || row.action}</span><span className="shrink-0 text-slate-400">{String(row.created_at || '').slice(0, 10)}</span></li>
              ))}</ul>
              : <Empty>سابقه‌ای ثبت نشده است.</Empty>}
          </Panel>
        </div>
      );
    }

    if (tab === 'services') {
      return (
        <div className="space-y-3">
          <Panel title="محصولات آنلاین">
            {(tables.online_products || []).length
              ? <ul className="space-y-1 text-[11px]">{(tables.online_products || []).map(row => (
                <li key={row.id} className="flex justify-between border-b border-[#eef3f7] py-1"><span>{row.name}</span><span className="tabular-nums">{money(row.price)} {row.currency || 'AFN'}</span></li>
              ))}</ul>
              : <Empty>محصولی ثبت نشده است.</Empty>}
          </Panel>
          <Panel title="سفارش‌های خدمات">
            {(tables.charge_orders || []).length
              ? <ul className="space-y-1 text-[11px]">{(tables.charge_orders || []).map(row => (
                <li key={row.id} className="flex justify-between border-b border-[#eef3f7] py-1"><span>{row.product_name || row.title || 'سفارش'}</span><span>{row.status || 'pending'}</span></li>
              ))}</ul>
              : <Empty>سفارشی ثبت نشده است.</Empty>}
          </Panel>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Panel title="پشتیبان‌گیری" note="خروجی JSON از جدول‌های اصلی همین دستگاه ساخته می‌شود و در backup_records ثبت می‌گردد.">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={runBackup} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e4776] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">
              <Download className="h-4 w-4" /> {saving ? 'در حال ساخت…' : 'ساخت فایل پشتیبان'}
            </button>
            <span className="text-[10px] text-slate-500">سابقه: {(tables.backup_records || []).length} مورد</span>
          </div>
        </Panel>
        <Panel title="گزارش خطاها">
          {(tables.error_reports || []).length
            ? <ul className="space-y-1 text-[11px]">{(tables.error_reports || []).map(row => (
              <li key={row.id} className="border-b border-[#eef3f7] py-1"><b className="block">{row.error_type}</b><span className="text-slate-500">{row.error_message}</span></li>
            ))}</ul>
            : <Empty>خطایی ثبت نشده است.</Empty>}
        </Panel>
        <Panel title="نسخه و وضعیت">
          <ul className="space-y-1 text-[11px] text-slate-600">
            <li>نسخهٔ ساختار: ۲۱</li>
            <li>منبع داده: IndexedDB محلی همین مرورگر</li>
            <li>اتصال خارجی: غیرفعال</li>
            <li>ورود: نشست آزمایشی محلی (بدون احراز هویت واقعی)</li>
          </ul>
        </Panel>
      </div>
    );
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h1 className="text-sm font-extrabold text-[#1e4776]">پنل سازنده</h1>
            <p className="text-[10px] text-slate-500">ساختار: پنل سازندهٔ سامانه · منبع داده: جدول‌های محلی</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] bg-white px-2.5 py-1.5 text-[11px]">میز کار</button>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-[#c9d7e3] bg-white px-2.5 py-1.5 text-[11px]"><RefreshCw className="h-3.5 w-3.5" /> تازه‌سازی</button>
          <button type="button" onClick={() => logout()} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-800"><X className="h-3.5 w-3.5" /> خروج</button>
        </div>
      </header>

      <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="تب‌های پنل سازنده">
        {TABS.map(item => {
          const Icon = item.icon;
          const activeTab = tab === item.value;
          return (
            <button key={item.value} type="button" onClick={() => setTab(item.value)}
              className={'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold ' + (activeTab ? 'border-[#1e4776] bg-[#1e4776] text-white' : 'border-[#c9d7e3] bg-white text-[#2a5477]')}>
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          );
        })}
      </nav>

      {notice ? (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          <Check className="h-4 w-4 shrink-0" /> <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice('')}><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}

      {state.loading ? <p className="p-6 text-center text-xs text-slate-500">در حال بارگذاری…</p> : null}
      {state.error ? <p className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800"><AlertTriangle className="h-4 w-4" /> {state.error}</p> : null}
      {!state.loading && !state.error ? renderTab() : null}
    </div>
  );
}