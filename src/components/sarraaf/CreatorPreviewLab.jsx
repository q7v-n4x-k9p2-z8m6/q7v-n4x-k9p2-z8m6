import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, ArrowLeftRight, Send, Wallet, BookOpen,
  ChartNoAxesCombined, GitBranch, Globe2, Settings2, Search, Bell,
  ChevronLeft, Plus, FileText, CircleDollarSign, ArrowDownUp,
  Landmark, ClipboardList, ShieldCheck, CalendarDays, Menu, X,
  CheckCircle2, Building2, Calculator, ReceiptText, Scale, BookMarked,
  History, UserRound, Banknote, Coins, BadgeCheck, Archive, SlidersHorizontal,
  ArrowDownToLine, ArrowUpFromLine, ListChecks, LockKeyhole, CircleHelp
} from 'lucide-react';

const GROUPS = [
  { id: 'dashboard', title: 'نمای کلی حسابداری', subtitle: 'وضعیت اسناد، تراز و کنترل‌های مالی', icon: LayoutDashboard, modules: [
    ['خلاصه وضعیت حسابداری', 'نمای اسناد روز، جمع بدهکار و بستانکار و اسناد در انتظار'],
    ['اسناد اخیر', 'آخرین اسناد ثبت‌شده و وضعیت توازن آن‌ها'],
    ['هشدارهای حسابداری', 'اسناد نامتوازن، تاریخ خارج از دوره و حساب‌های ناقص'],
  ]},
  { id: 'accounts', title: 'کدینگ و اطلاعات پایه', subtitle: 'ساختار حساب‌ها و سطوح تفصیلی', icon: BookOpen, modules: [
    ['گروه حساب‌ها', 'تعریف دارایی، بدهی، سرمایه، درآمد و هزینه'],
    ['حساب‌های کل', 'کد و عنوان حساب کل و ماهیت بدهکار یا بستانکار'],
    ['حساب‌های معین', 'تعریف حساب‌های معین زیرمجموعه حساب کل'],
    ['حساب‌های تفصیلی', 'اشخاص، صندوق‌ها، بانک‌ها و سایر شناورهای تفصیلی'],
    ['درختواره کدینگ', 'مشاهده ارتباط گروه، کل، معین و تفصیلی'],
  ]},
  { id: 'vouchers', title: 'اسناد حسابداری', subtitle: 'ثبت سند دستی، کنترل توازن و گردش وضعیت سند', icon: ReceiptText, modules: [
    ['ثبت سند جدید', 'شماره، تاریخ، شرح و ردیف‌های بدهکار و بستانکار'],
    ['فهرست اسناد', 'جست‌وجو بر اساس شماره، تاریخ، شرح و وضعیت'],
    ['سند موقت و قطعی', 'پیش‌نویس، بررسی، تأیید و قطعی‌سازی سند'],
    ['اصلاح و برگشت سند', 'اصلاح مستند با حفظ سابقه و ثبت سند معکوس'],
    ['پیوست و یادداشت سند', 'ضمیمه مدارک و درج توضیحات حسابداری'],
  ]},
  { id: 'books', title: 'دفاتر حسابداری', subtitle: 'دفتر روزنامه، کل، معین و تفصیلی', icon: BookMarked, modules: [
    ['دفتر روزنامه', 'نمایش همه آرتیکل‌ها به ترتیب تاریخ و شماره سند'],
    ['دفتر کل', 'گردش بدهکار، بستانکار و مانده حساب کل'],
    ['دفتر معین', 'گردش حساب‌های معین به تفکیک حساب کل'],
    ['دفتر تفصیلی', 'گردش اشخاص و تفصیلی‌های شناور'],
    ['مرور حساب', 'مشاهده ریز گردش و رسیدن از گزارش به سند مبنا'],
  ]},
  { id: 'trial', title: 'ترازهای آزمایشی', subtitle: 'کنترل برابری بدهکار و بستانکار', icon: Scale, modules: [
    ['تراز آزمایشی ۴ ستونی', 'گردش و مانده بدهکار و بستانکار'],
    ['تراز آزمایشی ۶ ستونی', 'مانده اول دوره، گردش و مانده پایان دوره'],
    ['تراز آزمایشی ۸ ستونی', 'نمای تفصیلی‌تر گردش و مانده حساب‌ها'],
    ['کنترل اسناد نامتوازن', 'یافتن اختلاف جمع بدهکار و بستانکار'],
  ]},
  { id: 'statements', title: 'صورت‌های مالی و گزارش‌ها', subtitle: 'گزارش‌های رسمی و مدیریتی حسابداری', icon: ChartNoAxesCombined, modules: [
    ['ترازنامه', 'گزارش دارایی‌ها، بدهی‌ها و حقوق مالکانه'],
    ['سود و زیان', 'گزارش درآمدها، هزینه‌ها و نتیجه دوره'],
    ['گزارش گردش حساب', 'گردش و مانده حساب در بازه انتخابی'],
    ['گزارش اسناد', 'فیلتر و چاپ اسناد بر اساس تاریخ و وضعیت'],
    ['مقایسه دوره‌ای', 'مقایسه مانده و گردش حساب در دوره‌های مالی'],
  ]},
  { id: 'fiscal', title: 'دوره مالی و عملیات پایان سال', subtitle: 'کنترل سال مالی و انتقال مانده‌ها', icon: CalendarDays, modules: [
    ['تعریف سال مالی', 'تاریخ شروع و پایان و وضعیت دوره'],
    ['سند افتتاحیه', 'انتقال مانده حساب‌ها به ابتدای دوره'],
    ['سند اختتامیه', 'بستن حساب‌های موقت در پایان دوره'],
    ['انتقال مانده‌ها', 'انتقال مانده حساب‌های دائمی به دوره بعد'],
    ['کنترل قفل دوره', 'جلوگیری از ثبت سند در دوره بسته‌شده'],
  ]},
  { id: 'controls', title: 'کنترل، دسترسی و پشتیبان', subtitle: 'ردپای حسابرسی و تنظیمات بخش حسابداری', icon: ShieldCheck, modules: [
    ['سطح دسترسی حسابداران', 'مجوز مشاهده، ثبت، اصلاح و قطعی‌سازی اسناد'],
    ['سوابق تغییرات', 'ثبت کاربر، زمان و نوع تغییر روی سند'],
    ['کنترل شماره‌گذاری', 'شماره مسلسل و جلوگیری از شماره تکراری'],
    ['پشتیبان اطلاعات آزمایشی', 'خروجی و بازیابی داده‌های همین پیش‌نمایش'],
  ]},
];
const MENU_ITEMS = [['فایل', 'dashboard'], ['اطلاعات پایه', 'accounts'], ['اسناد', 'vouchers'], ['دفاتر', 'books'], ['ترازها', 'trial'], ['گزارشات', 'statements'], ['پایان سال', 'fiscal'], ['تنظیمات', 'controls']];
const MODULE_ICONS = [FileText, ClipboardList, ReceiptText, CircleDollarSign, Landmark, BookMarked, CalendarDays, Archive, ListChecks];
const SAMPLE_ROWS = [
  { ref: 'AZ-000124', date: '۱۴۰۵/۰۸/۲۴', type: 'سند افتتاحیه نمونه', account: 'صندوق اصلی', debit: '۱۲۵٬۰۰۰', credit: '۱۲۵٬۰۰۰', state: 'متوازن' },
  { ref: 'AZ-000123', date: '۱۴۰۵/۰۸/۲۴', type: 'ثبت هزینه اداری', account: 'هزینه‌های اداری', debit: '۲٬۵۰۰', credit: '۲٬۵۰۰', state: 'متوازن' },
  { ref: 'AZ-000122', date: '۱۴۰۵/۰۸/۲۳', type: 'سند اصلاحی نمونه', account: 'حساب‌های دریافتنی', debit: '۸۰۰', credit: '۷۹۰', state: 'نیازمند بررسی' },
];
const METRICS = [
  { label: 'اسناد ثبت‌شده امروز', value: '۲۴', note: 'نمونه نمایشی', icon: ReceiptText },
  { label: 'جمع بدهکار', value: '۱۲۸٬۳۰۰', note: 'واحد نمونه', icon: ArrowDownToLine },
  { label: 'جمع بستانکار', value: '۱۲۸٬۳۰۰', note: 'واحد نمونه', icon: ArrowUpFromLine },
  { label: 'اسناد نیازمند بررسی', value: '۰۱', note: 'نمونه نامتوازن', icon: Scale },
];

