import React, { useMemo, useState } from 'react';
import { Monitor, Smartphone, ShieldCheck, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Send, ArrowLeftRight, Search, Bell, ChevronDown, Home } from 'lucide-react';
import CreatorPreviewLab, { CREATOR_PREVIEW_MODULES } from '@/components/sarraaf/CreatorPreviewLab';
import MobileLayoutPreview from '@/components/sarraaf/MobileLayoutPreview';

const LAPTOP_DESIGNS = [
  ['ساختار اصلی حساب صراف','منوهای افقی، نوار آیکون‌ها، داشبورد و شش گروه اصلی','کلاسیک'],
  ['میزکار فشرده','همان ابزارها و صفحات با فاصله کمتر و دسترسی سریع‌تر','فشرده'],
  ['ناوبری کناری','آیکون‌ها در ستون کناری و میزکار در بخش اصلی','کناری'],
  ['داشبورد مدیریتی','کارت‌های آماری برجسته و گروه‌های اصلی زیر آن','مدیریتی'],
  ['دو ستونه متعادل','شش گروه ماژول در دو ستون منظم','دو ستونه'],
  ['سه ستونه عریض','نمای فشرده گروه‌ها برای نمایشگر عریض','سه ستونه'],
  ['حسابداری‌محور','دفاتر، کدینگ، گزارش و بیلانس در اولویت دید','حسابداری'],
  ['عملیات‌محور','عملیات دخل، خرج، حواله و معامله در ابتدای میزکار','عملیات'],
  ['رسمی روشن','پس‌زمینه روشن، مرزبندی ظریف و خوانایی بالا','روشن'],
  ['حرفه‌ای پرتراکنش','فضای کاری متراکم با حفظ همه ماژول‌ها','پرتراکنش']
].map((x,i)=>({id:i+1,title:x[0],desc:x[1],style:x[2]}));

const MOBILE_DESIGNS = [
  ['اندروید کلاسیک','صفحه خانه، نوار آیکون‌های واقعی و نوار پایین','کلاسیک'],
  ['کارت‌های مدیریتی','شاخص‌های مشتری، صندوق، عملیات و سود در کارت‌های لمسی','کارت‌ها'],
  ['شبکه آیکون‌ها','دسترسی شبکه‌ای به ماژول‌های واقعی حساب صراف','شبکه‌ای'],
  ['عملیات سریع','دخل، خرج، حواله و معامله در دسترس ابتدای صفحه','عملیات'],
  ['نوار پایین کاربردی','ناوبری پایین و فضای اصلی برای فهرست‌ها و فرم‌ها','نوار پایین'],
  ['فهرست عمودی','ماژول‌ها به شکل ردیف‌های واضح و قابل لمس','فهرستی'],
  ['مشتری و دفاتر','دسترسی زودهنگام به مشتریان و دفتر حساب','مشتری'],
  ['صندوق و حواله','صندوق‌ها، بانک‌ها و حواله‌ها در اولویت','صندوق'],
  ['نمای جمع‌وجور','فاصله‌گذاری کمتر با حفظ لمس‌پذیری','جمع‌وجور'],
  ['اندروید رسمی','چیدمان ساده، خوانا و منظم برای استفاده روزانه','رسمی']
].map((x,i)=>({id:i+1,title:x[0],desc:x[1],style:x[2]}));

const GROUP_ORDER = ['عمومی','تعاریف و دفاتر','صندوق و بانک','عملیات صرافی','حسابداری','گزارشات','امکانات تکمیلی','تنظیمات'];
const SAMPLE_ROWS = [
  ['مشتری نمونه احمدی','دخل صندوق','۱۲٬۰۰۰ AFN'],
  ['مشتری نمونه رحیمی','حواله ارسالی','۳۰۰ USD']
];

