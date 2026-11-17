import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard, Search, Bell, Wallet, Users, ArrowLeftRight, FileText,
  Landmark, BarChart3, Menu, Plus, Clock3, TrendingUp, ArrowUpRight,
  ArrowDownRight, Send, CalendarDays, Receipt, Building2, Home, Settings,
  CreditCard, Activity, Filter, ShieldCheck, ChevronLeft, PanelLeft,
  Smartphone, BookOpen, BookText, Coins, Scale, Banknote, ClipboardList,
  ListChecks, Globe, Printer, MoreHorizontal
} from 'lucide-react';

const LAPTOP_DESIGNS = [
  {id:1,title:'ساختار اصلی کلاسیک',desc:'همان ساختار آشنای حساب صراف با فاصله‌گذاری مرتب‌تر',style:'وفادار به نسخه اصلی',tone:'#245b80'},
  {id:2,title:'نوار ابزار فشرده',desc:'همان منوها و گروه‌ها در فضای کم‌ارتفاع‌تر',style:'فشرده و سریع',tone:'#245b80'},
  {id:3,title:'میزکار با منوی کناری',desc:'همان بخش‌ها با منوی عمودی در کنار میزکار',style:'ناوبری کناری',tone:'#245b80'},
  {id:4,title:'کارت‌های آماری برجسته',desc:'ساختار ثابت با تأکید بصری بیشتر بر چهار شاخص اصلی',style:'مدیریتی',tone:'#245b80'},
  {id:5,title:'گروه‌بندی دو ستونه',desc:'شش گروه اصلی با چینش دو ستونه و خوانایی بیشتر',style:'دو ستونه',tone:'#245b80'},
  {id:6,title:'گروه‌بندی سه ستونه',desc:'همان شش گروه در سه ستون برای نمایشگر عریض',style:'نمایشگر عریض',tone:'#245b80'},
  {id:7,title:'میزکار حسابداری',desc:'همان بخش‌ها با برجسته‌سازی دفاتر و گزارشات',style:'حسابداری‌محور',tone:'#245b80'},
  {id:8,title:'عملیات سریع در بالا',desc:'عملیات روزانه در دسترس‌تر، بدون حذف هیچ گروهی',style:'عملیات‌محور',tone:'#245b80'},
  {id:9,title:'نمای رسمی روشن',desc:'پس‌زمینه روشن، خطوط ظریف و چیدمان رسمی',style:'رسمی و روشن',tone:'#245b80'},
  {id:10,title:'نمای متراکم حرفه‌ای',desc:'همان اجزا با فاصله کمتر برای کاربران پرتراکنش',style:'حرفه‌ای متراکم',tone:'#245b80'}
];
const MOBILE_DESIGNS = [
  {id:1,title:'موبایل کلاسیک',desc:'ساختار آشنای صفحه اصلی با نوار پایین',style:'وفادار به نسخه اصلی',tone:'#245b80'},
  {id:2,title:'کارت‌های آماری بزرگ',desc:'چهار شاخص اصلی در کارت‌های خوانا و لمسی',style:'داشبوردی',tone:'#245b80'},
  {id:3,title:'منوی ماژول‌ها',desc:'شش گروه اصلی به شکل فهرست‌های مرتب',style:'گروه‌بندی‌شده',tone:'#245b80'},
  {id:4,title:'دسترسی سریع عملیاتی',desc:'عملیات روزانه بالاتر از سایر بخش‌ها',style:'عملیات‌محور',tone:'#245b80'},
  {id:5,title:'نوار پایین کلاسیک',desc:'ناوبری پایین و صفحه اصلی با فضای بیشتر',style:'ناوبری پایین',tone:'#245b80'},
  {id:6,title:'فهرست عمودی',desc:'بخش‌ها به صورت ردیف‌های بزرگ و قابل لمس',style:'فهرست‌محور',tone:'#245b80'},
  {id:7,title:'مشتری و حسابداری',desc:'همان گروه‌ها با میانبر مشتریان و دفاتر در ابتدا',style:'مشتری‌محور',tone:'#245b80'},
  {id:8,title:'صندوق و حواله',desc:'میانبرهای صندوق و حواله در اولویت صفحه',style:'صندوق‌محور',tone:'#245b80'},
  {id:9,title:'نمای جمع‌وجور',desc:'چیدمان کم‌ارتفاع با حفظ عنوان‌ها و گروه‌ها',style:'فشرده',tone:'#245b80'},
  {id:10,title:'نمای رسمی موبایل',desc:'کارت‌های ساده، خطوط ظریف و تایپوگرافی رسمی',style:'رسمی و روشن',tone:'#245b80'}
];

