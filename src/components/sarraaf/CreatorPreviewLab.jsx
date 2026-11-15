import React, { useMemo, useState } from 'react';
import {
  Home, Users, Wallet, BookOpen, BookText, FileText, Search, Printer, Plus,
  Pencil, Trash2, RefreshCw, CalendarDays, ArrowDownUp, Receipt, CircleDollarSign,
  Landmark, Building2, Send, BarChart3, Settings, X, Check, List, Eye, CreditCard,
  ArrowLeftRight, Coins, Banknote, ScrollText, UserRound, Lock, MoreHorizontal,
  ChevronDown, ChevronLeft, ChevronRight, Save, ClipboardList, FileSpreadsheet,
  CircleHelp, Calculator, Package, Clock3, BadgeCheck, RotateCcw, Download,
  Upload, Filter, HandCoins, CircleArrowDown, CircleArrowUp, PrinterCheck
} from 'lucide-react';

const NAV = [
  { id: 'home', label: 'صفحه اصلی', icon: Home, group: 'عمومی' },
  { id: 'customers', label: 'مشتریان', icon: Users, group: 'حساب‌ها' },
  { id: 'customerLedger', label: 'حساب مشتریان', icon: BookOpen, group: 'حساب‌ها' },
  { id: 'branches', label: 'نمایندگی‌ها', icon: Building2, group: 'حساب‌ها' },
  { id: 'branchLedger', label: 'حساب نمایندگی‌ها', icon: BookText, group: 'حساب‌ها' },
  { id: 'cash', label: 'صندوق', icon: Wallet, group: 'مالی' },
  { id: 'banks', label: 'حساب بانکی و چک', icon: Landmark, group: 'مالی' },
  { id: 'journal', label: 'روزنامچه', icon: ScrollText, group: 'مالی' },
  { id: 'generalLedger', label: 'دفتر کل', icon: ClipboardList, group: 'مالی' },
  { id: 'exchange', label: 'خرید و فروش اسعار', icon: ArrowLeftRight, group: 'عملیات' },
  { id: 'remittance', label: 'ارسال و دریافت حواله', icon: Send, group: 'عملیات' },
  { id: 'expenses', label: 'مصارف', icon: Receipt, group: 'عملیات' },
  { id: 'profit', label: 'مفاد و زیان', icon: BarChart3, group: 'گزارش‌ها' },
  { id: 'balance', label: 'بیلانس عمومی و سرمایه', icon: Calculator, group: 'گزارش‌ها' },
  { id: 'reports', label: 'راپورها', icon: FileSpreadsheet, group: 'گزارش‌ها' },
];

const MENUS = [
  { label: 'فایل', items: ['صفحه اصلی', 'پشتیبان‌گیری آزمایشی', 'خروج از پیش‌نمایش'] },
  { label: 'تعاریف', items: ['مشتریان', 'نمایندگی‌ها', 'ارزها', 'حساب‌های بانکی'] },
  { label: 'عملیات', items: ['دخل صندوق', 'خرج صندوق', 'ارسال حواله', 'دریافت حواله', 'خرید اسعار', 'فروش اسعار', 'ثبت مصرف'] },
  { label: 'حسابات', items: ['حساب مشتریان', 'حساب نمایندگی‌ها', 'روزنامچه', 'دفتر کل'] },
  { label: 'گزارشات', items: ['راپور عملیات روز', 'راپور مشتریان', 'راپور نمایندگی‌ها', 'مفاد و زیان', 'بیلانس عمومی'] },
  { label: 'تنظیمات', items: ['سال مالی', 'تنظیم چاپ', 'تنظیمات نمایش'] },
  { label: 'راهنما', items: ['راهنمای آزمایشگاه', 'درباره این پیش‌نمایش'] },
];

const TOOLBAR = [
  { label: 'جدید', icon: Plus, action: 'new' },
  { label: 'ویرایش', icon: Pencil, action: 'edit' },
  { label: 'حذف', icon: Trash2, action: 'delete' },
  { label: 'تازه‌سازی', icon: RefreshCw, action: 'refresh' },
  { label: 'جستجو', icon: Search, action: 'search' },
  { label: 'چاپ', icon: Printer, action: 'print' },
];

