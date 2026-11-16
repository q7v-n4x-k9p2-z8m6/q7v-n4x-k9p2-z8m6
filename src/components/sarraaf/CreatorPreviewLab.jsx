import React, { useEffect, useMemo, useState } from 'react';
import {
  Home, Users, Wallet, BookOpen, BookText, Search, Printer, Plus, Pencil, Trash2,
  RefreshCw, Receipt, Landmark, Building2, Send, BarChart3, X, Check, ArrowLeftRight,
  ScrollText, Lock, MoreHorizontal, ChevronDown, Save, ClipboardList, FileSpreadsheet,
  Calculator, Download, Upload, Filter, Coins, Banknote, FileText, CalendarDays, MessageSquare, Bot,
  Eye, FilePlus2, ArrowDownCircle, ArrowUpCircle, Scale, Settings2,
  Archive, RotateCcw, ListChecks, CreditCard, PrinterCheck,
  Languages, ShoppingBag, Smartphone, Wifi, Gamepad2, MessagesSquare, Headphones
} from 'lucide-react';

const STORE_KEY = 'hisab-sarraf-lab-v2';
const CURRENCIES = ['AFN','USD','EUR','IRR','TRY','PKR','AED','SAR','GBP','CNY'];
const MODULES = [
  {id:'home',label:'مرکز عملیات',icon:Home,group:'عمومی'},
  {id:'customers',label:'تعریف مشتریان',icon:Users,group:'تعاریف و دفاتر'},
  {id:'customerLedger',label:'دفتر حساب مشتریان',icon:BookOpen,group:'تعاریف و دفاتر'},
  {id:'branches',label:'تعریف نمایندگی‌ها',icon:Building2,group:'تعاریف و دفاتر'},
  {id:'branchLedger',label:'دفتر حساب نمایندگی‌ها',icon:BookText,group:'تعاریف و دفاتر'},
  {id:'cash',label:'صندوق‌ها و موجودی',icon:Wallet,group:'صندوق و بانک'},
  {id:'banks',label:'بانک و چک',icon:Landmark,group:'صندوق و بانک'},
  {id:'exchange',label:'خرید و فروش اسعار',icon:ArrowLeftRight,group:'عملیات صرافی'},
  {id:'remittance',label:'دفتر حواله‌ها',icon:Send,group:'عملیات صرافی'},
  {id:'expenses',label:'مصارف و پرداخت‌ها',icon:Receipt,group:'عملیات صرافی'},
  {id:'journal',label:'دفتر روزنامچه',icon:ScrollText,group:'حسابداری'},
  {id:'ledger',label:'دفتر کل',icon:ClipboardList,group:'حسابداری'},
  {id:'accounts',label:'کدینگ حساب‌ها',icon:ListChecks,group:'حسابداری'},
  {id:'currencies',label:'تعریف اسعار',icon:Coins,group:'تنظیمات'},
  {id:'reports',label:'گزارش عملیات',icon:FileSpreadsheet,group:'گزارشات'},
  {id:'profit',label:'مفاد و زیان',icon:BarChart3,group:'گزارشات'},
  {id:'balance',label:'بیلانس عمومی',icon:Scale,group:'گزارشات'},
  {id:'sarraafGroups',label:'گروه و چت',icon:MessagesSquare,group:'امکانات تکمیلی',skeleton:true,children:['گروه صرافان','ایجاد گروه','گفت‌وگوی گروهی','گفت‌وگوی خصوصی']},
  {id:'assistant',label:'هوش مصنوعی',icon:Bot,group:'امکانات تکمیلی',skeleton:true},
  {id:'products',label:'محصولات آنلاین',icon:ShoppingBag,group:'امکانات تکمیلی',skeleton:true,children:['شارژ موبایل','بسته‌های اینترنت','UC پابجی موبایل']},
  {id:'language',label:'زبان برنامه',icon:Languages,group:'تنظیمات',skeleton:true,children:['فارسی','دری','English','العربية']}
];
const SCHEMAS = {
 transactions:{title:'گردش حساب',fields:[['date','تاریخ','date'],['type','نوع عملیات','text'],['partyType','نوع طرف حساب','select',[{value:'customer',label:'مشتری'},{value:'branch',label:'نمایندگی'},{value:'other',label:'سایر'}]],['party','طرف حساب','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ (+ دریافت / - پرداخت)','number'],['description','شرح','text']]},
 customers:{title:'مشتری',fields:[['code','کد مشتری','text'],['name','نام مشتری','text'],['kind','نوع حساب','select',['دائمی','موقتی']],['phone','شماره تماس','text'],['address','آدرس','text'],['currency','ارز اصلی','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال','قفل']]]},
 branches:{title:'نمایندگی',fields:[['code','کد نمایندگی','text'],['name','نام نمایندگی','text'],['city','موقعیت','text'],['phone','شماره تماس','text'],['status','وضعیت','select',['فعال','غیرفعال']]]},
 cash:{title:'صندوق',fields:[['code','کد صندوق','text'],['name','نام صندوق','text'],['currency','ارز','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال']],['description','توضیحات','text']]},
 banks:{title:'حساب بانکی / چک',fields:[['name','نام بانک یا حساب','text'],['account','شماره حساب','text'],['currency','ارز','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال']],['description','توضیحات','text']]},
 currencies:{title:'ارز',fields:[['code','کد ارز','text'],['name','نام ارز','text'],['symbol','نماد','text'],['rate','نرخ مقابل ارز پایه','number'],['active','وضعیت','select',['فعال','غیرفعال']]]},
 accounts:{title:'حساب کل',fields:[['code','کد حساب','text'],['name','نام حساب','text'],['accountType','نوع حساب','select',[{value:'asset',label:'دارایی'},{value:'liability',label:'بدهی'},{value:'equity',label:'سرمایه'},{value:'revenue',label:'درآمد'},{value:'expense',label:'مصرف'}]],['nature','ماهیت','select',['بدهکار','بستانکار']],['parentId','حساب مادر','select',[]],['currency','ارز اختصاصی (اختیاری)','select',['','AFN','USD','EUR','IRR','TRY','PKR','AED','SAR','GBP','CNY']],['status','وضعیت','select',['فعال','غیرفعال']],['description','شرح','text']]},
 expenses:{title:'مصرف',fields:[['date','تاریخ','date'],['title','شرح مصرف','text'],['expenseAccount','حساب مصرف','select',[]],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['cash','پرداخت از صندوق','select',[]],['note','یادداشت','text']]},
 remittance:{title:'حواله',fields:[['date','تاریخ','date'],['number','شماره حواله','text'],['direction','نوع حواله','select',['ارسالی','دریافتی']],['sender','فرستنده','text'],['receiver','گیرنده','text'],['branch','نمایندگی','select',[]],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['fee','کمیشن','number'],['cash','صندوق مرتبط','select',[]],['status','وضعیت','select',['در انتظار','اجرا شده','لغو شده']],['note','یادداشت','text']]},
 exchange:{title:'معامله اسعار',fields:[['date','تاریخ','date'],['fromCurrency','ارز مبدا','select',CURRENCIES],['fromAmount','مبلغ مبدا','number'],['toCurrency','ارز مقصد','select',CURRENCIES],['toAmount','مبلغ مقصد','number'],['rate','نرخ معامله','number'],['party','طرف حساب','text'],['cashFrom','صندوق پرداخت ارز مبدا','select',[]],['cashTo','صندوق دریافت ارز مقصد','select',[]],['note','یادداشت','text']]},
 journal:{title:'سند روزنامچه',fields:[['date','تاریخ','date'],['number','شماره سند','text'],['description','شرح سند','text'],['debitAccount','حساب بدهکار','select',[]],['creditAccount','حساب بستانکار','select',[]],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['status','وضعیت','select',['پیش‌نویس','قطعی']]]}
};
const initial = () => {
 const sampleDate=new Date().toLocaleDateString('en-CA');
 return ({
 customers:[
  {id:'c1',code:'1001',name:'مشتری نمونه احمدی',kind:'دائمی',phone:'0700000001',address:'کابل، شهرنو',currency:'AFN',opening:12000,status:'فعال'},
  {id:'c2',code:'1002',name:'مشتری نمونه رحیمی',kind:'دائمی',phone:'0700000002',address:'کابل، کارته چهار',currency:'USD',opening:250,status:'فعال'},
  {id:'demo-c3',code:'1003',name:'مشتری نمونه کریمی',kind:'موقتی',phone:'0700000003',address:'هرات',currency:'AFN',opening:5000,status:'فعال'},
  {id:'demo-c4',code:'1004',name:'مشتری نمونه محمدی',kind:'دائمی',phone:'0700000004',address:'مزارشریف',currency:'EUR',opening:100,status:'فعال'}
 ],
 branches:[
  {id:'b1',code:'2001',name:'نمایندگی مرکزی',city:'کابل',phone:'0200000001',currency:'AFN',opening:45000,status:'فعال'},
  {id:'demo-b2',code:'2002',name:'نمایندگی نمونه هرات',city:'هرات',phone:'0400000002',currency:'AFN',opening:18000,status:'فعال'},
  {id:'demo-b3',code:'2003',name:'نمایندگی نمونه مزار',city:'مزارشریف',phone:'0500000003',currency:'USD',opening:900,status:'فعال'}
 ],
 cash:[
  {id:'k1',code:'C-001',name:'صندوق مرکزی افغانی',currency:'AFN',opening:100000,status:'فعال',description:'صندوق اصلی نمونه'},
  {id:'k2',code:'C-002',name:'صندوق دالر',currency:'USD',opening:5000,status:'فعال',description:'صندوق اسعار خارجی'},
  {id:'demo-k3',code:'C-003',name:'صندوق یورو',currency:'EUR',opening:2500,status:'فعال',description:'صندوق نمونه یورو'}
 ],
 banks:[
  {id:'demo-bank1',name:'بانک نمونه ملی',account:'000123456789',currency:'AFN',opening:250000,description:'حساب آزمایشی'},
  {id:'demo-bank2',name:'بانک نمونه بین‌المللی',account:'USD-009812',currency:'USD',opening:12000,description:'حساب دالری آزمایشی'}
 ],
 currencies:CURRENCIES.map((code,i)=>({id:'u'+i,code,name:({AFN:'افغانی',USD:'دالر امریکا',EUR:'یورو',IRR:'تومان',TRY:'لیره ترکیه',PKR:'کلدار پاکستان',AED:'درهم امارات',SAR:'ریال سعودی',GBP:'پوند',CNY:'یوان'}[code]||code),symbol:code,rate:({AFN:1,USD:70,EUR:76,IRR:0.0011,TRY:2.05,PKR:0.25,AED:19.05,SAR:18.66,GBP:88,CNY:9.7}[code]||0),active:'فعال'})),
 accounts:[
  {id:'a1',code:'100',name:'صندوق',level:'کل',nature:'بدهکار',description:'دارایی جاری'},
  {id:'a2',code:'200',name:'سرمایه',level:'کل',nature:'بستانکار',description:'سرمایه مالک'},
  {id:'a3',code:'300',name:'عواید',level:'کل',nature:'بستانکار',description:'عواید معاملات'},
  {id:'a4',code:'400',name:'مصارف',level:'کل',nature:'بدهکار',description:'مصارف عملیاتی'},
  {id:'demo-a5',code:'110',name:'بانک‌ها',level:'معین',nature:'بدهکار',description:'حساب‌های بانکی'},
  {id:'demo-a6',code:'120',name:'حسابات مشتریان',level:'معین',nature:'بدهکار',description:'مطالبات و حساب مشتری'},
  {id:'demo-a7',code:'210',name:'حسابات نمایندگی‌ها',level:'معین',nature:'بستانکار',description:'حساب متقابل نمایندگی‌ها'}
 ],
 expenses:[
  {id:'demo-e1',date:sampleDate,title:'کرایه دفتر نمونه',currency:'AFN',amount:4500,cash:'صندوق مرکزی افغانی',note:'مصرف آزمایشی ماه جاری'},
  {id:'demo-e2',date:sampleDate,title:'مصرف برق و انترنت',currency:'AFN',amount:1200,cash:'صندوق مرکزی افغانی',note:'رسید نمونه'},
  {id:'demo-e3',date:sampleDate,title:'هزینه خدمات بانکی',currency:'USD',amount:12,cash:'صندوق دالر',note:'نمونه آزمایشی'}
 ],
 remittance:[
  {id:'demo-r1',date:sampleDate,number:'RM-0001',direction:'ارسالی',sender:'مشتری نمونه احمدی',receiver:'مشتری نمونه رحیمی',branch:'نمایندگی مرکزی',currency:'AFN',amount:15000,fee:150,cash:'صندوق مرکزی افغانی',status:'اجرا شده',note:'حواله نمونه برای نمایش گردش کار'},
  {id:'demo-r2',date:sampleDate,number:'RM-0002',direction:'دریافتی',sender:'مشتری نمونه کریمی',receiver:'مشتری نمونه محمدی',branch:'نمایندگی نمونه هرات',currency:'USD',amount:300,fee:5,cash:'صندوق دالر',status:'در انتظار',note:'حواله نمونه در انتظار اجرا'},
  {id:'demo-r3',date:sampleDate,number:'RM-0003',direction:'نامعلوم',sender:'فرستنده نمونه',receiver:'گیرنده نمونه',branch:'نمایندگی مرکزی',currency:'AFN',amount:2500,fee:0,cash:'صندوق مرکزی افغانی',status:'در انتظار',note:'نمونه حواله نامعلوم'}
 ],
 exchange:[
  {id:'demo-x1',date:sampleDate,kind:'خرید',fromCurrency:'USD',fromAmount:500,toCurrency:'AFN',toAmount:35000,rate:70,profit:350,party:'مشتری نمونه احمدی',note:'معامله خرید نمونه'},
  {id:'demo-x2',date:sampleDate,kind:'فروش',fromCurrency:'AFN',fromAmount:14000,toCurrency:'USD',toAmount:198,rate:70.7,profit:140,party:'مشتری نمونه رحیمی',note:'معامله فروش نمونه'},
  {id:'demo-x3',date:sampleDate,kind:'تبدیل',fromCurrency:'EUR',fromAmount:100,toCurrency:'USD',toAmount:108,rate:1.08,profit:25,party:'مشتری نمونه محمدی',note:'تبدیل ارز نمونه'}
 ],
 journal:[
  {id:'demo-j1',date:sampleDate,number:'JV-00001',description:'ثبت سرمایه افتتاحی نمونه',debitAccount:'100 — صندوق',creditAccount:'200 — سرمایه',currency:'AFN',amount:100000,status:'قطعی'},
  {id:'demo-j2',date:sampleDate,number:'JV-00002',description:'ثبت مصرف دفتر نمونه',debitAccount:'400 — مصارف',creditAccount:'صندوق: صندوق مرکزی افغانی',currency:'AFN',amount:4500,status:'قطعی'},
  {id:'demo-j3',date:sampleDate,number:'JV-00003',description:'واریز به حساب بانکی نمونه',debitAccount:'110 — بانک‌ها',creditAccount:'100 — صندوق',currency:'AFN',amount:20000,status:'قطعی'}
 ],
 transactions:[
  {id:'demo-t1',date:sampleDate,type:'دخل',party:'مشتری نمونه احمدی',partyType:'customer',currency:'AFN',amount:12000,cash:'صندوق مرکزی افغانی',description:'دریافت وجه از مشتری نمونه'},
  {id:'demo-t2',date:sampleDate,type:'خرج',party:'مشتری نمونه رحیمی',partyType:'customer',currency:'USD',amount:-80,cash:'صندوق دالر',description:'پرداخت به مشتری نمونه'},
  {id:'demo-t3',date:sampleDate,type:'دخل نمایندگی',party:'نمایندگی نمونه هرات',partyType:'branch',currency:'AFN',amount:8000,cash:'صندوق مرکزی افغانی',description:'تسویه حساب نمایندگی'},
  {id:'demo-t4',date:sampleDate,type:'حواله ارسالی',party:'مشتری نمونه رحیمی',partyType:'customer',currency:'AFN',amount:-15000,cash:'صندوق مرکزی افغانی',description:'حواله RM-0001'},
  {id:'demo-t5',date:sampleDate,type:'حواله دریافتی',party:'مشتری نمونه محمدی',partyType:'customer',currency:'USD',amount:300,cash:'صندوق دالر',description:'دریافت حواله نمونه'},
  {id:'demo-t6',date:sampleDate,type:'مصرف',party:'کرایه دفتر نمونه',partyType:'other',currency:'AFN',amount:-4500,cash:'صندوق مرکزی افغانی',description:'مصرف آزمایشی دفتر'},
  {id:'demo-t7',date:sampleDate,type:'معامله خرید · خروج',party:'مشتری نمونه احمدی',partyType:'customer',currency:'USD',amount:-500,description:'معامله خرید نمونه'},
  {id:'demo-t8',date:sampleDate,type:'معامله خرید · ورود',party:'مشتری نمونه احمدی',partyType:'customer',currency:'AFN',amount:35000,description:'معامله خرید نمونه'}
 ]
 });
};