function ModuleIcons({mobile=false,variant=1}) {
  const modules = CREATOR_PREVIEW_MODULES.filter(m=>m.id!=='home');
  const ordered = variant===7
    ? [...modules].sort((a,b)=>((a.group==='حسابداری'||a.group==='گزارشات')?0:1)-((b.group==='حسابداری'||b.group==='گزارشات')?0:1))
    : variant===8
      ? [...modules].sort((a,b)=>((a.group==='صندوق و بانک'||a.group==='عملیات صرافی')?0:1)-((b.group==='صندوق و بانک'||b.group==='عملیات صرافی')?0:1))
      : modules;
  return <div className={'grid gap-1.5 '+(mobile?'grid-cols-3':'grid-cols-4 sm:grid-cols-5')}>
    {ordered.slice(0,mobile?9:15).map(m=>{const Icon=m.icon;return <div key={m.id} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-center"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eaf1f7] text-[#245b80]"><Icon size={16}/></span><span className="line-clamp-2 text-[8px] leading-3 text-slate-600">{m.label}</span></div>;})}
  </div>;
}

function MiniSample({mobile=false,variant=1}) {
  return <div dir="rtl" className={'overflow-hidden rounded-lg border border-slate-300 bg-[#f4f7fa] text-slate-700 '+(mobile?'w-full':'w-full')}>
    <div className="flex items-center justify-between bg-gradient-to-l from-[#245b80] to-[#397da5] px-2 py-2 text-white">
      <div className="flex items-center gap-1.5"><Home size={13}/><b className="text-[9px]">حساب صراف</b></div>
      <div className="flex gap-2"><Search size={12}/><Bell size={12}/><ChevronDown size={12}/></div>
    </div>
    {!mobile&&<div className="flex flex-wrap gap-1 border-b bg-white p-1">{['فایل','تعاریف','عملیات','حسابات','گزارشات','تنظیمات','امکانات تکمیلی'].map(x=><span key={x} className="rounded bg-slate-100 px-1.5 py-1 text-[7px]">{x}</span>)}</div>}
    <div className="p-2">
      <div className="mb-2 flex items-center justify-between"><b className="text-[9px]">مرکز عملیات صرافی</b><span className="rounded bg-emerald-50 px-1.5 py-1 text-[7px] text-emerald-700">آزمایشی</span></div>
      <div className={'mb-2 grid gap-1 '+(mobile?'grid-cols-2':'grid-cols-4')}>
        {['مشتریان','صندوق‌ها','عملیات امروز','سود خالص'].map((x,i)=><div key={x} className="rounded border border-slate-200 bg-white p-1.5"><span className="block text-[7px] text-slate-500">{x}</span><b className="text-[9px]">{['۱۲۸','۸','۴۸','—'][i]}</b></div>)}
      </div>
      <ModuleIcons mobile={mobile} variant={variant}/>
      <div className="mt-2 rounded border border-slate-200 bg-white p-2">
        <div className="mb-1 flex items-center justify-between"><b className="text-[8px]">گردش نمونه عملیات</b><span className="text-[7px] text-slate-400">فهرست آزمایشی</span></div>
        {SAMPLE_ROWS.map((r,i)=><div key={r[0]} className="grid grid-cols-[1.2fr_1fr_.8fr] gap-1 border-t py-1 text-[7px]"><span>{r[0]}</span><span>{r[1]}</span><b>{r[2]}</b></div>)}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {[[ArrowDownCircle,'دخل'],[ArrowUpCircle,'خرج'],[Send,'حواله'],[ArrowLeftRight,'معامله'],[Monitor,'دفاتر']].map(([Icon,label])=><div key={label} className="flex flex-col items-center gap-1 rounded border border-slate-200 bg-white p-1 text-[7px]"><Icon size={13} className="text-[#245b80]"/>{label}</div>)}
      </div>
    </div>
    {mobile&&<div className="grid grid-cols-5 border-t bg-white p-1 text-center text-[7px]">{['خانه','حسابات','عملیات','مشتریان','بیشتر'].map(x=><span key={x}>{x}</span>)}</div>}
  </div>;
}