const SAMPLE = {
  customers: [
    ['۱۰۰۱', 'محمدی، عبدالرحمان', 'دائمی', '۰۷۹۱۲۳۴۵۶۷', 'فعال'],
    ['۱۰۰۲', 'احمدی، حامد', 'دائمی', '۰۷۸۱۲۳۴۵۶۷', 'فعال'],
    ['۱۰۰۳', 'کریمی، نصیر', 'موقتی', '۰۷۷۱۲۳۴۵۶۷', 'فعال'],
    ['۱۰۰۴', 'رحیمی، فرید', 'دائمی', '۰۷۰۱۲۳۴۵۶۷', 'غیرفعال'],
  ],
  branches: [
    ['۲۰۰۱', 'نمایندگی کابل', 'کابل', '۰۷۹۰۰۰۰۰۰۱', 'فعال'],
    ['۲۰۰۲', 'نمایندگی هرات', 'هرات', '۰۷۹۰۰۰۰۰۰۲', 'فعال'],
    ['۲۰۰۳', 'نمایندگی مزار', 'مزارشریف', '۰۷۹۰۰۰۰۰۰۳', 'فعال'],
  ],
  journal: [
    ['۱۴۰۵/۰۸/۲۴', '۰۰۱۲۴۵', 'دخل صندوق از مشتری', 'محمدی', 'AFN', '۲۵٬۰۰۰', '۰'],
    ['۱۴۰۵/۰۸/۲۴', '۰۰۱۲۴۴', 'اجرای حواله کابل', 'احمدی', 'USD', '۰', '۳۰۰'],
    ['۱۴۰۵/۰۸/۲۳', '۰۰۱۲۴۳', 'فروش اسعار', 'کریمی', 'AFN', '۷۱٬۲۰۰', '۰'],
    ['۱۴۰۵/۰۸/۲۳', '۰۰۱۲۴۲', 'مصارف دفتر', 'مصارف اداری', 'AFN', '۰', '۲٬۰۰۰'],
    ['۱۴۰۵/۰۸/۲۲', '۰۰۱۲۴۱', 'دریافت حواله', 'نمایندگی هرات', 'EUR', '۱۵۰', '۰'],
  ],
  remittance: [
    ['ح-۰۰۳۴۱', '۱۴۰۵/۰۸/۲۴', 'ارسال', 'محمدی', 'نمایندگی هرات', 'USD', '۵۰۰', 'در انتظار'],
    ['ح-۰۰۳۴۰', '۱۴۰۵/۰۸/۲۴', 'دریافت', 'احمدی', 'نمایندگی کابل', 'AFN', '۱۸٬۰۰۰', 'اجرا شده'],
    ['ح-۰۰۳۳۹', '۱۴۰۵/۰۸/۲۳', 'ارسال', 'کریمی', 'متفرقه', 'EUR', '۲۵۰', 'اجرا شده'],
  ],
  cash: [
    ['صندوق مرکزی', 'AFN', '۲۵۰٬۰۰۰', '۱۲۰٬۰۰۰', '۱۳۰٬۰۰۰'],
    ['صندوق دالر', 'USD', '۸٬۵۰۰', '۲٬۰۰۰', '۶٬۵۰۰'],
    ['صندوق یورو', 'EUR', '۳٬۲۰۰', '۷۰۰', '۲٬۵۰۰'],
  ],
  exchange: [
    ['۱۴۰۵/۰۸/۲۴', 'خرید اسعار', 'USD', '۵۰۰', 'AFN', '۳۵٬۵۰۰', '۲۵۰'],
    ['۱۴۰۵/۰۸/۲۴', 'فروش اسعار', 'EUR', '۲۰۰', 'AFN', '۱۵٬۸۰۰', '۱۲۰'],
    ['۱۴۰۵/۰۸/۲۳', 'تبدیل حساب', 'USD', '۱۰۰', 'EUR', '۹۲', '۰'],
  ],
  expenses: [
    ['۱۴۰۵/۰۸/۲۴', 'کرایه دفتر', 'AFN', '۱۲٬۰۰۰', 'صندوق مرکزی'],
    ['۱۴۰۵/۰۸/۲۲', 'برق و اینترنت', 'AFN', '۲٬۵۰۰', 'صندوق مرکزی'],
    ['۱۴۰۵/۰۸/۲۰', 'مصارف ترانسپورت', 'USD', '۳۰', 'صندوق دالر'],
  ],
};

