import React, { useMemo, useState } from 'react';
import {
  Home, Users, Wallet, BookOpen, Building2, Landmark, ArrowLeftRight, Send,
  Receipt, ScrollText, ClipboardList, Coins, FileSpreadsheet, BarChart3,
  Scale, CircleDollarSign, Settings, Search, Bell, ChevronLeft, ArrowDownCircle,
  ArrowUpCircle, Plus, Filter, MoreHorizontal, CalendarDays, X, Check,
  CreditCard, Headphones, Bot, ShoppingBag, Languages, LayoutGrid
} from 'lucide-react';

const modules = [
  { id: 'customers', label: 'مشتریان', sub: 'فهرست و حساب اشخاص', Icon: Users, tone: 'from-sky-500 to-blue-700' },
  { id: 'cash', label: 'صندوق‌ها', sub: 'موجودی و گردش صندوق', Icon: Wallet, tone: 'from-amber-500 to-orange-600' },
  { id: 'banks', label: 'بانک و چک', sub: 'حساب‌های بانکی', Icon: Landmark, tone: 'from-indigo-500 to-blue-700' },
  { id: 'branches', label: 'نمایندگی‌ها', sub: 'حساب نمایندگی‌ها', Icon: Building2, tone: 'from-violet-500 to-purple-700' },
  { id: 'debtors', label: 'بدهکاران و بستانکاران', sub: 'وضعیت حساب اشخاص', Icon: CircleDollarSign, tone: 'from-rose-500 to-emerald-600' },
  { id: 'exchange', label: 'خرید و فروش اسعار', sub: 'عملیات تبادله', Icon: ArrowLeftRight, tone: 'from-fuchsia-500 to-purple-700' },
  { id: 'remittance', label: 'حواله‌ها', sub: 'ارسالی و دریافتی', Icon: Send, tone: 'from-orange-500 to-amber-600' },
  { id: 'expenses', label: 'مصارف و پرداخت‌ها', sub: 'ثبت و بررسی مصارف', Icon: Receipt, tone: 'from-rose-500 to-red-700' },
  { id: 'journal', label: 'روزنامچه', sub: 'اسناد حسابداری', Icon: ScrollText, tone: 'from-slate-500 to-slate-800' },
  { id: 'ledger', label: 'دفتر کل', sub: 'گردش حساب‌ها', Icon: ClipboardList, tone: 'from-cyan-500 to-blue-700' },
  { id: 'currencies', label: 'تعریف اسعار', sub: 'ارزهای مورد استفاده', Icon: Coins, tone: 'from-lime-500 to-green-700' },
  { id: 'reports', label: 'گزارش‌ها', sub: 'گزارش عملیات و بیلانس', Icon: FileSpreadsheet, tone: 'from-blue-500 to-cyan-700' },
];

const samplePeople = [
  { id: 'p1', name: 'احمدی (نمونه)', code: '1001', phone: '—', balance: '۱۲٬۵۰۰', currency: 'AFN', status: 'بدهکار' },
  { id: 'p2', name: 'رحیمی (نمونه)', code: '1002', phone: '—', balance: '۳۵۰', currency: 'USD', status: 'بستانکار' },
  { id: 'p3', name: 'محمدی (نمونه)', code: '1003', phone: '—', balance: '۰', currency: 'AFN', status: 'تسویه' },
];

function IconTile({ item, onClick }) {
  const Icon = item.Icon;
  return (
    <button type="button" onClick={onClick}
      className="group flex min-h-[112px] min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[#d8e5f1] bg-gradient-to-b from-white to-[#f4f8fd] px-2 py-3 text-center shadow-[0_3px_10px_rgba(31,73,115,.07)] transition active:scale-[.98] active:bg-blue-50">
      <span className={'grid h-12 w-12 place-items-center rounded-[15px] bg-gradient-to-br '+item.tone+' text-white shadow-md ring-2 ring-white'}>
        <Icon className="h-6 w-6" strokeWidth={2.15}/>
      </span>
      <b className="text-[12px] leading-5 text-[#183d63]">{item.label}</b>
      <span className="text-[10px] leading-4 text-slate-500">{item.sub}</span>
    </button>
  );
}

