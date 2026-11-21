// a1/pages/Notifications.jsx — اعلان‌های صرافی (ساختار: src/pages/Notifications.jsx سورس A1)
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { all } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

export default function Notifications() {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = currentUser();
        const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
        const [userRows, customerRows] = await Promise.all([all('user_notifications'), all('customer_notifications')]);
        const rows = [...userRows, ...customerRows]
          .filter(row => !row.exchange_code || row.exchange_code === code)
          .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
        if (active) setState({ loading: false, rows, error: '' });
      } catch (error) {
        if (active) setState({ loading: false, rows: [], error: error?.message || 'بارگذاری اعلان‌ها ناموفق بود.' });
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><Bell className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">اعلان‌ها</h1>
          <p className="text-[10px] text-slate-500">جدول‌های user_notifications و customer_notifications همین دستگاه</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
        {state.loading ? <p className="p-6 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
          : state.error ? <p className="p-6 text-center text-[11px] text-rose-700">{state.error}</p>
            : !state.rows.length ? <p className="p-6 text-center text-[11px] text-slate-500">اعلانی ثبت نشده است.</p>
              : (
                <ul className="divide-y divide-[#eef3f7]">
                  {state.rows.map(row => (
                    <li key={`${row.id}-${row.title || ''}`} className="flex items-start gap-2 p-3 text-[11px]">
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#1e4776]" />
                      <span className="min-w-0 flex-1">
                        <b className="block text-[#1e4776]">{row.title || 'اعلان'}</b>
                        <span className="mt-0.5 block text-slate-600">{row.message || row.body || '—'}</span>
                      </span>
                      <span className="shrink-0 text-[9px] text-slate-400">{String(row.created_at || '').slice(0, 10)}</span>
                    </li>
                  ))}
                </ul>
              )}
      </section>
    </div>
  );
}