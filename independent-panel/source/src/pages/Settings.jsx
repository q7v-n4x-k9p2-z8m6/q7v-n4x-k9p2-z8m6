import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe2, Coins, Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui-kit/PageHeader';
import SectionCard from '@/components/ui-kit/SectionCard';
import StatusBadge from '@/components/ui-kit/StatusBadge';
import { FormField, TextInput, Notice } from '@/components/forms/FormField';
import { useRecords } from '@/hooks/useRecords';
import { useRole } from '@/lib/role-context';
import { useI18n } from '@/lib/i18n';
import { APP_META, BASE_CURRENCY, EXCHANGE } from '@/lib/config';
import { dec } from '@/lib/format';

const DEMO_ENTITIES = ['LedgerEntry', 'Document', 'Transfer', 'Customer', 'Safe', 'BankAccount', 'Origin', 'AuditLog'];

export default function Settings() {
  const { can } = useRole();
  const { lang, setLang } = useI18n();
  const { items: currencies, reload } = useRecords('Rate');
  const [form, setForm] = useState({ code: '', buy_rate: '', sell_rate: '', symbol: '', decimals: '2' });
  const [busy, setBusy] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [message, setMessage] = useState(null);

  async function addCurrency(event) {
    event.preventDefault();
    if (!form.code.trim() || !Number(form.buy_rate) || !Number(form.sell_rate)) {
      return setMessage({ tone: 'rose', text: 'کد ارز و نرخ خرید و فروش الزامی است.' });
    }
    setBusy(true);
    try {
      await base44.entities.Rate.create({
        currency: form.code.trim().toUpperCase(),
        buy_rate: Number(form.buy_rate),
        sell_rate: Number(form.sell_rate),
        symbol: form.symbol.trim(),
        decimals: Number(form.decimals) || 2,
        type: 'fiat',
        is_active: true,
        show_to_customer: true,
      });
      setForm({ code: '', buy_rate: '', sell_rate: '', symbol: '', decimals: '2' });
      setMessage({ tone: 'emerald', text: 'ارز ثبت شد.' });
      reload();
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'ثبت ارز انجام نشد.' });
    } finally {
      setBusy(false);
    }
  }

  async function cleanupDemoData() {
    setBusy(true);
    setMessage(null);
    try {
      for (const entity of DEMO_ENTITIES) {
        await base44.entities[entity].deleteMany({ is_demo: true });
      }
      setMessage({ tone: 'emerald', text: 'رکوردهای نمونه پاک شدند. رکوردهای ساخته‌شده توسط شما دست‌نخورده ماندند.' });
      setConfirmCleanup(false);
    } catch (error) {
      setMessage({ tone: 'rose', text: error.message || 'پاک‌سازی انجام نشد.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="تنظیمات"
        description="اطلاعات محیط، زبان، ارزها و مدیریت داده‌های نمونه. این نسخه به هیچ سرویس بیرونی وصل نیست."
        icon={SettingsIcon}
      />

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <SectionCard title="اطلاعات محیط">
          <div className="space-y-1.5 text-[11.5px]">
            <Row label="نام برنامه" value={APP_META.name} />
            <Row label="نسخه" value={`${APP_META.version} — ${APP_META.edition}`} />
            <Row label="صرافی نمایشی" value={`${EXCHANGE.name} (${EXCHANGE.code})`} />
            <Row label="شهر / کشور" value={`${EXCHANGE.city} / ${EXCHANGE.country}`} />
            <Row label="ارز پایه" value={`${BASE_CURRENCY} — ${BASE_CURRENCY === 'AFN' ? 'افغانی' : BASE_CURRENCY}`} />
            <Row label="اتصال پایگاه دادهٔ واقعی" value="ندارد — مستقل و آزمایشی" />
          </div>
          <div className="mt-2">
            <Notice tone="amber">
              این برنامه عمداً به هیچ دیتابیس، حساب کاربری یا سرویس خارجی وصل نیست. اطلاعات نمایشی است.
            </Notice>
          </div>
        </SectionCard>

        <SectionCard title="زبان و نمایش" description="ساختار ترجمه آماده است؛ متن کامل صفحات در فاز بعد منتقل می‌شود">
          <div className="flex items-center gap-2">
            {[
              { code: 'fa', label: 'فارسی' },
              { code: 'en', label: 'English' },
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11.5px] font-bold ${
                  lang === item.code ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <Globe2 className="h-3.5 w-3.5" /> {item.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-5 text-muted-foreground">
            زبان پیش‌فرض فارسی و جهت راست‌چین است. در نسخهٔ نهایی، زبان دستگاه و ترجیح کاربر مبنا قرار می‌گیرد.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="ارزها و نرخ" description="جدول rates مرجع A1: هر ارز با نرخ خرید و فروش دستی (بدون نرخ‌گیری خودکار)">
        <form onSubmit={addCurrency} className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <FormField label="کد">
            <TextInput value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="USD" />
          </FormField>
          <FormField label="نرخ خرید">
            <TextInput type="number" value={form.buy_rate} onChange={(event) => setForm((prev) => ({ ...prev, buy_rate: event.target.value }))} placeholder="0" />
          </FormField>
          <FormField label="نرخ فروش">
            <TextInput type="number" value={form.sell_rate} onChange={(event) => setForm((prev) => ({ ...prev, sell_rate: event.target.value }))} placeholder="0" />
          </FormField>
          <FormField label="نماد">
            <TextInput value={form.symbol} onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))} placeholder="$" />
          </FormField>
          <FormField label="اعشار">
            <TextInput type="number" value={form.decimals} onChange={(event) => setForm((prev) => ({ ...prev, decimals: event.target.value }))} />
          </FormField>
          <button
            type="submit"
            disabled={busy || !can('settings.manage')}
            className="mt-4 flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[11.5px] font-bold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> افزودن
          </button>
        </form>

        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {currencies.map((currency) => (
            <div key={currency.id} className="flex items-center justify-between rounded-lg border border-border/70 px-2.5 py-1.5">
              <div>
                <p className="num text-[11.5px] font-bold">{currency.currency} {currency.symbol}</p>
                <p className="text-[10px] text-muted-foreground">
                  خرید {dec(currency.buy_rate)} / فروش {dec(currency.sell_rate)}
                </p>
              </div>
              <StatusBadge label={currency.is_active ? 'فعال' : 'غیرفعال'} tone={currency.is_active ? 'emerald' : 'slate'} />
            </div>
          ))}
          {!currencies.length ? (
            <p className="text-[11px] text-muted-foreground">
              ارزی تعریف نشده است. تا زمان تعریف، فهرست پیش‌فرض برنامه استفاده می‌شود.
            </p>
          ) : null}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Coins className="h-3 w-3" /> نرخ خرید و فروش همین‌جا دستی ثبت می‌شود؛ هیچ نرخ روز، API نرخ ارز یا نرخ‌گیری خودکار وجود ندارد.
        </p>
      </SectionCard>

      <SectionCard title="داده‌های نمونه" description="رکوردهای علامت‌خوردهٔ دمو قابل پاک‌سازی هستند">
        <p className="mb-2 text-[11px] leading-6 text-muted-foreground">
          رکوردهایی که با برچسب «نمونه» ساخته شده‌اند در فیلد is_demo علامت خورده‌اند. پاک‌سازی فقط این رکوردها را حذف می‌کند.
        </p>
        {confirmCleanup ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={cleanupDemoData}
              disabled={busy}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-50"
            >
              {busy ? 'در حال پاک‌سازی…' : 'تأیید پاک‌سازی داده نمونه'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmCleanup(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-[11.5px] font-bold text-foreground/80"
            >
              انصراف
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmCleanup(true)}
            disabled={!can('settings.manage')}
            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11.5px] font-bold text-rose-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> پاک‌سازی داده‌های نمونه
          </button>
        )}
      </SectionCard>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-left font-bold">{value}</span>
    </div>
  );
}