export default function MobileLayoutPreview() {
  const [page, setPage] = useState('home');
  const [person, setPerson] = useState(null);
  const [filter, setFilter] = useState('همه');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [notice, setNotice] = useState('');

  const people = useMemo(() => samplePeople.filter(p =>
    (filter === 'همه' || p.status === filter) &&
    (!search || (p.name + p.code).toLowerCase().includes(search.toLowerCase()))
  ), [filter, search]);

  const selectedModule = modules.find(m => m.id === page);
  const goHome = () => { setPage('home'); setPerson(null); setAction(''); };
  const openModule = id => { setPage(id); setPerson(null); setSearch(''); setFilter('همه'); };
  const showAction = name => { setAction(name); setNotice(''); };

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[460px] overflow-hidden rounded-[26px] border-[6px] border-[#17334f] bg-[#edf4fa] shadow-[0_16px_45px_rgba(20,48,75,.22)]">
      <div className="flex items-center justify-between bg-gradient-to-l from-[#123d68] via-[#1d5b91] to-[#2876ad] px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/25 bg-white/15"><Wallet className="h-5 w-5"/></span>
          <div className="min-w-0"><b className="block truncate text-sm">حساب صراف</b><span className="text-[10px] text-blue-100">محیط پیش‌نمایش چیدمان موبایل</span></div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="اعلان‌ها" onClick={() => setNotice('این فقط پیش‌نمایش رابط کاربری است.')} className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/10"><Bell className="h-4 w-4"/></button>
          <button type="button" aria-label="تنظیمات" onClick={() => openModule('settings')} className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/10"><Settings className="h-4 w-4"/></button>
        </div>
      </div>

      <div className="border-b border-[#d2e0ec] bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#385a78]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/> محیط آزمایشی مستقل</span>
          <span>اطلاعات نمونه · بدون اتصال به دیتابیس</span>
        </div>
      </div>

      {page === 'home' && !person && (
        <main className="space-y-3 p-3 pb-4">
          <section className="rounded-2xl bg-gradient-to-l from-[#174875] to-[#287bb3] p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div><span className="text-[11px] text-blue-100">داشبورد صرافی</span><h2 className="mt-1 text-lg font-extrabold">مرکز عملیات</h2><p className="mt-1 text-[10px] text-blue-100">دسترسی سریع به بخش‌های اصلی</p></div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15"><LayoutGrid className="h-6 w-6"/></span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/15 bg-white/10 p-2"><span className="block text-[10px] text-blue-100">مشتریان</span><b className="mt-1 block text-base">۳</b></div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-2"><span className="block text-[10px] text-blue-100">صندوق‌ها</span><b className="mt-1 block text-base">۲</b></div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-2"><span className="block text-[10px] text-blue-100">عملیات امروز</span><b className="mt-1 block text-base">۵</b></div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#d7e4ef] bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-extrabold text-[#1c456c]">دسترسی سریع</h3><span className="text-[10px] text-slate-400">همه بخش‌ها</span></div>
            <div className="grid grid-cols-2 gap-2.5">
              {modules.map(item => <IconTile key={item.id} item={item} onClick={() => openModule(item.id)}/>)}
            </div>
          </section>
        </main>
      )}

      {page === 'customers' && !person && (
        <main className="space-y-3 p-3 pb-4">
          <div className="flex items-center justify-between"><button onClick={goHome} className="flex items-center gap-1 text-xs font-bold text-[#24557f]"><ChevronLeft className="h-4 w-4"/> بازگشت</button><h2 className="text-base font-extrabold text-[#183f65]">مشتریان</h2><button onClick={() => showAction('ثبت مشتری نمونه')} className="grid h-9 w-9 place-items-center rounded-xl bg-[#1d639b] text-white"><Plus className="h-4 w-4"/></button></div>
          <div className="relative"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجوی نام یا کد مشتری" className="h-11 w-full rounded-xl border border-[#d4e1ec] bg-white pr-10 pl-3 text-sm outline-none focus:border-blue-400"/></div>
          <div className="flex gap-2 overflow-x-auto pb-1">{['همه','بدهکار','بستانکار','تسویه'].map(x=><button key={x} onClick={()=>setFilter(x)} className={'shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold '+(filter===x?'border-[#1e639b] bg-[#1e639b] text-white':'border-[#d3e1ec] bg-white text-[#355a7a]')}>{x}</button>)}</div>
          <div className="space-y-2">{people.map(p=><button key={p.id} onClick={()=>setPerson(p)} className="flex w-full items-center gap-3 rounded-2xl border border-[#d5e2ed] bg-white p-3 text-right shadow-sm active:bg-blue-50"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white"><Users className="h-5 w-5"/></span><span className="min-w-0 flex-1"><b className="block text-sm text-[#1d456a]">{p.name}</b><small className="text-[10px] text-slate-500">کد {p.code} · {p.currency}</small></span><span className="text-left"><b className="block text-sm tabular-nums text-[#1d456a]">{p.balance}</b><small className={'text-[10px] font-bold '+(p.status==='بدهکار'?'text-rose-600':p.status==='بستانکار'?'text-emerald-600':'text-slate-500')}>{p.status}</small></span><ChevronLeft className="h-4 w-4 text-slate-400"/></button>)}</div>
        </main>
      )}

      {page === 'customers' && person && (
        <main className="space-y-3 p-3 pb-4">
          <div className="flex items-center justify-between"><button onClick={()=>setPerson(null)} className="flex items-center gap-1 text-xs font-bold text-[#24557f]"><ChevronLeft className="h-4 w-4"/> فهرست مشتریان</button><button onClick={()=>showAction('ویرایش مشتری نمونه')} className="rounded-lg border border-[#cbdce9] bg-white px-3 py-2 text-xs font-bold text-[#24557f]">ویرایش</button></div>
          <section className="rounded-2xl bg-gradient-to-l from-[#174875] to-[#287bb3] p-4 text-white"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Users className="h-6 w-6"/></span><div><h2 className="font-extrabold">{person.name}</h2><p className="text-[10px] text-blue-100">کد مشتری: {person.code}</p></div></div><div className="mt-4 rounded-xl bg-white/10 p-3"><span className="text-[10px] text-blue-100">مانده حساب نمونه</span><div className="mt-1 flex items-baseline gap-2"><b className="text-2xl tabular-nums">{person.balance}</b><span className="text-xs">{person.currency}</span><span className={'mr-auto rounded-full px-2 py-1 text-[10px] font-bold '+(person.status==='بدهکار'?'bg-rose-100 text-rose-700':person.status==='بستانکار'?'bg-emerald-100 text-emerald-700':'bg-white/20 text-white')}>{person.status}</span></div></div></section>
          <div className="grid grid-cols-2 gap-2"><button onClick={()=>showAction('دریافت وجه آزمایشی')} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white shadow"><ArrowDownCircle className="h-5 w-5"/> دریافت وجه</button><button onClick={()=>showAction('پرداخت وجه آزمایشی')} className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-sm font-bold text-white shadow"><ArrowUpCircle className="h-5 w-5"/> پرداخت وجه</button></div>
          <section className="rounded-2xl border border-[#d7e4ef] bg-white p-3"><h3 className="mb-2 text-sm font-extrabold text-[#1d456a]">گردش حساب نمونه</h3>{[['۱۶/۱۱/۲۰۲۶','ثبت مانده افتتاحیه','۱۲٬۵۰۰ AFN'],['—','دریافت / پرداخت','بدون داده واقعی']].map((r,i)=><div key={i} className="flex items-center justify-between border-t border-slate-100 py-3 text-[11px]"><span><b className="block text-[#365b7b]">{r[1]}</b><small className="text-slate-400">{r[0]}</small></span><b className="text-[#254b70]">{r[2]}</b></div>)}</section>
          <section className="rounded-2xl border border-[#d7e4ef] bg-white p-3"><h3 className="mb-2 text-sm font-extrabold text-[#1d456a]">مشخصات مشتری</h3><div className="grid grid-cols-2 gap-3 text-xs"><div><small className="text-slate-400">شماره تماس</small><b className="mt-1 block">—</b></div><div><small className="text-slate-400">وضعیت</small><b className="mt-1 block">{person.status}</b></div></div></section>
        </main>
      )}

      {page !== 'home' && page !== 'customers' && (
        <main className="space-y-3 p-3 pb-4">
          <div className="flex items-center justify-between"><button onClick={goHome} className="flex items-center gap-1 text-xs font-bold text-[#24557f]"><ChevronLeft className="h-4 w-4"/> بازگشت</button><h2 className="text-base font-extrabold text-[#183f65]">{selectedModule?.label || 'بخش برنامه'}</h2><button onClick={()=>setNotice('این بخش در این نسخه فقط برای بررسی چیدمان است.')} className="grid h-9 w-9 place-items-center rounded-xl border border-[#d3e1ec] bg-white"><MoreHorizontal className="h-4 w-4"/></button></div>
          <section className="rounded-2xl border border-[#d7e4ef] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className={'grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br '+(selectedModule?.tone||'from-blue-500 to-indigo-700')+' text-white'}>{selectedModule?.Icon && React.createElement(selectedModule.Icon,{className:'h-6 w-6'})}</span><div><b className="text-sm text-[#1d456a]">{selectedModule?.label}</b><p className="text-[11px] text-slate-500">نمونه چیدمان این بخش</p></div></div><p className="mt-4 text-xs leading-6 text-slate-600">این صفحه برای بررسی جایگاه آیکون‌ها، اندازه دکمه‌ها و فاصله مناسب لمس طراحی شده است. به اطلاعات واقعی حساب صراف وصل نیست.</p><button onClick={()=>setNotice('عملیات نمایشی است و هیچ داده‌ای ثبت نشد.')} className="mt-3 min-h-11 w-full rounded-xl border border-[#cbdce9] bg-[#f3f8fc] text-xs font-bold text-[#24557f]">بررسی جایگاه عملیات</button></section>
        </main>
      )}

      {action && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-3" onClick={()=>setAction('')}><div className="w-full max-w-[440px] rounded-2xl border border-[#d3e1ec] bg-white p-4 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="mb-3 flex items-center justify-between"><b className="text-sm text-[#1d456a]">{action}</b><button onClick={()=>setAction('')} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100"><X className="h-4 w-4"/></button></div><p className="text-xs leading-6 text-slate-600">این فقط نمونهٔ پنجرهٔ عملیات است؛ هیچ دریافت، پرداخت یا تغییری در حساب واقعی انجام نمی‌شود.</p><label className="mt-3 block text-xs text-slate-600">مبلغ آزمایشی<input type="number" placeholder="مبلغ" className="mt-1 h-11 w-full rounded-xl border border-[#d3e1ec] px-3"/></label><button onClick={()=>{setAction('');setNotice('این عملیات صرفاً نمایشی بود و ذخیره نشد.');}} className="mt-3 min-h-11 w-full rounded-xl bg-[#1e639b] text-sm font-bold text-white">بستن پیش‌نمایش عملیات</button></div></div>}

      {notice && <div className="mx-3 mb-3 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900"><span className="flex items-center gap-2"><Check className="h-4 w-4"/>{notice}</span><button onClick={()=>setNotice('')}><X className="h-4 w-4"/></button></div>}

      <nav className="sticky bottom-0 grid grid-cols-4 border-t border-[#d2e0ec] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
        {[{id:'home',label:'خانه',Icon:Home},{id:'customers',label:'مشتریان',Icon:Users},{id:'cash',label:'صندوق',Icon:Wallet},{id:'reports',label:'گزارش',Icon:BarChart3}].map(item=>{const Icon=item.Icon;return <button key={item.id} onClick={()=>openModule(item.id)} className={'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold '+(page===item.id?'bg-[#e8f2fa] text-[#185b91]':'text-slate-500')}><Icon className="h-5 w-5"/>{item.label}</button>;})}
      </nav>
      <div className="bg-[#e7eff6] px-3 py-2 text-center text-[9px] text-[#5c748a]">پیش‌نمایش محلی پنل سازنده · داده نمونه · بدون ارتباط با حساب واقعی</div>
    </div>
  );
}
