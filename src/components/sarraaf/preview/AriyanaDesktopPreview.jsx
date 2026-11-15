import React, { useMemo, useState } from 'react';
import {
  Home, Users, BookOpen, BookText, Wallet, Landmark, ArrowLeftRight, Send,
  Download, Coins, BarChart3, FileText, Printer, Search, Plus, Pencil,
  Trash2, RefreshCw, Settings, ChevronDown, CalendarDays, ClipboardList,
  Receipt, CircleDollarSign, Building2, NotebookTabs, X, Menu, FolderOpen,
  Calculator, Scale, TrendingUp, HandCoins, FileSpreadsheet, ListFilter,
  CircleHelp, Save, ArrowDownToLine, ArrowUpFromLine, CreditCard, Network
} from 'lucide-react';

const groups = [
  { title: 'اصلی', items: [['خانه', Home], ['مشتریان', Users], ['دفتر حساب مشتری', BookOpen], ['صندوق‌ها', Wallet], ['بانک‌ها', Landmark]] },
  { title: 'عملیات', items: [['دریافت وجه', Download], ['پرداخت وجه', ArrowUpFromLine], ['خرید ارز', CircleDollarSign], ['فروش ارز', Coins], ['حواله ارسال', Send], ['حواله دریافت', ArrowDownToLine], ['تبدیل ارز', ArrowLeftRight]] },
  { title: 'حسابداری', items: [['دفتر روزنامه', BookText], ['دفتر کل', NotebookTabs], ['تراز آزمایشی', Scale], ['سود و زیان', TrendingUp], ['گزارش‌ها', BarChart3]] },
  { title: 'مدیریت', items: [['نمایندگی‌ها', Network], ['حساب‌های بانکی', Building2], ['تعریف ارزها', CircleDollarSign], ['تنظیمات', Settings]] }
];

const menuItems = [
  ['پرونده', ['ایجاد پرونده جدید', 'باز کردن', 'پشتیبان‌گیری', 'خروج']],
  ['عملیات', ['ثبت دریافت', 'ثبت پرداخت', 'خرید ارز', 'فروش ارز', 'ارسال حواله', 'دریافت حواله']],
  ['حساب‌ها', ['مشتریان', 'صندوق‌ها', 'بانک‌ها', 'نمایندگی‌ها']],
  ['گزارشات', ['دفتر روزنامه', 'دفتر حساب مشتری', 'دفتر کل', 'سود و زیان', 'تراز آزمایشی']],
  ['ابزارها', ['ماشین حساب', 'جستجوی اسناد', 'تبدیل ارز', 'چاپ']],
  ['تنظیمات', ['اطلاعات سیستم', 'تعریف ارزها', 'کاربران و دسترسی‌ها']]
];

const demoRows = [
  ['۱۴۰۵/۰۸/۲۴', 'دریافت از محمدی', '۵۰٬۰۰۰', '—', 'AFN', 'دریافت'],
  ['۱۴۰۵/۰۸/۲۴', 'پرداخت کرایه دفتر', '—', '۸٬۰۰۰', 'AFN', 'پرداخت'],
  ['۱۴۰۵/۰۸/۲۳', 'فروش ارز به احمدی', '—', '۳۰۰', 'USD', 'فروش ارز'],
  ['۱۴۰۵/۰۸/۲۳', 'دریافت حواله کابل', '۱٬۲۰۰', '—', 'USD', 'حواله']
];

const customerRows = [
  ['۱۴۰۵/۰۸/۲۴', 'دریافت نقدی', '۵۰٬۰۰۰', '—', 'AFN', 'بدهکار'],
  ['۱۴۰۵/۰۸/۲۳', 'پرداخت نقدی', '—', '۱۲٬۰۰۰', 'AFN', 'بستانکار'],
  ['۱۴۰۵/۰۸/۲۲', 'فروش دالر', '—', '۲۰۰', 'USD', 'بستانکار'],
  ['۱۴۰۵/۰۸/۲۰', 'دریافت حواله', '۳۰۰', '—', 'USD', 'بدهکار']
];

function Action({ icon: Icon, label, onClick }) {
  return <button onClick={onClick} title={label} className="flex min-w-[58px] flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-slate-700 hover:bg-blue-50 hover:text-blue-800"><Icon size={17}/><span>{label}</span></button>;
}

