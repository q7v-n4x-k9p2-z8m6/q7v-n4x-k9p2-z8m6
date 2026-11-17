import React, { useEffect, useMemo, useState } from 'react';
import { loadVersion21Database } from './Version21DataAdapter';
import { saveVersion21Record, editVersion21Record, deleteVersion21Record, deactivateVersion21MasterRecord, captureVersion21Error, seedVersion21BaseAccounts } from './Version21WriteAdapter';
import { loadVersion21LocalState, saveVersion21LocalState } from './Version21LocalStore';
import { saveDemoPreviewRecord, deleteDemoPreviewRecord } from './Version21DemoAdapter';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LanguageSettings from './LanguageSettings';
import { hasPermission } from '@/lib/permissions';
import {
  Home, Users, Wallet, BookOpen, BookText, Search, Printer, Plus, Pencil, Trash2,
  RefreshCw, Receipt, Landmark, Building2, Send, BarChart3, X, Check, ArrowLeftRight,
  ScrollText, Lock, MoreHorizontal, ChevronDown, Save, ClipboardList, FileSpreadsheet,
  Calculator, Download, Upload, Filter, Coins, Banknote, FileText, CalendarDays, MessageSquare, Bot,
  CircleDollarSign, Eye, FilePlus2, ArrowDownCircle, ArrowUpCircle, Scale, Settings2,
  Archive, RotateCcw, ListChecks, CreditCard, CircleHelp, PrinterCheck,
  Languages, ShoppingBag, Smartphone, Wifi, Gamepad2, MessagesSquare, Headphones
} from 'lucide-react';

