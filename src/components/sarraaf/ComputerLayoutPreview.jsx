import React, { useMemo, useState } from 'react';
import {
  Calculator, Users, Wallet, BookOpen, BookMarked, FileText, Search,
  Printer, Plus, Pencil, Trash2, RefreshCw, ChevronDown, CalendarDays,
  ArrowDownUp, Receipt, CircleDollarSign, Landmark, Building2, Send,
  BarChart3, Settings, HelpCircle, X, Check, Filter, List, Eye,
  ClipboardList, CreditCard, ArrowLeftRight, Coins, FolderOpen, Save,
  FileSpreadsheet, Banknote, ScrollText, UserRound, Lock, MoreHorizontal,
  Bot, ShoppingBag, MessagesSquare, Languages
} from 'lucide-react';

const MENU = [
  { label: 'فایل', items: ['صفحه اصلی', 'پشتیبان‌گیری', 'خروج'] },
  { label: 'عملیات', items: ['ثبت دریافت', 'ثبت پرداخت', 'ثبت حواله', 'ثبت معامله ارز', 'ثبت مصارف'] },
  { label: 'جستجو', items: ['جستجوی مشتری', 'جستجوی سند', 'جستجوی حواله'] },
  { label: 'ارزها', items: ['فهرست ارزها', 'نرخ ارز', 'تبدیل ارز'] },
  { label: 'نمایش محدودیت', items: ['نمایش همه', 'محدودیت تاریخ', 'محدودیت مشتری'] },
  { label: 'رسید', items: ['رسید دریافت', 'رسید پرداخت', 'رسید حواله'] },
  { label: 'تبدیل ارز', items: ['تبدیل خرید', 'تبدیل فروش'] },
  { label: 'سود و زیان', items: ['سود معاملات', 'گزارش سود و زیان'] },
  { label: 'تصفیه حساب', items: ['تصفیه مشتری', 'تصفیه حساب شعبه'] },
  { label: 'چاپ', items: ['چاپ صفحه', 'چاپ دفتر', 'چاپ صورت حساب'] },
];

const NAV = [
  { id: 'journal', label: 'دفتر روزنامه', icon: BookMarked },
  { id: 'customer', label: 'دفتر حساب مشتری', icon: Users },
  { id: 'customers', label: 'فهرست مشتریان', icon: UserRound },
  { id: 'cash', label: 'صندوق‌ها', icon: Wallet },
  { id: 'remittance', label: 'حواله‌ها', icon: Send },
  { id: 'exchange', label: 'تبدیل ارز', icon: ArrowLeftRight },
  { id: 'branches', label: 'نمایندگی‌ها', icon: Building2 },
  { id: 'banks', label: 'حساب‌های بانکی', icon: Landmark },
  { id: 'expenses', label: 'مصارف', icon: Receipt },
  { id: 'reports', label: 'گزارش‌ها', icon: BarChart3 },
];

// امکانات اختصاصی حساب صراف؛ نام‌های اصلی آریانا بدون تغییر باقی می‌مانند.
const EXTRA_NAV = [
  { id: 'sarraafGroups', label: 'گروه صرافان', icon: MessagesSquare },
  { id: 'assistant', label: 'هوش مصنوعی', icon: Bot },
  { id: 'products', label: 'محصولات آنلاین', icon: ShoppingBag },
  { id: 'language', label: 'زبان برنامه', icon: Languages },
];

const JOURNAL_ROWS = [
  ['۱۴۰۵/۰۸/۲۴', '۰۰۱۲۴۵', 'دریافت از مشتری محمدی', 'محمدی', 'AFN', '۲۵٬۰۰۰', '۰', 'دریافت'],
  ['۱۴۰۵/۰۸/۲۴', '۰۰۱۲۴۴', 'پرداخت حواله کابل', 'احمدی', 'USD', '۰', '۳۰۰', 'پرداخت'],
  ['۱۴۰۵/۰۸/۲۳', '۰۰۱۲۴۳', 'تبدیل دالر به افغانی', 'کریمی', 'AFN', '۷۱٬۲۰۰', '۰', 'تبدیل ارز'],
  ['۱۴۰۵/۰۸/۲۳', '۰۰۱۲۴۲', 'مصارف دفتر', 'مصارف اداری', 'AFN', '۰', '۲٬۰۰۰', 'مصارف'],
  ['۱۴۰۵/۰۸/۲۲', '۰۰۱۲۴۱', 'دریافت از مشتری', 'رحیمی', 'EUR', '۱۵۰', '۰', 'دریافت'],
];