const GROUPS = [
  {title:'تعاریف و دفاتر',icon:BookOpen,items:['تعریف مشتریان','دفتر حساب مشتریان','تعریف نمایندگی‌ها','دفتر حساب نمایندگی‌ها']},
  {title:'صندوق و بانک',icon:Wallet,items:['صندوق‌ها و موجودی','بانک و چک','انتقال بین صندوق‌ها']},
  {title:'عملیات صرافی',icon:ArrowLeftRight,items:['خرید و فروش اسعار','دفتر حواله‌ها','مصارف و پرداخت‌ها']},
  {title:'حسابداری و گزارشات',icon:FileText,items:['دفتر روزنامچه','دفتر کل','کدینگ حساب‌ها','بدهکاران و بستانکاران','گزارش عملیات','مفاد و زیان','بیلانس عمومی']},
  {title:'امکانات تکمیلی',icon:Globe,items:['گروه و چت','محصولات آنلاین','راهنما و پشتیبانی']},
  {title:'تنظیمات',icon:Settings,items:['تعریف اسعار','کاربران و دسترسی‌ها','تنظیمات سیستم']}
];
const QUICK = [
  ['دخل صندوق',Plus],['خرج صندوق',ArrowDownRight],['حواله ارسالی',Send],
  ['حواله دریافتی',ArrowUpRight],['معامله اسعار',ArrowLeftRight]
];
const STATS = [
  ['مشتریان','۱٬۲۸۰',Users],['صندوق‌ها','۸',Wallet],
  ['عملیات امروز','۴۸',Activity],['سود خالص','محاسبه نشده',TrendingUp]
];
const TONE = '#245b80';