function GridTable({ rows, customer = false }) {
  const headers = customer
    ? ['تاریخ', 'شرح عملیات', 'بدهکار', 'بستانکار', 'ارز', 'وضعیت']
    : ['تاریخ', 'شرح', 'دریافت', 'پرداخت', 'ارز', 'نوع عملیات'];
  return <div className="overflow-auto border border-slate-300 bg-white">
    <table className="w-full min-w-[720px] border-collapse text-right text-[11px]">
      <thead className="bg-slate-200 text-slate-800"><tr>{headers.map(h => <th key={h} className="border border-slate-300 px-2 py-2 font-bold">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i} className={i%2?'bg-slate-50':'bg-white'}>{r.map((v,j)=><td key={j} className="border border-slate-200 px-2 py-2 text-slate-700">{v}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export default function AriyanaDesktopPreview() {
  const [active, setActive] = useState('دفتر روزنامه');
  const [menuOpen, setMenuOpen] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('محیط نمایشی — اطلاعات نمونه و غیرواقعی');
  const [period, setPeriod] = useState('امروز');
  const [sidebar, setSidebar] = useState(true);

  const pageTitle = active;
  const rows = useMemo(() => (active === 'دفتر حساب مشتری' ? customerRows : demoRows).filter(r => r.join(' ').includes(query)), [active, query]);
  const choose = (name) => { setActive(name); setMenuOpen(''); setNotice('صفحه «' + name + '» در پیش‌نمایش ساختاری انتخاب شد.'); };
  const toolbar = [
    ['جدید', Plus], ['ویرایش', Pencil], ['حذف', Trash2], ['جستجو', Search],
    ['تازه‌سازی', RefreshCw], ['چاپ', Printer], ['ثبت', Save], ['راهنما', CircleHelp]
  ];

  return <div dir="rtl" className="min-h-[760px] overflow-hidden rounded-lg border border-slate-400 bg-[#e9edf2] text-slate-800 shadow-xl">
    <div className="flex items-center justify-between border-b border-slate-400 bg-gradient-to-b from-slate-100 to-slate-200 px-3 py-2">
      <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded bg-blue-800 text-white"><Calculator size={17}/></div><div><div className="text-xs font-bold">سیستم حسابداری صرافی</div><div className="text-[9px] text-slate-500">پیش‌نمایش دسکتاپ حساب صراف</div></div></div>
      <div className="flex items-center gap-1"><span className="rounded border border-amber-300 bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-800">نسخه آزمایشی</span><button className="rounded p-1 hover:bg-slate-300" onClick={()=>setSidebar(!sidebar)}><Menu size={16}/></button></div>
    </div>

    <div className="flex flex-wrap items-center gap-0 border-b border-slate-400 bg-slate-100 px-2">
      {menuItems.map(([name, entries])=><div key={name} className="relative">
        <button onClick={()=>setMenuOpen(menuOpen===name?'':name)} className={'px-3 py-2 text-[11px] hover:bg-blue-100 '+(menuOpen===name?'bg-blue-100 font-bold':'')}>{name}<ChevronDown className="mr-1 inline" size={11}/></button>
        {menuOpen===name && <div className="absolute right-0 top-full z-30 min-w-44 border border-slate-300 bg-white py-1 shadow-lg">{entries.map(entry=><button key={entry} onClick={()=>choose(entry)} className="block w-full px-3 py-2 text-right text-[11px] hover:bg-blue-50">{entry}</button>)}</div>}
      </div>)}
    </div>

    <div className="flex flex-wrap items-center gap-1 border-b border-slate-300 bg-[#f8fafc] px-2 py-1">
      {toolbar.map(([label,Icon])=><Action key={label} icon={Icon} label={label} onClick={()=>setNotice('عملیات «'+label+'» در این مرحله نمایشی است؛ هنوز به دیتابیس وصل نیست.')}/>)}
      <div className="mx-2 h-8 border-r border-slate-300"/>
      <Action icon={Receipt} label="رسید" onClick={()=>setNotice('قالب رسید در مرحله بعد تکمیل می‌شود.')}/>
      <Action icon={FileSpreadsheet} label="اکسل" onClick={()=>setNotice('خروجی اکسل در این نمونه فعال نیست.')}/>
    </div>

    <div className="flex min-h-[620px]">
      {sidebar && <aside className="hidden w-52 shrink-0 border-l border-slate-400 bg-[#f4f6f8] p-2 md:block">
        <div className="mb-2 border-b border-slate-300 px-2 pb-2 text-[11px] font-bold text-slate-700">فهرست امکانات</div>
        {groups.map(group=><div key={group.title} className="mb-3">
          <div className="mb-1 rounded-sm bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">{group.title}</div>
          {group.items.map(([label,Icon])=><button key={label} onClick={()=>choose(label)} className={'flex w-full items-center gap-2 rounded px-2 py-1.5 text-right text-[10px] '+(active===label?'bg-blue-100 font-bold text-blue-900':'text-slate-700 hover:bg-slate-200')}><Icon size={14}/>{label}</button>)}
        </div>)}
      </aside>}

      <main className="min-w-0 flex-1 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2">
          <div className="flex items-center gap-2"><FolderOpen size={17} className="text-blue-800"/><h2 className="text-sm font-bold">{pageTitle}</h2></div>
          <div className="flex items-center gap-2 text-[10px]"><CalendarDays size={13}/><select value={period} onChange={e=>setPeriod(e.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1"><option>امروز</option><option>این هفته</option><option>این ماه</option><option>تمام تاریخ</option></select><span className="text-slate-500">تاریخ سیستم: ۱۴۰۵/۰۸/۲۴</span></div>
        </div>

        {active === 'دفتر حساب مشتری' && <div className="mb-3 grid grid-cols-1 gap-2 border border-slate-300 bg-slate-100 p-2 text-[11px] sm:grid-cols-3">
          <label className="flex items-center gap-2">کد مشتری <input className="w-full rounded border border-slate-300 bg-white px-2 py-1" value="۱۰۲۵" readOnly/></label>
          <label className="flex items-center gap-2">نام مشتری <input className="w-full rounded border border-slate-300 bg-white px-2 py-1" value="محمدی" readOnly/></label>
          <label className="flex items-center gap-2">ارز حساب <select className="rounded border border-slate-300 bg-white px-2 py-1"><option>همه ارزها</option><option>AFN</option><option>USD</option><option>EUR</option></select></label>
        </div>}

        <div className="mb-2 flex flex-wrap items-center gap-2 border border-slate-300 bg-slate-100 p-2">
          <div className="flex min-w-40 flex-1 items-center gap-1 rounded border border-slate-300 bg-white px-2"><Search size={13} className="text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو در اسناد و شرح عملیات..." className="w-full bg-transparent py-1 text-[10px] outline-none"/></div>
          <button onClick={()=>setQuery('')} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] hover:bg-slate-50"><X size={12} className="inline"/> پاک‌کردن</button>
          <button onClick={()=>setNotice('فیلترهای پیشرفته در ساختار بعدی افزوده می‌شوند.')} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]"><ListFilter size={12} className="ml-1 inline"/> فیلتر</button>
        </div>

        {active === 'خانه' ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['موجودی صندوق', '۵٬۰۰۰٬۰۰۰ AFN', Wallet],['مشتریان فعال','۲۴۸',Users],['عملیات امروز','۳۶',ClipboardList],['سود و زیان','۱۲٬۵۰۰ AFN',TrendingUp]].map(([l,v,I])=><div key={l} className="border border-slate-300 bg-white p-4 shadow-sm"><I size={20} className="mb-2 text-blue-800"/><div className="text-[10px] text-slate-500">{l}</div><div className="mt-1 text-sm font-bold">{v}</div></div>)}</div>
          : <><GridTable rows={rows} customer={active==='دفتر حساب مشتری'}/>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {(active==='دفتر حساب مشتری'?[['جمع بدهکار','۵۰٬۳۰۰ AFN'],['جمع بستانکار','۱۲٬۲۰۰ AFN'],['مانده AFN','۳۸٬۱۰۰'],['مانده USD','۱۰۰']]:[['جمع دریافت','۵۱٬۲۰۰'],['جمع پرداخت','۸٬۳۰۰'],['تعداد اسناد','۴'],['وضعیت','متوازن']]).map(([l,v])=><div key={l} className="border border-slate-300 bg-white px-3 py-2"><div className="text-[10px] text-slate-500">{l}</div><div className="mt-1 text-xs font-bold">{v}</div></div>)}
            </div>
          </>}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-slate-100 px-2 py-2 text-[9px] text-slate-600"><span>{notice}</span><span>ردیف‌ها: {rows.length} | نمونه نمایشی</span></div>
      </main>
    </div>
    <div className="flex items-center justify-between border-t border-slate-400 bg-slate-200 px-3 py-1.5 text-[9px] text-slate-600"><span>سیستم حسابداری صرافی — چیدمان دسکتاپ</span><span>کاربر: مدیر سیستم | اتصال: غیرفعال در پیش‌نمایش</span></div>
  </div>;
}