function DesignCard({item,selected,onClick,mobile=false}) {
  return <button type="button" onClick={onClick} className={'min-w-0 rounded-xl border p-2 text-right transition '+(selected?'border-[#245b80] bg-blue-50 ring-2 ring-blue-100':'border-slate-200 bg-white hover:border-slate-400')}>
    <div className="mb-2 flex items-center justify-between gap-1"><span className="rounded-md bg-[#245b80] px-2 py-1 text-[9px] font-black text-white">طرح {String(item.id).padStart(2,'0')}</span><span className="text-[8px] text-slate-500">{item.style}</span></div>
    <div className={mobile?'mx-auto max-w-[175px] overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white p-1':'overflow-hidden rounded-lg border border-slate-300 bg-slate-50 p-1'}>
      <MiniSample mobile={mobile} variant={item.id}/>
    </div>
    <b className="mt-2 block text-[10px] text-slate-800">{item.title}</b>
    <span className="mt-1 block text-[8px] leading-4 text-slate-500">{item.desc}</span>
    <span className="mt-2 block text-[8px] font-bold text-[#245b80]">{selected?'نمونه کامل همین طرح نمایش داده شده':'برای دیدن نمونه کامل انتخاب کنید'}</span>
  </button>;
}

const LAPTOP_STYLE = `
.layout-full-preview[data-device="laptop"] .creator-preview-device { max-height: none !important; min-height: 720px !important; }
.layout-full-preview[data-device="laptop"][data-design="2"] .creator-preview-menus button { min-height: 34px; padding: 4px 8px; }
.layout-full-preview[data-device="laptop"][data-design="2"] .creator-mobile-module-dock button { min-height: 48px; padding: 4px; }
.layout-full-preview[data-device="laptop"][data-design="2"] .creator-preview-device main { padding: 8px; }
.layout-full-preview[data-device="laptop"][data-design="3"] .creator-preview-device > div.flex.min-h-0.flex-1.flex-col.overflow-hidden { flex-direction: row; }
.layout-full-preview[data-device="laptop"][data-design="3"] .creator-mobile-module-dock { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); align-content: start; width: 210px; max-height: 620px; overflow-y: auto; border-left: 1px solid #9aabb9; border-bottom: 0; }
.layout-full-preview[data-device="laptop"][data-design="3"] .creator-preview-device main { min-width: 0; }
.layout-full-preview[data-device="laptop"][data-design="4"] .creator-preview-device main > div:nth-child(2) > div { border-radius: 14px; box-shadow: 0 3px 12px #1e3a5f12; padding: 16px; }
.layout-full-preview[data-device="laptop"][data-design="5"] .creator-preview-device main > div:nth-child(3) { grid-template-columns: repeat(2,minmax(0,1fr)); }
.layout-full-preview[data-device="laptop"][data-design="6"] .creator-preview-device main > div:nth-child(3) { grid-template-columns: repeat(3,minmax(0,1fr)); }
.layout-full-preview[data-device="laptop"][data-design="7"] .creator-preview-device main > div:nth-child(3) section { border-color: #9db4c7; }
.layout-full-preview[data-device="laptop"][data-design="7"] .creator-preview-device main > div:nth-child(3) section:nth-child(4) { grid-column: span 2; }
.layout-full-preview[data-device="laptop"][data-design="8"] .creator-preview-device main { display: flex; flex-direction: column; }
.layout-full-preview[data-device="laptop"][data-design="8"] .creator-preview-device main > div:nth-child(4) { order: 1; }
.layout-full-preview[data-device="laptop"][data-design="8"] .creator-preview-device main > div:nth-child(3) { order: 2; }
.layout-full-preview[data-device="laptop"][data-design="9"] .creator-preview-device main { background: #fff; }
.layout-full-preview[data-device="laptop"][data-design="9"] .creator-preview-device main section { border-radius: 6px; box-shadow: none; }
.layout-full-preview[data-device="laptop"][data-design="10"] .creator-preview-device main { padding: 7px; }
.layout-full-preview[data-device="laptop"][data-design="10"] .creator-preview-device main section { padding: 7px; }
`;

