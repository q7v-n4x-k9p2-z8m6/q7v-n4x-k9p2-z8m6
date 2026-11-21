// src/a1/pages/EnterpriseModuleScreen.jsx — صفحهٔ مرجع هر بخش سازمانی (مسیر پارامتری enterprise)
// هیچ داده یا عدد ساختگی نمایش نمی‌دهد: هویت ماژول از فهرست مرجع می‌آید و وضعیت هر جنبه شفاف است.
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, ListTree } from 'lucide-react';
import {
  enterpriseModuleByKey, aspectsFor, ENTERPRISE_ASPECT_LABELS,
} from '@/core/transfer/enterpriseModules';

const TONE = {
  PASS: 'bg-emerald-50 text-emerald-700',
  FAIL: 'bg-rose-50 text-rose-700',
  BLOCKED: 'bg-amber-50 text-amber-800',
};

function EmptyModule({ moduleKey }) {
  return (
    <section dir="rtl" lang="fa" className="rounded-2xl border border-[#d5e2f0] bg-white p-5 shadow-sm">
      <h1 className="text-sm font-extrabold text-[#102b4c]">بخش سازمانی ناشناخته</h1>
      <p className="mt-1 text-[11.5px] leading-6 text-slate-600">
        شناسهٔ «{moduleKey}» در فهرست مرجع بخش‌های سازمانی نیست؛ برای جلوگیری از نمایش محتوای ساختگی، صفحه‌ای ساخته نمی‌شود.
      </p>
      <Link to="/dashboard" className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#164b87]">
        <ArrowLeft className="h-3.5 w-3.5" /> بازگشت به میز کار
      </Link>
    </section>
  );
}

export default function EnterpriseModuleScreen() {
  const { moduleKey } = useParams();
  const module = enterpriseModuleByKey(moduleKey);
  if (!module) return <EmptyModule moduleKey={moduleKey} />;

  const aspects = aspectsFor(module);
  const entries = Object.entries(aspects);

  return (
    <section dir="rtl" lang="fa" className="rounded-2xl border border-[#d5e2f0] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf2fb] text-[#164b87]">
          <ListTree className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-sm font-extrabold text-[#102b4c]">{module.title}</h1>
          <p className="mt-1 text-[11.5px] leading-6 text-slate-600">{module.description}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {entries.map(([key, aspect]) => (
          <div key={key} className="rounded-xl border border-[#e2ebf5] px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <b className="text-[11px] text-[#102b4c]">{ENTERPRISE_ASPECT_LABELS[key] || key}</b>
              <span className={'rounded-lg px-1.5 py-0.5 text-[9.5px] font-bold ' + (TONE[aspect.status] || '')}>{aspect.status}</span>
            </div>
            <p className="mt-0.5 text-[10px] leading-5 text-slate-600">{aspect.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-[#e2ebf5] bg-[#f8fbfe] px-2.5 py-2">
        <b className="text-[11px] text-[#102b4c]">قابلیت‌های مرجع این بخش</b>
        <ul className="mt-1 space-y-0.5">
          {module.capabilities.map((item) => (
            <li key={item} className="flex items-start gap-1 text-[10.5px] leading-5 text-slate-700">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#2f7d5b]" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/70 px-2.5 py-2">
        <b className="flex items-center gap-1 text-[11px] text-amber-900">
          <Lock className="h-3 w-3" /> وابستگی‌های تکمیل این بخش
        </b>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10.5px] leading-5 text-amber-900">
          {module.dependsOn.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-1 text-[9.5px] leading-5 text-amber-800">
          تا زمانی که این وابستگی‌ها تأیید و متصل نشوند، این صفحه هیچ سند، مانده یا گزارش ساختگی نمایش نمی‌دهد.
        </p>
      </div>

      <Link to="/dashboard" className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-[#164b87]">
        <ArrowLeft className="h-3.5 w-3.5" /> بازگشت به میز کار
      </Link>
    </section>
  );
}