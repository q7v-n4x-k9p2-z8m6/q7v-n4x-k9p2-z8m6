import React, { useEffect, useMemo, useState } from 'react';
import {
  Home, Users, Wallet, BookOpen, BookText, Search, Printer, Plus, Pencil, Trash2,
  RefreshCw, Receipt, Landmark, Building2, Send, BarChart3, X, Check, ArrowLeftRight,
  ScrollText, Lock, MoreHorizontal, ChevronDown, Save, ClipboardList, FileSpreadsheet,
  Calculator, Download, Upload, Filter, Coins, Banknote, FileText, CalendarDays,
  CircleDollarSign, Eye, FilePlus2, ArrowDownCircle, ArrowUpCircle, Scale, Settings2,
  Archive, RotateCcw, ListChecks, CreditCard, CircleHelp, PrinterCheck
} from 'lucide-react';

const STORE_KEY = 'hisab-sarraf-lab-v2';
const CURRENCIES = ['AFN','USD','EUR','IRR','TRY','PKR','AED','SAR','GBP','CNY'];
const MODULES = [
  {id:'home',label:'میز کار',icon:Home,group:'عمومی'},
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
  {id:'balance',label:'بیلانس عمومی',icon:Scale,group:'گزارشات'}
];
const SCHEMAS = {
 customers:{title:'مشتری',fields:[['code','کد مشتری','text'],['name','نام مشتری','text'],['kind','نوع حساب','select',['دائمی','موقتی']],['phone','شماره تماس','text'],['address','آدرس','text'],['currency','ارز اصلی','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال','قفل']]]},
 branches:{title:'نمایندگی',fields:[['code','کد نمایندگی','text'],['name','نام نمایندگی','text'],['city','موقعیت','text'],['phone','شماره تماس','text'],['currency','ارز اصلی','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال']]]},
 cash:{title:'صندوق',fields:[['name','نام صندوق','text'],['currency','ارز','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['description','توضیحات','text']]},
 banks:{title:'حساب بانکی / چک',fields:[['name','نام بانک یا حساب','text'],['account','شماره حساب','text'],['currency','ارز','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['description','توضیحات','text']]},
 currencies:{title:'ارز',fields:[['code','کد ارز','text'],['name','نام ارز','text'],['symbol','نماد','text'],['rate','نرخ مقابل ارز پایه','number'],['active','وضعیت','select',['فعال','غیرفعال']]]},
 accounts:{title:'حساب کل',fields:[['code','کد حساب','text'],['name','نام حساب','text'],['level','سطح','select',['کل','معین','تفصیلی']],['nature','ماهیت','select',['بدهکار','بستانکار']],['description','شرح','text']]},
 expenses:{title:'مصرف',fields:[['date','تاریخ','date'],['title','شرح مصرف','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['cash','پرداخت از صندوق','text'],['note','یادداشت','text']]},
 remittance:{title:'حواله',fields:[['date','تاریخ','date'],['number','شماره حواله','text'],['direction','نوع حواله','select',['ارسالی','دریافتی','متفرقه','نامعلوم']],['sender','فرستنده','text'],['receiver','گیرنده','text'],['branch','نمایندگی','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['fee','کمیشن','number'],['cash','صندوق مرتبط','text'],['status','وضعیت','select',['در انتظار','اجرا شده','لغو شده']],['note','یادداشت','text']]},
 exchange:{title:'معامله اسعار',fields:[['date','تاریخ','date'],['kind','نوع معامله','select',['خرید','فروش','تبدیل']],['fromCurrency','ارز مبدا','select',CURRENCIES],['fromAmount','مبلغ مبدا','number'],['toCurrency','ارز مقصد','select',CURRENCIES],['toAmount','مبلغ مقصد','number'],['rate','نرخ معامله','number'],['profit','مفاد معامله','number'],['party','طرف حساب','text'],['note','یادداشت','text']]},
 journal:{title:'سند روزنامچه',fields:[['date','تاریخ','date'],['number','شماره سند','text'],['description','شرح سند','text'],['debitAccount','حساب بدهکار','text'],['creditAccount','حساب بستانکار','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['status','وضعیت','select',['پیش‌نویس','قطعی']]]}
};
const initial = () => ({
 customers:[
  {id:'c1',code:'1001',name:'مشتری نمونه اول',kind:'دائمی',phone:'0700000001',currency:'AFN',opening:0,status:'فعال'},
  {id:'c2',code:'1002',name:'مشتری نمونه دوم',kind:'موقتی',phone:'0700000002',currency:'USD',opening:0,status:'فعال'}
 ],
 branches:[{id:'b1',code:'2001',name:'نمایندگی مرکزی',city:'کابل',currency:'AFN',opening:0,status:'فعال'}],
 cash:[{id:'k1',name:'صندوق مرکزی',currency:'AFN',opening:100000},{id:'k2',name:'صندوق دالر',currency:'USD',opening:5000}],
 banks:[], currencies:CURRENCIES.map((code,i)=>({id:'u'+i,code,name:code,symbol:code,rate:i===0?1:0,active:'فعال'})),
 accounts:[{id:'a1',code:'100',name:'صندوق',level:'کل',nature:'بدهکار'},{id:'a2',code:'200',name:'سرمایه',level:'کل',nature:'بستانکار'},{id:'a3',code:'300',name:'عواید',level:'کل',nature:'بستانکار'},{id:'a4',code:'400',name:'مصارف',level:'کل',nature:'بدهکار'}],
 expenses:[],remittance:[],exchange:[],journal:[],transactions:[]
});
const readStore = () => { try { const s=localStorage.getItem(STORE_KEY); return s?{...initial(),...JSON.parse(s)}:initial(); } catch { return initial(); } };
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
 {label:'تنظیمات',items:[['تنظیمات محلی','settings'],['راهنما','help']]}
];

function Field({field,value,onChange,choices}) {
 const [key,label,type,opts]=field;
 const options=choices?.[key]||opts||[];
 return <label className="block space-y-1 text-[11px]"><span className="font-semibold text-slate-700">{label}</span>
 {type==='select'||choices?.[key]?<select value={value??options[0]?.value??options[0]??''} onChange={e=>onChange(key,e.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs">{options.map(o=>{const v=typeof o==='object'?o.value:o;const t=typeof o==='object'?o.label:o;return <option key={v} value={v}>{t}</option>;})}</select>:
 <input type={type==='number'?'number':type==='date'?'date':'text'} value={value??''} onChange={e=>onChange(key,e.target.value)} className="h-9 w-full border border-slate-300 bg-white px-2 text-xs" />}</label>;
}
function DataTable({columns,rows,onSelect,selected}) {
 return <div className="overflow-auto border border-slate-300 bg-white"><table className="w-full min-w-[760px] border-collapse text-right text-[11px]"><thead className="sticky top-0 bg-[#dce5ed] text-[#203c54]"><tr>{columns.map(c=><th key={c.key} className="border border-slate-300 px-2 py-2">{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i} onClick={()=>onSelect(r)} className={'cursor-pointer '+(selected?.id===r.id?'bg-blue-100':i%2?'bg-slate-50':'bg-white')+' hover:bg-blue-50'}>{columns.map(c=><td key={c.key} className="whitespace-nowrap border border-slate-200 px-2 py-2">{c.render?c.render(r):String(r[c.key]??'—')}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="p-8 text-center text-xs text-slate-500">موردی برای نمایش وجود ندارد.</div>}</div>;
}
function Tile({icon:Icon,label,onClick}){return <button onClick={onClick} className="group flex min-h-[94px] flex-col items-center justify-center gap-2 border border-[#9aabb9] bg-gradient-to-b from-white to-[#edf2f6] px-2 py-3 text-center shadow-sm transition hover:border-[#47799d] hover:from-[#f7fbff] hover:to-[#dceaf4] active:translate-y-px"><span className="grid h-11 w-11 place-items-center rounded-sm border border-[#9eb2c2] bg-gradient-to-b from-[#f9fcff] to-[#d8e5ef] text-[#245777] shadow-sm group-hover:border-[#47799d]"><Icon className="h-6 w-6"/></span><b className="text-[11px] font-semibold text-[#29465e]">{label}</b></button>}

export default function CreatorPreviewLab(){
 const [data,setData]=useState(readStore);
 const [active,setActive]=useState('home');
 const [selected,setSelected]=useState(null);
 const [menu,setMenu]=useState('');
 const [modal,setModal]=useState('');
 const [draft,setDraft]=useState({});
 const [query,setQuery]=useState('');
 const [notice,setNotice]=useState('');
 const [filterCurrency,setFilterCurrency]=useState('همه');
 const [dateFrom,setDateFrom]=useState('');
 const [dateTo,setDateTo]=useState('');
 const [restoreText,setRestoreText]=useState('');
 const [showHelp,setShowHelp]=useState(false);
 useEffect(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(data));}catch{setNotice('فضای ذخیره‌سازی مرورگر در دسترس نیست؛ داده‌ها فقط تا زمان بازبودن صفحه باقی می‌مانند.');}},[data]);
 const notify=s=>{setNotice(s);setTimeout(()=>setNotice(''),4500);};
 const page=MODULES.find(x=>x.id===active)||MODULES[0];
 const schema=SCHEMAS[active];
 const rows=useMemo(()=>{
  let source=data[active]||[];
  if(active==='customerLedger') source=data.transactions.filter(x=>x.partyType==='customer');
  if(active==='branchLedger') source=data.transactions.filter(x=>x.partyType==='branch');
  if(active==='ledger') source=data.journal;
  if(active==='reports') source=data.transactions;
  const q=query.trim().toLowerCase();
  return source.filter(r=>(!q||Object.values(r).join(' ').toLowerCase().includes(q))&&(filterCurrency==='همه'||!r.currency||r.currency===filterCurrency)&&(!dateFrom||!r.date||r.date>=dateFrom)&&(!dateTo||!r.date||r.date<=dateTo));
 },[data,active,query,filterCurrency,dateFrom,dateTo]);
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
  if(active==='reports'){notify('گزارش فقط نمایشی است؛ رکورد را از بخش عملیات اصلی حذف کنید.');return;}
  if(!window.confirm('این ردیف فقط از اطلاعات آزمایشی همین مرورگر حذف شود؟'))return;
  const key=active==='customerLedger'||active==='branchLedger'?'transactions':active==='ledger'?'journal':active;
  setData(d=>({...d,[key]:(d[key]||[]).filter(x=>x.id!==selected.id)}));setSelected(null);notify('ردیف آزمایشی حذف شد.');
 };
 const editSelected=()=>{if(!selected){notify('ابتدا یک ردیف را انتخاب کنید.');return;}if(!SCHEMAS[active]){notify('ویرایش مستقیم این گزارش ممکن نیست؛ رکورد اصلی را از بخش مربوط باز کنید.');return;}setDraft({...selected});setModal(active);};
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
 const columnsFor=(mod,arr)=>{
  const fields=SCHEMAS[mod]?.fields||[];
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
  if(action==='settings'||action==='help')return setModal(action);
  setActive(action);
 };
 const exportCsv=()=>{const cols=columnsFor(active);const csv=[cols.map(c=>c.label).join(','),...rows.map(r=>cols.map(c=>'"'+String(r[c.key]??'').replaceAll('"','""')+'"').join(','))].join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=active+'-report.csv';a.click();URL.revokeObjectURL(a.href);};
 const dailyTransactions=data.transactions.filter(t=>t.date===today());
 const profit=data.exchange.reduce((s,x)=>s+n(x.profit),0);
 const currencies=[...new Set([...data.cash.map(x=>x.currency),...data.transactions.map(x=>x.currency),'AFN'])];
 const mainTitle='سیستم حسابداری صراف — الگوی آزمایشگاهی الهام‌گرفته از آریانا'; return <div dir="rtl" className="space-y-2 text-[#253746]">
  <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-400 bg-[#eaf0f5] px-3 py-2"><b className="flex items-center gap-2 text-xs text-[#24496d]"><Calculator className="h-4 w-4"/> آزمایشگاه حسابداری صراف — نسخه مرورگری</b><span className="text-[10px] font-bold text-emerald-800">محلی و مستقل · بدون اتصال به سرور یا دیتابیس</span></div>
  <section className="overflow-hidden border border-[#65798b] bg-[#eef1f4] shadow-md">
   <header className="flex min-h-9 items-center justify-between bg-gradient-to-b from-[#315f80] to-[#173f5d] px-3 py-1.5 text-white"><div className="flex items-center gap-2"><Calculator className="h-4 w-4"/><b className="text-xs">{mainTitle}</b><span className="hidden text-[10px] text-blue-100 sm:inline">— محیط آزمایشی مستقل</span></div><div className="flex gap-1"><button onClick={()=>setModal('settings')} className="border border-white/30 px-2 text-xs">⚙</button><button onClick={()=>setActive('home')} className="border border-white/30 px-2 text-xs">⌂</button></div></header>
   <nav className="flex flex-wrap items-center border-b border-slate-400 bg-gradient-to-b from-[#fdfefe] to-[#dce4ea]">{NAV_MENUS.map(m=><div key={m.label} className="relative"><button onClick={()=>setMenu(menu===m.label?'':m.label)} className={'px-3 py-2 text-[11px] hover:bg-white '+(menu===m.label?'bg-white font-bold text-blue-800':'')}>{m.label}<ChevronDown className="mr-1 inline h-3 w-3"/></button>{menu===m.label&&<div className="absolute right-0 top-full z-40 min-w-48 border border-slate-400 bg-white py-1 shadow-xl">{m.items.map(([label,act])=><button key={act} onClick={()=>menuAction(act)} className="block w-full px-3 py-2 text-right text-[11px] hover:bg-blue-50">{label}</button>)}</div>}</div>)}</nav>
   <div className="flex flex-wrap items-center border-b border-slate-400 bg-[#edf1f4]">{[[Plus,'جدید',()=>SCHEMAS[active]?openNew():notify('برای ثبت جدید، یکی از بخش‌های عملیاتی را انتخاب کنید.')],[Pencil,'ویرایش',editSelected],[Trash2,'حذف',removeSelected],[RefreshCw,'تازه‌سازی',()=>{setQuery('');setFilterCurrency('همه');setSelected(null);notify('فهرست تازه شد.')}],[Search,'جستجو',()=>document.getElementById('lab-search')?.focus()],[Printer,'چاپ',printPage],[Download,'خروجی CSV',exportCsv],[Archive,'پشتیبان',backup]].map(([I,l,fn])=><button key={l} onClick={fn} className="flex min-w-[68px] flex-col items-center gap-1 border-l border-slate-300 px-3 py-2 text-[10px] hover:bg-white"><I className="h-4 w-4 text-[#315d7d]"/>{l}</button>)}<span className="mr-auto flex items-center gap-1 px-3 text-[10px] text-slate-500"><Lock className="h-3 w-3"/> فقط مرورگر</span></div>
   <div className="grid min-h-[610px] grid-cols-1 lg:grid-cols-[205px_minmax(0,1fr)]">
    <aside className="border-b border-slate-400 bg-[#e1e8ed] p-2 lg:border-b-0 lg:border-l"><div className="mb-2 flex items-center justify-between border-b border-slate-300 px-2 pb-2"><b className="text-[11px]">فهرست برنامه</b><MoreHorizontal className="h-4 w-4"/></div>{['عمومی','تعاریف و دفاتر','صندوق و بانک','عملیات صرافی','حسابداری','تنظیمات','گزارشات'].map(g=><div key={g} className="mb-2"><div className="px-2 py-1 text-[9px] font-bold text-slate-500">{g}</div>{MODULES.filter(m=>m.group===g).map(m=>{const I=m.icon;return <button key={m.id} onClick={()=>{setActive(m.id);setSelected(null);setQuery('');}} className={'flex w-full items-center gap-2 border px-2 py-2 text-right text-[10px] '+(active===m.id?'border-blue-300 bg-[#d2e3f1] font-bold text-blue-900':'border-transparent hover:border-slate-300 hover:bg-white')}><I className="h-4 w-4"/>{m.label}</button>})}</div>)}</aside>
    <main className="min-w-0 bg-[#f9fafb] p-3">
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
        {title:'حسابداری و گزارشات',ids:['journal','ledger','accounts','currencies','reports','profit','balance']}
       ].map(group=><section key={group.title} className="border border-[#9aabb9] bg-[#e8eef3] p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between border-b border-[#b7c5d0] pb-1"><b className="text-[11px] text-[#294d69]">\${group.title}</b><span className="text-[9px] text-slate-500">فهرست امکانات</span></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{group.ids.map(id=>{const m=MODULES.find(x=>x.id===id);return m?<Tile key={m.id} icon={m.icon} label={m.label} onClick={()=>{setActive(m.id);setSelected(null);setQuery('');}}/>:null;})}</div>
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
     </><>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315e80] pb-2"><div className="flex items-center gap-2"><page.icon className="h-5 w-5 text-[#315e80]"/><div><div className="text-[9px] text-slate-500">سیستم حسابداری / {page.label}</div><h2 className="text-sm font-bold text-[#24496d]">{page.label}</h2></div></div><div className="flex flex-wrap gap-1 text-[10px]"><label>از <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border bg-white px-1 py-1"/></label><label>تا <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border bg-white px-1 py-1"/></label><button onClick={()=>{setDateFrom('');setDateTo('');}} className="border bg-white px-2">پاک‌سازی تاریخ</button></div></div>
      {active==='cash'&&<div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{data.cash.map(c=><div key={c.id} className="border bg-[#edf3f7] p-3"><div className="text-[10px]">{c.name} · {c.currency}</div><b className="text-lg text-blue-900">{fmt(balanceFor(c.currency,c.name))}</b><div className="mt-2 flex gap-1"><button onClick={()=>cashAction('دخل')} className="border bg-white px-2 py-1 text-[10px]">دخل</button><button onClick={()=>cashAction('خرج')} className="border bg-white px-2 py-1 text-[10px]">خرج</button></div></div>)}</div>}
      {active==='profit'&&<div className="mb-3 grid gap-2 sm:grid-cols-3">{CURRENCIES.slice(0,4).map(c=><div key={c} className="border bg-emerald-50 p-3"><span className="text-[10px]">گردش خالص {c}</span><b className="block text-lg">{fmt(totalByCurrency(c))}</b></div>)}</div>}
      {active==='balance'&&<div className="mb-3 overflow-auto border bg-white"><table className="w-full text-xs"><thead className="bg-slate-200"><tr><th className="p-2 text-right">ارز</th><th>مانده صندوق</th><th>گردش خالص</th></tr></thead><tbody>{currencies.map(c=><tr key={c} className="border-t"><td className="p-2">{c}</td><td className="text-center">{fmt(data.cash.filter(x=>x.currency===c).reduce((s,x)=>s+balanceFor(c,x.name),0))}</td><td className="text-center">{fmt(totalByCurrency(c))}</td></tr>)}</tbody></table></div>}
      {active==='exchange'&&<div className="mb-2 flex gap-2"><button onClick={()=>openNew('exchange',{kind:'خرید'})} className="border bg-white px-3 py-2 text-[10px]">خرید اسعار</button><button onClick={()=>openNew('exchange',{kind:'فروش'})} className="border bg-white px-3 py-2 text-[10px]">فروش اسعار</button><button onClick={()=>openNew('exchange',{kind:'تبدیل'})} className="border bg-white px-3 py-2 text-[10px]">تبدیل ارز</button></div>}
      {active==='remittance'&&<div className="mb-2 flex gap-2"><button onClick={()=>openNew('remittance',{direction:'ارسالی'})} className="border bg-white px-3 py-2 text-[10px]">حواله ارسالی</button><button onClick={()=>openNew('remittance',{direction:'دریافتی'})} className="border bg-white px-3 py-2 text-[10px]">حواله دریافتی</button><button onClick={()=>openNew('remittance',{direction:'نامعلوم'})} className="border bg-white px-3 py-2 text-[10px]">حواله نامعلوم</button></div>}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-[10px]"><b>فهرست {page.label}</b><span className="text-slate-500">تعداد: {fmt(rows.length)}</span></div><div className="flex flex-wrap gap-1"><input id="lab-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-8 w-36 border bg-white px-2 text-[10px]"/><select value={filterCurrency} onChange={e=>setFilterCurrency(e.target.value)} className="h-8 border bg-white px-2 text-[10px]"><option>همه</option>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select><button onClick={()=>{setQuery('');setFilterCurrency('همه');}} className="border bg-white px-2 text-[10px]"><Filter className="inline h-3 w-3"/> پاک</button></div></div>
      <DataTable columns={active==='reports'?columnsFor('transactions'):active==='ledger'?columnsFor('journal'):active==='customerLedger'||active==='branchLedger'?columnsFor('transactions'):columnsFor(active)} rows={rows} selected={selected} onSelect={setSelected}/>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border bg-[#e9edf1] px-3 py-2 text-[10px]"><span>ردیف انتخاب‌شده: {selected?.id||'هیچ‌کدام'} · ذخیره‌سازی: محلی</span><div className="flex gap-1"><button onClick={editSelected} className="border bg-white px-2 py-1">ویرایش</button><button onClick={removeSelected} className="border bg-white px-2 py-1">حذف</button><button onClick={exportCsv} className="border bg-white px-2 py-1">CSV</button><button onClick={printPage} className="border bg-white px-2 py-1">چاپ</button></div></div>
      {SCHEMAS[active]&&<button onClick={()=>openNew()} className="mt-2 border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4"/>ثبت {SCHEMAS[active].title} جدید</button>}
     </>}
    </main>
   </div>
   <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-400 bg-[#dfe5ea] px-3 py-2 text-[9px] text-slate-600"><span>وضعیت: آماده</span><span>محیط: آزمایشگاه محلی مرورگر</span><span>دیتابیس: قطع</span><span>داده‌های نمونه و آزمایشی</span></footer>
  </section>
  {notice&&<div className="flex items-center gap-2 border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900"><Check className="h-4 w-4"/>{notice}<button onClick={()=>setNotice('')} className="mr-auto"><X className="h-4 w-4"/></button></div>}
  <p className="text-[10px] leading-5 text-slate-500">تمام اطلاعات این آزمایشگاه فقط در حافظه محلی مرورگر ذخیره می‌شود. پاک‌کردن داده‌های سایت یا استفاده از مرورگر/دستگاه دیگر ممکن است اطلاعات را از بین ببرد؛ برای نگهداری، از پشتیبان JSON استفاده کنید. هیچ اتصال یا تغییری در دیتابیس و اطلاعات اصلی A1 انجام نمی‌شود.</p>
  {modal&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl"><div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white"><b className="text-xs">{SCHEMAS[modal]?((draft.id?'ویرایش ':'ثبت ')+SCHEMAS[modal].title):modal==='cashAction'?'ثبت گردش صندوق':modal==='restore'?'بازیابی پشتیبان':modal==='settings'?'تنظیمات آزمایشگاه':'راهنمای آزمایشگاه'}</b><button onClick={()=>setModal('')}><X className="h-4 w-4"/></button></div>
   {SCHEMAS[modal]&&<><div className="grid gap-3 p-4 sm:grid-cols-2">{SCHEMAS[modal].fields.map(f=><Field key={f[0]} field={f} value={fieldValue(draft,f[0])} onChange={setField} choices={{
    ...(modal==='journal'?{debitAccount:[{value:'',label:'انتخاب حساب بدهکار'},...data.accounts.map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name})),...data.cash.map(x=>({value:'صندوق: '+x.name,label:'صندوق: '+x.name+' ('+x.currency+')'}))],creditAccount:[{value:'',label:'انتخاب حساب بستانکار'},...data.accounts.map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name})),...data.cash.map(x=>({value:'صندوق: '+x.name,label:'صندوق: '+x.name+' ('+x.currency+')'}))]}:{})
    ,...(modal==='expenses'?{cash:[{value:'',label:'انتخاب صندوق پرداخت'},...data.cash.filter(x=>x.currency===draft.currency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))]}:{})
    ,...(modal==='remittance'?{cash:[{value:'',label:'انتخاب صندوق مرتبط'},...data.cash.filter(x=>x.currency===draft.currency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))],branch:[{value:'',label:'انتخاب نمایندگی'},...data.branches.map(x=>({value:x.name,label:x.name}))]}:{})
   }}/>)}</div><div className="flex justify-end gap-2 border-t bg-slate-100 p-3"><button onClick={saveRecord} className="flex items-center gap-1 border bg-white px-4 py-2 text-xs"><Save className="h-4 w-4"/>ثبت</button><button onClick={()=>setModal('')} className="border bg-white px-4 py-2 text-xs">انصراف</button></div></>}
   {modal==='cashAction'&&<><div className="grid gap-3 p-4 sm:grid-cols-2">{[['تاریخ','date'],['نوع عملیات','kind'],['نوع طرف حساب','partyType'],['طرف حساب','party'],['ارز','currency'],['مبلغ','amount'],['صندوق','cash'],['شرح','description']].map(([label,key])=><label key={key} className="space-y-1 text-[11px]"><span>{label}</span>{key==='kind'?<select value={draft.kind} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option>دخل</option><option>خرج</option></select>:key==='partyType'?<select value={draft.partyType||'customer'} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option value="customer">مشتری</option><option value="branch">نمایندگی</option><option value="other">سایر</option></select>:key==='currency'?<select value={draft.currency} onChange={e=>{const currency=e.target.value;const first=data.cash.find(x=>x.currency===currency);setDraft(d=>({...d,currency,cash:first?.name||''}));}} className="h-9 w-full border bg-white px-2">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>:key==='cash'?<select value={draft.cash||''} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option value="">انتخاب صندوق</option>{data.cash.filter(c=>c.currency===draft.currency).map(c=><option key={c.id} value={c.name}>{c.name} · {c.currency}</option>)}</select>:<input type={key==='amount'?'number':key==='date'?'date':'text'} value={draft[key]||''} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"/>}</label>)}</div><div className="flex justify-end border-t bg-slate-100 p-3"><button onClick={saveCashAction} className="border bg-white px-4 py-2 text-xs">ثبت گردش صندوق</button></div></>}
   {modal==='restore'&&<div className="space-y-3 p-4"><p className="text-xs">محتوای فایل پشتیبان JSON آزمایشگاه را اینجا وارد کنید. اطلاعات فعلی جایگزین می‌شود.</p><textarea value={restoreText} onChange={e=>setRestoreText(e.target.value)} rows={9} className="w-full border bg-white p-2 text-xs" placeholder="محتوای JSON..."/><button onClick={restore} className="border bg-white px-4 py-2 text-xs">بازیابی در مرورگر</button></div>}
   {modal==='settings'&&<div className="space-y-2 p-4 text-xs"><p>ذخیره‌سازی: localStorage همین مرورگر</p><p>اتصال شبکه و دیتابیس: غیرفعال</p><p>برای انتقال داده‌ها بین دستگاه‌ها از پشتیبان JSON استفاده کنید.</p><button onClick={backup} className="border bg-white px-3 py-2">گرفتن پشتیبان</button><button onClick={reset} className="mr-2 border bg-white px-3 py-2">بازنشانی داده‌های آزمایشی</button></div>}
   {modal==='help'&&<div className="space-y-2 p-4 text-xs leading-6"><p>۱. از فهرست سمت راست بخش مورد نظر را باز کنید.</p><p>۲. با دکمه ثبت جدید رکورد آزمایشی اضافه کنید؛ ردیف را انتخاب و ویرایش یا حذف کنید.</p><p>۳. عملیات دخل و خرج در گردش صندوق ثبت و مانده‌ها محاسبه می‌شوند.</p><p>۴. پشتیبان JSON برای نگهداری و بازیابی اطلاعات محلی استفاده می‌شود.</p><p>این محیط به دیتابیس اصلی متصل نیست.</p></div>}
  </div></div>}
  <style>{'@media print{body *{visibility:hidden!important} .print-area,.print-area *{visibility:visible!important}}'}</style>
 </div>;
}