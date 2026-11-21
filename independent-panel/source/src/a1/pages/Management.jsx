// a1/pages/Management.jsx — مرکز مدیریت (رابط کاربری اولیه + سند معماری)
// فقط آیکون، پوسته و چیدمان؛ هیچ داده، کاربر، نقش، مجوز یا اتصال پایگاه داده‌ای خوانده یا نوشته نمی‌شود.
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, ChevronLeft, Users, UserPlus, KeyRound,
  Building2, Activity, Settings2, Layers,
} from 'lucide-react';
import { MANAGEMENT_SECTIONS_UI } from '@/a1/data/managementSections';
import ManagementSectionPanel from '@/a1/components/v21/management/ManagementSectionPanel';
import ManagementArchitectureView from '@/a1/components/v21/management/ManagementArchitectureView';

const ICONS = {
  users: Users,
  staff: UserPlus,
  roles: KeyRound,
  branches: Building2,
  activity: Activity,
  settings: Settings2,
};

export default function Management() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('center');
  const sectionId = params.get('section') || '';

  const openSection = id => setParams({ section: id });
  const closeSection = () => setParams({});

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-primary">مرکز مدیریت</h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              کاربران، کارکنان، نقش‌ها، شعب و کنترل‌های مدیریتی — فقط رئیس صراف.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-800">
            رابط اولیه — بدون دیتابیس
          </span>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700"
          >
            <ArrowRight className="h-3.5 w-3.5" /> میزکار
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="نمای مرکز مدیریت" className="flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'center'}
          onClick={() => { setTab('center'); }}
          className={'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ' + (
            tab === 'center' ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-secondary'
          )}
        >
          بخش‌های مدیریت
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'architecture'}
          onClick={() => { setTab('architecture'); setParams({}); }}
          className={'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ' + (
            tab === 'architecture' ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-secondary'
          )}
        >
          سند معماری
        </button>
      </div>

      {tab === 'architecture' ? (
        <ManagementArchitectureView />
      ) : (
        <div className="space-y-2">
          <div className="grid gap-1.5 sm:grid-cols-3">
            {[
              { label: 'بخش‌های مدیریتی', value: '۶ بخش' },
              { label: 'نقش‌های پایه', value: '۴ نقش' },
              { label: 'دسترسی', value: 'رئیس صراف و بالاتر' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-2">
                <span className="block text-[9px] text-muted-foreground">{item.label}</span>
                <b className="mt-0.5 block text-[11px] text-foreground">{item.value}</b>
              </div>
            ))}
          </div>

          {sectionId ? (
            <ManagementSectionPanel sectionId={sectionId} onBack={closeSection} />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {MANAGEMENT_SECTIONS_UI.map(section => {
                const Icon = ICONS[section.icon] || ShieldCheck;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => openSection(section.id)}
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-2.5 text-right transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <b className="min-w-0 text-[11px] font-extrabold text-foreground">{section.title}</b>
                      <ChevronLeft className="ms-auto h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">{section.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {section.functions.map(item => (
                        <span key={item} className="rounded-full border border-border bg-secondary/50 px-1.5 py-0.5 text-[9px] text-slate-600">
                          {item}
                        </span>
                      ))}
                    </div>
                    <span className="mt-auto pt-1.5 text-[9px] font-bold text-primary">بازکردن بخش</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-start gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-2 text-[10px] leading-5 text-sky-900">
            <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              این رابط، پوستهٔ اولیه است: چیدمان و مسیرها آماده‌اند اما هیچ کاربر، کارمند، شعبه یا مجوزی خوانده یا
              تغییر داده نمی‌شود. جزئیات قرارداد و مرزهای امنیتی در تب «سند معماری» آمده است.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}