function DesktopMock({design}) {
  const n=design.id;
  const dense=[2,10].includes(n);
  const groupCols=n===5?2:n===6?3:n===10?3:1;
  const statsCols=n===4?2:4;
  const sidebar=n===3;
  const quickTop=n===8;
  const shell='rounded-2xl bg-[#edf2f7] text-slate-800 '+(dense?'p-2 space-y-2':'p-3 space-y-3');
  const menuItems=['فایل','تعاریف','عملیات','حسابات','گزارشات','تنظیمات','امکانات تکمیلی'];
  const groupGrid='grid gap-2 '+(groupCols===1?'grid-cols-1':groupCols===2?'grid-cols-2':'grid-cols-3');
  return <div className={shell}>
    <header className="rounded-xl bg-gradient-to-l from-[#245b80] to-[#397da5] px-4 py-3 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><div className="rounded-lg bg-white/15 p-2"><Landmark size={20}/></div><div><b className="block text-sm">حساب صراف</b><span className="text-[9px] text-white/75">سامانه مدیریت صرافی</span></div></div>
        <div className="hidden items-center gap-2 sm:flex"><span className="rounded-lg bg-white/15 px-3 py-2 text-[10px]"><Search className="ml-1 inline" size={12}/>جست‌وجو</span><Bell size={16}/><Settings size={16}/><span className="rounded-lg bg-white/15 px-3 py-2 text-[10px]">صراف نمونه</span></div>
      </div>
    </header>
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {menuItems.map((x,i)=><span key={x} className={'rounded-lg px-3 py-2 text-[10px] font-bold '+(i===2?'bg-[#245b80] text-white':'text-slate-600')}>{x}</span>)}
    </nav>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap gap-2">{[['مشتریان',Users],['صندوق',Wallet],['معاملات',ArrowLeftRight],['حواله',Send],['دفاتر',BookText],['گزارش',BarChart3],['اسعار',Coins],['تنظیمات',Settings]].map(([x,I])=><span key={x} className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2 text-[9px] font-semibold text-slate-600"><I size={14} color={TONE}/>{x}</span>)}</div>
      <span className="text-[9px] text-slate-500">دسترسی سریع به ماژول‌ها</span>
    </div>
    <div className={sidebar?'grid grid-cols-[145px_minmax(0,1fr)] gap-3':'space-y-3'}>
      {sidebar&&<aside className="rounded-xl border bg-white p-2"><b className="mb-2 block text-[10px] text-slate-700">منوی بخش‌ها</b>{menuItems.map(x=><div key={x} className="border-b border-slate-100 px-2 py-3 text-[10px] text-slate-600">{x}</div>)}</aside>}
      <main className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <div><b className="text-sm">مرکز عملیات صرافی</b><p className="mt-1 text-[9px] text-slate-500">تاریخ: ۱۴۰۵/۰۸/۲۶ · وضعیت اتصال: آنلاین</p></div>
          <span className="rounded-lg bg-emerald-50 px-3 py-2 text-[9px] font-bold text-emerald-700">آماده به کار</span>
        </div>
        <div className={'grid gap-2 '+(statsCols===2?'grid-cols-2':'grid-cols-4')}>
          {STATS.map(([label,value,I],i)=><div key={label} className={'rounded-xl border bg-white '+(dense?'p-2':'p-3')+(n===4&&i===3?' ring-1 ring-[#245b80]/20':'')}><div className="flex items-center justify-between gap-1"><span className="text-[9px] text-slate-500">{label}</span><I size={16} color={TONE}/></div><b className="mt-2 block text-sm font-black">{value}</b></div>)}
        </div>
        {quickTop&&<QuickPanel dense={dense}/>}
        <div className={groupGrid}>
          {GROUPS.map(({title,icon:Icon,items},i)=><section key={title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 border-b border-slate-100 pb-2"><span className="rounded-lg bg-[#245b80]/10 p-2"><Icon size={15} color={TONE}/></span><b className="text-[10px]">{title}</b></div>
            <div className={'grid gap-1 '+(groupCols===1?'grid-cols-4':groupCols===2?'grid-cols-2':'grid-cols-2')}>
              {items.map((x,j)=><div key={x} className="flex min-h-9 items-center gap-1 rounded-lg bg-slate-50 px-2 py-2 text-[9px] text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-[#245b80]"/>{x}</div>)}
            </div>
          </section>)}
        </div>
        {!quickTop&&<QuickPanel dense={dense}/>}
      </main>
    </div>
    <footer className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[8px] text-slate-500"><span>حساب صراف · نسخه آزمایشی</span><span>اطلاعات این صفحه ساختگی است</span></footer>
  </div>;
}

function QuickPanel({dense=false}) {
  return <section className="rounded-xl border border-slate-200 bg-white p-3">
    <div className="mb-2 flex items-center justify-between"><b className="text-[11px]">عملیات سریع</b><span className="text-[8px] text-slate-400">میانبرهای روزانه</span></div>
    <div className={'grid gap-2 '+(dense?'grid-cols-5':'grid-cols-5')}>
      {QUICK.map(([x,I])=><div key={x} className="flex items-center justify-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-3 text-[9px] font-semibold text-slate-600"><I size={14} color={TONE}/>{x}</div>)}
    </div>
  </section>;
}

function MobileMock({design}) {
  const n=design.id;
  const dense=n===9;
  const statsFirst=[1,2,5,10].includes(n);
  const quickFirst=n===4||n===8;
  const groupStyle=n===6?'list':n===3?'grid':'cards';
  const cols=n===3?3:n===6?1:2;
  return <div className={'bg-[#f2f5f8] text-slate-800 '+(dense?'space-y-2':'space-y-3')}>
    <header className="bg-gradient-to-l from-[#245b80] to-[#397da5] px-3 py-3 text-white">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Landmark size={18}/><div><b className="block text-xs">حساب صراف</b><span className="text-[8px] text-white/75">مرکز عملیات</span></div></div><div className="flex gap-3"><Search size={16}/><Bell size={16}/><Menu size={17}/></div></div>
    </header>
    <div className="mx-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"><div><b className="text-[11px]">مرکز عملیات صرافی</b><p className="text-[8px] text-slate-500">۱۴۰۵/۰۸/۲۶ · آنلاین</p></div><span className="rounded-md bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">آماده</span></div>
    {quickFirst&&<div className="px-3"><QuickPanel dense/></div>}
    {statsFirst&&<div className={'grid grid-cols-2 gap-2 px-3 '+(dense?'':'')}>{STATS.map(([label,value,I])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><span className="text-[9px] text-slate-500">{label}</span><I size={15} color={TONE}/></div><b className="mt-2 block text-sm">{value}</b></div>)}</div>}
    <div className="space-y-2 px-3">
      {GROUPS.map(({title,icon:Icon,items})=><section key={title} className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center gap-2"><span className="rounded-lg bg-[#245b80]/10 p-2"><Icon size={15} color={TONE}/></span><b className="text-[10px]">{title}</b><ChevronLeft className="mr-auto text-slate-400" size={14}/></div>
        <div className={groupStyle==='list'?'space-y-1':'grid gap-1 '+(cols===3?'grid-cols-3':'grid-cols-2')}>
          {items.map(x=><div key={x} className={'rounded-lg bg-slate-50 px-2 py-2 text-[9px] text-slate-600 '+(groupStyle==='list'?'border-b border-slate-100':'')}>{x}</div>)}
        </div>
      </section>)}
    </div>
    {!statsFirst&&<div className="grid grid-cols-2 gap-2 px-3">{STATS.map(([label,value,I])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><span className="text-[9px] text-slate-500">{label}</span><I size={15} color={TONE}/></div><b className="mt-2 block text-sm">{value}</b></div>)}</div>}
    {!quickFirst&&<div className="px-3"><QuickPanel dense/></div>}
    <nav className="sticky bottom-0 grid grid-cols-5 border-t border-slate-200 bg-white px-1 py-2">{[['خانه',Home],['حسابات',FileText],['عملیات',ArrowLeftRight],['مشتریان',Users],['بیشتر',Menu]].map(([x,I],i)=><div key={x} className={'flex flex-col items-center gap-1 text-[8px] '+(i===0?'font-bold text-[#245b80]':'text-slate-400')}><I size={17}/>{x}</div>)}</nav>
  </div>;
}

function LayoutCard({item,selected,onClick,mobile=false}) {
  return <button type="button" onClick={onClick} className={'rounded-xl border p-2 text-right transition '+(selected?'border-[#245b80] bg-blue-50 ring-2 ring-blue-100':'border-slate-200 bg-white hover:border-slate-400')}>
    <div className="mb-2 flex items-center justify-between"><span className="rounded-md bg-[#245b80] px-2 py-1 text-[10px] font-black text-white">طرح {String(item.id).padStart(2,'0')}</span><span className="text-[8px] text-slate-400">{item.style}</span></div>
    <div className={'overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 '+(mobile?'mx-auto h-24 w-16':'h-24 w-full')}>
      {mobile?<div className="mx-auto h-full w-full rounded-md border border-slate-300 bg-white p-1"><div className="h-2 rounded bg-[#245b80]"/><div className="mt-1 grid grid-cols-2 gap-1">{[1,2,3,4].map(x=><div key={x} className="h-4 rounded-sm bg-slate-100"/>)}</div><div className="mt-1 space-y-1">{[1,2,3].map(x=><div key={x} className="h-1.5 rounded bg-slate-200"/>)}</div><div className="mt-1 h-2 rounded bg-[#245b80]/30"/></div>
      :<div className="flex h-full gap-1"><div className="w-1/5 rounded-sm bg-[#245b80]"/><div className="flex-1"><div className="h-2 rounded-sm bg-slate-200"/><div className="mt-1 grid grid-cols-3 gap-1">{[1,2,3].map(x=><div key={x} className="h-5 rounded-sm bg-white ring-1 ring-slate-200"/>)}</div><div className="mt-1 h-8 rounded-sm bg-white ring-1 ring-slate-200"/><div className="mt-1 grid grid-cols-5 gap-1">{[1,2,3,4,5].map(x=><div key={x} className="h-1.5 rounded-sm bg-slate-200"/>)}</div></div></div>}
    </div>
    <b className="mt-2 block text-[11px] text-slate-800">{item.title}</b><span className="mt-1 block text-[9px] leading-4 text-slate-500">{item.desc}</span>
    <span className="mt-2 block text-[9px] font-bold text-slate-600">{selected?'در حال نمایش':'برای مشاهده انتخاب کنید'}</span>
  </button>;
}

export default function LayoutDesignCatalog() {
  const [device,setDevice]=useState('laptop');
  const [laptopChoice,setLaptopChoice]=useState(1);
  const [mobileChoice,setMobileChoice]=useState(1);
  const designs=device==='laptop'?LAPTOP_DESIGNS:MOBILE_DESIGNS;
  const selected=device==='laptop'?laptopChoice:mobileChoice;
  const current=useMemo(()=>designs.find(x=>x.id===selected)||designs[0],[designs,selected]);
  const choose=(id)=>device==='laptop'?setLaptopChoice(id):setMobileChoice(id);
  return <section dir="rtl" className="space-y-4">
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-l from-blue-50 to-white p-4">
      <div className="flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-[#245b80]"/><h3 className="text-sm font-black text-slate-800">طرح‌های برگرفته از ساختار اصلی حساب صراف</h3></div>
      <p className="mt-2 text-[10px] leading-6 text-slate-600">همه طرح‌ها همان بخش‌های آشنای برنامه را حفظ می‌کنند: منوهای اصلی، نوار آیکون‌ها، مرکز عملیات، چهار کارت آماری، شش گروه ماژول و عملیات سریع. تفاوت فقط در چیدمان و تراکم نمایش است.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-semibold"><span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">۱۰ طرح لپ‌تاپ</span><span className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200">۱۰ طرح موبایل</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-emerald-800"><ShieldCheck size={12}/>فقط محیط آزمایشی</span></div>
    </div>
    <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
      <button type="button" onClick={()=>setDevice('laptop')} className={'flex-1 rounded-lg px-3 py-3 text-xs font-bold '+(device==='laptop'?'bg-white text-slate-900 shadow-sm':'text-slate-500')}><PanelLeft className="ml-1 inline" size={15}/>طرح‌های لپ‌تاپ (۱۰)</button>
      <button type="button" onClick={()=>setDevice('mobile')} className={'flex-1 rounded-lg px-3 py-3 text-xs font-bold '+(device==='mobile'?'bg-white text-slate-900 shadow-sm':'text-slate-500')}><Smartphone className="ml-1 inline" size={15}/>طرح‌های موبایل (۱۰)</button>
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]">
      <div className="min-w-0 rounded-2xl border bg-slate-100 p-3">
        <div className="mb-3 flex items-center justify-between"><div><b className="text-xs text-slate-800">پیش‌نمایش طرح {String(current.id).padStart(2,'0')}</b><p className="mt-1 text-[9px] text-slate-500">{current.title}</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-slate-600">نمونه نمایشی</span></div>
        {device==='laptop'?<div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-slate-300 bg-slate-200 p-2 shadow-inner"><div className="max-h-[650px] overflow-auto"><DesktopMock design={current}/></div><div className="mx-auto mt-2 h-1.5 w-1/3 rounded-full bg-slate-400"/></div>:<div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[30px] border-[7px] border-slate-800 bg-slate-50 shadow-2xl"><div className="flex items-center justify-between bg-white px-4 py-1 text-[8px] text-slate-500"><span>۹:۴۱</span><span>● ● ●</span></div><div className="max-h-[650px] overflow-y-auto"><MobileMock design={current}/></div><div className="flex justify-center bg-white py-2"><div className="h-1 w-16 rounded-full bg-slate-800"/></div></div>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3"><div><b className="text-[11px] text-slate-800">طرح {String(current.id).padStart(2,'0')} · {current.style}</b><p className="mt-1 text-[9px] text-slate-500">{current.desc}</p></div><span className="rounded-lg bg-[#245b80] px-3 py-2 text-[9px] font-bold text-white">فقط آزمایشی</span></div>
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between"><b className="text-xs text-slate-800">فهرست طرح‌ها</b><span className="text-[9px] text-slate-500">{selected} از ۱۰ انتخاب شده</span></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
          {designs.map(item=><LayoutCard key={device+'-'+item.id} item={item} selected={item.id===selected} mobile={device==='mobile'} onClick={()=>choose(item.id)}/>)}
        </div>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-900">انتخاب این کارت فقط پیش‌نمایش را عوض می‌کند. هیچ طرحی روی صفحه اصلی یا محیط عملیاتی برنامه اعمال نمی‌شود و انتخاب نهایی بعداً جداگانه انجام خواهد شد.</div>
      </div>
    </div>
  </section>;
}