const readStore = () => {
 try {
  const s=localStorage.getItem(STORE_KEY);
  if(!s)return initial();
  const saved=JSON.parse(s);
  const base=initial();
  const merged={...base,...saved};
  Object.keys(base).forEach(key=>{
   if(Array.isArray(base[key])){
    const stored=Array.isArray(saved[key])?saved[key]:[];
    merged[key]=[...base[key].filter(seed=>!stored.some(item=>item.id===seed.id)),...stored];
   }
  });
  return merged;
 } catch { return initial(); }
};
const today = () => new Date().toLocaleDateString('en-CA');
const n = v => Number(String(v??0).replaceAll(',',''))||0;
const fmt = v => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n(v));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fieldValue = (obj,key) => obj?.[key] ?? '';
const NAV_MENUS = [
 {label:'فایل',items:[['پشتیبان‌گیری','backup'],['بازیابی پشتیبان','restore'],['چاپ صفحه','print'],['بازنشانی داده‌های آزمایشی','reset']]},
 {label:'تعاریف',items:[['مشتریان','customers'],['نمایندگی‌ها','branches'],['صندوق‌ها','cash'],['بانک و چک','banks'],['اسعار','currencies'],['کدینگ حساب‌ها','accounts']]},
 {label:'عملیات',items:[['دخل صندوق','cashIn'],['خرج صندوق','cashOut'],['خرید و فروش اسعار','exchange'],['ثبت حواله','remittance'],['ثبت مصرف','expenses']]},
 {label:'حسابات',items:[['روزنامچه','journal'],['دفتر کل','ledger'],['حساب مشتریان','customerLedger'],['حساب نمایندگی‌ها','branchLedger']]},
 {label:'گزارشات',items:[['گزارش عملیات روز','reports'],['مفاد و زیان','profit'],['بیلانس عمومی','balance']]},
 {label:'تنظیمات',items:[['تنظیمات محلی','settings'],['انتخاب زبان','language'],['پشتیبانی','support'],['راهنما','help']]},
  {label:'امکانات تکمیلی',items:[['گروه و چت','sarraafGroups'],['هوش مصنوعی','assistant']] }
];

