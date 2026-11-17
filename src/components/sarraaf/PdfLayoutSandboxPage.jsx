import React from 'react';
import {
  Home, Globe, ShoppingCart, Bot, Users, BookText, CreditCard, ArrowLeftRight,
  Wallet, Send, Landmark, User, BookOpen, Building2, Receipt, ClipboardList,
  FileText, BarChart3, Settings, Languages, PlusCircle, MinusCircle, Printer,
  Save, Pencil, Trash2, CalendarDays, Banknote, ShieldCheck
} from 'lucide-react';

const menus = ['فایل', 'تعریف', 'عملیات', 'حسابات', 'گزارشات', 'تنظیمات', 'امکانات تکمیلی'];
const toolbar = [
  [Home, 'میزکار'], [Globe, 'زبان برنامه'], [ShoppingCart, 'محصولات آنلاین'],
  [Bot, 'هوش مصنوعی'], [Users, 'گروه و چت'], [BookText, 'دفتر روزنامه'],
  [CreditCard, 'مصارف و پرداخت‌ها'], [ArrowLeftRight, 'خرید و فروش اسعار'],
  [Wallet, 'صندوق‌ها و موجودی'], [Send, 'دفتر حواله‌ها'],
  [Landmark, 'بانک و چک چک'], [Building2, 'دفتر حساب نمایندگی‌ها'],
  [User, 'تعریف مشتریان'], [BookOpen, 'دفتر حساب مشتریان']
];
const panels = [
  { title: 'تعاریف و دفاتر', items: [[Users, 'تعریف مشتریان'], [BookOpen, 'دفتر حساب مشتریان'], [Building2, 'دفتر حساب نمایندگی‌ها']] },
  { title: 'صندوق و بانک', items: [[Wallet, 'صندوق‌ها و موجودی'], [Landmark, 'بانک و چک چک'], [Send, 'دفتر حواله‌ها']] },
  { title: 'عملیات صرافی', items: [[ArrowLeftRight, 'خرید و فروش اسعار'], [Receipt, 'مصارف و پرداخت‌ها'], [Banknote, 'عملیات صندوق']] },
  { title: 'حسابداری و گزارشات', items: [[BookText, 'دفتر روزنامه'], [ClipboardList, 'دفتر کل'], [FileText, 'دفتر متفرقه']] },
  { title: 'امکانات تکمیلی', items: [[ShoppingCart, 'محصولات آنلاین'], [Users, 'گروه و چت'], [Bot, 'هوش مصنوعی']] },
  { title: 'تنظیمات', items: [[Settings, 'تنظیمات برنامه'], [Languages, 'زبان برنامه'], [ShieldCheck, 'مدیریت دسترسی']] }
];
const stats = [
  [Users, 'تعداد مشتریان'], [Wallet, 'صندوق‌های تعریف‌شده'],
  [ArrowLeftRight, 'عملیات امروز'], [BarChart3, 'مفاد معاملات']
];
const quick = [[PlusCircle, 'ثبت دخل صندوق'], [MinusCircle, 'ثبت خرج صندوق'], [Send, 'حواله ارسالی'], [Send, 'حواله دریافتی'], [ArrowLeftRight, 'معامله اسعار']];
function Tile({ icon: Icon, label, compact = false }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 border border-[#cad8ee] bg-[#f7f9fd] px-1 text-center font-bold text-[#14213d] ${compact ? 'h-[78px] text-[12px]' : 'h-[96px] text-[13px]'}`}>
      <Icon className={compact ? 'h-5 w-5 shrink-0 text-[#1f4e9f]' : 'h-6 w-6 shrink-0 text-[#1f4e9f]'} />
      <span className="leading-5">{label}</span>
    </div>
  );
}

function Panel({ title, items, compact = false }) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden border border-[#c4d3ec] bg-[#eef3fb]">
      <h3 className={`flex shrink-0 items-center bg-[#cbdcf5] px-3 font-bold text-[#14213d] ${compact ? 'h-[35px] text-[14px]' : 'h-[40px] text-[16px]'}`}>{title}</h3>
      <div className="flex min-w-0 flex-1 items-stretch gap-1 p-1">
        {items.map(([Icon, label]) => <Tile key={label} icon={Icon} label={label} compact={compact} />)}
      </div>
    </section>
  );
}