function MetricCard({ item }) {
  const Icon = item.icon;
  return <div className="min-w-0 rounded-xl border bg-card p-3 sm:p-4">
    <div className="flex items-center justify-between gap-2"><span className="text-[11px] text-muted-foreground">{item.label}</span><span className="rounded-lg bg-muted p-2"><Icon className="h-4 w-4 text-primary" /></span></div>
    <div className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{item.value}</div>
    <div className="mt-1 text-[10px] text-muted-foreground">{item.note}</div>
  </div>;
}

export default function CreatorPreviewLab() {
  const [device, setDevice] = useState('desktop');
  const [active, setActive] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [notice, setNotice] = useState('');
  const [records, setRecords] = useState(() => { try { return JSON.parse(sessionStorage.getItem('hisabsarraf_accounting_demo_v1') || '{}'); } catch { return {}; } });
  const [draft, setDraft] = useState({ title: '', party: '', currency: 'USD', amount: '', date: '', status: 'ثبت موقت', notes: '' });
  const [editingId, setEditingId] = useState(null);
  useEffect(() => { try { sessionStorage.setItem('hisabsarraf_accounting_demo_v1', JSON.stringify(records)); } catch { setNotice('فضای ذخیره‌سازی مرورگر در دسترس نیست؛ اطلاعات پس از بستن صفحه باقی نمی‌ماند.'); } }, [records]);
  const activeGroup = GROUPS.find(group => group.id === active) || GROUPS[0];
  const filteredGroups = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return GROUPS;
    return GROUPS.filter(group => (group.title + ' ' + group.subtitle + ' ' + group.modules.map(item => item.join(' ')).join(' ')).toLocaleLowerCase().includes(term));
  }, [query]);

  const chooseGroup = (id) => {
    setActive(id);
    setSelectedModule(null);
    setMobileMenu(false);
    setNotice('');
  };
  const chooseModule = (module) => {
    setSelectedModule(module);
    setNotice(''); 
  };
  const openModuleForm = (name) => {
    const module = activeGroup.modules.find(item => item[0] === name) || activeGroup.modules[0];
    setSelectedModule({ name: module[0], detail: module[1] });
    setDraft({ title: module[0], party: '', currency: 'USD', amount: '', date: '', status: 'ثبت موقت', notes: '' });
    setEditingId(null);
    setNotice('فرم آزمایشی آماده ورود اطلاعات است.');
  };

  const simulateAction = (label) => setNotice(label + ' فقط در همین صفحه شبیه‌سازی شد؛ هیچ اطلاعاتی به سرور ارسال نشد.');
  const saveDraft = () => {
    if (!selectedModule || !draft.title.trim()) { setNotice('عنوان یا شرح اصلی را وارد کنید.'); return; }
    const id = editingId || `LOCAL-${Date.now()}`;
    const item = { ...draft, id, module: selectedModule.name, group: active, savedAt: new Date().toISOString() };
    setRecords(current => ({ ...current, [active]: [...(current[active] || []).filter(row => row.id !== id), item] }));
    setDraft({ title: '', party: '', currency: 'USD', amount: '', date: '', status: 'ثبت موقت', notes: '' });
    setEditingId(null);
    setNotice('اطلاعات در حافظه همین مرورگر ذخیره شد؛ به سرور یا دیتابیس ارسال نشد.');
  };
  const editRecord = (row) => {
    setSelectedModule({ name: row.module, detail: 'ویرایش اطلاعات ذخیره‌شده محلی' });
    setDraft({ title: row.title || '', party: row.party || '', currency: row.currency || 'USD', amount: row.amount || '', date: row.date || '', status: row.status || 'ثبت موقت', notes: row.notes || '' });
    setEditingId(row.id);
    setNotice('حالت ویرایش فعال شد.');
  };
  const deleteRecord = (id) => {
    setRecords(current => ({ ...current, [active]: (current[active] || []).filter(row => row.id !== id) }));
    setNotice('رکورد فقط از حافظه محلی مرورگر حذف شد.');
  };
  const exportLocal = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'hisabsarraf-demo-local-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const clearLocal = () => {
    if (!window.confirm('تمام داده‌های آزمایشی ذخیره‌شده در این زبانه پاک شود؟')) return;
    setRecords({}); try { sessionStorage.removeItem('hisabsarraf_accounting_demo_v1'); } catch {} setNotice('داده‌های آزمایشی محلی پاک شد.');
  };

  return <div dir="rtl" className="space-y-4">
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5"><Calculator className="h-5 w-5 text-primary" /></div>
          <div><h2 className="text-sm font-bold sm:text-base">آزمایشگاه حسابداری حساب صراف</h2><p className="mt-1 text-xs leading-6 text-muted-foreground">پیش‌نمایش دسکتاپ بخش حسابداری؛ کدینگ، اسناد دوبل، دفاتر، ترازها و صورت‌های مالی.</p></div>
        </div>
        <span className="rounded-full border px-3 py-1.5 text-[10px] font-semibold">محیط بررسی · داده‌های کاملاً ساختگی</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" />فقط رابط کاربری؛ بدون اتصال به داده‌های اصلی</div>
        <div className="inline-flex gap-1 rounded-xl border bg-background p-1">
          <button type="button" onClick={() => setDevice('desktop')} className={'rounded-lg px-3 py-2 text-xs ' + (device === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}> <Building2 className="ml-1 inline h-3.5 w-3.5" />لپ‌تاپ</button>
          <button type="button" onClick={() => setDevice('mobile')} className={'rounded-lg px-3 py-2 text-xs ' + (device === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}> <UserRound className="ml-1 inline h-3.5 w-3.5" />گوشی</button>
        </div>
      </div>
    </section>

    <div className={device === 'mobile' ? 'mx-auto w-full max-w-[430px] rounded-[30px] border-[6px] border-slate-700 bg-background p-2 shadow-xl' : 'w-full rounded-2xl border bg-background p-3 sm:p-4'}>
       <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-300 pb-2 dark:border-slate-700">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-primary p-2 text-primary-foreground"><Calculator className="h-5 w-5" /></div>
          <div className="min-w-0"><div className="text-sm font-bold">حساب صراف | سیستم حسابداری و مدیریت مالی</div><div className="text-[10px] text-muted-foreground">دفتر مرکزی نمونه · دوره مالی ۱۴۰۵ · کاربر آزمایشی</div></div>
        </div>
        <div className="flex items-center gap-2"><span className="hidden border-r px-3 text-[10px] sm:inline-flex">وضعیت: محیط آزمایشی</span><button type="button" aria-label="اعلان‌های نمونه" onClick={() => simulateAction('اعلان‌ها')} className="relative rounded-md border p-2"><Bell className="h-4 w-4" /></button></div>
      </header>
      <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b bg-slate-100 px-2 py-1.5 text-[10px] dark:bg-slate-900">
        {MENU_ITEMS.map(([item, groupId]) => <button key={item} type="button" onClick={() => chooseGroup(groupId)} className={'rounded px-3 py-1.5 font-semibold hover:bg-white hover:text-primary dark:hover:bg-slate-800 ' + (active === groupId ? 'bg-white text-primary shadow-sm' : '')}>{item}</button>)}
        <span className="mr-auto rounded border bg-white px-2 py-1 text-[9px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">الگوی حسابداری دسکتاپ · محیط آزمایشی</span>
      </nav>
      <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50 px-2 py-2 dark:bg-slate-950">
        {[[Plus,'سند جدید',() => { chooseGroup('vouchers'); openModuleForm('ثبت سند جدید'); }],[BookOpen,'کدینگ',() => chooseGroup('accounts')],[BookMarked,'دفتر روزنامه',() => chooseGroup('books')],[Scale,'تراز آزمایشی',() => chooseGroup('trial')],[ChartNoAxesCombined,'صورت‌های مالی',() => chooseGroup('statements')],[CalendarDays,'سال مالی',() => chooseGroup('fiscal')],[Archive,'پشتیبان',exportLocal]].map(([Icon,label,action]) => <button key={label} type="button" onClick={action} className="inline-flex min-w-[66px] items-center justify-center gap-1.5 rounded border bg-white px-2.5 py-2 text-[10px] shadow-sm hover:border-primary hover:text-primary dark:bg-slate-900"><Icon className="h-3.5 w-3.5" />{label}</button>)}
        <div className="relative min-w-[180px] flex-1"><Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جست‌وجوی حساب، شماره سند یا گزارش..." className="h-8 w-full rounded border bg-background pr-9 pl-3 text-[10px] outline-none focus:ring-2 focus:ring-primary/30" /></div>
        {device === 'mobile' && <button type="button" onClick={() => setMobileMenu(value => !value)} className="rounded border p-2" aria-label="نمایش منوی اصلی">{mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>}
      </div>
      {device === 'mobile' ? <div className="space-y-3">
        {mobileMenu && <nav className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/20 p-2">
          {filteredGroups.map(group => { const Icon = group.icon; return <button key={group.id} type="button" onClick={() => chooseGroup(group.id)} className={'flex items-center gap-2 rounded-lg border p-2 text-right text-[11px] ' + (active === group.id ? 'border-primary bg-primary/10' : 'bg-background')}><Icon className="h-4 w-4 shrink-0" /><span>{group.title}</span></button>; })}
        </nav>}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredGroups.map(group => { const Icon = group.icon; return <button key={group.id} type="button" onClick={() => chooseGroup(group.id)} className={'shrink-0 rounded-xl border px-3 py-2 text-[10px] ' + (active === group.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background')}><Icon className="mx-auto mb-1 h-4 w-4" />{group.title}</button>; })}
        </div>
        <button type="button" onClick={() => openModuleForm(activeGroup.modules[0][0])} className="w-full rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground">عملیات جدید</button>
        <WorkspaceContent group={activeGroup} selectedModule={selectedModule} onSelectModule={chooseModule} onAction={simulateAction} notice={notice} records={records[active] || []} draft={draft} setDraft={setDraft} onSave={saveDraft} onEdit={editRecord} onDelete={deleteRecord} editingId={editingId} onExport={exportLocal} onClear={clearLocal} />
      </div> : <div className="flex gap-4 pt-1">
        <aside className="w-60 shrink-0 border-l border-slate-300 pl-2 dark:border-slate-700">
          <div className="mb-2 flex items-center justify-between border-b bg-slate-100 px-2 py-2 dark:bg-slate-900"><span className="text-[10px] font-bold">فهرست بخش‌های حسابداری</span><span className="text-[9px] text-muted-foreground">{GROUPS.length} بخش</span></div>
          <nav className="space-y-0.5">
            {filteredGroups.map((group, index) => { const Icon = group.icon; return <button key={group.id} type="button" onClick={() => chooseGroup(group.id)} className={'flex w-full items-center gap-2 border-b border-dashed px-2 py-2 text-right text-[11px] transition ' + (active === group.id ? 'border-r-2 border-r-primary bg-primary/10 font-bold text-primary' : 'hover:bg-muted')}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">{String(index + 1).padStart(2,'0')} · {group.title}</span><ChevronLeft className="h-3 w-3 opacity-50" /></button>; })}
          </nav>
          <div className="mt-3 border bg-slate-50 p-2 text-[10px] leading-5 text-muted-foreground dark:bg-slate-900"><div className="mb-1 flex items-center gap-1 font-bold text-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />کنترل تراز سند</div>هر سند باید تراز باشد؛ جمع بدهکار و بستانکار باید برابر شود. داده‌ها صرفاً نمونه‌اند.</div>
        </aside>
        <main className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[10px] text-muted-foreground">حسابداری / محیط آزمایشی</div><h3 className="mt-1 text-lg font-bold">{activeGroup.title}</h3><p className="mt-1 text-xs text-muted-foreground">{activeGroup.subtitle}</p></div><button type="button" onClick={() => openModuleForm(activeGroup.modules[0][0])} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"><Plus className="h-4 w-4" />عملیات جدید</button></div>
          <WorkspaceContent group={activeGroup} selectedModule={selectedModule} onSelectModule={chooseModule} onAction={simulateAction} notice={notice} records={records[active] || []} draft={draft} setDraft={setDraft} onSave={saveDraft} onEdit={editRecord} onDelete={deleteRecord} editingId={editingId} onExport={exportLocal} />
        </main>
      </div>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[10px] text-muted-foreground"><span>پیش‌نمایش حسابداری · داده‌های ساختگی</span><span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />عدم اتصال به پایگاه داده</span></div>
    </div>

    <div className="flex flex-wrap gap-2"><button type="button" onClick={exportLocal} className="rounded-lg border px-3 py-2 text-xs">خروجی پشتیبان محلی</button><button type="button" onClick={clearLocal} className="rounded-lg border px-3 py-2 text-xs">پاک‌کردن داده‌های آزمایشی</button><span className="self-center text-[10px] text-muted-foreground">{Object.values(records).reduce((n, rows) => n + rows.length, 0)} رکورد ذخیره‌شده در این مرورگر</span></div>\n    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={exportLocal} className="rounded-lg border px-3 py-2 text-xs">خروجی پشتیبان محلی</button>
      <button type="button" onClick={clearLocal} className="rounded-lg border px-3 py-2 text-xs">پاک‌کردن داده‌های آزمایشی</button>
      <span className="text-[10px] text-muted-foreground">{Object.values(records).reduce((n, rows) => n + rows.length, 0)} رکورد ذخیره‌شده در این مرورگر</span>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        [Scale, 'حسابداری دوبل', 'ثبت دوطرفه و کنترل توازن هر سند'],
        [History, 'سوابق حسابرسی', 'ثبت کاربر، زمان، اصلاح و برگشت سند'],
        [Coins, 'کدینگ چندسطحی', 'ساختار گروه، کل، معین و تفصیلی'],
        [GitBranch, 'دفاتر و ترازها', 'دفتر روزنامه، کل، معین و تفصیلی'],
      ].map(([Icon, title, detail]) => <div key={title} className="rounded-xl border p-3"><div className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</div><p className="mt-2 text-[10px] leading-5 text-muted-foreground">{detail}</p></div>)}
    </div>
    <div className="rounded-xl border border-amber-300/70 bg-amber-50/50 p-3 text-[10px] leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">این محیط فقط پیش‌نمایش آزمایشی بخش حسابداری در پنل سازنده است. هیچ سند واقعی، جدول، API یا داده مالی A1 ایجاد یا تغییر نمی‌شود.</div>
  </div>;
}

function WorkspaceContent({ group, selectedModule, onSelectModule, onAction, notice, records = [], draft = {}, setDraft = () => {}, onSave = () => {}, onEdit = () => {}, onDelete = () => {}, editingId, onExport = () => {}, onClear = () => {} }) {
  const Icon = group.icon;
  return <section className="space-y-3 rounded-xl border bg-card p-3 sm:p-4">
    <div className="flex items-center gap-2"><div className="rounded-lg bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div><div><h4 className="text-sm font-bold">{group.title}</h4><p className="text-[10px] text-muted-foreground">{group.subtitle}</p></div></div>
    {group.id === 'dashboard' && <div className="grid grid-cols-2 gap-2 xl:grid-cols-4 sm:gap-3">{METRICS.map(item => <MetricCard key={item.label} item={item} />)}</div>}
    {group.id === 'dashboard' && <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[720px] text-right text-xs"><thead className="bg-muted/60 text-muted-foreground"><tr>{['شماره مرجع', 'تاریخ', 'نوع عملیات', 'حساب مرتبط', 'بدهکار', 'بستانکار', 'کنترل'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{SAMPLE_ROWS.map(row => <tr key={row.ref} className="border-t"><td className="p-3 font-medium">{row.ref}</td><td className="p-3">{row.date}</td><td className="p-3">{row.type}</td><td className="p-3">{row.account}</td><td className="p-3 tabular-nums">{row.debit}</td><td className="p-3 tabular-nums">{row.credit}</td><td className="p-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] text-emerald-800">{row.state}</span></td></tr>)}</tbody></table></div>}
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {group.modules.map(([name, detail], index) => { const ModuleIcon = MODULE_ICONS[index % MODULE_ICONS.length]; return <button key={name} type="button" onClick={() => onSelectModule({ name, detail })} className={'flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-right transition hover:border-primary/50 hover:bg-muted/40 ' + (selectedModule?.name === name ? 'border-primary bg-primary/5' : '')}><span className="rounded-lg bg-muted p-2"><ModuleIcon className="h-4 w-4 text-muted-foreground" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{name}</span><span className="mt-1 block text-[10px] leading-5 text-muted-foreground">{detail}</span></span><ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" /></button>; })}
    </div>
    {selectedModule && <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-start gap-2"><div className="rounded-lg bg-background p-2"><FileText className="h-4 w-4 text-primary" /></div><div className="min-w-0 flex-1"><div className="text-xs font-bold">{selectedModule.name}</div><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{selectedModule.detail}</p></div></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-[10px]">عنوان / شرح اصلی<input value={draft.title || ''} onChange={e => setDraft(v => ({...v,title:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs" placeholder="مثلاً ثبت دریافت از مشتری" /></label>
        <label className="space-y-1 text-[10px]">طرف حساب / مرجع<input value={draft.party || ''} onChange={e => setDraft(v => ({...v,party:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs" placeholder="نام مشتری یا حساب" /></label>
        <label className="space-y-1 text-[10px]">ارز<select value={draft.currency || 'USD'} onChange={e => setDraft(v => ({...v,currency:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs"><option>USD</option><option>EUR</option><option>AFN</option><option>IRR</option><option>TRY</option><option>GBP</option></select></label>
        <label className="space-y-1 text-[10px]">مبلغ<input type="number" min="0" value={draft.amount || ''} onChange={e => setDraft(v => ({...v,amount:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs" placeholder="مبلغ آزمایشی" /></label>
        <label className="space-y-1 text-[10px]">تاریخ<input type="date" value={draft.date || ''} onChange={e => setDraft(v => ({...v,date:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs" /></label>
        <label className="space-y-1 text-[10px]">وضعیت<select value={draft.status || 'ثبت موقت'} onChange={e => setDraft(v => ({...v,status:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs"><option>ثبت موقت</option><option>در انتظار</option><option>تکمیل‌شده (آزمایشی)</option><option>نیازمند بررسی</option></select></label>
        <label className="space-y-1 text-[10px] sm:col-span-2">یادداشت<input value={draft.notes || ''} onChange={e => setDraft(v => ({...v,notes:e.target.value}))} className="h-9 w-full rounded-lg border bg-background px-3 text-xs" placeholder="توضیحات تکمیلی" /></label>
      </div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-xs text-primary-foreground">{editingId ? 'ذخیره ویرایش' : 'ذخیره موقت در مرورگر'}</button><button type="button" onClick={() => onAction('فرم ' + selectedModule.name)} className="rounded-lg border bg-background px-3 py-2 text-xs">آزمون دکمه فرم</button><button type="button" onClick={onExport} className="rounded-lg border bg-background px-3 py-2 text-xs">پشتیبان JSON</button></div>
      <div className="text-[10px] text-muted-foreground">این داده فقط در sessionStorage همین زبانه مرورگر ذخیره می‌شود؛ با پاک‌کردن داده‌های سایت/مرورگر ممکن است حذف شود و بین دستگاه‌ها همگام‌سازی نمی‌شود.</div>
    </div>}
    {records.length > 0 && <div className="space-y-2 rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold">سوابق ذخیره‌شده موقت ({records.length})</span><button type="button" onClick={onClear} className="rounded border px-3 py-1.5 text-[10px] text-red-600">پاک‌کردن همه داده‌های آزمایشی</button></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-xs"><thead className="bg-muted/60"><tr>{['عنوان','طرف حساب','ارز','مبلغ','وضعیت','عملیات'].map(x=><th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{records.map(row=><tr key={row.id} className="border-t"><td className="p-3 font-medium">{row.title}</td><td className="p-3">{row.party || '—'}</td><td className="p-3">{row.currency}</td><td className="p-3 tabular-nums">{row.amount || '—'}</td><td className="p-3">{row.status}</td><td className="p-3"><div className="flex gap-2"><button type="button" onClick={()=>onEdit(row)} className="rounded border px-2 py-1">ویرایش</button><button type="button" onClick={()=>onDelete(row.id)} className="rounded border px-2 py-1 text-red-600">حذف</button></div></td></tr>)}</tbody></table></div></div>}
    {group.id === 'operations' && <div className="grid gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold"><ArrowLeftRight className="h-4 w-4 text-primary" />الگوی فرم عملیات روزانه</div>
      <p className="sm:col-span-2 text-[10px] leading-5 text-muted-foreground">در معماری نهایی، ثبت این فرم یک عملیات واحد است و سند بدهکار/بستانکار متناظر از همان رویداد تولید می‌شود؛ ورود دوباره در دفترها لازم نیست.</p>
    </div>}
    {notice && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[10px] leading-5">{notice}</div>}
  </section>;
}