const MOBILE_STYLE = `
.layout-full-preview[data-device="mobile"] .creator-preview-device { max-height: 78vh !important; min-height: 680px !important; }
.layout-full-preview[data-device="mobile"] .creator-mobile-module-dock { display:flex !important; flex:0 0 auto; width:100%; gap:6px; overflow-x:auto; overflow-y:hidden; border-top:1px solid #cbd5e1; border-bottom:0; background:#fff; padding:8px 7px calc(8px + env(safe-area-inset-bottom)); }
.layout-full-preview[data-device="mobile"] .creator-mobile-module-dock > button { flex:0 0 72px; min-width:72px; min-height:62px; border:1px solid #e2e8f0; border-radius:13px; background:#f8fafc; padding:7px 4px; }
.layout-full-preview[data-device="mobile"] .creator-preview-device > div.flex.min-h-0.flex-1.flex-col.overflow-hidden { display:flex; flex-direction:column; }
.layout-full-preview[data-device="mobile"] .creator-preview-device > div > main { order:1; flex:1 1 auto; min-height:0; width:100%; overflow-y:auto; padding:12px; }
.layout-full-preview[data-device="mobile"] .creator-preview-device > div > aside.creator-mobile-module-dock { order:2; }
.layout-full-preview[data-device="mobile"] .creator-preview-device main > div:first-child { gap:8px; }
.layout-full-preview[data-device="mobile"] .creator-preview-device input,
.layout-full-preview[data-device="mobile"] .creator-preview-device select,
.layout-full-preview[data-device="mobile"] .creator-preview-device textarea { min-height:44px; max-width:100%; }
.layout-full-preview[data-device="mobile"] .creator-preview-device .creator-mobile-records { width:100%; }
.layout-full-preview[data-device="mobile"] .creator-preview-device .creator-mobile-records > button { min-height:76px; text-align:right; }
.layout-full-preview[data-device="mobile"][data-design="2"] .creator-preview-device main > div:nth-child(2) { gap:8px; }
.layout-full-preview[data-device="mobile"][data-design="3"] .creator-preview-device main > div:nth-child(3) { grid-template-columns:repeat(3,minmax(0,1fr)); }
.layout-full-preview[data-device="mobile"][data-design="4"] .creator-preview-device main { display:flex; flex-direction:column; }
.layout-full-preview[data-device="mobile"][data-design="4"] .creator-preview-device main > div:nth-child(4) { order:1; }
.layout-full-preview[data-device="mobile"][data-design="4"] .creator-preview-device main > div:nth-child(3) { order:2; }
.layout-full-preview[data-device="mobile"][data-design="5"] .creator-mobile-module-dock { position:sticky; bottom:0; }
.layout-full-preview[data-device="mobile"][data-design="6"] .creator-preview-device main > div:nth-child(3) section { border-radius:10px; margin-bottom:8px; }
.layout-full-preview[data-device="mobile"][data-design="7"] .creator-preview-device main > div:nth-child(3) section:nth-child(1),
.layout-full-preview[data-device="mobile"][data-design="7"] .creator-preview-device main > div:nth-child(3) section:nth-child(4) { border-color:#7da4c4; box-shadow:0 2px 8px #245b8014; }
.layout-full-preview[data-device="mobile"][data-design="8"] .creator-preview-device main > div:nth-child(3) section:nth-child(2),
.layout-full-preview[data-device="mobile"][data-design="8"] .creator-preview-device main > div:nth-child(3) section:nth-child(3) { border-color:#7da4c4; }
.layout-full-preview[data-device="mobile"][data-design="9"] .creator-preview-device main { padding:7px; }
.layout-full-preview[data-device="mobile"][data-design="9"] .creator-preview-device main section { padding:8px; }
.layout-full-preview[data-device="mobile"][data-design="10"] .creator-preview-device main section { border-radius:9px; box-shadow:none; }
`;