export default function PdfLayoutSandboxPage() {
  return (
    <div dir="rtl" className="w-full overflow-x-auto rounded-lg bg-[#e9eff8] p-2">
      <div className="mx-auto flex min-h-[900px] min-w-[1180px] flex-col overflow-hidden border border-[#b8c9e2] bg-[#e9eff8] text-[#14213d] shadow-sm">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#c8d5e8] bg-[#f4f6fa] px-4 text-[12px]">
          <span className="font-bold">حساب صراف</span>
          <span>نسخه ۲۱</span>
        </div>
        <nav className="flex h-11 shrink-0 items-center justify-start gap-9 border-b border-[#c8d5e8] bg-[#f7f9fc] px-5 text-[13px] font-bold">
          {menus.map((label) => <span key={label} className="whitespace-nowrap">{label}</span>)}
        </nav>
        <div className="flex h-[90px] shrink-0 items-stretch justify-between gap-1 border-b border-[#c8d5e8] bg-[#f0f4fa] px-2 py-1">
          {toolbar.map(([Icon, label]) => (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-center text-[10px] font-bold leading-4 text-[#14213d]">
              <Icon className="h-6 w-6 shrink-0 text-[#1f4e9f]" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <main className="flex flex-1 flex-col gap-3 p-[10px]">
          <header className="grid h-[55px] shrink-0 grid-cols-3 items-center rounded-md bg-[#285aa7] px-4 text-white">
            <div className="flex items-center gap-2 text-[14px]"><CalendarDays className="h-6 w-6" /><span>سه‌شنبه، ۱۶ آبان ۱۴۰۴</span></div>
            <h1 className="text-center text-[23px] font-bold">مرکز عملیات صرافی</h1>
            <Home className="h-7 w-7 justify-self-end" />
          </header>
          <div className="grid h-[78px] shrink-0 grid-cols-4 gap-[10px]">
            {stats.map(([Icon, label]) => (
              <div key={label} className="flex flex-col justify-center gap-2 border border-[#c4d3ec] bg-[#f8fafe] px-3">
                <div className="flex items-center gap-2 whitespace-nowrap text-[14px] font-bold"><Icon className="h-5 w-5 text-[#1f4e9f]" />{label}</div>
                <div className="text-center text-[18px]">-</div>
              </div>
            ))}
          </div>
          <div className="grid shrink-0 [grid-template-columns:.84fr_1fr_1fr] grid-rows-[144px_124px] gap-x-[10px] gap-y-[13px]">
            {panels.slice(0, 3).map((panel) => <Panel key={panel.title} {...panel} />)}
            {panels.slice(3).map((panel) => <Panel key={panel.title} {...panel} compact />)}
          </div>
          <section className="flex h-[125px] shrink-0 flex-col border border-[#c4d3ec] bg-[#e6ecf5] p-2">
            <h3 className="mb-2 text-[14px] font-bold">عملیات سریع</h3>
            <div className="flex h-[68px] items-stretch gap-[11px]">
              {quick.map(([Icon, label]) => <div key={label} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 border border-[#c3d2ea] bg-[#f7f9fd] text-[13px] font-bold"><Icon className="h-5 w-5 text-[#1f4e9f]" /><span>{label}</span></div>)}
            </div>
          </section>
        </main>
        <footer className="flex h-[43px] shrink-0 items-center justify-between border-t border-[#cad8ee] bg-[#eef2f8] px-3 text-[12px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Save className="h-4 w-4 text-green-600" />ثبت</span>
            <span className="flex items-center gap-1"><Pencil className="h-4 w-4 text-blue-600" />ویرایش</span>
            <span className="flex items-center gap-1"><Trash2 className="h-4 w-4 text-red-600" />حذف</span>
            <span className="flex items-center gap-1"><Printer className="h-4 w-4" />چاپ</span>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap"><span>کاربر اصلی</span><i className="h-4 w-px bg-[#9aa8c0]" /><span>۱۶ آبان ۱۴۰۴</span><i className="h-4 w-px bg-[#9aa8c0]" /><span>نسخه ۲۱</span></div>
        </footer>
      </div>
    </div>
  );
}
