// a1/components/v21/ContactSettingsPanel.jsx — ویرایش نوار تماس پایین صفحه از داخل تنظیمات
// آدرس وب‌سایت ثابت است (فقط نمایش/عدم نمایش)؛ ایمیل، تلفن و لینک‌ها قابل تغییر، افزودن و حذف‌اند.
import React from 'react';
import { Plus, Trash2, Globe, Check } from 'lucide-react';
import { useContactSettings } from '@/a1/lib/contactSettings';

export default function ContactSettingsPanel() {
  const [settings, save] = useContactSettings();

  const patchItem = (id, patch) => save({
    ...settings,
    items: settings.items.map(item => (item.id === id ? { ...item, ...patch } : item)),
  });

  const removeItem = id => save({ ...settings, items: settings.items.filter(item => item.id !== id) });

  const addItem = () => save({
    ...settings,
    items: [...settings.items, { id: `contact-${Date.now().toString(36)}`, label: '', href: '' }],
  });

  return (
    <section className="space-y-2 border border-[#b6c4cf] bg-[#f2f6f9] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <b className="text-[11px] text-[#24496d]">اطلاعات تماس نوار پایین</b>
          <p className="mt-1 text-[10px] leading-5 text-slate-600">
            ایمیل، شماره تلفن و لینک‌ها را همین‌جا جایگزین یا حذف کنید. آدرس وب‌سایت ثابت است و فقط می‌توانید نمایش آن را خاموش کنید.
          </p>
        </div>
        <button type="button" onClick={addItem} className="flex items-center gap-1 border border-blue-300 bg-white px-3 py-2 text-[10px] font-bold text-blue-900">
          <Plus className="h-3.5 w-3.5" />افزودن مورد
        </button>
      </div>

      <div className="space-y-2">
        {settings.items.map(item => (
          <div key={item.id} className="grid gap-2 border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_1fr_auto]">
            <label className="space-y-1 text-[10px]">
              <span className="text-slate-600">{item.fixed ? 'آدرس وب‌سایت (ثابت)' : 'متن نمایشی'}</span>
              <input
                value={item.label}
                readOnly={item.fixed}
                onChange={event => patchItem(item.id, { label: event.target.value })}
                placeholder={item.fixed ? '' : 'مثلاً ۰۷۰۰۱۲۳۴۵۶ یا info@example.com'}
                className={'h-8 w-full border bg-white px-2 text-[11px] ' + (item.fixed ? 'bg-slate-100 text-slate-600' : '')}
              />
            </label>
            <label className="space-y-1 text-[10px]">
              <span className="text-slate-600">{item.fixed ? 'نشانی (ثابت)' : 'نشانی یا لینک'}</span>
              <input
                value={item.href}
                readOnly={item.fixed}
                onChange={event => patchItem(item.id, { href: event.target.value })}
                placeholder={item.fixed ? '' : 'مثلاً https://t.me/... یا mailto:...'}
                dir="ltr"
                className={'h-8 w-full border bg-white px-2 text-[11px] ' + (item.fixed ? 'bg-slate-100 text-slate-600' : '')}
              />
            </label>
            <div className="flex items-end">
              {item.fixed ? (
                <label className="flex h-8 items-center gap-1.5 text-[10px] font-bold text-[#24496d]">
                  <input
                    type="checkbox"
                    checked={settings.showWebsite}
                    onChange={event => save({ ...settings, showWebsite: event.target.checked })}
                  />
                  <Globe className="h-3.5 w-3.5" />نمایش
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  title="حذف این مورد از نوار پایین"
                  className="flex h-8 items-center gap-1 border border-rose-200 bg-rose-50 px-2 text-[10px] text-rose-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />حذف
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1 text-[10px] text-emerald-700">
        <Check className="h-3.5 w-3.5" />تغییرات همین لحظه در نوار پایین اعمال می‌شود.
      </p>
    </section>
  );
}