const HEADERS = {
  customers: ['کد', 'نام مشتری', 'نوع حساب', 'شماره تماس', 'وضعیت'],
  branches: ['کد', 'نام نمایندگی', 'موقعیت', 'شماره تماس', 'وضعیت'],
  journal: ['تاریخ', 'شماره سند', 'شرح عملیات', 'طرف حساب', 'ارز', 'بدهکار', 'بستانکار'],
  remittance: ['شماره حواله', 'تاریخ', 'نوع', 'فرستنده / گیرنده', 'نمایندگی', 'ارز', 'مبلغ', 'وضعیت'],
  cash: ['نام صندوق', 'ارز', 'اول دوره', 'جمع دخل', 'مانده نمونه'],
  exchange: ['تاریخ', 'نوع معامله', 'ارز مبدا', 'مقدار', 'ارز مقصد', 'مقدار معادل', 'مفاد نمونه'],
  expenses: ['تاریخ', 'شرح مصرف', 'ارز', 'مبلغ', 'پرداخت از'],
};

const money = (v) => v;
function Table({ headers, rows, selected, onSelect }) {
  return <div className="overflow-auto border border-[#9da9b5] bg-white">
    <table className="w-full min-w-[720px] border-collapse text-right text-[11px]">
      <thead className="sticky top-0 bg-[#dce4ec] text-[#1d354b]">
        <tr>{headers.map((h) => <th key={h} className="whitespace-nowrap border border-[#b5c0ca] px-2.5 py-2 font-bold">{h}</th>)}</tr>
      </thead>
      <tbody>{rows.map((r, i) => <tr key={i} onClick={() => onSelect?.(i)}
        className={'cursor-pointer ' + (selected === i ? 'bg-[#cfe3f8]' : i % 2 ? 'bg-[#f7f9fb]' : 'bg-white') + ' hover:bg-[#eaf3fc]'}>
        {r.map((v, j) => <td key={j} className="whitespace-nowrap border border-[#d3dae1] px-2.5 py-2 tabular-nums">{money(v)}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

function Tile({ icon: Icon, label, color, onClick }) {
  return <button type="button" onClick={onClick} className="group flex min-h-[112px] flex-col items-center justify-center gap-2 border border-[#8d9aa7] bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <span className={'grid h-12 w-12 place-items-center text-white ' + color}><Icon className="h-6 w-6" /></span>
    <span className="text-[11px] font-bold text-[#263d52] group-hover:text-[#07558a]">{label}</span>
  </button>;
}

export default function CreatorPreviewLab() {
  const [active, setActive] = useState('home');
  const [selected, setSelected] = useState(0);
  const [menuOpen, setMenuOpen] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState('');
  const [draft, setDraft] = useState({ date: '۱۴۰۵/۰۸/۲۴', name: '', description: '', currency: 'AFN', amount: '', phone: '', type: 'دائمی', branch: 'نمایندگی کابل' });
  const [localRows, setLocalRows] = useState({});
  const [showSearch, setShowSearch] = useState(false);

  const page = NAV.find(x => x.id === active) || NAV[0];
  const Icon = page.icon;
  const sourceKey = active === 'customerLedger' || active === 'branchLedger' || active === 'generalLedger' ? 'journal' : active;
  const baseRows = SAMPLE[sourceKey] || [];
  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return [...(localRows[sourceKey] || baseRows)].filter(row => !q || row.join(' ').toLocaleLowerCase().includes(q));
  }, [query, sourceKey, localRows, baseRows]);
  const notify = (s) => { setNotice(s + ' — حالت نمایشی؛ هیچ داده‌ای در سرور ذخیره نمی‌شود.'); setMenuOpen(''); };
  const go = (id) => { setActive(id); setSelected(0); setQuery(''); setNotice(''); setMenuOpen(''); setDialog(''); };
  const openNew = () => { setDraft({ date: '۱۴۰۵/۰۸/۲۴', name: '', description: '', currency: 'AFN', amount: '', phone: '', type: 'دائمی', branch: 'نمایندگی کابل' }); setDialog('new'); };
  const saveDemo = () => {
    const row = active === 'customers'
      ? [String(1000 + (localRows.customers || []).length + 5), draft.name || 'مشتری نمونه', draft.type, draft.phone || '—', 'فعال']
      : active === 'branches'
      ? [String(2000 + (localRows.branches || []).length + 5), draft.name || 'نمایندگی نمونه', draft.description || '—', draft.phone || '—', 'فعال']
      : active === 'expenses'
      ? [draft.date, draft.description || 'مصرف آزمایشی', draft.currency, draft.amount || '۰', 'صندوق مرکزی']
      : active === 'remittance'
      ? ['ح-۰۰۳۴۲', draft.date, 'ارسال', draft.name || 'مشتری نمونه', draft.branch, draft.currency, draft.amount || '۰', 'در انتظار']
      : [draft.date, 'سند آزمایشی', draft.description || draft.name || 'عملیات نمونه', draft.name || 'حساب نمونه', draft.currency, draft.amount || '۰', '۰'];
    setLocalRows(old => ({ ...old, [sourceKey]: [row, ...(old[sourceKey] || baseRows)] }));
    setDialog('');
    notify('ردیف نمونه به جدول همین پیش‌نمایش اضافه شد');
  };
  const handleToolbar = (action) => {
    if (action === 'new') return openNew();
    if (action === 'search') { setShowSearch(v => !v); return; }
    if (action === 'refresh') { setQuery(''); setSelected(0); notify('فهرست تازه شد'); return; }
    if (action === 'edit') return notify('ویرایش ردیف انتخاب‌شده');
    if (action === 'delete') return notify('حذف نمایشی ردیف انتخاب‌شده');
    if (action === 'print') return notify('آماده‌سازی چاپ نمونه');
  };

  return <div dir="rtl" className="space-y-2 text-[#263746]">
    <div className="flex flex-wrap items-center justify-between gap-2 border border-[#9aa9b5] bg-[#eaf0f5] px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-bold text-[#24496d]"><Calculator className="h-4 w-4" /> آزمایشگاه بازسازی محیط دسکتاپ آریانا صراف</div>
      <span className="text-[10px] font-semibold text-emerald-800">داده نمونه · اتصال به دیتابیس اصلی خاموش</span>
    </div>

    <section className="overflow-hidden border border-[#65798b] bg-[#eef1f4] shadow-md">
      <header className="flex min-h-9 items-center justify-between gap-2 bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-1.5 text-white">
        <div className="flex items-center gap-2"><Calculator className="h-4 w-4" /><span className="text-[12px] font-bold">سیستم حسابداری حساب صراف</span><span className="hidden text-[10px] text-blue-100 sm:inline">— محیط آزمایشی دسکتاپ</span></div>
        <div className="flex items-center gap-1"><button onClick={() => notify('کوچک‌نمایی پنجره')} className="grid h-6 w-7 place-items-center border border-white/30 text-xs">−</button><button onClick={() => notify('بزرگ‌نمایی پنجره')} className="grid h-6 w-7 place-items-center border border-white/30 text-xs">□</button><button onClick={() => notify('بستن پنجره آزمایشی')} className="grid h-6 w-7 place-items-center border border-white/30 text-xs">×</button></div>
      </header>

      <nav className="flex flex-wrap items-center border-b border-[#aab5bf] bg-gradient-to-b from-[#fbfcfd] to-[#e2e7ec]">
        {MENUS.map(m => <div key={m.label} className="relative">
          <button onClick={() => setMenuOpen(menuOpen === m.label ? '' : m.label)} className={'px-3 py-2 text-[11px] hover:bg-white ' + (menuOpen === m.label ? 'bg-white font-bold text-[#15527e]' : '')}>{m.label}<ChevronDown className="mr-1 inline h-3 w-3" /></button>
          {menuOpen === m.label && <div className="absolute right-0 top-full z-30 min-w-[190px] border border-[#8999a8] bg-white py-1 shadow-xl">
            {m.items.map(item => <button key={item} onClick={() => { const match = NAV.find(n => n.label === item || n.label.includes(item)); if (match) go(match.id); else notify(item); }} className="block w-full px-3 py-2 text-right text-[11px] hover:bg-[#e7f1fa]">{item}</button>)}
          </div>}
        </div>)}
      </nav>

      <div className="flex flex-wrap items-stretch border-b border-[#aab5bf] bg-[#edf1f4]">
        {TOOLBAR.map(t => { const TIcon = t.icon; return <button key={t.action} onClick={() => handleToolbar(t.action)} className="flex min-w-[64px] flex-col items-center justify-center gap-1 border-l border-[#c4ccd3] px-3 py-2 text-[10px] hover:bg-white"><TIcon className="h-4 w-4 text-[#315d7d]" />{t.label}</button>; })}
        <div className="mr-auto flex items-center gap-2 px-3 py-2 text-[10px] text-slate-500"><Lock className="h-3.5 w-3.5" />پیش‌نمایش مستقل</div>
      </div>

      <div className="grid min-h-[590px] grid-cols-1 lg:grid-cols-[205px_minmax(0,1fr)]">
        <aside className="border-b border-[#9caab6] bg-[#e4e9ee] p-2 lg:border-b-0 lg:border-l">
          <div className="mb-2 flex items-center justify-between border-b border-[#bdc7d0] px-2 pb-2"><b className="text-[11px]">فهرست برنامه</b><MoreHorizontal className="h-4 w-4 text-slate-500" /></div>
          {['عمومی', 'حساب‌ها', 'مالی', 'عملیات', 'گزارش‌ها'].map(group => <div key={group} className="mb-2">
            <div className="px-2 py-1 text-[9px] font-bold text-[#65788a]">{group}</div>
            {NAV.filter(n => n.group === group).map(n => { const NIcon = n.icon; return <button key={n.id} onClick={() => go(n.id)} className={'flex w-full items-center gap-2 border px-2 py-2 text-right text-[10px] ' + (active === n.id ? 'border-[#9bb5cc] bg-[#d2e3f1] font-bold text-[#164c73]' : 'border-transparent hover:border-[#c1ccd5] hover:bg-white')}><NIcon className="h-4 w-4 shrink-0" />{n.label}</button>; })}
          </div>)}
        </aside>

        <main className="min-w-0 bg-[#f9fafb] p-3">
          {active === 'home' ? <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315e80] pb-2"><div><div className="text-[9px] text-slate-500">سیستم حسابداری / صفحه اصلی</div><h2 className="text-sm font-bold text-[#24496d]">مرکز عملیات حساب صراف</h2></div><span className="text-[10px]">سال مالی: ۱۴۰۵　 |　 تاریخ: ۱۴۰۵/۰۸/۲۴</span></div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              <Tile icon={Users} label="مشتریان" color="bg-[#2474a6]" onClick={() => go('customers')} />
              <Tile icon={Wallet} label="صندوق / دخل و خرج" color="bg-[#168b78]" onClick={() => go('cash')} />
              <Tile icon={Send} label="دفتر حواله" color="bg-[#a34d7d]" onClick={() => go('remittance')} />
              <Tile icon={ArrowLeftRight} label="خرید و فروش اسعار" color="bg-[#d17b25]" onClick={() => go('exchange')} />
              <Tile icon={ScrollText} label="روزنامچه" color="bg-[#287c9a]" onClick={() => go('journal')} />
              <Tile icon={Building2} label="نمایندگی‌ها" color="bg-[#6b67a8]" onClick={() => go('branches')} />
              <Tile icon={BarChart3} label="مفاد و زیان" color="bg-[#398a4d]" onClick={() => go('profit')} />
              <Tile icon={Calculator} label="بیلانس عمومی" color="bg-[#4e8294]" onClick={() => go('balance')} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <div className="border border-[#aebbc6] bg-[#e8f0f5] p-3"><div className="text-[10px] text-slate-600">مانده نمونه صندوق AFN</div><div className="mt-1 text-lg font-bold text-[#1c5d7d]">۱۳۰٬۰۰۰</div></div>
              <div className="border border-[#aebbc6] bg-[#edf4ed] p-3"><div className="text-[10px] text-slate-600">تعداد حواله‌های نمونه امروز</div><div className="mt-1 text-lg font-bold text-[#277244]">۱۲</div></div>
              <div className="border border-[#aebbc6] bg-[#f5f0e8] p-3"><div className="text-[10px] text-slate-600">سود نمونه معاملات امروز</div><div className="mt-1 text-lg font-bold text-[#93601e]">۳۷۰</div></div>
            </div>
          </> : <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315e80] pb-2">
              <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#315e80]" /><div><div className="text-[9px] text-slate-500">سیستم حسابداری / {page.label}</div><h2 className="text-sm font-bold text-[#24496d]">{page.label}</h2></div></div>
              <div className="flex flex-wrap items-center gap-2 text-[10px]"><span>از تاریخ</span><input defaultValue="۱۴۰۵/۰۸/۰۱" className="w-[90px] border border-[#aebbc6] bg-white px-2 py-1" /><span>تا</span><input defaultValue="۱۴۰۵/۰۸/۳۰" className="w-[90px] border border-[#aebbc6] bg-white px-2 py-1" /><button onClick={() => notify('اعمال محدودیت تاریخ')} className="border border-[#9aaab8] bg-[#e8edf1] px-3 py-1 hover:bg-white">نمایش</button></div>
            </div>

            {showSearch && <div className="mb-2 flex items-center gap-2 border border-[#b5c0ca] bg-[#edf2f6] p-2"><Search className="h-4 w-4" /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو در همین فهرست..." className="h-7 min-w-0 flex-1 border border-[#aebbc6] bg-white px-2 text-[11px]" /><button onClick={() => { setQuery(''); setShowSearch(false); }} className="border bg-white px-2 py-1 text-[10px]">بستن</button></div>}

            {active === 'customerLedger' || active === 'branchLedger' || active === 'generalLedger' ? <div className="mb-2 grid gap-2 border border-[#b6c2cc] bg-[#edf1f4] p-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-[10px]">کد / شماره حساب <input className="min-w-0 flex-1 border bg-white px-2 py-1" defaultValue={active === 'branchLedger' ? '۲۰۰۱' : '۱۰۰۱'} /></label>
              <label className="flex items-center gap-2 text-[10px]">نام حساب <input className="min-w-0 flex-1 border bg-white px-2 py-1" defaultValue={active === 'branchLedger' ? 'نمایندگی کابل' : 'محمدی، عبدالرحمان'} /></label>
              <button onClick={() => notify('نمایش حساب نمونه')} className="border border-[#9aaab8] bg-white px-3 py-1 text-[10px]">نمایش حساب</button>
            </div> : null}

            {active === 'cash' && <div className="mb-2 grid gap-2 sm:grid-cols-3">{[['صندوق افغانی','۱۳۰٬۰۰۰'],['صندوق دالر','۶٬۵۰۰'],['صندوق یورو','۲٬۵۰۰']].map(x => <div key={x[0]} className="border border-[#b4c0ca] bg-[#edf3f7] p-2"><div className="text-[10px]">{x[0]}</div><b className="text-sm text-[#1d5b7d]">{x[1]}</b></div>)}</div>}
            {active === 'exchange' && <div className="mb-2 flex flex-wrap gap-2">{['خرید اسعار','فروش اسعار','تبدیل حساب مشتری','تبدیل حساب نمایندگی'].map(x => <button key={x} onClick={() => { setDraft(d => ({...d, description:x})); setDialog('new'); }} className="border border-[#9eacb8] bg-[#e9eef2] px-3 py-2 text-[10px] hover:bg-white">{x}</button>)}</div>}
            {active === 'remittance' && <div className="mb-2 flex flex-wrap gap-2">{['حواله جدید','ثبت حواله متفرقه','حواله نامعلوم','اجرای حواله'].map(x => <button key={x} onClick={() => { setDraft(d => ({...d, description:x})); setDialog('new'); }} className="border border-[#9eacb8] bg-[#e9eef2] px-3 py-2 text-[10px] hover:bg-white">{x}</button>)}</div>}

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px]"><span className="font-bold">فهرست {page.label}</span><span className="text-slate-500">تعداد ردیف: {rows.length}</span></div>
              <div className="flex items-center gap-1"><button onClick={() => setQuery('')} className="border border-[#aab6c0] bg-white px-2 py-1 text-[10px]"><Filter className="ml-1 inline h-3 w-3" />پاک‌سازی فیلتر</button><input value={query} onChange={e => setQuery(e.target.value)} placeholder="جستجو..." className="h-7 w-[150px] border border-[#aebbc6] bg-white px-2 text-[10px]" /></div>
            </div>
            <Table headers={HEADERS[sourceKey] || HEADERS.journal} rows={rows} selected={selected} onSelect={setSelected} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border border-[#b0bdc8] bg-[#e9edf1] px-3 py-2 text-[10px]">
              <div className="flex flex-wrap gap-4"><span>جمع بدهکار نمونه: <b>۲۵٬۰۰۰</b></span><span>جمع بستانکار نمونه: <b>۷٬۰۰۰</b></span><span>مانده نمونه: <b>۱۸٬۰۰۰</b></span></div>
              <div className="flex gap-1"><button onClick={() => notify('ویرایش نمایشی')} className="border border-[#aab6c0] bg-white px-2 py-1">ویرایش</button><button onClick={() => notify('حذف نمایشی')} className="border border-[#aab6c0] bg-white px-2 py-1">حذف</button><button onClick={() => notify('چاپ فهرست نمونه')} className="border border-[#aab6c0] bg-white px-2 py-1">چاپ</button></div>
            </div>
          </>}
        </main>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#9eabb7] bg-[#dfe5ea] px-3 py-2 text-[9px] text-[#536779]"><span>وضعیت: آماده</span><span>کاربر: سازنده آزمایشی</span><span>سال مالی: ۱۴۰۵</span><span>اتصال پایگاه داده: غیرفعال</span></footer>
    </section>

    {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="w-full max-w-xl border-2 border-[#65798b] bg-[#f7f9fb] shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white"><b className="text-xs">فرم آزمایشی — {page.label}</b><button onClick={() => setDialog('')}><X className="h-4 w-4" /></button></div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="space-y-1 text-[10px]">تاریخ<input value={draft.date} onChange={e => setDraft(d => ({...d,date:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs" /></label>
          <label className="space-y-1 text-[10px]">نام / طرف حساب<input value={draft.name} onChange={e => setDraft(d => ({...d,name:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs" /></label>
          <label className="space-y-1 text-[10px]">شرح عملیات<input value={draft.description} onChange={e => setDraft(d => ({...d,description:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs" /></label>
          <label className="space-y-1 text-[10px]">شماره تماس<input value={draft.phone} onChange={e => setDraft(d => ({...d,phone:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs" /></label>
          <label className="space-y-1 text-[10px]">ارز<select value={draft.currency} onChange={e => setDraft(d => ({...d,currency:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs"><option>AFN</option><option>USD</option><option>EUR</option><option>IRR</option><option>TRY</option></select></label>
          <label className="space-y-1 text-[10px]">مبلغ<input value={draft.amount} onChange={e => setDraft(d => ({...d,amount:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs" /></label>
          <label className="space-y-1 text-[10px]">نوع حساب<select value={draft.type} onChange={e => setDraft(d => ({...d,type:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs"><option>دائمی</option><option>موقتی</option></select></label>
          <label className="space-y-1 text-[10px]">نمایندگی<select value={draft.branch} onChange={e => setDraft(d => ({...d,branch:e.target.value}))} className="h-8 w-full border border-[#aebbc6] bg-white px-2 text-xs"><option>نمایندگی کابل</option><option>نمایندگی هرات</option><option>نمایندگی مزار</option><option>متفرقه</option></select></label>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#c4cdd5] bg-[#e9edf1] p-3"><button onClick={saveDemo} className="flex items-center gap-1 border border-[#8fa1b0] bg-white px-4 py-2 text-[10px] hover:bg-[#e7f1fa]"><Save className="h-3.5 w-3.5" />ثبت نمونه</button><button onClick={() => setDialog('')} className="border border-[#8fa1b0] bg-white px-4 py-2 text-[10px]">انصراف</button></div>
      </div>
    </div>}

    {notice && <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 p-3 text-[10px] text-blue-900"><Check className="h-4 w-4 shrink-0" />{notice}<button className="mr-auto" onClick={() => setNotice('')}><X className="h-3.5 w-3.5" /></button></div>}
    <p className="text-[10px] leading-5 text-slate-500">این محیط، بازسازی آزمایشی برای بررسی چیدمان و گردش کار است. نام‌ها، مبالغ و عملیات ساختگی‌اند؛ ثبت فرم فقط در حافظه همین صفحه انجام می‌شود و به کاربران، اسناد، صندوق‌ها، جداول یا تراکنش‌های اصلی A1 دسترسی ندارد.</p>
  </div>;
}