export default function LayoutDesignCatalog() {
  const [device,setDevice]=useState('laptop');
  const [laptopChoice,setLaptopChoice]=useState(1);
  const [mobileChoice,setMobileChoice]=useState(1);
  const designs=device==='laptop'?LAPTOP_DESIGNS:MOBILE_DESIGNS;
  const selected=device==='laptop'?laptopChoice:mobileChoice;
  const current=useMemo(()=>designs.find(x=>x.id===selected)||designs[0],[designs,selected]);
  const choose=id=>device==='laptop'?setLaptopChoice(id):setMobileChoice(id);
  return <section dir="rtl" className="space-y-4">
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-4">
      <div className="flex items-center gap-2"><Monitor className="h-5 w-5 text-[#245b80]"/><h3 className="text-sm font-black text-slate-800">آزمایش طرح‌های واقعی حساب صراف</h3></div>
      <p className="mt-2 text-[10px] leading-6 text-slate-600">هر کارت یک نمونه داخلی دارد که از نام‌ها و آیکون‌های واقعی ماژول‌های حساب صراف ساخته شده است. با انتخاب هر کارت، پیش‌نمایش کامل همان دستگاه باز می‌شود؛ فرم‌ها، فهرست‌ها، ثبت و ویرایش فقط با داده ساختگی و در حافظه محلی مرورگر کار می‌کنند.</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-semibold">
        <span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">۱۰ طرح لپ‌تاپ</span>
        <span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">۱۰ طرح اندروید</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-emerald-800"><ShieldCheck size={12}/>فقط محیط آزمایشی</span>
      </div>
    </div>
    <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
      <button type="button" onClick={()=>setDevice('laptop')} className={'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-bold '+(device==='laptop'?'bg-white text-[#245b80] shadow':'text-slate-600')}><Monitor size={15}/>طرح‌های لپ‌تاپ</button>
      <button type="button" onClick={()=>setDevice('mobile')} className={'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-bold '+(device==='mobile'?'bg-white text-[#245b80] shadow':'text-slate-600')}><Smartphone size={15}/>طرح‌های اندروید</button>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {designs.map(item=><DesignCard key={item.id} item={item} mobile={device==='mobile'} selected={selected===item.id} onClick={()=>choose(item.id)}/>)}
    </div>
    <div className="rounded-2xl border border-[#c7d5e1] bg-white p-3 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><span className="text-[9px] font-bold text-[#245b80]">پیش‌نمایش کامل انتخاب‌شده</span><h4 className="mt-1 text-sm font-black text-slate-800">طرح {String(current.id).padStart(2,'0')} · {current.title}</h4><p className="mt-1 text-[9px] text-slate-500">{current.desc}</p></div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-800"><CheckCircle2 size={11}/>داده ساختگی · دیتابیس قطع</span>
      </div>
      <style>{device==='laptop'?LAPTOP_STYLE:MOBILE_STYLE}</style>
      <div className="layout-full-preview" data-device={device} data-design={current.id}>
        {device==='laptop'?<CreatorPreviewLab key="full-laptop-preview"/>:<MobileLayoutPreview key="full-mobile-preview"/>}
      </div>
      <p className="mt-3 text-[9px] leading-5 text-slate-500">برای آزمایش، روی آیکون مشتریان، صندوق، حواله، معامله، دفاتر یا گزارش‌ها بزنید. ثبت و ویرایش به داده‌های نمونه همین مرورگر محدود است و به حساب‌ها یا اطلاعات واقعی دسترسی ندارد.</p>
    </div>
  </section>;
}