function Field({field,value,onChange,choices}) {
 const [key,label,type,opts]=field;
 const options=choices?.[key]||opts||[];
 return <label className="block space-y-1 text-[11px]"><span className="font-semibold text-slate-700">{label}</span>
 {type==='select'||choices?.[key]?<select value={value??options[0]?.value??options[0]??''} onChange={e=>onChange(key,e.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs">{options.map(o=>{const v=typeof o==='object'?o.value:o;const t=typeof o==='object'?o.label:o;return <option key={v} value={v}>{t}</option>;})}</select>:
 <input type={type==='number'?'number':type==='date'?'date':'text'} value={value??''} onChange={e=>onChange(key,e.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs" />}</label>;
}
function DataTable({columns,rows,onSelect,selected,mobile=false}) {
 if(mobile)return <div className="creator-mobile-records grid gap-2">{rows.map((r,i)=><button type="button" key={r.id||i} onClick={()=>onSelect(r)} className={'w-full rounded-xl border p-3 text-right shadow-sm '+(selected?.id===r.id?'border-blue-500 bg-blue-50 ring-2 ring-blue-100':'border-slate-200 bg-white')}><div className="mb-2 flex items-start justify-between gap-2"><b className="text-xs text-slate-800">{columns[1]?.render?columns[1].render(r):String(r[columns[1]?.key]??r.name??r.title??r.number??'رکورد')}</b><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{columns[0]?.render?columns[0].render(r):String(r[columns[0]?.key]??'')}</span></div><div className="grid grid-cols-2 gap-x-3 gap-y-2">{columns.slice(2).map(c=><div key={c.key} className="min-w-0"><span className="block text-[9px] text-slate-500">{c.label}</span><span className="block break-words text-[11px] font-semibold text-slate-700">{c.render?c.render(r):String(r[c.key]??'—')}</span></div>)}</div></button>)}{!rows.length&&<div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">موردی برای نمایش وجود ندارد.</div>}</div>;
 return <div className="overflow-auto border border-slate-300 bg-white"><table className="w-full min-w-[760px] border-collapse text-right text-[11px]"><thead className="sticky top-0 bg-[#dce5ed] text-[#203c54]"><tr>{columns.map(c=><th key={c.key} className="border border-slate-300 px-2 py-2">{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i} onClick={()=>onSelect(r)} className={'cursor-pointer '+(selected?.id===r.id?'bg-blue-100':i%2?'bg-slate-50':'bg-white')+' hover:bg-blue-50'}>{columns.map(c=><td key={c.key} className="whitespace-nowrap border border-slate-200 px-2 py-2">{c.render?c.render(r):String(r[c.key]??'—')}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="p-8 text-center text-xs text-slate-500">موردی برای نمایش وجود ندارد.</div>}</div>;
}
const MODULE_TONES={home:'from-blue-700 to-indigo-700',customers:'from-sky-600 to-blue-700',customerLedger:'from-emerald-600 to-teal-700',branches:'from-violet-600 to-indigo-700',branchLedger:'from-cyan-600 to-blue-700',cash:'from-amber-500 to-orange-600',banks:'from-blue-600 to-indigo-700',exchange:'from-fuchsia-600 to-purple-700',remittance:'from-orange-500 to-amber-600',expenses:'from-rose-600 to-red-700',journal:'from-slate-600 to-slate-800',ledger:'from-indigo-600 to-violet-700',accounts:'from-cyan-600 to-teal-700',currencies:'from-lime-600 to-green-700',reports:'from-blue-600 to-cyan-700',profit:'from-emerald-600 to-green-700',balance:'from-violet-600 to-purple-700',sarraafGroups:'from-sky-600 to-cyan-700',assistant:'from-indigo-600 to-blue-800',products:'from-orange-500 to-pink-600',language:'from-teal-600 to-cyan-700'};
function Tile({icon:Icon,label,onClick,moduleId}){const tone=MODULE_TONES[moduleId]||'from-blue-600 to-indigo-700';return <button type="button" onClick={onClick} className="group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border border-[#d2deec] bg-gradient-to-b from-white to-[#f1f6fd] px-2 py-3 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md active:translate-y-px"><span className={'grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br '+tone+' text-white shadow-md ring-1 ring-white/70'}><Icon className="h-6 w-6"/></span><b className="text-[11px] font-bold leading-tight text-[#203b5b]">{label}</b></button>}

export default function CreatorPreviewLab({ mobileMode = false }){
 const [data,setData]=useState(readStore);
 const [active,setActive]=useState('home');
 const [selected,setSelected]=useState(null);
 const [menu,setMenu]=useState('');
 const [modal,setModal]=useState('');
 const [draft,setDraft]=useState({});
 const [query,setQuery]=useState('');
 const [showVoided,setShowVoided]=useState(false);
 const [notice,setNotice]=useState('');
 const [filterCurrency,setFilterCurrency]=useState('همه');
 const [dateFrom,setDateFrom]=useState('');
 const [dateTo,setDateTo]=useState('');
 const [restoreText,setRestoreText]=useState('');
 const [showHelp,setShowHelp]=useState(false);
 const [showWorkspace,setShowWorkspace]=useState(false);
 const [customerDetail,setCustomerDetail]=useState(null);
 const [branchDetail,setBranchDetail]=useState(null);
 useEffect(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(data));}catch{setNotice('فضای ذخیره‌سازی مرورگر در دسترس نیست؛ داده‌ها فقط تا زمان بازبودن صفحه باقی می‌مانند.');}},[data]);
 const notify=s=>{setNotice(s);setTimeout(()=>setNotice(''),4500);};
 const page=MODULES.find(x=>x.id===active)||MODULES[0];
 const schema=SCHEMAS[active];
 const rows=useMemo(()=>{
  let source=data[active]||[];
  if(active==='customerLedger') source=customerDetail?data.transactions.filter(x=>x.partyType==='customer'&&x.party===customerDetail.name):data.customers;
  if(active==='branchLedger') source=branchDetail?data.transactions.filter(x=>x.partyType==='branch'&&x.party===branchDetail.name):data.branches;
  if(active==='ledger') source=data.journal;
  if(active==='reports') source=data.transactions;
  const q=query.trim().toLowerCase();
  return source.filter(r=>(showVoided||!r.deleted)&&(!q||Object.values(r).join(' ').toLowerCase().includes(q))&&(filterCurrency==='همه'||!r.currency||r.currency===filterCurrency)&&(!dateFrom||!r.date||r.date>=dateFrom)&&(!dateTo||!r.date||r.date<=dateTo));
 },[data,active,customerDetail,branchDetail,query,filterCurrency,dateFrom,dateTo,showVoided]);
 const setField=(k,v)=>setDraft(d=>({...d,[k]:v}));
 const openNew=(module=active,extra={})=>{const sc=SCHEMAS[module];const defaults=Object.fromEntries((sc?.fields||[]).map(([k,,type,opts])=>[k,type==='date'?today():type==='select'?(opts?.[0]??''): '']));setActive(module);setDraft({...defaults,date:today(),currency:'AFN',...extra});setSelected(null);setModal(module);};
 const saveRecord=()=>{
  const mod=modal; if(!SCHEMAS[mod])return;
  const record={...draft,id:draft.id||uid()};
  if(mod==='journal'){
   if(!record.date||!record.description||!record.debitAccount||!record.creditAccount||n(record.amount)<=0){notify('تاریخ، شرح، دو حساب و مبلغ مثبت برای سند الزامی است.');return;}
   if(record.debitAccount===record.creditAccount){notify('حساب بدهکار و بستانکار نمی‌تواند یکسان باشد.');return;}
   const known=[...data.accounts.map(a=>a.code+' — '+a.name),...data.cash.map(x=>'صندوق: '+x.name)].map(x=>x.toLowerCase());
   if(!known.includes(String(record.debitAccount).toLowerCase())||!known.includes(String(record.creditAccount).toLowerCase())){notify('حساب بدهکار و بستانکار را از فهرست حساب‌ها یا صندوق‌های تعریف‌شده انتخاب کنید.');return;}
   record.number=record.number||'JV-'+String(data.journal.length+1).padStart(5,'0');record.status='قطعی';
  }
  if(['expenses','exchange','remittance'].includes(mod)&&n(record.amount??record.fromAmount)<=0){notify('مبلغ عملیات باید بیشتر از صفر باشد.');return;}
  if(mod==='remittance'&&record.status==='اجرا شده'&&!draft.id){
   const signed=record.direction==='دریافتی'?n(record.amount):-n(record.amount);
   addTransaction({type:'حواله '+record.direction,party:record.receiver||record.sender,currency:record.currency,amount:signed,date:record.date,cash:record.cash||'',description:'حواله '+(record.number||'')+' · '+(record.note||'')});
  }
  setData(d=>({...d,[mod]:draft.id?(d[mod]||[]).map(x=>x.id===draft.id?record:x):[record,...(d[mod]||[])]}));
  if(mod==='expenses') addTransaction({type:'مصرف',party:record.title,partyType:'other',currency:record.currency,amount:-n(record.amount),date:record.date,cash:record.cash,description:record.title});
  if(mod==='exchange'){
   addTransaction({type:'معامله '+record.kind+' · خروج',party:record.party,currency:record.fromCurrency,amount:-n(record.fromAmount),date:record.date,description:'نرخ '+record.rate});
   addTransaction({type:'معامله '+record.kind+' · ورود',party:record.party,currency:record.toCurrency,amount:n(record.toAmount),date:record.date,description:'طرف دیگر معامله'});
  }
  setModal('');setSelected(record);notify('اطلاعات در حافظه محلی مرورگر ثبت شد.');
 };
 const addTransaction=tx=>setData(d=>({...d,transactions:[{id:uid(),date:today(),...tx},...d.transactions]}));
 const removeSelected=()=>{
  if(!selected){notify('ابتدا یک ردیف را انتخاب کنید.');return;}
  if(active==='reports'||active==='profit'||active==='balance'){notify('این بخش گزارش است؛ عملیات ابطال از دفتر اصلی انجام می‌شود.');return;}
  const masterModules=['customers','branches','cash','banks','currencies','accounts'];
  const isMaster=masterModules.includes(active);
  const actionLabel=isMaster?'غیرفعال‌سازی':'ابطال سند';
  if(!window.confirm('این عملیات فقط روی داده آزمایشی همین مرورگر انجام می‌شود. '+actionLabel+' انتخاب‌شده؟'))return;
  const key=['customerLedger','branchLedger'].includes(active)?'transactions':active==='ledger'?'journal':active;
  setData(d=>({...d,[key]:(d[key]||[]).map(x=>x.id===selected.id?(isMaster?{...x,status:'غیرفعال',active:'غیرفعال'}:{...x,deleted:true,status:'باطل شده'}):x)}));
  setSelected(null);
  notify(isMaster?'رکورد آزمایشی غیرفعال شد؛ سابقه آن حفظ شده است.':'سند آزمایشی باطل شد؛ سابقه آن در فهرست ابطال‌شده قابل مشاهده است.');
 };
 const editSelected=()=>{
  const master=active==='customerLedger'?customerDetail:active==='branchLedger'?branchDetail:null;
  if(master){const mod=active==='customerLedger'?'customers':'branches';setDraft({...master});setModal(mod);return;}
  if(!selected){notify('ابتدا یک ردیف را انتخاب کنید.');return;}
  if(!SCHEMAS[active]){notify('ویرایش مستقیم این گزارش ممکن نیست؛ رکورد اصلی را از بخش مربوط باز کنید.');return;}
  setDraft({...selected});setModal(active);
 };
 const cashAction=kind=>{const first=data.cash.find(x=>x.currency==='AFN')||data.cash[0];setDraft({date:today(),kind,amount:'',currency:first?.currency||'AFN',cash:first?.name||'',party:'',partyType:'customer',description:''});setModal('cashAction');};
 const saveCashAction=()=>{
  const amount=n(draft.amount);if(amount<=0){notify('مبلغ باید بیشتر از صفر باشد.');return;}
  if(!draft.cash||!data.cash.some(x=>x.name===draft.cash&&x.currency===draft.currency)){notify('صندوقی را انتخاب کنید که با ارز عملیات مطابقت داشته باشد.');return;}
  if(draft.kind==='خرج'&&balanceFor(draft.currency,draft.cash)<amount){notify('مانده این صندوق برای پرداخت کافی نیست.');return;}
  const sign=draft.kind==='دخل'?1:-1;
  addTransaction({type:draft.kind,party:draft.party,partyType:draft.partyType||'customer',currency:draft.currency,amount:sign*amount,date:draft.date,cash:draft.cash,description:draft.description});
  setModal('');notify('عملیات صندوق در دفتر گردش محلی ثبت شد.');
 };
 const backup=()=>{const blob=new Blob([JSON.stringify({version:2,createdAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hisab-sarraf-lab-backup.json';a.click();URL.revokeObjectURL(a.href);notify('فایل پشتیبان آزمایشگاه آماده شد.');};
 const restore=()=>{try{const parsed=JSON.parse(restoreText);const restored=parsed.data||parsed;if(!restored||!Array.isArray(restored.customers)||!Array.isArray(restored.transactions))throw new Error();setData({...initial(),...restored});setModal('');setRestoreText('');notify('پشتیبان در همین مرورگر بازیابی شد.');}catch{notify('فایل پشتیبان معتبر نیست یا ساختار آن پشتیبانی نمی‌شود.');}};
 const printPage=()=>window.print();
 const reset=()=>{if(window.confirm('تمام داده‌های آزمایشی ذخیره‌شده در این مرورگر پاک و نمونه اولیه جایگزین شود؟')){setData(initial());setSelected(null);notify('داده‌های آزمایشی بازنشانی شد.');}};
 const balanceFor=(currency,cashName)=>{const opening=(data.cash.find(x=>x.currency===currency&&(!cashName||x.name===cashName))?.opening)||0;return opening+data.transactions.filter(t=>t.currency===currency&&(!cashName||t.cash===cashName)).reduce((s,t)=>s+n(t.amount),0);};
 const totalByCurrency=(currency)=>data.transactions.filter(t=>t.currency===currency).reduce((s,t)=>s+n(t.amount),0);
 const customerSummary=(customer)=>{
  const tx=data.transactions.filter(t=>t.partyType==='customer'&&t.party===customer.name);
  const currencies=[...new Set([customer.currency||'AFN',...tx.map(t=>t.currency)])];
  return currencies.map(currency=>{
   const opening=customer.currency===currency?n(customer.opening):0;
   const debit=Math.max(opening,0)+tx.filter(t=>t.currency===currency&&n(t.amount)<0).reduce((sum,t)=>sum+Math.abs(n(t.amount)),0);
   const credit=Math.max(-opening,0)+tx.filter(t=>t.currency===currency&&n(t.amount)>0).reduce((sum,t)=>sum+n(t.amount),0);
   const net=debit-credit;
   return {currency,debit,credit,net,status:net>0?'بدهکار':net<0?'بستانکار':'تسویه'};
  });
 };
 const customerListTotals=()=>{
  const totals={};
  data.customers.forEach(customer=>customerSummary(customer).forEach(x=>{
   totals[x.currency]??={debit:0,credit:0};totals[x.currency].debit+=x.debit;totals[x.currency].credit+=x.credit;
  }));
  return Object.entries(totals).map(([currency,x])=>({currency,...x}));
 };
 const customerDetailTotals=()=>{
  if(!customerDetail)return [];
  const tx=data.transactions.filter(t=>t.partyType==='customer'&&t.party===customerDetail.name);
  const totals={};
  if(customerDetail.opening){const c=customerDetail.currency||'AFN';totals[c]={debit:Math.max(n(customerDetail.opening),0),credit:Math.max(-n(customerDetail.opening),0)};}
  tx.forEach(t=>{const c=t.currency||'AFN';totals[c]??={debit:0,credit:0};if(n(t.amount)<0)totals[c].debit+=Math.abs(n(t.amount));else totals[c].credit+=n(t.amount);});
  return Object.entries(totals).map(([currency,x])=>({currency,...x,net:x.debit-x.credit}));
 };
 const branchSummary=(branch)=>{
  const tx=data.transactions.filter(t=>t.partyType==='branch'&&t.party===branch.name);
  const currencies=[...new Set([branch.currency||'AFN',...tx.map(t=>t.currency||'AFN')])];
  return currencies.map(currency=>{
   const opening=branch.currency===currency?n(branch.opening):0;
   const debit=Math.max(opening,0)+tx.filter(t=>(t.currency||'AFN')===currency&&n(t.amount)<0).reduce((s,t)=>s+Math.abs(n(t.amount)),0);
   const credit=Math.max(-opening,0)+tx.filter(t=>(t.currency||'AFN')===currency&&n(t.amount)>0).reduce((s,t)=>s+n(t.amount),0);
   return {currency,debit,credit,net:debit-credit};
  });
 };
 const branchListTotals=()=>{
  const totals={};data.branches.forEach(branch=>branchSummary(branch).forEach(x=>{totals[x.currency]??={debit:0,credit:0};totals[x.currency].debit+=x.debit;totals[x.currency].credit+=x.credit;}));
  return Object.entries(totals).map(([currency,x])=>({currency,...x,net:x.debit-x.credit}));
 };
 const branchDetailTotals=()=>branchDetail?branchSummary(branchDetail):[];
 const accountBookTotals=()=>{
  const allRows=active==='cash'?data.cash:active==='banks'?data.banks:(active==='journal'||active==='ledger')?data.journal:rows;
  const selectedRows=selected?[selected]:allRows;
  if(active==='customerLedger')return customerDetail?customerDetailTotals():customerListTotals().map(x=>({...x,net:x.debit-x.credit}));
  if(active==='branchLedger')return branchDetail?branchDetailTotals():branchListTotals();
  const totals={};
  if(active==='cash'){
   const accounts=selectedRows;
   accounts.forEach(account=>{
    const currency=account.currency||'AFN';totals[currency]??={debit:0,credit:0};
    const tx=data.transactions.filter(t=>t.cash===account.name&&t.currency===currency);
    totals[currency].debit+=Math.max(n(account.opening),0)+tx.filter(t=>n(t.amount)>0).reduce((s,t)=>s+n(t.amount),0);
    totals[currency].credit+=Math.max(-n(account.opening),0)+tx.filter(t=>n(t.amount)<0).reduce((s,t)=>s+Math.abs(n(t.amount)),0);
   });
  } else if(active==='banks'){
   for(const account of selectedRows){const currency=account.currency||'AFN';totals[currency]??={debit:0,credit:0};totals[currency].debit+=Math.max(n(account.opening),0);const related=data.journal.filter(j=>(j.debitAccount||'').includes(account.name)||(j.creditAccount||'').includes(account.name));totals[currency].debit+=related.filter(j=>(j.debitAccount||'').includes(account.name)).reduce((s,j)=>s+n(j.amount),0);totals[currency].credit+=related.filter(j=>(j.creditAccount||'').includes(account.name)).reduce((s,j)=>s+n(j.amount),0);}
  } else if(active==='journal'||active==='ledger'){
   selectedRows.filter(x=>x.status==='قطعی'||!x.status).forEach(row=>{const currency=row.currency||'AFN';totals[currency]??={debit:0,credit:0};totals[currency].debit+=n(row.amount);totals[currency].credit+=n(row.amount);});
  }
  return Object.entries(totals).map(([currency,x])=>({currency,...x,net:x.debit-x.credit}));
 };
 const showBookSummary=['customerLedger','branchLedger','cash','banks','journal','ledger'].includes(active);
 const columnsFor=(mod,arr)=>{
  if(mod==='customerLedger'&&!customerDetail)return [
   {key:'code',label:'کد مشتری'},{key:'name',label:'نام مشتری'},{key:'currency',label:'ارز اصلی'},
   {key:'balance',label:'وضعیت و مانده حساب',render:r=><div className="flex flex-wrap gap-1">{customerSummary(r).map(x=><span key={x.currency} className={'rounded px-2 py-1 text-[10px] font-bold '+(x.status==='بدهکار'?'bg-rose-100 text-rose-800':x.status==='بستانکار'?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-700')}>{fmt(Math.abs(x.net))} {x.currency} · {x.status}</span>)}</div>},
   {key:'phone',label:'شماره تماس'},{key:'status',label:'وضعیت مشتری'}
  ];
  if(mod==='customerLedger'&&customerDetail)return [
   {key:'date',label:'تاریخ'},{key:'type',label:'نوع عملیات'},{key:'description',label:'شرح'},
   {key:'debit',label:'بدهکار',render:r=>fmt(n(r.amount)<0?Math.abs(n(r.amount)):0)},
   {key:'credit',label:'بستانکار',render:r=>fmt(n(r.amount)>0?n(r.amount):0)},{key:'currency',label:'ارز'}
  ];
  if(mod==='branchLedger'&&!branchDetail)return [
   {key:'code',label:'کد نمایندگی'},{key:'name',label:'نام نمایندگی'},{key:'city',label:'موقعیت'},{key:'currency',label:'ارز اصلی'},
   {key:'opening',label:'مانده افتتاحیه',render:r=>fmt(r.opening)},{key:'status',label:'وضعیت'}
  ];
  if(mod==='branchLedger'&&branchDetail)return [
   {key:'date',label:'تاریخ'},{key:'type',label:'نوع عملیات'},{key:'description',label:'شرح'},
   {key:'debit',label:'بدهکار',render:r=>fmt(n(r.amount)<0?Math.abs(n(r.amount)):0)},
   {key:'credit',label:'بستانکار',render:r=>fmt(n(r.amount)>0?n(r.amount):0)},{key:'currency',label:'ارز'}
  ];
  const fields=SCHEMAS[mod]?.fields||[];
  if(mod==='cash')return [{key:'code',label:'کد صندوق'},{key:'name',label:'نام صندوق'},{key:'currency',label:'ارز'},{key:'opening',label:'مانده افتتاحیه',render:r=>fmt(r.opening)},{key:'balance',label:'موجودی فعلی',render:r=>fmt(balanceFor(r.currency,r.name))},{key:'status',label:'وضعیت'},{key:'description',label:'توضیحات'}];
  if(mod==='journal')return [{key:'date',label:'تاریخ'},{key:'number',label:'شماره سند'},{key:'description',label:'شرح'},{key:'debitAccount',label:'بدهکار'},{key:'creditAccount',label:'بستانکار'},{key:'currency',label:'ارز'},{key:'amount',label:'مبلغ',render:r=>fmt(r.amount)},{key:'status',label:'وضعیت'}];
  if(mod==='transactions'||active==='customerLedger'||active==='branchLedger'||active==='reports')return [{key:'date',label:'تاریخ'},{key:'type',label:'نوع عملیات'},{key:'party',label:'طرف حساب'},{key:'description',label:'شرح'},{key:'currency',label:'ارز'},{key:'amount',label:'مبلغ',render:r=>fmt(r.amount)},{key:'cash',label:'صندوق'}];
  return fields.map(([key,label])=>({key,label,render:r=>key==='amount'||key==='opening'||key==='rate'||key==='profit'?fmt(r[key]):undefined}));
 };
 const menuAction=(action)=>{
  setMenu('');
  if(SCHEMAS[action]){setActive(action);return;}
  if(action==='cashIn')return cashAction('دخل');
  if(action==='cashOut')return cashAction('خرج');
  if(action==='backup')return backup();
  if(action==='restore')return setModal('restore');
  if(action==='print')return printPage();
  if(action==='reset')return reset();
  if(action==='settings'||action==='help'||action==='support')return setModal(action);
  setActive(action);
 };
 const exportCsv=()=>{const cols=columnsFor(active);const csv=[cols.map(c=>c.label).join(','),...rows.map(r=>cols.map(c=>'"'+String(r[c.key]??'').replaceAll('"','""')+'"').join(','))].join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=active+'-report.csv';a.click();URL.revokeObjectURL(a.href);};
 const dailyTransactions=data.transactions.filter(t=>t.date===today());
 const profit=data.exchange.reduce((s,x)=>s+n(x.profit),0);
 const currencies=[...new Set([...data.cash.map(x=>x.currency),...data.transactions.map(x=>x.currency),'AFN'])];
 const mainTitle=mobileMode?'چیدمان موبایل حساب صراف — پیش‌نمایش آزمایشگاهی':'چیدمان لپ‌تاپ حساب صراف — پیش‌نمایش آزمایشگاهی'; return <div dir="rtl" className={(mobileMode?'creator-mobile-lab '+(active==='home'?'creator-mobile-home ':''):'')+'space-y-2 text-[#253746]'}>
  <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-400 bg-[#eaf0f5] px-3 py-2"><b className="flex items-center gap-2 text-xs text-[#24496d]"><Calculator className="h-4 w-4"/> {mobileMode?'چیدمان موبایل':'چیدمان لپ‌تاپ'} حساب صراف — نسخه مرورگری</b><span className="text-[10px] font-bold text-emerald-800">محلی و مستقل · بدون اتصال به سرور یا دیتابیس</span></div>
  <section className={'creator-preview-device flex flex-col overflow-hidden border border-[#65798b] bg-[#eef1f4] shadow-md '+(mobileMode?'mx-auto min-h-[680px] max-h-[82vh] w-full max-w-[430px] rounded-[28px] border-[7px] border-slate-800':'max-h-[78vh] min-h-[640px]')}>
   <header className="flex min-h-9 items-center justify-between bg-gradient-to-b from-[#315f80] to-[#173f5d] px-3 py-1.5 text-white"><div className="flex items-center gap-2"><Calculator className="h-4 w-4"/><b className="text-xs">{mainTitle}</b><span className="hidden text-[10px] text-blue-100 sm:inline">— محیط آزمایشی مستقل</span></div><div className="flex gap-1"><button onClick={()=>setModal('settings')} className="border border-white/30 px-2 text-xs">⚙</button><button onClick={()=>setActive('home')} className="border border-white/30 px-2 text-xs">⌂</button></div></header>
   {!mobileMode&&<nav className="creator-preview-menus flex flex-wrap items-center border-b border-slate-400 bg-gradient-to-b from-[#fdfefe] to-[#dce4ea]">{NAV_MENUS.map(m=><div key={m.label} className="relative"><button type="button" onClick={()=>setMenu(menu===m.label?'':m.label)} className={'min-h-11 px-3 py-2 text-[11px] hover:bg-white '+(menu===m.label?'bg-white font-bold text-blue-800':'')}>{m.label}<ChevronDown className="mr-1 inline h-3 w-3"/></button>{menu===m.label&&<div className="absolute right-0 top-full z-40 min-w-48 border border-slate-400 bg-white py-1 shadow-xl">{m.items.map(([label,act])=><button key={act} onClick={()=>menuAction(act)} className="block w-full px-3 py-2 text-right text-[11px] hover:bg-blue-50">{label}</button>)}</div>}</div>)}</nav>}
   {/* ردیف اول: عملیات روی رکورد انتخاب‌شده */}
   <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <aside className={'creator-mobile-module-dock shrink-0 grid w-full grid-cols-3 gap-1 border-b border-slate-400 bg-[#e1e8ed] p-2 '+(mobileMode?'':'md:grid-cols-12')}>
      {(mobileMode?MODULES.filter(m=>m.id!=='home').map(m=>m.id):['customerLedger','customers','branches','branchLedger','banks','remittance','cash','exchange','expenses','journal','ledger','sarraafGroups','assistant','products','language']).map(id=>{const m=MODULES.find(x=>x.id===id);if(!m)return null;const I=m.icon;return <button key={m.id} title={m.label} onClick={()=>{setActive(m.id);setSelected(null);setCustomerDetail(null);setBranchDetail(null);setQuery('');}} className={'flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center '+(active===m.id?'border-blue-300 bg-[#d2e3f1] font-bold text-blue-900':'border-transparent text-[#29465e] hover:border-slate-300 hover:bg-white')}><I className="h-5 w-5"/><span className="w-full whitespace-normal text-[10px] leading-tight">{m.label}</span></button>})}
      {!mobileMode&&<button onClick={()=>setShowWorkspace(true)} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-sm border border-[#9aabb9] bg-white px-1 py-1.5 text-center text-[#24496d] hover:bg-blue-50"><Home className="h-4 w-4"/><span className="w-full truncate text-[9px] font-bold">میزکار</span></button>}
     </aside>
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f9fafb] p-3">
     {active==='home'?<>
      <div className="mb-3 flex flex-wrap items-center justify-between border-b-2 border-[#315e80] pb-2">
       <div><div className="text-[9px] text-slate-500">سیستم حسابداری صراف / میز کار</div><h2 className="text-sm font-bold text-[#24496d]">مرکز عملیات صرافی</h2><p className="mt-1 text-[10px] text-slate-500">دسترسی مستقیم به دفاتر، صندوق‌ها، حواله‌ها و معاملات</p></div>
       <div className="text-left text-[10px]"><b className="block text-[#24496d]">\${today()}</b><span className="text-emerald-700">حالت آزمایشی محلی</span></div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
       <div className="border border-[#b6c4cf] bg-white px-3 py-2 shadow-sm"><span className="text-[10px] text-slate-500">تعداد مشتریان</span><b className="mt-1 block text-lg text-[#24496d]">\${fmt(data.customers.length)}</b></div>
       <div className="border border-[#b6c4cf] bg-white px-3 py-2 shadow-sm"><span className="text-[10px] text-slate-500">صندوق‌های تعریف‌شده</span><b className="mt-1 block text-lg text-[#24496d]">\${fmt(data.cash.length)}</b></div>
       <div className="border border-[#b6c4cf] bg-white px-3 py-2 shadow-sm"><span className="text-[10px] text-slate-500">عملیات امروز</span><b className="mt-1 block text-lg text-[#24496d]">\${fmt(dailyTransactions.length)}</b></div>
       <div className="border border-[#b6c4cf] bg-white px-3 py-2 shadow-sm"><span className="text-[10px] text-slate-500">مفاد معاملات آزمایشی</span><b className="mt-1 block text-lg text-[#24496d]">\${fmt(profit)}</b></div>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
       {[
        {title:'تعاریف و دفاتر',ids:['customers','customerLedger','branches','branchLedger']},
        {title:'صندوق و بانک',ids:['cash','banks']},
        {title:'عملیات صرافی',ids:['exchange','remittance','expenses']},
        {title:'حسابداری و گزارشات',ids:['journal','ledger','accounts','currencies','reports','profit','balance']},
         {title:'امکانات تکمیلی · اسکلت اولیه',ids:['sarraafGroups','assistant','products']},
        {title:'تنظیمات',ids:['language']}
       ].map(group=><section key={group.title} className="border border-[#9aabb9] bg-[#e8eef3] p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between border-b border-[#b7c5d0] pb-1"><b className="text-[11px] text-[#294d69]">\${group.title}</b><span className="text-[9px] text-slate-500">فهرست امکانات</span></div>
        <div className="flex flex-wrap items-stretch gap-2">{group.ids.map(id=>{const m=MODULES.find(x=>x.id===id);return m?<div key={m.id} className="min-w-[112px] flex-1 basis-[112px]"><Tile icon={m.icon} label={m.label} moduleId={m.id} onClick={()=>{setActive(m.id);setSelected(null);setCustomerDetail(null);setBranchDetail(null);setQuery('');}}/></div>:null;})}</div>
       </section>)}
      </div>
      <div className="mt-3 border border-[#9aabb9] bg-white p-2">
       <div className="mb-2 border-b border-slate-200 pb-1 text-[11px] font-bold text-[#294d69]">عملیات سریع</div>
       <div className="flex flex-wrap gap-2">
        <button onClick={()=>cashAction('دخل')} className="border border-[#a8b7c3] bg-[#edf3f7] px-3 py-2 text-[10px] hover:bg-blue-50"><ArrowDownCircle className="ml-1 inline h-4 w-4"/>ثبت دخل صندوق</button>
        <button onClick={()=>cashAction('خرج')} className="border border-[#a8b7c3] bg-[#edf3f7] px-3 py-2 text-[10px] hover:bg-blue-50"><ArrowUpCircle className="ml-1 inline h-4 w-4"/>ثبت خرج صندوق</button>
        <button onClick={()=>openNew('remittance',{direction:'ارسالی'})} className="border border-[#a8b7c3] bg-[#edf3f7] px-3 py-2 text-[10px] hover:bg-blue-50"><Send className="ml-1 inline h-4 w-4"/>حواله ارسالی</button>
        <button onClick={()=>openNew('remittance',{direction:'دریافتی'})} className="border border-[#a8b7c3] bg-[#edf3f7] px-3 py-2 text-[10px] hover:bg-blue-50"><Send className="ml-1 inline h-4 w-4"/>حواله دریافتی</button>
        <button onClick={()=>openNew('exchange')} className="border border-[#a8b7c3] bg-[#edf3f7] px-3 py-2 text-[10px] hover:bg-blue-50"><ArrowLeftRight className="ml-1 inline h-4 w-4"/>معامله اسعار</button>
       </div>
      </div>
     </>:page.skeleton?<section className="min-h-[360px] border-2 border-dashed border-[#9aabb9] bg-white p-6 text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl border border-[#b6c4cf] bg-[#edf3f7]"><page.icon className="h-7 w-7 text-[#315e80]"/></div><h2 className="text-base font-bold text-[#24496d]">{page.label}</h2><p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-600">اسکلت اولیه این بخش اضافه شده است. فعلاً فقط جایگاه آیکون و عنوان آن مشخص است؛ هیچ عملیات، ثبت، ویرایش، حذف یا اتصال داده‌ای برای این بخش فعال نیست.</p><div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">{(page.children||[]).map(child=><span key={child} className="rounded border border-[#b6c4cf] bg-[#f2f6f9] px-3 py-2 text-[11px] font-semibold text-[#294d69]">{child}</span>)}</div><span className="mt-4 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">در مرحله طراحی ساختار · بدون عملیات و اتصال</span></section>:<>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315e80] pb-2"><div className="flex items-center gap-2"><page.icon className="h-5 w-5 text-[#315e80]"/><div><div className="text-[9px] text-slate-500">سیستم حسابداری / {page.label}</div><h2 className="text-sm font-bold text-[#24496d]">{page.label}</h2></div>{active==='customerLedger'&&customerDetail&&<button onClick={()=>{setCustomerDetail(null);setSelected(null);}} className="mr-2 border bg-white px-2 py-1 text-[10px]">بازگشت به فهرست مشتریان</button>}{active==='branchLedger'&&branchDetail&&<button onClick={()=>{setBranchDetail(null);setSelected(null);}} className="mr-2 border bg-white px-2 py-1 text-[10px]">بازگشت به فهرست نمایندگی‌ها</button>}</div><div className="flex flex-wrap gap-1 text-[10px]"><label>از <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border bg-white px-1 py-1"/></label><label>تا <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border bg-white px-1 py-1"/></label><button onClick={()=>{setDateFrom('');setDateTo('');}} className="border bg-white px-2">پاک‌سازی تاریخ</button></div></div>
      {active==='cash'&&<div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2"><div><b className="text-[11px] text-[#24496d]">فهرست صندوق‌ها</b><div className="mt-1 text-[10px] text-slate-600">هر صندوق در یک ردیف؛ برای دیدن جزئیات، ردیف را انتخاب کنید.</div></div><div className="flex items-center gap-3 text-[10px]"><span>تعداد صندوق‌ها: <b>{fmt(data.cash.length)}</b></span><button onClick={()=>openNew('cash')} className="border border-blue-300 bg-white px-3 py-2 font-bold text-blue-900"><Plus className="ml-1 inline h-3 w-3"/>صندوق جدید</button></div></div>}
      {active==='profit'&&<div className="mb-3 grid gap-2 sm:grid-cols-3">{CURRENCIES.slice(0,4).map(c=><div key={c} className="border bg-emerald-50 p-3"><span className="text-[10px]">گردش خالص {c}</span><b className="block text-lg">{fmt(totalByCurrency(c))}</b></div>)}</div>}
      {active==='balance'&&<div className="mb-3 overflow-auto border bg-white"><table className="w-full text-xs"><thead className="bg-slate-200"><tr><th className="p-2 text-right">ارز</th><th>مانده صندوق</th><th>گردش خالص</th></tr></thead><tbody>{currencies.map(c=><tr key={c} className="border-t"><td className="p-2">{c}</td><td className="text-center">{fmt(data.cash.filter(x=>x.currency===c).reduce((s,x)=>s+balanceFor(c,x.name),0))}</td><td className="text-center">{fmt(totalByCurrency(c))}</td></tr>)}</tbody></table></div>}
      {active==='exchange'&&<div className="mb-2 flex gap-2"><button onClick={()=>openNew('exchange',{kind:'خرید'})} className="border bg-white px-3 py-2 text-[10px]">خرید اسعار</button><button onClick={()=>openNew('exchange',{kind:'فروش'})} className="border bg-white px-3 py-2 text-[10px]">فروش اسعار</button><button onClick={()=>openNew('exchange',{kind:'تبدیل'})} className="border bg-white px-3 py-2 text-[10px]">تبدیل ارز</button></div>}
      {active==='remittance'&&<div className="mb-2 flex gap-2"><button onClick={()=>openNew('remittance',{direction:'ارسالی'})} className="border bg-white px-3 py-2 text-[10px]">حواله ارسالی</button><button onClick={()=>openNew('remittance',{direction:'دریافتی'})} className="border bg-white px-3 py-2 text-[10px]">حواله دریافتی</button><button onClick={()=>openNew('remittance',{direction:'نامعلوم'})} className="border bg-white px-3 py-2 text-[10px]">حواله نامعلوم</button></div>}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-[10px]"><b>فهرست {page.label}</b><span className="text-slate-500">تعداد: {fmt(rows.length)}</span></div><div className="flex flex-wrap gap-1"><input id="lab-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-8 w-36 border bg-white px-2 text-[10px]"/><select value={filterCurrency} onChange={e=>setFilterCurrency(e.target.value)} className="h-8 border bg-white px-2 text-[10px]"><option>همه</option>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select><button onClick={()=>{setQuery('');setFilterCurrency('همه');}} className="border bg-white px-2 text-[10px]"><Filter className="inline h-3 w-3"/> پاک</button></div></div>
      <div className="mb-2 flex flex-wrap gap-1 border border-slate-300 bg-white p-1.5 text-[10px]">
       {[[RefreshCw,'تازه‌سازی',()=>{setQuery('');setFilterCurrency('همه');setDateFrom('');setDateTo('');setSelected(null);setShowVoided(false);notify('فهرست محلی تازه شد.')}],[Search,'تمرکز جستجو',()=>document.getElementById('lab-search')?.focus()],[Download,'خروجی CSV',exportCsv],[Archive,'پشتیبان',backup]].map(([I,label,fn])=><button key={label} onClick={fn} className="flex items-center gap-1 border border-slate-200 bg-[#f8fafc] px-2 py-1.5 hover:bg-blue-50"><I className="h-3.5 w-3.5"/>{label}</button>)}
       <button onClick={editSelected} disabled={!selected&&!customerDetail&&!branchDetail} className="flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-900 disabled:opacity-40"><Pencil className="h-3.5 w-3.5"/>ویرایش انتخاب‌شده</button>
       <button onClick={removeSelected} disabled={!selected} className="flex items-center gap-1 border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-800 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5"/>{['customers','branches','cash','banks','currencies','accounts'].includes(active)?'غیرفعال‌سازی انتخاب‌شده':'ابطال سند انتخاب‌شده'}</button>
       <button onClick={()=>setShowVoided(v=>!v)} className="flex items-center gap-1 border border-slate-200 bg-white px-2 py-1.5"><Eye className="h-3.5 w-3.5"/>{showVoided?'پنهان‌کردن ابطال‌شده‌ها':'نمایش ابطال‌شده‌ها'}</button>
      </div>
      <DataTable mobile={mobileMode} columns={active==='reports'?columnsFor('transactions'):active==='ledger'?columnsFor('journal'):columnsFor(active)} rows={rows} selected={selected} onSelect={r=>{if(active==='customerLedger'&&!customerDetail){setCustomerDetail(r);setSelected(null);}else if(active==='branchLedger'&&!branchDetail){setBranchDetail(r);setSelected(null);}else setSelected(r);}}/>
      {SCHEMAS[active]&&<button onClick={()=>openNew()} className="mt-2 border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4"/>ثبت {SCHEMAS[active].title} جدید</button>}
     </>}
    </main>
   </div>
   {showBookSummary&&<div className="shrink-0 border-t border-slate-400 bg-[#e9edf1] p-2">
    <div className="flex gap-2 overflow-x-auto pb-1">{accountBookTotals().map(x=><div key={x.currency} className="min-w-[250px] flex-1 border border-slate-300 bg-white p-2 text-right"><b className="mb-1 block text-[10px] text-[#294d69]" dir="ltr">{x.currency}</b><div className="grid grid-cols-3 gap-2"><div><span className="block text-[9px] text-slate-500">جمع کل بدهکار</span><b className="text-[11px]">{fmt(x.debit)}</b></div><div><span className="block text-[9px] text-slate-500">جمع کل بستانکار</span><b className="text-[11px]">{fmt(x.credit)}</b></div><div><span className="block text-[9px] text-slate-500">{x.net>0?'مانده بدهکار':x.net<0?'مانده بستانکار':'اختلاف مانده'}</span><b className="text-[11px]">{fmt(Math.abs(x.net))}</b></div></div></div>)}</div>
   </div>}
   <div className="shrink-0 flex items-center justify-between gap-2 border-t border-slate-400 bg-[#dfe5ea] px-3 py-2" aria-label="چهار عملیات ثابت دفتر"><div className="flex gap-2">{[[Plus,'ثبت',()=>{const mod=active==='customerLedger'?'customers':active==='branchLedger'?'branches':active==='ledger'?'journal':active;if(SCHEMAS[mod])openNew(mod);else notify('ثبت جدید برای این بخش در دسترس نیست.');}],[Pencil,'ویرایش',editSelected],[Trash2,'حذف',removeSelected],[Printer,'چاپ',printPage]].map(([I,label,fn])=><button key={label} onClick={fn} title={label} aria-label={label} className="flex min-w-[42px] items-center justify-center gap-1 border border-slate-400 bg-white px-2 py-2 text-[10px] hover:bg-blue-50"><I className="h-4 w-4 text-[#315d7d]"/><span>{label}</span></button>)}</div><span className="text-[9px] text-slate-500">عملیات آزمایشی محلی</span></div>
   <footer className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-400 bg-[#dfe5ea] px-3 py-2 text-[9px] text-slate-600"><span>وضعیت: آماده</span><span>محیط: آزمایشگاه محلی مرورگر</span><span>دیتابیس: قطع</span><span>داده‌های نمونه و آزمایشی</span></footer>
  </section>
  {showWorkspace&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3"><div className="max-h-[85vh] w-full max-w-4xl overflow-auto border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl"><div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white"><b className="text-xs">میزکار · سایر امکانات برنامه</b><button onClick={()=>setShowWorkspace(false)}><X className="h-4 w-4"/></button></div><div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-4">{MODULES.filter(m=>m.id!=='home'&&!['customerLedger','customers','branches','branchLedger','banks','remittance','cash','exchange','expenses','journal','ledger'].includes(m.id)).map(m=><Tile key={m.id} icon={m.icon} label={m.label} moduleId={m.id} onClick={()=>{setActive(m.id);setSelected(null);setCustomerDetail(null);setQuery('');setShowWorkspace(false);}}/>)}</div></div></div>}
   {notice&&<div className="flex items-center gap-2 border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900"><Check className="h-4 w-4"/>{notice}<button onClick={()=>setNotice('')} className="mr-auto"><X className="h-4 w-4"/></button></div>}
  <p className="text-[10px] leading-5 text-slate-500">تمام اطلاعات این آزمایشگاه فقط در حافظه محلی مرورگر ذخیره می‌شود. پاک‌کردن داده‌های سایت یا استفاده از مرورگر/دستگاه دیگر ممکن است اطلاعات را از بین ببرد؛ برای نگهداری، از پشتیبان JSON استفاده کنید. هیچ اتصال یا تغییری در دیتابیس و اطلاعات اصلی A1 انجام نمی‌شود.</p>
  {modal&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl"><div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white"><b className="text-xs">{SCHEMAS[modal]?((draft.id?'ویرایش ':'ثبت ')+SCHEMAS[modal].title):modal==='cashAction'?'ثبت گردش صندوق':modal==='restore'?'بازیابی پشتیبان':modal==='settings'?'تنظیمات آزمایشگاه':'راهنمای آزمایشگاه'}</b><button onClick={()=>setModal('')}><X className="h-4 w-4"/></button></div>
   {SCHEMAS[modal]&&<><div className="grid gap-3 p-4 sm:grid-cols-2">{SCHEMAS[modal].fields.map(f=><Field key={f[0]} field={f} value={fieldValue(draft,f[0])} onChange={setField} choices={{
    ...(modal==='journal'?{debitAccount:[{value:'',label:'انتخاب حساب بدهکار'},...data.accounts.map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name})),...data.cash.map(x=>({value:'صندوق: '+x.name,label:'صندوق: '+x.name+' ('+x.currency+')'}))],creditAccount:[{value:'',label:'انتخاب حساب بستانکار'},...data.accounts.map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name})),...data.cash.map(x=>({value:'صندوق: '+x.name,label:'صندوق: '+x.name+' ('+x.currency+')'}))]}:{}) 
    ,...(modal==='expenses'?{cash:[{value:'',label:'انتخاب صندوق پرداخت'},...data.cash.filter(x=>x.currency===draft.currency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))],expenseAccount:[{value:'',label:'انتخاب حساب مصرف'},...data.accounts.filter(a=>a.accountType==='expense'||a.nature==='بدهکار').map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name}))]}:{})
    ,...(modal==='remittance'?{cash:[{value:'',label:'انتخاب صندوق مرتبط'},...data.cash.filter(x=>x.currency===draft.currency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))],branch:[{value:'',label:'انتخاب نمایندگی'},...data.branches.map(x=>({value:x.name,label:x.name}))]}:{})
    ,...(modal==='exchange'?{cashFrom:[{value:'',label:'انتخاب صندوق پرداخت'},...data.cash.filter(x=>x.currency===draft.fromCurrency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))],cashTo:[{value:'',label:'انتخاب صندوق دریافت'},...data.cash.filter(x=>x.currency===draft.toCurrency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))]}:{})
    ,...(modal==='accounts'?{parentId:[{value:'',label:'بدون حساب مادر'},...data.accounts.map(a=>({value:a.id,label:a.code+' — '+a.name}))]}:{})
   }}/>)}</div><div className="flex justify-end gap-2 border-t bg-slate-100 p-3"><button onClick={saveRecord} className="flex items-center gap-1 border bg-white px-4 py-2 text-xs"><Save className="h-4 w-4"/>ثبت</button><button onClick={()=>setModal('')} className="border bg-white px-4 py-2 text-xs">انصراف</button></div></>}
   {modal==='cashAction'&&<><div className="grid gap-3 p-4 sm:grid-cols-2">{[['تاریخ','date'],['نوع عملیات','kind'],['نوع طرف حساب','partyType'],['طرف حساب','party'],['ارز','currency'],['مبلغ','amount'],['صندوق','cash'],['شرح','description']].map(([label,key])=><label key={key} className="space-y-1 text-[11px]"><span>{label}</span>{key==='kind'?<select value={draft.kind} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option>دخل</option><option>خرج</option></select>:key==='partyType'?<select value={draft.partyType||'customer'} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option value="customer">مشتری</option><option value="branch">نمایندگی</option><option value="other">سایر</option></select>:key==='currency'?<select value={draft.currency} onChange={e=>{const currency=e.target.value;const first=data.cash.find(x=>x.currency===currency);setDraft(d=>({...d,currency,cash:first?.name||''}));}} className="h-9 w-full border bg-white px-2">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>:key==='cash'?<select value={draft.cash||''} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option value="">انتخاب صندوق</option>{data.cash.filter(c=>c.currency===draft.currency).map(c=><option key={c.id} value={c.name}>{c.name} · {c.currency}</option>)}</select>:<input type={key==='amount'?'number':key==='date'?'date':'text'} value={draft[key]||''} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"/>}</label>)}</div><div className="flex justify-end border-t bg-slate-100 p-3"><button onClick={saveCashAction} className="border bg-white px-4 py-2 text-xs">ثبت گردش صندوق</button></div></>}
   {modal==='restore'&&<div className="space-y-3 p-4"><p className="text-xs">محتوای فایل پشتیبان JSON آزمایشگاه را اینجا وارد کنید. اطلاعات فعلی جایگزین می‌شود.</p><textarea value={restoreText} onChange={e=>setRestoreText(e.target.value)} rows={9} className="w-full border bg-white p-2 text-xs" placeholder="محتوای JSON..."/><button onClick={restore} className="border bg-white px-4 py-2 text-xs">بازیابی در مرورگر</button></div>}
   {modal==='settings'&&<div className="space-y-2 p-4 text-xs"><p>ذخیره‌سازی: localStorage همین مرورگر</p><p>اتصال شبکه و دیتابیس: غیرفعال</p><p>برای انتقال داده‌ها بین دستگاه‌ها از پشتیبان JSON استفاده کنید.</p><button onClick={backup} className="border bg-white px-3 py-2">گرفتن پشتیبان</button><button onClick={reset} className="mr-2 border bg-white px-3 py-2">بازنشانی داده‌های آزمایشی</button></div>}
   {modal==='support'&&<div className="space-y-2 p-4 text-xs leading-6"><b>پشتیبانی حساب صراف</b><p>جایگاه پشتیبانی در تنظیمات مشخص شده است؛ روش‌های تماس و ارسال درخواست بعداً طراحی می‌شوند.</p><span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">اسکلت اولیه · غیرفعال</span></div>}
   {modal==='help'&&<div className="space-y-2 p-4 text-xs leading-6"><p>۱. از فهرست سمت راست بخش مورد نظر را باز کنید.</p><p>۲. با دکمه ثبت جدید رکورد آزمایشی اضافه کنید؛ ردیف را انتخاب و ویرایش یا حذف کنید.</p><p>۳. عملیات دخل و خرج در گردش صندوق ثبت و مانده‌ها محاسبه می‌شوند.</p><p>۴. پشتیبان JSON برای نگهداری و بازیابی اطلاعات محلی استفاده می‌شود.</p><p>این محیط به دیتابیس اصلی متصل نیست.</p></div>}
  </div></div>}
  <style>{'@media print{body *{visibility:hidden!important} .print-area,.print-area *{visibility:visible!important}}'}</style>
 </div>;
}