const CURRENCIES = ['AFN','USD','EUR','IRR','TRY','PKR','AED','SAR','GBP','CNY'];
const MODULES = [
  {id:'home',label:'مرکز عملیات',icon:Home,group:'عمومی'},
  {id:'customers',label:'تعریف مشتریان',icon:Users,group:'تعاریف و دفاتر'},
  {id:'customerLedger',label:'دفتر حساب مشتریان',icon:BookOpen,group:'تعاریف و دفاتر'},
  {id:'debtors',label:'بدهکاران و بستانکاران',icon:CircleDollarSign,group:'حسابداری'},
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
  {id:'activity',label:'سوابق فعالیت',icon:ClipboardList,group:'گزارشات'},
  {id:'errors',label:'گزارش خطاها و فیلدها',icon:CircleHelp,group:'گزارشات'},
  {id:'balance',label:'بیلانس عمومی',icon:Scale,group:'گزارشات'},
  {id:'sarraafGroups',label:'گروه و چت',icon:MessagesSquare,group:'امکانات تکمیلی',linkedModule:true,children:['گروه صرافان','ایجاد گروه','گفت‌وگوی گروهی','گفت‌وگوی خصوصی']},
  {id:'assistant',label:'هوش مصنوعی',icon:Bot,group:'امکانات تکمیلی',linkedModule:true},
  {id:'products',label:'محصولات آنلاین',icon:ShoppingBag,group:'امکانات تکمیلی',linkedModule:true,children:['شارژ موبایل','بسته‌های اینترنت','UC پابجی موبایل']},
  {id:'language',label:'زبان برنامه',icon:Languages,group:'تنظیمات',linkedModule:true,children:['فارسی','دری','English','العربية']}
];
const SCHEMAS = {
 transactions:{title:'گردش حساب',fields:[['date','تاریخ','date'],['type','نوع عملیات','text'],['partyType','نوع طرف حساب','select',['customer','branch','other']],['party','طرف حساب','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ (+ دریافت / - پرداخت)','number'],['description','شرح','text']]},
 customers:{title:'مشتری',fields:[['code','کد مشتری','text'],['name','نام مشتری','text'],['kind','نوع حساب','select',['دائمی','موقتی']],['phone','شماره تماس','text'],['address','آدرس','text'],['currency','ارز اصلی','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال','قفل']]]},
 branches:{title:'نمایندگی',fields:[['code','کد نمایندگی','text'],['name','نام نمایندگی','text'],['city','موقعیت','text'],['phone','شماره تماس','text'],['status','وضعیت','select',['فعال','غیرفعال']]]},
 cash:{title:'صندوق',fields:[['name','نام صندوق','text'],['currency','ارز','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال']]]},
 banks:{title:'حساب بانکی / چک',fields:[['name','نام بانک یا حساب','text'],['account','شماره حساب','text'],['currency','ارز','select',CURRENCIES],['opening','مانده افتتاحیه','number'],['status','وضعیت','select',['فعال','غیرفعال']],['description','توضیحات','text']]},
 currencies:{title:'ارز',fields:[['code','کد ارز','text'],['name','نام ارز','text'],['symbol','نماد','text'],['rate','نرخ مقابل ارز پایه','number'],['active','وضعیت','select',['فعال','غیرفعال']]]},
 accounts:{title:'حساب کل',fields:[['code','کد حساب','text'],['name','نام حساب','text'],['accountType','نوع حساب','select',[{value:'asset',label:'دارایی'},{value:'liability',label:'بدهی'},{value:'equity',label:'سرمایه'},{value:'revenue',label:'درآمد'},{value:'expense',label:'مصرف'}]],['nature','ماهیت','select',['بدهکار','بستانکار']],['parentId','حساب مادر','select',[]],['currency','ارز اختصاصی (اختیاری)','select',['','AFN','USD','EUR','IRR','TRY','PKR','AED','SAR','GBP','CNY']],['status','وضعیت','select',['فعال','غیرفعال']],['description','شرح','text']]},
 expenses:{title:'مصرف',fields:[['date','تاریخ','date'],['title','شرح مصرف','text'],['expenseAccount','حساب مصرف','select',[]],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['cash','پرداخت از صندوق','text'],['note','یادداشت','text']]},
 remittance:{title:'حواله',fields:[['date','تاریخ','date'],['direction','نوع حواله','select',['ارسالی','دریافتی']],['sender','فرستنده','text'],['receiver','گیرنده','text'],['branch','نمایندگی','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number'],['fee','کمیشن','number'],['note','یادداشت','text']]},
 exchange:{title:'معامله اسعار',fields:[['date','تاریخ','date'],['fromCurrency','ارز مبدا','select',CURRENCIES],['fromAmount','مبلغ مبدا','number'],['toCurrency','ارز مقصد','select',CURRENCIES],['toAmount','مبلغ مقصد','number'],['rate','نرخ معامله','number'],['party','طرف حساب','text'],['cashFrom','صندوق پرداخت ارز مبدا','select',[]],['cashTo','صندوق دریافت ارز مقصد','select',[]],['note','یادداشت','text']]},
 journal:{title:'سند روزنامچه',fields:[['date','تاریخ','date'],['description','شرح سند','text'],['debitAccount','حساب بدهکار','text'],['creditAccount','حساب بستانکار','text'],['currency','ارز','select',CURRENCIES],['amount','مبلغ','number']]}
};
const emptyInitial = () => ({ role: '', permissions: [], customers: [], branches: [], cash: [], banks: [], currencies: [], accounts: [], expenses: [], remittance: [], exchange: [], journal: [], ledger: [], transactions: [], reports: [], activity: [], errors: [], profitByCurrency: [], profitAccounts: [], profitEntries: [], unclassifiedProfitLines: [] });
const today = () => new Date().toLocaleDateString('en-CA');
const n = v => Number(String(v??0).replaceAll(',',''))||0;
const fmt = v => new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n(v));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fieldValue = (obj,key) => obj?.[key] ?? '';
const NAV_MENUS = [
 {label:'فایل',items:[['پشتیبان‌گیری','backup'],['بازیابی پشتیبان','restore'],['چاپ صفحه','print'],['پاک‌سازی نمای محلی','reset']]},
 {label:'تعاریف',items:[['مشتریان','customers'],['نمایندگی‌ها','branches'],['صندوق‌ها','cash'],['بانک و چک','banks'],['اسعار','currencies'],['کدینگ حساب‌ها','accounts']]},
 {label:'عملیات',items:[['دخل صندوق','cashIn'],['خرج صندوق','cashOut'],['خرید و فروش اسعار','exchange'],['ثبت حواله','remittance'],['ثبت مصرف','expenses']]},
 {label:'حسابات',items:[['روزنامچه','journal'],['دفتر کل','ledger'],['حساب مشتریان','customerLedger'],['حساب نمایندگی‌ها','branchLedger']]},
 {label:'گزارشات',items:[['گزارش عملیات روز','reports'],['مفاد و زیان','profit'],['بیلانس عمومی','balance'],['سوابق فعالیت','activity'],['گزارش خطاها','errors']]},
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
function DataTable({columns,rows,onSelect,selected}) {
 const renderValue=(column,row)=>column.render?column.render(row):String(row[column.key]??'—');
 if(!rows.length)return <div className="v21-data-table rounded-xl border border-[#cbd9e8] bg-white p-10 text-center text-sm text-slate-500">موردی برای نمایش وجود ندارد.</div>;
 return <div className="v21-data-table rounded-xl border border-[#cbd9e8] bg-white shadow-sm">
  <div className="v21-data-table-desktop overflow-auto">
   <table className="w-full min-w-[760px] border-collapse text-right text-xs">
    <thead className="sticky top-0 bg-gradient-to-l from-[#164b87] to-[#2767a5] text-white"><tr>{columns.map(c=><th key={c.key} className="border-l border-white/15 px-3 py-3 font-bold">{c.label}</th>)}</tr></thead>
    <tbody>{rows.map((r,i)=><tr key={r.id||i} onClick={()=>onSelect(r)} className={'cursor-pointer transition-colors '+(selected?.id===r.id?'bg-blue-100':i%2?'bg-[#f7faff]':'bg-white')+' hover:bg-blue-50'}>{columns.map(c=><td key={c.key} className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3 text-[#263c55]">{renderValue(c,r)}</td>)}</tr>)}</tbody>
   </table>
  </div>
  <div className="v21-data-table-mobile">
   {rows.map((r,i)=><div role="button" tabIndex={0} key={r.id||i} onClick={()=>onSelect(r)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(r);}}} aria-pressed={Boolean(selected&&selected.id===r.id)} className={'v21-record-card w-full rounded-xl border p-3 text-right transition '+(selected?.id===r.id?'is-selected':'')}>
    <div className="v21-record-card-title block border-b pb-2 text-sm font-extrabold">{columns[0]?renderValue(columns[0],r):'رکورد '+(i+1)}</div>
    {columns[0]&&<span className="v21-record-card-primary-label block pt-1 text-[10px]">{columns[0].label}</span>}
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
     {columns.slice(1).map(c=><div key={c.key} className="v21-record-card-field flex min-w-0 flex-col gap-1"><span className="v21-record-card-label">{c.label}</span><div className="v21-record-card-value break-words">{renderValue(c,r)}</div></div>)}
    </div>
    <span className="v21-record-card-select mt-3 block text-[10px] font-bold">برای مشاهده و عملیات، انتخاب کنید</span>
   </div>)}
  </div>
 </div>;
}
const MODULE_TONES = {
 home:'from-blue-700 to-indigo-700', customers:'from-sky-600 to-blue-700', customerLedger:'from-emerald-600 to-teal-700',
 branches:'from-violet-600 to-indigo-700', branchLedger:'from-cyan-600 to-blue-700', cash:'from-amber-500 to-orange-600',
 banks:'from-blue-600 to-indigo-700', exchange:'from-fuchsia-600 to-purple-700', remittance:'from-orange-500 to-amber-600',
 expenses:'from-rose-600 to-red-700', journal:'from-slate-600 to-slate-800', ledger:'from-indigo-600 to-violet-700',
 accounts:'from-cyan-600 to-teal-700', currencies:'from-lime-600 to-green-700', reports:'from-blue-600 to-cyan-700',
 profit:'from-emerald-600 to-green-700', activity:'from-slate-600 to-blue-700', errors:'from-rose-600 to-pink-700',
 balance:'from-violet-600 to-purple-700', debtors:'from-rose-600 to-emerald-700', sarraafGroups:'from-sky-600 to-cyan-700',
 assistant:'from-indigo-600 to-blue-800', products:'from-orange-500 to-pink-600', language:'from-teal-600 to-cyan-700'
};
function Tile({icon:Icon,label,onClick,moduleId}){const tone=MODULE_TONES[moduleId]||'from-blue-600 to-indigo-700';return <button onClick={onClick} className="v21-module-tile group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl border border-[#d2deec] bg-gradient-to-b from-white to-[#f1f6fd] px-2 py-3 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:translate-y-px"><span className={'v21-module-icon grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br '+tone+' text-white shadow-md ring-1 ring-white/70 group-hover:scale-105'}><Icon className="h-6 w-6"/></span><b className="text-[11px] font-bold leading-tight text-[#203b5b]">{label}</b></button>}

export default function Version21Workspace(){
 const navigate=useNavigate();
 const [data,setData]=useState(emptyInitial);
 const [localReady,setLocalReady]=useState(false);
 const [saving,setSaving]=useState(false);
 const [dbStatus,setDbStatus]=useState('loading');
 const [dbError,setDbError]=useState('');
 const [localPreview,setLocalPreview]=useState(false);
 const [exchangeProfile,setExchangeProfile]=useState(null);
 const [lastLoaded,setLastLoaded]=useState(null);
 // Both real exchange tenants and the shared demo workspace may use CRUD UI.
 // Demo writes are isolated by Version21DemoAdapter; real writes retain server-side
 // role, employee-permission, and tenant-scoped authorization in Version21WriteAdapter.
 const readOnly=false;
 const [searchParams]=useSearchParams();
 const requestedModule=searchParams.get('module');
 const [active,setActive]=useState(()=>MODULES.some(x=>x.id===requestedModule)?requestedModule:'home');
 useEffect(()=>{
  setActive(MODULES.some(x=>x.id===requestedModule)?requestedModule:'home');
  setSelected(null);
  setCustomerDetail(null);
  setBranchDetail(null);
  setQuery('');
 },[requestedModule]);
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
 useEffect(()=>{let alive=true;loadVersion21LocalState().then(saved=>{if(!alive)return;if(saved.active&&MODULES.some(x=>x.id===saved.active))setActive(saved.active);if(saved.filterCurrency)setFilterCurrency(saved.filterCurrency);if(saved.dateFrom)setDateFrom(saved.dateFrom);if(saved.dateTo)setDateTo(saved.dateTo);setLocalReady(true);});return()=>{alive=false;};},[]);
 useEffect(()=>{if(!localReady)return;saveVersion21LocalState({active,filterCurrency,dateFrom,dateTo});},[localReady,active,filterCurrency,dateFrom,dateTo]);
 const [showHelp,setShowHelp]=useState(false);
 const [showWorkspace,setShowWorkspace]=useState(false);
 const [customerDetail,setCustomerDetail]=useState(null);
 const [branchDetail,setBranchDetail]=useState(null);
 const permissionSectionByModule={home:'dashboard',customers:'customers',customerLedger:'accounts_receivable',debtors:'accounts_receivable',transactions:'accounts_receivable',branches:'agents',branchLedger:'agents',cash:'cash',cashAction:'cash',banks:'bank',exchange:'trade',remittance:'transfers',expenses:'cash',journal:'journal',ledger:'general_ledger',accounts:'chart_of_accounts',currencies:'currencies',reports:'reports',profit:'profit_loss',activity:'audit_log',errors:'audit_log',balance:'balance_sheet',sarraafGroups:'chat_groups',assistant:'assistant',products:'online_products',language:'settings'};
 const isEmployee=data.role==='employee';
 const canViewModule=id=>!isEmployee||hasPermission(data.permissions,permissionSectionByModule[id],'view');
 const canModuleAction=(id,action)=>!isEmployee||hasPermission(data.permissions,permissionSectionByModule[id]||permissionSectionByModule[id==='cashAction'?'cash':id],action);
 useEffect(()=>{if(dbStatus==='connected'&&isEmployee&&!canViewModule(active)){const fallback=MODULES.find(m=>canViewModule(m.id));setActive(fallback?.id||'home');setSelected(null);}},[dbStatus,isEmployee,data.permissions,active]);
 const notify=s=>{setNotice(s);setTimeout(()=>setNotice(''),4500);};
 const refreshDatabase=async()=>{
  setDbStatus('loading');setDbError('');
  try{const result=await loadVersion21Database();setData(result.data);setExchangeProfile(result.exchange);setLastLoaded(result.loadedAt);setDbStatus('connected');setLocalPreview(false);setSelected(null);setCustomerDetail(null);setBranchDetail(null);notify('اطلاعات واقعی دیتابیس دوباره بارگذاری شد.');}
  catch(error){setDbStatus('error');setDbError(error?.message||'اتصال به دیتابیس ناموفق بود.');captureVersion21Error(error,'loadDatabase');}
 };
 useEffect(()=>{let activeRequest=true;(async()=>{try{const result=await loadVersion21Database();if(!activeRequest)return;setData(result.data);setExchangeProfile(result.exchange);setLastLoaded(result.loadedAt);setDbStatus('connected');setLocalPreview(false);}catch(error){if(!activeRequest)return;setDbStatus('error');setDbError(error?.message||'اتصال به دیتابیس ناموفق بود.');}})();return()=>{activeRequest=false;};},[]);
 const page=MODULES.find(x=>x.id===active)||MODULES[0];
 const schema=SCHEMAS[active];
 const rows=useMemo(()=>{
  let source=data[active]||[];
  if(active==='customerLedger') source=customerDetail?data.transactions.filter(x=>x.partyType==='customer'&&x.party===customerDetail.name):data.customers;
  if(active==='branchLedger') source=branchDetail?data.transactions.filter(x=>x.partyType==='branch'&&x.party===branchDetail.name):data.branches;
  if(active==='ledger') source=data.ledger||[];
  if(active==='reports') source=data.reports||[];
  const demoModule = active==='customerLedger' ? (customerDetail?'transactions':'customers') : active==='branchLedger' ? (branchDetail?'transactions':'branches') : active;
  const demoRows = (data.demoPreviewRecords||[]).filter(r=>{
   if(r.module_key!==demoModule)return false;
   if(active==='customerLedger'&&customerDetail)return r.payload?.party===customerDetail.name;
   if(active==='branchLedger'&&branchDetail)return r.payload?.party===branchDetail.name;
   return true;
  }).map(r=>({
   ...(r.payload||{}), id:'demo-'+r.id, _demoRecordId:r.id, _demoModule:r.module_key,
   _demoPreview:true, _demoFixed:r.record_kind==='sample'
  }));
  source=[...source,...demoRows];
  const q=query.trim().toLowerCase();
  return source.filter(r=>(!q||Object.values(r).join(' ').toLowerCase().includes(q))&&(filterCurrency==='همه'||!r.currency||r.currency===filterCurrency)&&(!dateFrom||!r.date||r.date>=dateFrom)&&(!dateTo||!r.date||r.date<=dateTo));
 },[data,active,customerDetail,branchDetail,query,filterCurrency,dateFrom,dateTo]);
 const profitReport=useMemo(()=>{
  const totals=new Map(),accounts=new Map();
  (data.profitEntries||[]).filter(x=>(!dateFrom||!x.date||x.date>=dateFrom)&&(!dateTo||!x.date||x.date<=dateTo)&&(filterCurrency==='همه'||x.currency===filterCurrency)).forEach(x=>{
   const currency=x.currency||'AFN';
   const t=totals.get(currency)||{currency,revenue:0,expense:0,net:0,lineCount:0};
   if(x.accountType==='revenue')t.revenue+=n(x.amount);else if(x.accountType==='expense')t.expense+=n(x.amount);
   t.net=t.revenue-t.expense;t.lineCount+=1;totals.set(currency,t);
   const key=x.accountId+'::'+currency;
   const row=accounts.get(key)||{accountId:x.accountId,code:x.code,account:x.account,accountType:x.accountType,currency,amount:0,lineCount:0};
   row.amount+=n(x.amount);row.lineCount+=1;accounts.set(key,row);
  });
  return {byCurrency:[...totals.values()].sort((x,y)=>x.currency.localeCompare(y.currency)),accounts:[...accounts.values()].sort((x,y)=>x.accountType.localeCompare(y.accountType)||x.account.localeCompare(y.account))};
 },[data.profitEntries,dateFrom,dateTo,filterCurrency]);
 const profitUnclassified=(data.unclassifiedProfitLines||[]).filter(x=>(!dateFrom||!x.date||x.date>=dateFrom)&&(!dateTo||!x.date||x.date<=dateTo)&&(filterCurrency==='همه'||x.currency===filterCurrency));
 const setField=(k,v)=>setDraft(d=>({...d,[k]:v,...(k==='accountType'&&!d.id?{nature:['revenue','liability','equity'].includes(v)?'بستانکار':'بدهکار'}:{})}));
 const openNew=(module=active,extra={})=>{if(readOnly){notify('ثبت اطلاعات در این حساب فعال نیست.');return;}if(!canModuleAction(module,'create')){notify('مجوز ثبت اطلاعات در این بخش برای حساب شما فعال نیست.');return;}const sc=SCHEMAS[module];const defaults=Object.fromEntries((sc?.fields||[]).map(([k,,type,opts])=>[k,type==='date'?today():type==='select'?(typeof opts?.[0]==='object'?(opts[0].value??''):(opts?.[0]??'')): '']));setActive(module);setDraft({...defaults,date:today(),currency:'AFN',...extra});setSelected(null);setModal(module);};
 const saveRecord=async()=>{
  if(readOnly){notify('ثبت اطلاعات در این حساب فعال نیست.');return;}
  const mod=modal;
  if(!SCHEMAS[mod]||saving)return;
  if(!canModuleAction(mod,draft?.id?'edit':'create')){notify('برای این عملیات مجوز کافی ندارید.');return;}
  if(dbStatus!=='connected'||localPreview){notify('برای جلوگیری از ثبت روی داده اشتباه، ابتدا اطلاعات واقعی همین صراف را تازه‌سازی کنید.');return;}
  setSaving(true);
  const payload={...draft,clientOperationId:draft.clientOperationId||(globalThis.crypto?.randomUUID?.()||('v21-'+Date.now()+'-'+Math.random().toString(36).slice(2)))};
  setDraft(payload);
  try{
   const result=data.isDemoAccount
    ? await saveDemoPreviewRecord(mod,payload,payload._demoRecordId||null)
    : (payload.id?await editVersion21Record(mod,payload):await saveVersion21Record(mod,payload));
   setModal('');setDraft({});
   await refreshDatabase();
   setSelected(null);
   notify(result?.warning||result?.auditWarning?'عملیات در دیتابیس ثبت شد؛ '+(result.warning||result.auditWarning):'اطلاعات در دیتابیس همین صراف ثبت شد.');
  }catch(error){
   await captureVersion21Error(error,'save:'+mod);
   setDbError(error?.message||'ثبت اطلاعات ناموفق بود.');
   notify('ثبت انجام نشد: '+(error?.message||'خطای نامشخص'));
  }finally{setSaving(false);}
 };
 const addTransaction=tx=>setData(d=>({...d,transactions:[{id:uid(),date:today(),...tx},...d.transactions]}));
 const removeSelected=async()=>{
  if(readOnly){notify('حذف اطلاعات در این حساب فعال نیست.');return;}
  if(!canModuleAction(active,'delete')){notify('مجوز ابطال یا حذف این بخش برای حساب شما فعال نیست.');return;}
  if(dbStatus!=='connected'||localPreview){notify('در پیش‌نمایش محلی عملیات مالی و ابطال غیرفعال است؛ ابتدا اطلاعات واقعی را تازه‌سازی کنید.');return;}
  if(!selected){notify('ابتدا یک ردیف را انتخاب کنید.');return;}
  if(active==='customerLedger'&&!customerDetail){notify('برای غیرفعال‌سازی مشتری از بخش «مشتریان» استفاده کنید؛ اینجا فقط گردش حساب قابل ابطال است.');return;}
  if(active==='branchLedger'&&!branchDetail){notify('برای غیرفعال‌سازی نمایندگی از بخش «نمایندگی‌ها» استفاده کنید؛ اینجا فقط گردش حساب قابل ابطال است.');return;}
  const targetModule=['customerLedger','branchLedger'].includes(active)?'transactions':active;
  if(active==='ledger'&&!selected.documentId){notify('شناسه سند اصلی برای این سطر موجود نیست؛ برای جلوگیری از ابطال سند اشتباه، عملیات متوقف شد.');return;}
  const masterDataModules=['customers','branches','cash','banks','currencies','accounts'];
  const isMasterData=masterDataModules.includes(targetModule);
  const confirmMessage=isMasterData
   ? 'این رکورد حذف فیزیکی نمی‌شود و فقط غیرفعال خواهد شد؛ سوابق مالی و ارتباطات آن حفظ می‌شود. ادامه می‌دهید؟'
   : 'این عملیات روی دیتابیس همین صراف اجرا می‌شود. برای اسناد مالی، سند معکوس ثبت خواهد شد و سابقه اصلی حفظ می‌شود. ادامه می‌دهید؟';
  if(!window.confirm(confirmMessage))return;
  try{
   const target=selected;
   if(data.isDemoAccount&&!target._demoPreview){notify('در این حساب فقط رکوردهای موقت قابل حذف هستند؛ اطلاعات اصلی حساب دست‌نخورده می‌ماند.');return;}
   if(target._demoPreview){
    if(target._demoFixed){notify('این رکورد ثابت است و امکان حذف آن وجود ندارد.');return;}
    await deleteDemoPreviewRecord(target._demoRecordId);
    await refreshDatabase();
    notify('رکورد موقت حذف شد.');
    return;
   }
   const result=isMasterData
    ? await deactivateVersion21MasterRecord(targetModule,target)
    : await deleteVersion21Record(targetModule,target);
   await refreshDatabase();
   const baseMessage=isMasterData?'رکورد غیرفعال شد؛ اطلاعات و سوابق آن حفظ شده است.':result?.partial?'ابطال ناقص انجام شد؛ برخی اسناد هنوز نیازمند بررسی هستند.':result?.reversed?'سند با ثبت سند معکوس ابطال شد و سابقه اصلی حفظ شد.':result?.warning?'ابطال انجام نشد؛ وضعیت سند را بررسی کنید.':'عملیات انجام شد؛ سوابق اصلی حفظ شدند.';
   notify([baseMessage,result?.warning,result?.auditWarning].filter(Boolean).join(' '));
  }catch(error){
   await captureVersion21Error(error,'delete:'+active);
   setDbError(error?.message||'حذف ناموفق بود.');
   notify('عملیات حذف انجام نشد: '+(error?.message||'خطای نامشخص'));
  }
 };
 const editSelected=()=>{
  if(readOnly){notify('ویرایش اطلاعات در این حساب فعال نیست.');return;}
  if(!canModuleAction(active,'edit')){notify('مجوز ویرایش این بخش برای حساب شما فعال نیست.');return;}
  if(dbStatus!=='connected'||localPreview){notify('در پیش‌نمایش محلی ویرایش غیرفعال است؛ ابتدا اطلاعات واقعی را تازه‌سازی کنید.');return;}
  if(!selected){notify('ابتدا یک ردیف را انتخاب کنید.');return;}
  if(data.isDemoAccount&&!selected._demoPreview){notify('در این حساب فقط رکوردهای موقت قابل ویرایش هستند؛ اطلاعات اصلی حساب دست‌نخورده می‌ماند.');return;}
  if(selected._demoPreview){
   if(selected._demoFixed){notify('این رکورد ثابت است و امکان ویرایش آن وجود ندارد.');return;}
   const demoEditModule=selected._demoModule;
   if(!SCHEMAS[demoEditModule]){notify('ویرایش این نوع رکورد از این بخش پشتیبانی نمی‌شود.');return;}
   setDraft({...selected});
   setModal(demoEditModule);
   return;
  }
  if(active==='ledger'){notify('دفتر کل گزارش سطرهای ثبت‌شده است؛ برای اصلاح، سند اصلی را در روزنامچه یا بخش عملیات مربوط باز کنید.');return;}
  if(['customerLedger','branchLedger'].includes(active)&&selected.documentId){
   setDraft({...selected});setModal('transactions');return;
  }
  if(['ledger','journal'].includes(active)&&!selected.documentId){notify('این ردیف سند مستقل ندارد و قابل ویرایش مستقیم نیست.');return;}
  const mod=['ledger','journal'].includes(active)?'journal':active;
  if(!SCHEMAS[mod]){notify('ویرایش مستقیم این گزارش ممکن نیست؛ رکورد اصلی را از بخش مربوط باز کنید.');return;}
  setDraft({...selected,...(['ledger','journal'].includes(active)?{id:selected.documentId}: {})});setModal(mod);
 };
 const cashAction=kind=>{if(readOnly){notify('ثبت گردش صندوق در این حساب فعال نیست.');return;}if(!canModuleAction('cash','create')){notify('مجوز ثبت گردش صندوق برای حساب شما فعال نیست.');return;}const first=data.cash.find(x=>x.currency==='AFN')||data.cash[0];setDraft({date:today(),kind,amount:'',currency:first?.currency||'AFN',cash:first?.name||'',party:'',partyType:'customer',description:''});setModal('cashAction');};
 const saveCashAction=async()=>{
  if(readOnly){notify('ثبت گردش صندوق در این حساب فعال نیست.');return;}
  if(saving)return;
  if(!canModuleAction('cash','create')){notify('مجوز ثبت گردش صندوق برای حساب شما فعال نیست.');return;}
  if(dbStatus!=='connected'||localPreview){notify('برای جلوگیری از ثبت روی داده اشتباه، ابتدا اطلاعات واقعی همین صراف را تازه‌سازی کنید.');return;}
  setSaving(true);
  const payload={...draft,clientOperationId:draft.clientOperationId||(globalThis.crypto?.randomUUID?.()||('v21-'+Date.now()+'-'+Math.random().toString(36).slice(2)))};
  setDraft(payload);
  try{
   const result=data.isDemoAccount
    ? await saveDemoPreviewRecord('transactions',{
      date:payload.date,type:payload.kind,partyType:payload.partyType,party:payload.party,
      currency:payload.currency,amount:(payload.kind==='خرج'?-1:1)*Number(payload.amount||0),
      cash:payload.cash,description:payload.description,status:'موقت'
    })
    : await saveVersion21Record('cashAction',payload);
   setModal('');setDraft({});
   await refreshDatabase();
   notify(result?.warning||result?.auditWarning?'گردش صندوق ثبت شد؛ '+(result.warning||result.auditWarning):'گردش صندوق و سند حسابداری در دیتابیس ثبت شد.');
  }catch(error){
   await captureVersion21Error(error,'cashAction');
   setDbError(error?.message||'ثبت گردش صندوق ناموفق بود.');
   notify('گردش صندوق ثبت نشد: '+(error?.message||'خطای نامشخص'));
  }finally{setSaving(false);}
 };
 const backup=()=>{const blob=new Blob([JSON.stringify({version:2,createdAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='hisab-sarraf-backup.json';a.click();URL.revokeObjectURL(a.href);notify('فایل پشتیبان محلی آماده شد.');};
 const restore=()=>{try{const parsed=JSON.parse(restoreText);const restored=parsed.data||parsed;if(!restored||!Array.isArray(restored.customers)||!Array.isArray(restored.transactions))throw new Error();setData({...emptyInitial(),...restored});setLocalPreview(true);setModal('');setRestoreText('');setSelected(null);notify('پشتیبان فقط به‌صورت پیش‌نمایش محلی باز شد؛ برای هر عملیات واقعی، ابتدا تازه‌سازی دیتابیس لازم است.');}catch{notify('فایل پشتیبان معتبر نیست یا ساختار آن پشتیبانی نمی‌شود.');}};
 const printPage=()=>window.print();
 const reset=()=>{if(window.confirm('فقط نمای محلی این صفحه پاک شود؟ هیچ رکوردی از دیتابیس حذف نمی‌شود.')){setData(emptyInitial());setLocalPreview(true);setSelected(null);notify('نمای محلی پاک شد؛ برای بارگذاری اطلاعات واقعی، تازه‌سازی را بزنید.');}};
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
  const allRows=active==='cash'?data.cash:active==='banks'?data.banks:active==='journal'?data.journal:active==='ledger'?(data.ledger||[]):rows;
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
  } else if(active==='journal'){
   selectedRows.filter(x=>x.status==='قطعی'||!x.status).forEach(row=>{const currency=row.currency||'AFN';totals[currency]??={debit:0,credit:0};totals[currency].debit+=n(row.debitTotal);totals[currency].credit+=n(row.creditTotal);});
  } else if(active==='ledger'){
   selectedRows.filter(row=>!row._demoPreview).forEach(row=>{const currency=row.currency||'AFN';totals[currency]??={debit:0,credit:0};totals[currency].debit+=n(row.debit);totals[currency].credit+=n(row.credit);});
  }
  return Object.entries(totals).map(([currency,x])=>({currency,...x,net:x.debit-x.credit}));
 };
 const showBookSummary=['customerLedger','branchLedger','cash','banks','journal','ledger'].includes(active);
 const columnsFor=(mod,arr)=>{
  if(mod==='activity')return [{key:'date',label:'تاریخ'},{key:'action',label:'عملیات'},{key:'entity',label:'بخش'},{key:'entityId',label:'شناسه'},{key:'description',label:'شرح'},{key:'status',label:'وضعیت'}];
  if(mod==='errors')return [{key:'date',label:'تاریخ'},{key:'error_type',label:'بخش / فیلد'},{key:'error_message',label:'شرح خطا'},{key:'device',label:'دستگاه'},{key:'app_version',label:'نسخه'},{key:'status',label:'وضعیت'}];
  if(mod==='customerLedger'&&!customerDetail)return [
   {key:'code',label:'کد مشتری'},{key:'name',label:'نام مشتری'},{key:'currency',label:'ارز اصلی'},
   {key:'balance',label:'وضعیت و مانده حساب',render:r=><div className="flex flex-wrap gap-1">{customerSummary(r).map(x=><span key={x.currency} className={'rounded px-2 py-1 text-[10px] font-bold '+(x.status==='بدهکار'?'bg-rose-100 text-rose-800':x.status==='بستانکار'?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-700')}>{fmt(Math.abs(x.net))} {x.currency} · {x.status}</span>)}</div>},
   {key:'phone',label:'شماره تماس'},{key:'status',label:'وضعیت مشتری'}
  ];
  if(mod==='customerLedger'&&customerDetail)return [
   {key:'date',label:'تاریخ'},{key:'type',label:'نوع عملیات'},{key:'description',label:'شرح'},
   {key:'debit',label:'بدهکار',render:r=><span className="inline-flex min-w-[82px] justify-center rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-700">{fmt(n(r.amount)<0?Math.abs(n(r.amount)):0)}</span>},
   {key:'credit',label:'بستانکار',render:r=><span className="inline-flex min-w-[82px] justify-center rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">{fmt(n(r.amount)>0?n(r.amount):0)}</span>},{key:'currency',label:'ارز'},{key:'status',label:'وضعیت سند'}
  ];
  if(mod==='branchLedger'&&!branchDetail)return [
   {key:'code',label:'کد نمایندگی'},{key:'name',label:'نام نمایندگی'},{key:'city',label:'موقعیت'},{key:'currency',label:'ارز اصلی'},
   {key:'opening',label:'مانده افتتاحیه',render:r=>fmt(r.opening)},{key:'status',label:'وضعیت'}
  ];
  if(mod==='branchLedger'&&branchDetail)return [
   {key:'date',label:'تاریخ'},{key:'type',label:'نوع عملیات'},{key:'description',label:'شرح'},
   {key:'debit',label:'بدهکار',render:r=><span className="inline-flex min-w-[82px] justify-center rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-700">{fmt(n(r.amount)<0?Math.abs(n(r.amount)):0)}</span>},
   {key:'credit',label:'بستانکار',render:r=><span className="inline-flex min-w-[82px] justify-center rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">{fmt(n(r.amount)>0?n(r.amount):0)}</span>},{key:'currency',label:'ارز'},{key:'status',label:'وضعیت سند'}
  ];
  const fields=SCHEMAS[mod]?.fields||[];
  if(mod==='accounts')return [
   {key:'code',label:'کد حساب'},
   {key:'name',label:'نام حساب'},
   {key:'accountType',label:'نوع حساب',render:r=>({asset:'دارایی',liability:'بدهی',equity:'سرمایه',revenue:'درآمد',expense:'مصرف'}[r.accountType]||r.accountType)},
   {key:'level',label:'سطح'},
   {key:'parentId',label:'حساب مادر',render:r=>data.accounts.find(a=>String(a.id)===String(r.parentId))?.code||'—'},
   {key:'balance',label:'مانده دفتر کل',render:r=><div className="flex flex-wrap gap-1">{(r.balanceByCurrency||[]).map(x=><span key={x.currency} className="rounded bg-slate-100 px-2 py-1 text-[10px]">{fmt(Math.abs(x.balance))} {x.currency} · {(r.nature==='بستانکار'?x.balance>=0:x.balance<0)?'بستانکار':'بدهکار'}</span>)}</div>},
   {key:'nature',label:'ماهیت'},
   {key:'status',label:'وضعیت'}
  ];
  if(mod==='remittance')return [{key:'date',label:'تاریخ'},{key:'number',label:'شماره حواله'},{key:'direction',label:'جهت'},{key:'sender',label:'فرستنده'},{key:'receiver',label:'گیرنده'},{key:'amount',label:'مبلغ',render:r=>fmt(r.amount)},{key:'fee',label:'کمیشن',render:r=>fmt(r.fee)},{key:'total',label:'جمع کل',render:r=>fmt(r.total)},{key:'currency',label:'ارز'},{key:'status',label:'وضعیت حواله'},{key:'accountingStatus',label:'وضعیت سند'}];
  if(mod==='exchange')return [{key:'date',label:'تاریخ'},{key:'fromCurrency',label:'ارز مبدا'},{key:'fromAmount',label:'مبلغ مبدا',render:r=>fmt(r.fromAmount)},{key:'toCurrency',label:'ارز مقصد'},{key:'toAmount',label:'مبلغ مقصد',render:r=>fmt(r.toAmount)},{key:'rate',label:'نرخ'},{key:'party',label:'طرف حساب'},{key:'accountingStatus',label:'وضعیت سند'}];
  if(mod==='expenses')return [{key:'date',label:'تاریخ'},{key:'title',label:'شرح مصرف'},{key:'expenseAccount',label:'حساب مصرف'},{key:'cash',label:'صندوق'},{key:'amount',label:'مبلغ',render:r=>fmt(r.amount)},{key:'currency',label:'ارز'},{key:'status',label:'وضعیت سند'}];
  if(mod==='cash')return [{key:'code',label:'کد صندوق'},{key:'name',label:'نام صندوق'},{key:'currency',label:'ارز'},{key:'opening',label:'مانده افتتاحیه',render:r=>fmt(r.opening)},{key:'balance',label:'موجودی فعلی',render:r=>fmt(balanceFor(r.currency,r.name))},{key:'status',label:'وضعیت'},{key:'description',label:'توضیحات'}];
  if(mod==='journal')return [{key:'date',label:'تاریخ'},{key:'number',label:'شماره سند'},{key:'description',label:'شرح'},{key:'debitAccount',label:'بدهکار'},{key:'creditAccount',label:'بستانکار'},{key:'currency',label:'ارز'},{key:'amount',label:'مبلغ',render:r=>fmt(r.amount)},{key:'status',label:'وضعیت'}];
  if(mod==='ledger')return [{key:'date',label:'تاریخ'},{key:'number',label:'شماره سند'},{key:'account',label:'حساب'},{key:'description',label:'شرح'},{key:'debit',label:'بدهکار',render:r=>fmt(r.debit)},{key:'credit',label:'بستانکار',render:r=>fmt(r.credit)},{key:'currency',label:'ارز'},{key:'status',label:'وضعیت'}];
  if(mod==='transactions'||active==='customerLedger'||active==='branchLedger'||active==='reports')return [{key:'date',label:'تاریخ'},{key:'type',label:'نوع عملیات'},{key:'party',label:'طرف حساب'},{key:'description',label:'شرح'},{key:'currency',label:'ارز'},{key:'amount',label:'مبلغ',render:r=>fmt(r.amount)},{key:'cash',label:'صندوق'},{key:'status',label:'وضعیت سند'}];
  return fields.map(([key,label])=>({key,label,render:r=>key==='amount'||key==='opening'||key==='rate'||key==='profit'?fmt(r[key]):undefined}));
 };
 const menuAction=(action)=>{
  setMenu('');
  if(MODULES.some(m=>m.id===action)&&!canViewModule(action)){notify('مجوز مشاهده این بخش برای حساب شما فعال نیست.');return;}
  if(SCHEMAS[action]){setActive(action);return;}
  if(action==='cashIn')return cashAction('دخل');
  if(action==='cashOut')return cashAction('خرج');
  if(action==='backup')return backup();
  if(action==='restore'){return setModal('restore');}
  if(action==='print')return printPage();
  if(action==='reset')return reset();
  if(action==='settings'||action==='help'||action==='support')return setModal(action);
  setActive(action);
 };
 const exportCsv=()=>{
  const cols=active==='profit'?[{key:'code',label:'کد حساب'},{key:'account',label:'حساب'},{key:'accountType',label:'نوع'},{key:'currency',label:'ارز'},{key:'amount',label:'مبلغ خالص'}]:columnsFor(active);
  const source=active==='profit'?profitReport.accounts:rows;
  const csv=[cols.map(c=>c.label).join(','),...source.map(r=>cols.map(c=>'"'+String(r[c.key]??'').replaceAll('"','""')+'"').join(','))].join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=active+'-report.csv';a.click();URL.revokeObjectURL(a.href);
 };
 const dailyTransactions=data.transactions.filter(t=>t.date===today());
 const profit=data.exchange.reduce((s,x)=>s+n(x.profit),0);
 const currencies=[...new Set([...data.cash.map(x=>x.currency),...data.transactions.map(x=>x.currency),'AFN'])];
 const mainTitle='حساب صراف'; return <div dir="rtl" className="v21-workspace-root space-y-2 text-[#253746]">

  {dbStatus==='error'&&<div className="border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">{dbError}</div>}
   {localPreview&&<div className="border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">پیش‌نمایش محلی پشتیبان/نمای پاک‌شده فعال است؛ ثبت، ویرایش و ابطال تا تازه‌سازی اطلاعات واقعی غیرفعال می‌ماند.</div>}
  {dbStatus==='connected'&&<div className="flex flex-wrap items-center justify-between gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-900"><span>صراف: <b>{exchangeProfile?.name||'—'}</b> · داده‌ها فقط از نشست همین صراف دریافت می‌شود.</span><span>آخرین بارگذاری: {lastLoaded?new Date(lastLoaded).toLocaleString('fa-IR'):'—'}</span></div>}
  <section className="v21-workspace-shell flex max-h-[78vh] min-h-[640px] flex-col overflow-hidden border border-[#65798b] bg-[#eef1f4] shadow-md">
   <header className="v21-reference-header flex min-h-10 items-center justify-between px-3 py-2 text-white">
    <div className="flex items-center gap-2"><span className="v21-reference-brand-mark"><Calculator className="h-5 w-5"/></span><div><b className="block text-sm">حساب صراف</b><span className="text-[9px] text-blue-100">نسخه ۲۱ · سامانه مدیریت صرافی</span></div></div>
    <div className="flex items-center gap-2"><span className="hidden text-[10px] text-blue-100 sm:block">{dbStatus==='connected'?'اتصال برقرار':'در انتظار اتصال'}</span><button type="button" onClick={()=>setModal('settings')} aria-label="تنظیمات" className="rounded-lg border border-white/25 p-2 hover:bg-white/10"><Settings2 className="h-4 w-4"/></button><button type="button" onClick={()=>setShowWorkspace(true)} aria-label="فهرست بخش‌ها" className="v21-reference-mobile-menu rounded-lg border border-white/25 p-2"><MoreHorizontal className="h-5 w-5"/></button></div>
   </header>
   
   {/* ردیف اول: عملیات روی رکورد انتخاب‌شده */}
   <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div className="v21-laptop-toolbar">
    <nav className="v21-laptop-menu-bar" aria-label="منوی اصلی">{NAV_MENUS.map(m=><div key={m.label} className="relative"><button onClick={()=>setMenu(menu===m.label?'':m.label)} className={'v21-laptop-menu-trigger '+(menu===m.label?'is-open':'')}>{m.label}<ChevronDown className="mr-1 inline h-3 w-3"/></button>{menu===m.label&&<div className="v21-laptop-menu-popover">{m.items.map(([label,act])=><button key={act} onClick={()=>menuAction(act)}>{label}</button>)}</div>}</div>)}</nav>
    <aside aria-label="دسترسی سریع به ماژول‌های حساب صراف" className="v21-module-icon-row shrink-0 flex w-full items-stretch gap-1.5 border-b border-[#bdcfe3] bg-gradient-to-b from-[#eaf2fd] to-[#dce8f7] p-2">
      {['home','language','products','assistant','sarraafGroups','journal','exchange','cash','remittance','banks','branchLedger','branches','customerLedger','customers'].filter(canViewModule).map(id=>{const m=MODULES.find(x=>x.id===id);if(!m)return null;const I=m.icon;return <button key={m.id} title={m.label} onClick={()=>{m.id==='debtors'?navigate('/debtors'):(setActive(m.id),setSelected(null),setCustomerDetail(null),setBranchDetail(null),setQuery(''));}} className={'v21-toolbar-module flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center transition-all '+(active===m.id?'is-active border-[#6f9ed5] bg-white font-bold text-[#0c4f9b] shadow-sm':'border-[#c8d8eb] bg-white/65 text-[#294d76] hover:border-blue-300 hover:bg-white')}><span className={'grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br '+(MODULE_TONES[m.id]||'from-blue-600 to-indigo-700')+' text-white shadow-sm'}><I className="h-5 w-5"/></span><span className="w-full whitespace-normal text-[10px] font-bold leading-tight">{m.label}</span></button>})}
     </aside>
     <nav className="v21-reference-mobile-shortcuts" aria-label="میانبرهای موبایل">
      {['assistant','language','products','home'].filter(canViewModule).map(id=>{const m=MODULES.find(x=>x.id===id);if(!m)return null;const I=m.icon;return <button key={id} type="button" onClick={()=>{setActive(id);setSelected(null);setQuery('');}} className={active===id?'is-current':''}><I className="h-5 w-5"/><span>{m.label}</span></button>;})}
     </nav>
    </div>
    <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#f9fafb] p-3">
     {active==='home'?<>
      <section className="v21-reference-dashboard-title mb-3 flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-white">
       <div className="flex items-center gap-2"><Home className="h-7 w-7"/><div><h2 className="text-lg font-extrabold">مرکز عملیات صرافی</h2><p className="text-[10px] text-blue-100">مدیریت یکپارچه حساب‌ها، صندوق‌ها، حواله‌ها و معاملات</p></div></div>
       <div className="flex items-center gap-2 text-left"><CalendarDays className="h-6 w-6"/><div className="text-[10px]"><b className="block">{new Intl.DateTimeFormat('fa-IR',{dateStyle:'full'}).format(new Date())}</b><span className="text-blue-100">{dbStatus==='connected'?'اتصال برقرار':'در انتظار اتصال'}</span></div></div>
      </section>
      <div className="v21-reference-stat-grid mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
       <div className="v21-reference-stat"><Users/><span>تعداد مشتریان</span><b>{canViewModule('customers')?fmt(data.customers.length):'—'}</b></div>
       <div className="v21-reference-stat"><Wallet/><span>صندوق‌های تعریف‌شده</span><b>{canViewModule('cash')?fmt(data.cash.length):'—'}</b></div>
       <div className="v21-reference-stat"><RefreshCw/><span>عملیات امروز</span><b>{canViewModule('reports')||canViewModule('cash')?fmt(dailyTransactions.length):'—'}</b></div>
       <div className="v21-reference-stat"><BarChart3/><span>مفاد معاملات</span><b>{canViewModule('profit')&&profit?fmt(profit):'—'}</b></div>
      </div>
      <div className="v21-reference-groups grid grid-cols-1 gap-3 xl:grid-cols-3">
       {[
        {title:'تعاریف و دفاتر',ids:['customers','branches','customerLedger','branchLedger']},
        {title:'صندوق و بانک',ids:['cash','banks','remittance']},
        {title:'عملیات صرافی',ids:['exchange','expenses','debtors']},
        {title:'حسابداری و گزارشات',ids:['journal','ledger','accounts','currencies','reports','profit','balance','activity','errors']},
        {title:'امکانات تکمیلی · اسکلت اولیه',ids:['assistant','sarraafGroups','products']},
        {title:'تنظیمات',ids:['language']}
       ].map(group=><section key={group.title} className="v21-reference-group overflow-hidden rounded-lg border border-[#b9cde5] bg-gradient-to-b from-white to-[#eaf2fc] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#c5d7ed] bg-gradient-to-l from-[#d7e7fb] to-[#eff5fd] px-3 py-2"><b className="text-sm font-extrabold text-[#173e70]">{group.title}</b><span className="text-[10px] text-[#55769a]">بخش‌ها</span></div>
        <div className="grid grid-cols-2 gap-1.5 p-2">{group.ids.filter(canViewModule).map(id=>{const m=MODULES.find(x=>x.id===id);return m?<Tile key={m.id} icon={m.icon} label={m.label} moduleId={m.id} onClick={()=>{if(m.id==='debtors'){navigate('/debtors');return;}setActive(m.id);setSelected(null);setCustomerDetail(null);setBranchDetail(null);setQuery('');}}/>:null;})}</div>
       </section>)}
      </div>
      <section className="v21-reference-quick mt-3 overflow-hidden rounded-lg border border-[#b9cde5] bg-gradient-to-b from-white to-[#eaf2fc] shadow-sm">
       <h3 className="border-b border-[#c5d7ed] bg-gradient-to-l from-[#d7e7fb] to-[#eff5fd] px-3 py-2 text-sm font-extrabold text-[#173e70]">عملیات سریع</h3>
       <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-5">
        <button onClick={()=>openNew('exchange')}><ArrowLeftRight/><span>معامله اسعار</span></button>
        <button onClick={()=>openNew('remittance',{direction:'دریافتی'})}><ArrowDownCircle/><span>حواله دریافتی</span></button>
        <button onClick={()=>openNew('remittance',{direction:'ارسالی'})}><Send/><span>حواله ارسالی</span></button>
        <button onClick={()=>cashAction('خرج')}><ArrowUpCircle/><span>ثبت خرج صندوق</span></button>
        <button onClick={()=>cashAction('دخل')}><ArrowDownCircle/><span>ثبت دخل صندوق</span></button>
       </div>
      </section>
     </>     </>:page.linkedModule?<section className="min-h-[360px] border border-[#9aabb9] bg-white p-4 sm:p-6"><div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#b6c4cf] bg-[#edf3f7]"><page.icon className="h-6 w-6 text-[#315e80]"/></div><div><h2 className="text-base font-bold text-[#24496d]">{page.label}</h2><p className="mt-1 text-[10px] text-slate-500">ورود به ماژول عملیاتی موجود در حساب صراف</p></div></div>{page.id==='language'?<LanguageSettings/>:<><p className="mb-4 text-xs leading-6 text-slate-600">برای استفاده از این امکان، ماژول مرتبط برنامه را باز کنید. دسترسی و محدودیت اشتراک در همان ماژول اعمال می‌شود.</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(page.id==='sarraafGroups'?[['گروه‌ها و گفت‌وگوی گروهی','/chat'],['گفت‌وگوی مستقیم صرافان','/sarraaf-chat'],['بازار نرخ صرافان','/sarraaf-market']]:page.id==='assistant'?[['دستیار هوش مصنوعی','/assistant']]:[['مدیریت محصولات آنلاین','/online-products'],['شارژ و بسته اینترنت','/online-products/recharge'],['بازی‌ها و خدمات دیجیتال','/online-products/games']]).map(([label,path])=><button key={path} onClick={()=>navigate(path)} className="min-h-12 border border-[#b6c4cf] bg-[#f2f6f9] px-3 py-3 text-right text-xs font-bold text-[#294d69] hover:border-[#47799d] hover:bg-blue-50">{label}</button>)}</div></>}</section>:<>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#315e80] pb-2"><div className="flex items-center gap-2"><page.icon className="h-5 w-5 text-[#315e80]"/><div><div className="text-[9px] text-slate-500">سیستم حسابداری / {page.label}</div><h2 className="text-sm font-bold text-[#24496d]">{page.label}</h2></div>{active==='customerLedger'&&customerDetail&&<button onClick={()=>{setCustomerDetail(null);setSelected(null);}} className="mr-2 border bg-white px-2 py-1 text-[10px]">بازگشت به فهرست مشتریان</button>}{active==='branchLedger'&&branchDetail&&<button onClick={()=>{setBranchDetail(null);setSelected(null);}} className="mr-2 border bg-white px-2 py-1 text-[10px]">بازگشت به فهرست نمایندگی‌ها</button>}</div><div className="flex flex-wrap gap-1 text-[10px]"><label>از <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="border bg-white px-1 py-1"/></label><label>تا <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="border bg-white px-1 py-1"/></label><button onClick={()=>{setDateFrom('');setDateTo('');}} className="border bg-white px-2">پاک‌سازی تاریخ</button></div></div>
      {active==='cash'&&<div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-[#b6c4cf] bg-[#edf3f7] px-3 py-2"><div><b className="text-[11px] text-[#24496d]">فهرست صندوق‌ها</b><div className="mt-1 text-[10px] text-slate-600">هر صندوق در یک ردیف؛ برای دیدن جزئیات، ردیف را انتخاب کنید.</div></div><div className="flex items-center gap-3 text-[10px]"><span>تعداد صندوق‌ها: <b>{fmt(data.cash.length)}</b></span><button onClick={()=>openNew('cash')} className="border border-blue-300 bg-white px-3 py-2 font-bold text-blue-900"><Plus className="ml-1 inline h-3 w-3"/>صندوق جدید</button></div></div>}
      {active==='profit'&&<section className="mb-3 space-y-3">
       {data.exchange.some(x=>(!dateFrom||!x.date||x.date>=dateFrom)&&(!dateTo||!x.date||x.date<=dateTo)&&(filterCurrency==='همه'||x.fromCurrency===filterCurrency||x.toCurrency===filterCurrency))&&<div className="border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">توجه: معاملات خریدوفروش/تبدیل اسعار در این بازه وجود دارد؛ اما سود معاملاتی آن‌ها هنوز در جمع سود و زیان منظور نشده است. برای محاسبهٔ قطعی باید ارز مبنا و بهای تمام‌شدهٔ موجودی هر ارز مشخص باشد. تا زمان اتصال این اطلاعات به کدینگ، مبلغ سود معاملات اسعار حدس زده نمی‌شود.</div>}
       {profitReport.byCurrency.length===0&&<div className="border border-amber-300 bg-amber-50 px-3 py-3 text-[11px] leading-6 text-amber-900">{data.accounts.some(account=>['revenue','expense'].includes(account.accountType))?'در بازهٔ انتخاب‌شده سطر ثبت‌شده‌ای به حساب درآمد یا مصرف وصل نیست؛ پس از ثبت اسناد به کدینگ مربوط، گزارش محاسبه می‌شود.':'سود و زیان قطعی هنوز قابل محاسبه نیست؛ ابتدا حساب‌های درآمد و مصرف را در «کدینگ حساب‌ها» تعریف کنید و اسناد را به همان حساب‌ها وصل نمایید. گردش صندوق و مشتری به‌تنهایی سود محسوب نمی‌شود.'}</div>}
       {profitReport.byCurrency.length>0&&<div className="overflow-auto border bg-white"><table className="w-full text-xs"><thead className="bg-slate-200"><tr><th className="p-2 text-right">ارز</th><th>درآمد</th><th>مصارف</th><th>سود / زیان خالص</th></tr></thead><tbody>{profitReport.byCurrency.map(x=><tr key={x.currency} className="border-t"><td className="p-2 font-bold">{x.currency}</td><td className="text-center">{fmt(x.revenue)}</td><td className="text-center">{fmt(x.expense)}</td><td className="text-center font-bold">{fmt(x.net)}</td></tr>)}</tbody></table></div>}
       {profitReport.accounts.length>0&&<div className="overflow-auto border bg-white"><div className="border-b bg-[#edf3f7] px-3 py-2 text-[11px] font-bold">تفکیک بر اساس حساب</div><table className="w-full text-xs"><thead className="bg-slate-100"><tr><th className="p-2 text-right">کد حساب</th><th>نام حساب</th><th>نوع</th><th>ارز</th><th>مبلغ خالص</th></tr></thead><tbody>{profitReport.accounts.map((x,i)=><tr key={x.accountId+'-'+x.currency+'-'+i} className="border-t"><td className="p-2">{x.code}</td><td>{x.account}</td><td>{x.accountType==='revenue'?'درآمد':'مصرف'}</td><td>{x.currency}</td><td className="text-center">{fmt(x.amount)}</td></tr>)}</tbody></table></div>}
       {profitUnclassified.length>0&&<div className="border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">تعداد {fmt(profitUnclassified.length)} سطر مالی با عنوان درآمد/مصرف هنوز به حساب کدینگ وصل نیست؛ این سطرها عمداً در سود و زیان محاسبه نشده‌اند تا عدد غیرواقعی نمایش داده نشود.</div>}
      </section>}
      {!readOnly&&!data.isDemoAccount&&active==='accounts'&&['1000','1010','1020','1030','2000','2010','3000','4000','4010','4020','5000','5010','5020'].some(code=>!data.accounts.some(account=>account.code===code))&&<div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-amber-300 bg-amber-50 px-3 py-3 text-[11px] leading-5 text-amber-900"><span>کدینگ پایه نسخهٔ ۲۱ کامل نیست. می‌توانید فقط حساب‌های پایهٔ غایب را برای همین صراف ایجاد کنید؛ حساب‌های موجود و سوابق قبلی تغییر نمی‌کنند.</span><button onClick={async()=>{if(dbStatus!=='connected'||localPreview){notify('ابتدا اطلاعات واقعی دیتابیس را تازه‌سازی کنید.');return;}if(!canModuleAction('accounts','create')){notify('مجوز ایجاد کدینگ برای این حساب فعال نیست.');return;}if(!window.confirm('کدینگ پایه فقط برای همین کد صرافی ایجاد شود؟ حساب‌ها و اسناد موجود حذف یا بازنویسی نمی‌شوند.'))return;setSaving(true);try{const result=await seedVersion21BaseAccounts();await refreshDatabase();notify('کدینگ پایه ایجاد شد. تعداد حساب‌های پایه: '+fmt(result.created)+(result.auditWarning?'؛ هشدار ثبت سوابق: '+result.auditWarning:''));}catch(error){await captureVersion21Error(error,'seedChartOfAccounts');notify('ایجاد کدینگ انجام نشد: '+(error?.message||'خطای نامشخص'));}finally{setSaving(false);}}} disabled={saving||dbStatus!=='connected'} className="shrink-0 border border-blue-300 bg-white px-3 py-2 font-bold text-blue-900 disabled:opacity-50">{saving?'در حال ایجاد...':'ایجاد کدینگ پایه'}</button></div>}
      {active==='balance'&&<><div className="mb-2 border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] leading-5 text-amber-900">این خلاصه فقط موجودی صندوق‌ها و گردش نقدی را نشان می‌دهد و جایگزین بیلانس آزمایشی یا ترازنامه بدهکار/بستانکار نیست.</div><div className="mb-3 overflow-auto border bg-white"><table className="w-full text-xs"><thead className="bg-slate-200"><tr><th className="p-2 text-right">ارز</th><th>مانده صندوق</th><th>گردش خالص</th></tr></thead><tbody>{currencies.map(c=><tr key={c} className="border-t"><td className="p-2">{c}</td><td className="text-center">{fmt(data.cash.filter(x=>x.currency===c).reduce((s,x)=>s+balanceFor(c,x.name),0))}</td><td className="text-center">{fmt(totalByCurrency(c))}</td></tr>)}</tbody></table></div></>}
      {active==='exchange'&&<div className="mb-2 flex gap-2"><button onClick={()=>openNew('exchange',{kind:'خرید'})} className="border bg-white px-3 py-2 text-[10px]">خرید اسعار</button><button onClick={()=>openNew('exchange',{kind:'فروش'})} className="border bg-white px-3 py-2 text-[10px]">فروش اسعار</button><button onClick={()=>openNew('exchange',{kind:'تبدیل'})} className="border bg-white px-3 py-2 text-[10px]">تبدیل ارز</button></div>}
      {active==='remittance'&&<div className="mb-2 flex gap-2"><button onClick={()=>openNew('remittance',{direction:'ارسالی'})} className="border bg-white px-3 py-2 text-[10px]">حواله ارسالی</button><button onClick={()=>openNew('remittance',{direction:'دریافتی'})} className="border bg-white px-3 py-2 text-[10px]">حواله دریافتی</button><button onClick={()=>openNew('remittance',{direction:'نامعلوم'})} className="border bg-white px-3 py-2 text-[10px]">حواله نامعلوم</button></div>}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-[10px]"><b>فهرست {page.label}</b><span className="text-slate-500">تعداد: {fmt(rows.length)}</span></div><div className="flex flex-wrap gap-1"><input id="lab-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجو..." className="h-8 w-36 border bg-white px-2 text-[10px]"/><select value={filterCurrency} onChange={e=>setFilterCurrency(e.target.value)} className="h-8 border bg-white px-2 text-[10px]"><option>همه</option>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select><button onClick={()=>{setQuery('');setFilterCurrency('همه');}} className="border bg-white px-2 text-[10px]"><Filter className="inline h-3 w-3"/> پاک</button></div></div>
      <div className="mb-2 flex flex-wrap gap-1 border border-slate-300 bg-white p-1.5 text-[10px]">{[[RefreshCw,'تازه‌سازی',refreshDatabase],[Search,'تمرکز جستجو',()=>document.getElementById('lab-search')?.focus()],[Download,'خروجی CSV',exportCsv],[Archive,'پشتیبان',backup]].map(([I,label,fn])=><button key={label} onClick={fn} className="flex items-center gap-1 border border-slate-200 bg-[#f8fafc] px-2 py-1.5 hover:bg-blue-50"><I className="h-3.5 w-3.5"/>{label}</button>)}<button onClick={editSelected} disabled={!selected||!canModuleAction(active,'edit')} className="flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"><Pencil className="h-3.5 w-3.5"/>ویرایش انتخاب‌شده</button><button onClick={removeSelected} disabled={!selected||!canModuleAction(active,'delete')||!(['customers','branches','cash','banks','currencies','accounts','transactions','cashAction','expenses','journal','ledger','remittance','exchange'].includes(active))} className="flex items-center gap-1 border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-800 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5"/>{['customers','branches','cash','banks','currencies','accounts'].includes(active)?'غیرفعال‌سازی انتخاب‌شده':['transactions','cashAction','expenses','journal','ledger','remittance','exchange'].includes(active)?'ابطال سند انتخاب‌شده':'عملیات در این بخش موجود نیست'}</button></div>
      <DataTable columns={active==='reports'?columnsFor('transactions'):columnsFor(active)} rows={rows} selected={selected} onSelect={r=>{if(active==='customerLedger'&&!customerDetail){setCustomerDetail(r);setSelected(null);}else if(active==='branchLedger'&&!branchDetail){setBranchDetail(r);setSelected(null);}else setSelected(r);}}/>
      {!readOnly&&SCHEMAS[active]&&canModuleAction(active,'create')&&<button onClick={()=>openNew()} className="mt-2 border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900"><Plus className="ml-1 inline h-4 w-4"/>ثبت {SCHEMAS[active].title} جدید</button>}
     </>}
    </main>
   </div>
   {showBookSummary&&<div className="shrink-0 border-t border-slate-400 bg-[#e9edf1] p-2">
    <div className="flex gap-2 overflow-x-auto pb-1">{accountBookTotals().map(x=><div key={x.currency} className="v21-ledger-summary-card min-w-[250px] flex-1 rounded-xl border border-[#d3deeb] bg-white p-3 text-right shadow-sm"><b className="mb-2 block text-xs font-extrabold text-[#1e4776]" dir="ltr">{x.currency}</b><div className="grid grid-cols-3 gap-2"><div className="rounded-lg bg-rose-50 p-2"><span className="block text-[10px] font-semibold text-rose-700">جمع بدهکار</span><b className="text-xs tabular-nums text-rose-800">{fmt(x.debit)}</b></div><div className="rounded-lg bg-emerald-50 p-2"><span className="block text-[10px] font-semibold text-emerald-700">جمع بستانکار</span><b className="text-xs tabular-nums text-emerald-800">{fmt(x.credit)}</b></div><div className="rounded-lg bg-blue-50 p-2"><span className="block text-[10px] font-semibold text-blue-700">{x.net>0?'مانده بدهکار':x.net<0?'مانده بستانکار':'تراز'}</span><b className="text-xs tabular-nums text-blue-800">{fmt(Math.abs(x.net))}</b></div></div></div>)}</div>
   </div>}
   <div className="v21-reference-record-actions shrink-0 flex items-center justify-end gap-2 border-t border-[#c4d5e9] bg-gradient-to-b from-[#edf4fd] to-[#dce8f6] px-3 py-2">
    <button type="button" onClick={()=>SCHEMAS[active]&&canModuleAction(active,'create')?openNew():notify('برای ثبت، ابتدا بخش مورد نظر را باز کنید.')} disabled={!SCHEMAS[active]||!canModuleAction(active,'create')}><Check/>ثبت</button>
    <button type="button" onClick={editSelected} disabled={!selected||!canModuleAction(active,'edit')}><Pencil/>ویرایش</button>
    <button type="button" onClick={removeSelected} disabled={!selected||!canModuleAction(active,'delete')}><X/>حذف / ابطال</button>
    <button type="button" onClick={printPage}><Printer/>چاپ</button>
   </div>
   <nav className="v21-mobile-bottom" aria-label="ناوبری اصلی موبایل">
    <button type="button" className={active==='home'?'is-current':''} onClick={()=>{setActive('home');setSelected(null);setCustomerDetail(null);setBranchDetail(null);setQuery('');}}><Home className="h-5 w-5"/><span>خانه</span></button>
    <button type="button" className={active==='reports'?'is-current':''} onClick={()=>{setActive('reports');setSelected(null);setQuery('');}}><BarChart3 className="h-5 w-5"/><span>گزارشات</span></button>
    <button type="button" className={active==='exchange'?'is-current':''} onClick={()=>{setActive('exchange');setSelected(null);setQuery('');}}><ArrowLeftRight className="h-5 w-5"/><span>عملیات</span></button>
    <button type="button" onClick={()=>setShowWorkspace(true)}><MoreHorizontal className="h-5 w-5"/><span>منو</span></button>
   </nav>
   <footer className="shrink-0 border-t border-slate-400 bg-[#dfe5ea] px-3 py-2 text-center text-[9px] text-slate-600">حساب صراف</footer>
  </section>
  {showWorkspace&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3"><div className="max-h-[85vh] w-full max-w-4xl overflow-auto border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl"><div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white"><b className="text-xs">سایر امکانات برنامه</b><button onClick={()=>setShowWorkspace(false)}><X className="h-4 w-4"/></button></div><div className="space-y-3 p-3">
      {NAV_MENUS.slice(5).map(group=><section key={group.label} className="border border-slate-300 bg-white p-2"><h3 className="mb-2 border-b border-slate-200 pb-1 text-xs font-bold text-[#24496d]">{group.label}</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{group.items.map(([label,act])=><button key={act} onClick={()=>{menuAction(act);setShowWorkspace(false);}} className="min-h-10 border border-slate-300 bg-[#f5f8fa] px-2 py-2 text-[11px] text-[#29465e] hover:bg-blue-50">{label}</button>)}</div></section>)}
      <section><h3 className="mb-2 text-xs font-bold text-[#24496d]">سایر بخش‌ها</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{MODULES.filter(m=>m.id!=='home'&&!['customerLedger','customers','branches','branchLedger','banks','remittance','cash','exchange','expenses','journal','ledger'].includes(m.id)).map(m=><Tile key={m.id} icon={m.icon} label={m.label} moduleId={m.id} onClick={()=>{if(m.id==='debtors'){setShowWorkspace(false);navigate('/debtors');return;}setActive(m.id);setSelected(null);setCustomerDetail(null);setQuery('');setShowWorkspace(false);}}/>)}</div></section>
     </div></div></div>}
   {notice&&<div className="flex items-center gap-2 border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900"><Check className="h-4 w-4"/>{notice}<button onClick={()=>setNotice('')} className="mr-auto"><X className="h-4 w-4"/></button></div>}
  <p className="text-[10px] leading-5 text-slate-500">اطلاعات مالی پس از ثبت در دیتابیس همان صراف ذخیره می‌شود. پیش‌نویس فرم‌ها و تنظیمات نمایش، جداگانه در حافظه محلی همین مرورگر و برای همین کاربر نگهداری می‌شود.</p>
  {modal&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto border-2 border-slate-600 bg-[#f7f9fb] shadow-2xl"><div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-[#386b91] to-[#17466c] px-3 py-2 text-white"><b className="text-xs">{SCHEMAS[modal]?((draft.id?'ویرایش ':'ثبت ')+SCHEMAS[modal].title):modal==='cashAction'?'ثبت گردش صندوق':modal==='restore'?'بازیابی پشتیبان':modal==='settings'?'تنظیمات محلی':'راهنمای حساب صراف'}</b><button onClick={()=>setModal('')}><X className="h-4 w-4"/></button></div>
   {SCHEMAS[modal]&&<><div className="grid gap-3 p-4 sm:grid-cols-2">{SCHEMAS[modal].fields.map(f=><Field key={f[0]} field={f} value={fieldValue(draft,f[0])} onChange={setField} choices={{
    ...(modal==='transactions'?{partyType:[{value:'customer',label:'مشتری'},{value:'branch',label:'نمایندگی'},{value:'other',label:'سایر'}]}:{}),
    ...(modal==='journal'?{debitAccount:[{value:'',label:'انتخاب حساب بدهکار'},...data.accounts.map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name})),...data.cash.map(x=>({value:'صندوق: '+x.name,label:'صندوق: '+x.name+' ('+x.currency+')'}))],creditAccount:[{value:'',label:'انتخاب حساب بستانکار'},...data.accounts.map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name})),...data.cash.map(x=>({value:'صندوق: '+x.name,label:'صندوق: '+x.name+' ('+x.currency+')'}))]}:{}),
    ...(modal==='accounts'?{parentId:[{value:'',label:'بدون حساب مادر'},...data.accounts.filter(a=>a.status!=='غیرفعال'&&!a.parentId&&String(a.id)!==String(draft.id||'')).map(a=>({value:String(a.id),label:a.code+' — '+a.name}))]}:{}),
    ...(modal==='expenses'?{expenseAccount:[{value:'',label:'انتخاب حساب مصرف'},...data.accounts.filter(a=>a.accountType==='expense'&&a.status!=='غیرفعال').map(a=>({value:a.code+' — '+a.name,label:a.code+' — '+a.name}))]}:{})
    ,...(modal==='exchange'?{cashFrom:[{value:'',label:'انتخاب صندوق ارز مبدا'},...data.cash.filter(x=>x.currency===draft.fromCurrency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))],cashTo:[{value:'',label:'انتخاب صندوق ارز مقصد'},...data.cash.filter(x=>x.currency===draft.toCurrency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))]}:{})
    ,...(modal==='expenses'?{cash:[{value:'',label:'انتخاب صندوق پرداخت'},...data.cash.filter(x=>x.currency===draft.currency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))]}:{})
    ,...(modal==='remittance'?{cash:[{value:'',label:'انتخاب صندوق مرتبط'},...data.cash.filter(x=>x.currency===draft.currency).map(x=>({value:x.name,label:x.name+' ('+x.currency+')'}))],branch:[{value:'',label:'انتخاب نمایندگی'},...data.branches.map(x=>({value:x.name,label:x.name}))]}:{})
   }}/>)}</div><div className="flex justify-end gap-2 border-t bg-slate-100 p-3"><button onClick={saveRecord} disabled={saving} className="flex items-center gap-1 border bg-white px-4 py-2 text-xs disabled:opacity-50"><Save className="h-4 w-4"/>{saving?'در حال ثبت...':'ثبت'}</button><button onClick={()=>setModal('')} className="border bg-white px-4 py-2 text-xs">انصراف</button></div></>}
   {modal==='cashAction'&&<><div className="grid gap-3 p-4 sm:grid-cols-2">{[['تاریخ','date'],['نوع عملیات','kind'],['نوع طرف حساب','partyType'],['طرف حساب','party'],['ارز','currency'],['مبلغ','amount'],['صندوق','cash'],['شرح','description']].map(([label,key])=><label key={key} className="space-y-1 text-[11px]"><span>{label}</span>{key==='kind'?<select value={draft.kind} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option>دخل</option><option>خرج</option></select>:key==='partyType'?<select value={draft.partyType||'customer'} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option value="customer">مشتری</option><option value="branch">نمایندگی</option><option value="other">سایر</option></select>:key==='currency'?<select value={draft.currency} onChange={e=>{const currency=e.target.value;const first=data.cash.find(x=>x.currency===currency);setDraft(d=>({...d,currency,cash:first?.name||''}));}} className="h-9 w-full border bg-white px-2">{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select>:key==='cash'?<select value={draft.cash||''} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"><option value="">انتخاب صندوق</option>{data.cash.filter(c=>c.currency===draft.currency).map(c=><option key={c.id} value={c.name}>{c.name} · {c.currency}</option>)}</select>:<input type={key==='amount'?'number':key==='date'?'date':'text'} value={draft[key]||''} onChange={e=>setField(key,e.target.value)} className="h-9 w-full border bg-white px-2"/>}</label>)}</div><div className="flex justify-end border-t bg-slate-100 p-3"><button onClick={saveCashAction} disabled={saving} className="border bg-white px-4 py-2 text-xs disabled:opacity-50">{saving?'در حال ثبت...':'ثبت گردش صندوق'}</button></div></>}
   {modal==='restore'&&<div className="space-y-3 p-4"><p className="text-xs">محتوای فایل پشتیبان JSON را وارد کنید. این بازیابی فقط نمای محلی مرورگر را تغییر می‌دهد و هیچ رکوردی در دیتابیس A1 ایجاد، جایگزین یا حذف نمی‌کند.</p><textarea value={restoreText} onChange={e=>setRestoreText(e.target.value)} rows={9} className="w-full border bg-white p-2 text-xs" placeholder="محتوای JSON..."/><button onClick={restore} className="border bg-white px-4 py-2 text-xs">بازیابی در مرورگر</button></div>}
   {modal==='settings'&&<div className="space-y-2 p-4 text-xs"><p>تنظیمات برنامه</p><button onClick={refreshDatabase} className="border bg-white px-3 py-2">بارگذاری دوباره اطلاعات</button></div>}
   {modal==='support'&&<div className="space-y-3 p-4 text-xs leading-6"><b>پشتیبانی حساب صراف</b><p>برای مشاهده راه‌های پشتیبانی و ثبت درخواست، صفحه پشتیبانی برنامه را باز کنید.</p><button onClick={()=>{setModal('');navigate('/support');}} className="border border-blue-300 bg-blue-50 px-4 py-2 font-bold text-blue-900">ورود به مرکز پشتیبانی</button></div>}
   {modal==='help'&&<div className="space-y-2 p-4 text-xs leading-6"><p>۱. از فهرست سمت راست بخش مورد نظر را باز کنید.</p><p>۲. اطلاعات صراف از دیتابیس دریافت می‌شود و ثبت‌های جدید در همان حساب ذخیره می‌گردد.</p><p>۳. برای تازه‌سازی، از دکمه «تازه‌سازی» استفاده کنید.</p><p>۴. ثبت و ویرایش در جدول‌های موجود انجام می‌شود؛ عملیات مالی با سند حسابداری و سوابق قابل‌ردیابی ثبت می‌گردد.</p><p>دسترسی اطلاعات به نشست و کد صرافی واردشده محدود است.</p></div>}
  </div></div>}
  <style>{'@media print{body *{visibility:hidden!important} .print-area,.print-area *{visibility:visible!important}} @media(max-width:640px){.v21-workspace-root{min-height:100dvh;padding-bottom:env(safe-area-inset-bottom)}.v21-workspace-shell{max-height:none!important;min-height:calc(100dvh - 16px)!important;height:auto;overflow:visible!important;border-radius:10px}.v21-workspace-shell>header{position:sticky;top:0;z-index:25;min-height:48px;padding:10px 12px}.v21-workspace-shell>nav{display:flex;flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;scrollbar-width:thin;position:relative;z-index:20}.v21-workspace-shell>nav>div{flex:0 0 auto}.v21-workspace-shell>div.flex.min-h-0{overflow:visible}.v21-workspace-shell aside.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px;padding:8px}.v21-workspace-shell aside.grid button{min-height:66px;padding:8px 4px}.v21-workspace-shell aside.grid button svg{width:20px;height:20px}.v21-workspace-shell aside.grid button span{white-space:normal;overflow:visible;text-overflow:clip;line-height:1.4;font-size:11px}.v21-workspace-shell main{overflow:visible!important;padding:10px}.v21-workspace-shell main>div.grid.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.v21-workspace-shell main section .min-w-\\[112px\\]{min-width:calc(50% - 8px)}.v21-workspace-shell main input,.v21-workspace-shell main select{max-width:100%;min-height:38px}.v21-workspace-shell table{min-width:640px}.v21-workspace-shell main>div:has(>table){overflow-x:auto}.v21-workspace-shell>div.shrink-0.flex.items-center.justify-between{position:sticky;bottom:56px;z-index:15}.v21-mobile-bottom{position:sticky;bottom:0;z-index:30;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:8px;background:#dfe8ef;border-top:1px solid #9aabb9;padding-bottom:calc(8px + env(safe-area-inset-bottom))}.v21-mobile-bottom button{min-height:42px;border:1px solid #a8bac8;border-radius:7px;background:#fff;color:#24496d;font-size:11px;font-weight:700}.v21-workspace-shell footer{font-size:9px;gap:6px}.v21-workspace-shell .fixed.inset-0{padding:8px}.v21-workspace-shell .fixed.inset-0>div{max-height:92dvh}} @media(min-width:641px){.v21-mobile-bottom{display:none}}'}</style>
 </div>;
}