const LEDGER_ROWS = [
  ['۱۴۰۵/۰۸/۲۴', '۰۰۱۲۴۵', 'دریافت نقدی', 'AFN', '۲۵٬۰۰۰', '۰'],
  ['۱۴۰۵/۰۸/۲۲', '۰۰۱۲۳۸', 'پرداخت بابت حواله', 'AFN', '۰', '۵٬۰۰۰'],
  ['۱۴۰۵/۰۸/۲۰', '۰۰۱۲۲۹', 'تسویه حساب', 'USD', '۱۰۰', '۰'],
  ['۱۴۰۵/۰۸/۱۸', '۰۰۱۲۱۸', 'دریافت نقدی', 'USD', '۲۵۰', '۰'],
  ['۱۴۰۵/۰۸/۱۵', '۰۰۱۲۰۴', 'پرداخت', 'EUR', '۰', '۵۰'],
];

const TOOLBAR = [
  { label: 'جدید', icon: Plus }, { label: 'ویرایش', icon: Pencil },
  { label: 'حذف', icon: Trash2 }, { label: 'تازه‌سازی', icon: RefreshCw },
  { label: 'رسید', icon: Receipt }, { label: 'چاپ', icon: Printer },
  { label: 'جستجو', icon: Search }, { label: 'فهرست', icon: List },
];

function ActionButton({ icon: Icon, label, onClick, disabled = false }) {
  return <button type="button" disabled={disabled} onClick={onClick} title={label}
    className="flex min-w-[62px] flex-col items-center justify-center gap-1 border-l border-slate-200 px-3 py-2 text-[10px] text-slate-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-40">
    <Icon className="h-4 w-4" /><span>{label}</span>
  </button>;
}

