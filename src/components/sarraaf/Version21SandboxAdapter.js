let activeTenantId = 'anonymous';
let activeTenantRole = 'sarraaf';
export function setSandboxTenantId(id, role='sarraaf') { activeTenantId = String(id || 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '_'); activeTenantRole = role === 'customer' ? 'customer' : 'sarraaf'; }
const storageKey = () => 'hisab_sarraf_v21_sandbox_data_v1_' + activeTenantId;
const today = () => new Date().toLocaleDateString('en-CA');
const makeId = () => 'sandbox-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);

function seedData() {
  const date = today();
  return {
    role: activeTenantRole, permissions: [], isDemoAccount: false,
    customers: [
      {id:'c-1',code:'C-001',name:'احمد رضایی (نمونه)',kind:'دائمی',phone:'09•••۱۲۳۴',currency:'AFN',opening:12000,status:'فعال'},
      {id:'c-2',code:'C-002',name:'محمد کریمی (نمونه)',kind:'موقتی',phone:'09•••۵۶۷۸',currency:'USD',opening:-150,status:'فعال'},
      {id:'c-3',code:'C-003',name:'فاطمه احمدی (نمونه)',kind:'دائمی',phone:'09•••۹۰۱۲',currency:'IRR',opening:0,status:'فعال'}
    ],
    branches:[{id:'b-1',code:'BR-01',name:'نمایندگی مرکزی (نمونه)',city:'تهران',phone:'—',currency:'AFN',opening:5000,status:'فعال'}],
    cash:[{id:'cash-1',code:'CASH-01',name:'صندوق افغانی (نمونه)',currency:'AFN',opening:250000,status:'فعال'},{id:'cash-2',code:'CASH-02',name:'صندوق دالر (نمونه)',currency:'USD',opening:3200,status:'فعال'}],
    banks:[{id:'bank-1',name:'بانک نمونه',account:'TEST-0001',currency:'AFN',opening:50000,status:'فعال',description:'حساب ساختگی'}],
    currencies:[{id:'cur-1',code:'AFN',name:'افغانی',symbol:'؋',rate:1,active:'فعال'},{id:'cur-2',code:'USD',name:'دالر آمریکا',symbol:'$',rate:70,active:'فعال'},{id:'cur-3',code:'IRR',name:'ریال ایران',symbol:'﷼',rate:0.0016,active:'فعال'},{id:'cur-4',code:'EUR',name:'یورو',symbol:'€',rate:76,active:'فعال'}],
    accounts:[
      {id:'a-1',code:'1000',name:'دارایی‌ها',accountType:'asset',nature:'بدهکار',level:1,status:'فعال'},
      {id:'a-2',code:'1010',name:'صندوق افغانی',accountType:'asset',nature:'بدهکار',level:2,parentId:'a-1',status:'فعال'},
      {id:'a-3',code:'2000',name:'بدهی‌ها',accountType:'liability',nature:'بستانکار',level:1,status:'فعال'},
      {id:'a-4',code:'4000',name:'درآمد معاملات',accountType:'revenue',nature:'بستانکار',level:1,status:'فعال'},
      {id:'a-5',code:'5000',name:'مصارف',accountType:'expense',nature:'بدهکار',level:1,status:'فعال'}
    ],
    expenses:[{id:'e-1',date,title:'مصرف نمونه دفتر',expenseAccount:'مصارف اداری',currency:'AFN',amount:1200,cash:'صندوق افغانی (نمونه)',note:'داده آزمایشی',status:'موقت'}],
    remittance:[{id:'r-1',date,number:'TR-TEST-001',direction:'ارسالی',sender:'احمد رضایی (نمونه)',receiver:'محمد کریمی (نمونه)',branch:'نمایندگی مرکزی (نمونه)',currency:'AFN',amount:15000,fee:150,total:15150,status:'موقت',accountingStatus:'پیش‌نویس'}],
    exchange:[{id:'x-1',date,fromCurrency:'USD',fromAmount:100,toCurrency:'AFN',toAmount:7000,rate:70,party:'احمد رضایی (نمونه)',profit:120,cashFrom:'صندوق دالر (نمونه)',cashTo:'صندوق افغانی (نمونه)',note:'معامله ساختگی',accountingStatus:'پیش‌نویس'}],
    journal:[{id:'j-1',date,number:'JV-TEST-001',description:'سند آزمایشی افتتاحیه',debitAccount:'صندوق افغانی',creditAccount:'سرمایه',currency:'AFN',amount:250000,debitTotal:250000,creditTotal:250000,status:'موقت'}],
    ledger:[{id:'l-1',date,number:'GL-TEST-001',account:'صندوق افغانی',description:'سطر دفتر کل ساختگی',debit:250000,credit:0,currency:'AFN',status:'موقت'}],
    transactions:[
      {id:'t-1',date,type:'دریافت',partyType:'customer',party:'احمد رضایی (نمونه)',description:'واریز آزمایشی',currency:'AFN',amount:5000,cash:'صندوق افغانی (نمونه)',status:'موقت'},
      {id:'t-2',date,type:'پرداخت',partyType:'customer',party:'محمد کریمی (نمونه)',description:'پرداخت آزمایشی',currency:'USD',amount:-50,cash:'صندوق دالر (نمونه)',status:'موقت'}
    ],
    reports:[],activity:[{id:'act-1',date,action:'ساخت محیط آزمایشی',entity:'system',entityId:'sandbox',description:'داده‌های ساختگی اولیه بارگذاری شد.',status:'موفق'}],
    errors:[],profitByCurrency:[],profitAccounts:[],profitEntries:[{id:'p-1',date,accountId:'a-4',code:'4000',account:'درآمد معاملات',accountType:'revenue',currency:'AFN',amount:1200}],
    unclassifiedProfitLines:[],demoPreviewRecords:[]
  };
}
function readData() {
  try { const raw=localStorage.getItem(storageKey()); if(raw){const parsed=JSON.parse(raw); if(parsed&&Array.isArray(parsed.customers)&&Array.isArray(parsed.transactions)) return parsed;} } catch {}
  const initial=seedData(); writeData(initial); return initial;
}
function writeData(data){ try{localStorage.setItem(storageKey(),JSON.stringify(data));}catch{} return data; }
function addActivity(data,action,entity,description){data.activity=[{id:makeId(),date:today(),action,entity,entityId:'sandbox',description,status:'موفق'},...(data.activity||[])].slice(0,100);}
const MODULE_KEYS={customers:'customers',branches:'branches',cash:'cash',banks:'banks',currencies:'currencies',accounts:'accounts',expenses:'expenses',remittance:'remittance',exchange:'exchange',journal:'journal',transactions:'transactions'};
export async function loadVersion21Database(){const data=readData();return {data,exchange:{id:'sandbox-exchange',name:'صراف آزمایشی'},loadedAt:new Date().toISOString()};}
export async function saveVersion21Record(module,payload){
 const data=readData(); const row={...payload,id:payload.id||makeId(),status:payload.status||'موقت'};
 if(module==='cashAction'){data.transactions=[{...row,type:payload.kind||'گردش صندوق',date:payload.date||today(),amount:(payload.kind==='خرج'?-1:1)*Number(payload.amount||0)},...(data.transactions||[])];}
 else {const key=MODULE_KEYS[module];if(!key)throw new Error('این عملیات در محیط آزمایشی شبیه‌سازی نشده است.');const list=data[key]||[];const index=list.findIndex(x=>String(x.id)===String(payload.id));if(index>=0)list[index]=row;else list.unshift(row);data[key]=list;}
 addActivity(data,'ثبت/ویرایش',module,'رکورد فقط در حافظه محلی محیط آزمایشی ذخیره شد.');writeData(data);return {id:row.id,localOnly:true};
}
export async function editVersion21Record(module,payload){return saveVersion21Record(module,payload);}
export async function deleteVersion21Record(module,target){
 const data=readData();const key=MODULE_KEYS[module];if(!key)throw new Error('حذف این نوع رکورد در محیط آزمایشی پشتیبانی نمی‌شود.');data[key]=(data[key]||[]).filter(x=>String(x.id)!==String(target.id));addActivity(data,'حذف آزمایشی',module,'رکورد از داده‌های محلی آزمایشی حذف شد.');writeData(data);return {deleted:true,localOnly:true};
}
export async function deactivateVersion21MasterRecord(module,target){
 const data=readData();const key=MODULE_KEYS[module];if(!key)throw new Error('این بخش در محیط آزمایشی موجود نیست.');data[key]=(data[key]||[]).map(x=>String(x.id)===String(target.id)?{...x,status:'غیرفعال'}:x);addActivity(data,'غیرفعال‌سازی',module,'رکورد فقط در داده‌های محلی آزمایشی غیرفعال شد.');writeData(data);return {updated:true,localOnly:true};
}
export async function seedVersion21BaseAccounts(){const data=readData();const existing=new Set((data.accounts||[]).map(x=>String(x.code)));const rows=[['1020','بانک‌ها','asset','بدهکار'],['1030','حساب‌های دریافتنی','asset','بدهکار'],['2010','حساب‌های پرداختنی','liability','بستانکار'],['3000','سرمایه','equity','بستانکار'],['4010','درآمد خدمات','revenue','بستانکار'],['5010','مصارف اداری','expense','بدهکار']];let created=0;for(const [code,name,accountType,nature] of rows){if(!existing.has(code)){data.accounts.push({id:makeId(),code,name,accountType,nature,status:'فعال'});created++;}}writeData(data);return {created};}
export async function captureVersion21Error(error,context){const data=readData();data.errors=[{id:makeId(),date:today(),error_type:context||'sandbox',error_message:String(error?.message||error||'خطای آزمایشی'),device:'مرورگر',app_version:'sandbox',status:'ثبت محلی'},...(data.errors||[])].slice(0,100);writeData(data);return {localOnly:true};}
export async function saveDemoPreviewRecord(module,payload,recordId=null){return saveVersion21Record(module,{...payload,id:recordId||payload.id});}
export async function deleteDemoPreviewRecord(recordId){const data=readData();for(const key of Object.keys(MODULE_KEYS))data[key]=(data[key]||[]).filter(x=>String(x.id)!==String(recordId));writeData(data);return {deleted:true,localOnly:true};}