function DataTable({ headers, rows, selected, onSelect }) {
  return <div className="overflow-auto border border-slate-300 bg-white">
    <table className="w-full min-w-[760px] border-collapse text-right text-[11px]">
      <thead className="sticky top-0 bg-[#e8edf3] text-slate-800">
        <tr>{headers.map(h => <th key={h} className="whitespace-nowrap border border-slate-300 px-3 py-2 font-bold">{h}</th>)}</tr>
      </thead>
      <tbody>{rows.map((row, i) => <tr key={i} onClick={() => onSelect(i)}
        className={'cursor-pointer ' + (selected === i ? 'bg-[#dcecff]' : i % 2 ? 'bg-[#fafbfd]' : 'bg-white') + ' hover:bg-blue-50'}>
        {row.map((cell, j) => <td key={j} className="whitespace-nowrap border border-slate-200 px-3 py-2 tabular-nums">{cell}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

export default function CreatorPreviewLab() {
  const [active, setActive] = useState('journal');
  const [selectedRow, setSelectedRow] = useState(0);
  const [customer, setCustomer] = useState('محمدی');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [openMenu, setOpenMenu] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [dateFrom, setDateFrom] = useState('۱۴۰۵/۰۸/۰۱');
  const [dateTo, setDateTo] = useState('۱۴۰۵/۰۸/۳۰');

  const current = NAV.find(x => x.id === active) || EXTRA_NAV.find(x => x.id === active) || NAV[0];
  const rows = useMemo(() => {
    const source = active === 'customer' ? LEDGER_ROWS : JOURNAL_ROWS;
    const q = search.trim().toLocaleLowerCase();
    return source.map((r, i) => ({ row: r, original: i })).filter(x => !q || x.row.join(' ').toLocaleLowerCase().includes(q));
  }, [active, search]);

  const notify = (label) => { setNotice(label + '؛ این فقط پیش‌نمایش است و هیچ اطلاعاتی در سرور یا دیتابیس ثبت نمی‌شود.'); setOpenMenu(''); };
  const changePage = id => { setActive(id); setSelectedRow(0); setSearch(''); setNotice(''); setOpenMenu(''); };

  return <div dir="rtl" className="space-y-3 text-slate-800">
    <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-emerald-300 bg-emerald-50 px-3 py-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900"><Calculator className="h-4 w-4" />پیش‌نمایش پنل سازنده · الگوی دسکتاپ آریانا + امکانات حساب صراف</div>
      <span className="text-[10px] text-emerald-800">داده‌های ساختگی · بدون اتصال به اطلاعات اصلی A1</span>
    </div>

    <section className="overflow-hidden border border-slate-400 bg-[#f4f5f7] shadow-sm">
      <header className="flex items-center justify-between gap-3 bg-[#24496d] px-3 py-2 text-white">
        <div className="flex items-center gap-2"><div className="rounded bg-white/15 p-1.5"><Calculator className="h-5 w-5" /></div>
          <div><div className="text-sm font-bold">سیستم حسابداری حساب صراف</div><div className="text-[9px] text-blue-100">نسخه آزمایشی دسکتاپ · شعبه مرکزی · کاربر نمونه</div></div>
        </div>
        <div className="flex items-center gap-2 text-[10px]"><span>سال مالی ۱۴۰۵</span><span className="rounded border border-white/30 px-2 py-1">آزمایشی</span></div>
      </header>

      <nav className="flex flex-wrap items-center border-b border-slate-400 bg-[#e5e8ec]">
        {MENU.map(menu => <div key={menu.label} className="relative">
          <button type="button" onClick={() => setOpenMenu(openMenu === menu.label ? '' : menu.label)}
            className={'px-3 py-2 text-[10px] font-semibold hover:bg-white ' + (openMenu === menu.label ? 'bg-white text-blue-800' : '')}>{menu.label}<ChevronDown className="mr-1 inline h-3 w-3" /></button>
          {openMenu === menu.label && <div className="absolute right-0 top-full z-30 min-w-[170px] border border-slate-400 bg-white py-1 shadow-lg">
            {menu.items.map(item => <button key={item} type="button" onClick={() => notify(item)} className="block w-full px-3 py-2 text-right text-[10px] hover:bg-blue-50">{item}</button>)}
          </div>}
        </div>)}
      </nav>

      <div className="flex flex-wrap items-stretch border-b border-slate-400 bg-[#f0f2f4]">
        {TOOLBAR.map(item => <ActionButton key={item.label} icon={item.icon} label={item.label}
          onClick={() => item.label === 'جدید' ? setShowForm(true) : notify(item.label)} />)}
        <div className="mr-auto flex items-center gap-2 px-3 py-2 text-[10px] text-slate-500"><Lock className="h-3.5 w-3.5" />محیط مستقل آزمایشی</div>
      </div>

      <div className="flex min-h-[540px]">
        <aside className="w-[190px] shrink-0 border-l border-slate-400 bg-[#e9edf1] p-2">
          <div className="mb-2 border-b border-slate-300 px-2 py-2 text-[11px] font-bold">فهرست برنامه</div>
          <div className="space-y-0.5">
            {NAV.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => changePage(item.id)}
              className={'flex w-full items-center gap-2 border px-2 py-2 text-right text-[10px] ' + (active === item.id ? 'border-[#8aa9c8] bg-[#d4e4f4] font-bold text-[#174a78]' : 'border-transparent hover:border-slate-300 hover:bg-white')}>
              <Icon className="h-4 w-4 shrink-0" />{item.label}
            </button>; })}
          </div>
          <div className="mb-2 mt-4 border-b border-slate-300 px-2 py-2 text-[10px] font-bold text-[#315d84]">امکانات اختصاصی حساب صراف</div>
          <div className="space-y-0.5">
            {EXTRA_NAV.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => changePage(item.id)} className={'flex w-full items-center gap-2 border px-2 py-2 text-right text-[10px] ' + (active === item.id ? 'border-[#8aa9c8] bg-[#d4e4f4] font-bold text-[#174a78]' : 'border-transparent hover:border-slate-300 hover:bg-white')}><Icon className="h-4 w-4 shrink-0" />{item.label}</button>; })}
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-white p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315d84] pb-2">
            <div><div className="text-[9px] text-slate-500">حساب صراف / {current.label}</div><h2 className="mt-1 text-sm font-bold text-[#24496d]">{current.label}</h2></div>
            <div className="flex items-center gap-2 text-[10px]"><span>از تاریخ</span><input value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[95px] border border-slate-300 px-2 py-1" /><span>تا</span><input value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[95px] border border-slate-300 px-2 py-1" /><button onClick={() => notify('اعمال محدودیت تاریخ')} className="border border-slate-400 bg-[#edf1f5] px-3 py-1 hover:bg-blue-50">نمایش</button></div>
          </div>

          {active === 'customer' && <div className="mb-3 grid gap-2 border border-slate-300 bg-[#f4f6f8] p-3 md:grid-cols-3">
            <div className="flex items-center gap-2 text-[10px]"><span className="font-bold">کد مشتری:</span><span className="border bg-white px-3 py-1">۱۰۰۱</span></div>
            <div className="flex items-center gap-2 text-[10px]"><span className="font-bold">نام مشتری:</span><span className="border bg-white px-3 py-1">{customer}</span><button onClick={() => setShowCustomerPicker(true)} className="border bg-white px-2 py-1 hover:bg-blue-50">جستجو</button></div>
            <div className="flex items-center gap-2 text-[10px]"><span className="font-bold">وضعیت:</span><span className="border bg-white px-3 py-1">فعال</span></div>
          </div>}

          {active === 'journal' && <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="font-bold">دفتر روزنامه</span><span className="text-slate-500">فهرست ثبت‌های روزانه به ترتیب تاریخ</span>
          </div>}

          {active === 'customer' && <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px]">
            {['عملیات','جستجو','ارزها','نمایش محدودیت','رسید','تبدیل ارز','سود و زیان','تصفیه حساب','چاپ'].map(label => <button key={label} onClick={() => notify(label)} className="border border-slate-300 bg-[#edf1f5] px-2.5 py-1.5 hover:bg-blue-50">{label}</button>)}
          </div>}

          {['journal','customer'].includes(active) ? <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="relative"><Search className="absolute right-2 top-2 h-3 w-3 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در فهرست..." className="h-7 w-[220px] border border-slate-300 pr-7 pl-2 text-[10px] outline-none focus:border-blue-500" /></div>
              <span className="text-[9px] text-slate-500">تعداد ردیف: {rows.length}</span>
            </div>
            <DataTable
              headers={active === 'customer' ? ['تاریخ','شماره','شرح','ارز','بدهکار','بستانکار'] : ['تاریخ','شماره سند','شرح عملیات','طرف حساب','ارز','بدهکار','بستانکار','نوع']}
              rows={rows.map(x => x.row)}
              selected={selectedRow}
              onSelect={setSelectedRow}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-slate-300 bg-[#f0f2f4] px-3 py-2 text-[10px]">
              <div className="flex flex-wrap gap-4"><span>جمع بدهکار: <b>۲۵٬۳۵۰</b></span><span>جمع بستانکار: <b>۷٬۰۵۰</b></span><span>مانده: <b>۱۸٬۳۰۰</b></span></div>
              <div className="flex gap-1"><button onClick={() => notify('ویرایش ردیف انتخاب‌شده')} className="border bg-white px-2 py-1">ویرایش</button><button onClick={() => notify('حذف ردیف انتخاب‌شده')} className="border bg-white px-2 py-1">حذف</button><button onClick={() => notify('بستن دفتر')} className="border bg-white px-2 py-1">بستن</button></div>
            </div>
            {active === 'customer' && <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] sm:grid-cols-6">
              {['AFN: ۲۰٬۰۰۰','USD: ۳۵۰','EUR: ۱۰۰'].map(x => <div key={x} className="border border-slate-300 bg-[#f7f8fa] px-2 py-2 text-center font-semibold">{x}</div>)}
            </div>}
          </> : <div className="grid min-h-[300px] place-items-center border border-slate-300 bg-[#fafbfc]">
            <div className="max-w-md px-5 text-center"><current.icon className="mx-auto h-10 w-10 text-slate-400" /><h3 className="mt-3 text-sm font-bold">{current.label}</h3><p className="mt-2 text-[10px] leading-6 text-slate-500">این بخش اختصاصی حساب صراف است و در کنار منوها و ابزارهای اصلی آریانا قرار گرفته است. در این پیش‌نمایش فقط جایگاه و مسیر نمایشی آن دیده می‌شود؛ اتصال عملیاتی آن پس از تطبیق با فیلدها و منطق داده‌ای قبلی حساب صراف انجام می‌شود.</p><button onClick={() => setShowForm(true)} className="mt-3 border border-slate-400 bg-[#edf1f5] px-4 py-2 text-[10px] hover:bg-blue-50">بازکردن فرم آزمایشی</button></div>
          </div>}

          {showForm && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg border-2 border-slate-500 bg-white shadow-xl">
              <div className="flex items-center justify-between bg-[#24496d] px-3 py-2 text-white"><b className="text-xs">فرم آزمایشی · {current.label}</b><button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button></div>
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {['شماره سند','تاریخ','نام مشتری','شرح','ارز','مبلغ'].map((label,i) => <label key={label} className="space-y-1 text-[10px]">{label}<input className="h-8 w-full border border-slate-300 px-2 text-xs" defaultValue={i===4?'AFN':''} /></label>)}
              </div>
              <div className="flex justify-end gap-2 border-t bg-slate-50 p-3"><button onClick={() => {setShowForm(false);notify('ذخیره نمایشی فرم');}} className="flex items-center gap-1 border bg-white px-3 py-1.5 text-[10px]"><Save className="h-3 w-3" />ذخیره آزمایشی</button><button onClick={() => setShowForm(false)} className="border bg-white px-3 py-1.5 text-[10px]">انصراف</button></div>
            </div>
          </div>}

          {showCustomerPicker && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-sm border border-slate-400 bg-white p-4"><div className="mb-3 flex items-center justify-between"><b className="text-xs">انتخاب مشتری نمونه</b><button onClick={() => setShowCustomerPicker(false)}><X className="h-4 w-4" /></button></div>{['محمدی','احمدی','کریمی','رحیمی'].map(name => <button key={name} onClick={() => {setCustomer(name);setShowCustomerPicker(false);}} className="block w-full border-b px-2 py-2 text-right text-xs hover:bg-blue-50">{name}</button>)}</div></div>}
        </main>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-400 bg-[#e8edf2] px-3 py-2 text-[9px] text-slate-600"><span>آماده · نسخه نمایشی</span><span>کاربر: سازنده آزمایشی</span><span>اتصال پایگاه داده: غیرفعال</span></footer>
    </section>
    {notice && <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 p-3 text-[10px] text-blue-900"><Check className="h-4 w-4 shrink-0" />{notice}<button className="mr-auto" onClick={() => setNotice('')}><X className="h-3.5 w-3.5" /></button></div>}
    <p className="text-[10px] leading-5 text-muted-foreground">این پیش‌نمایش، ساختار دسکتاپ آریانا را با حفظ نام‌های اصلی منوها و دکمه‌های عملیاتی نشان می‌دهد و امکانات اختصاصی حساب صراف را جداگانه به آن اضافه می‌کند. اطلاعات، اشخاص، ارقام و عملیات همگی نمونه هستند و هیچ تغییری در کاربران، اسناد، جداول، تنظیمات یا تراکنش‌های اصلی A1 ایجاد نمی‌کنند.</p>
  </div>;
}
