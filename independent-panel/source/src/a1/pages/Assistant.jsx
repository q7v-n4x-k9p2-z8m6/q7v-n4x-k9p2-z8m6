// a1/pages/Assistant.jsx — دستیار محلی (ساختار: src/pages/Assistant.jsx سورس A1)
// این دستیار به هیچ مدل یا سرویس بیرونی وصل نیست؛ پاسخ‌ها از جمع‌های دفتر کل محلی ساخته می‌شوند.
import React, { useState } from 'react';
import { Bot, Send, ShieldCheck } from 'lucide-react';
import { all } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

const money = value => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 }).format(Number(value) || 0);

const num = value => Number(value ?? 0) || 0;

async function answer(question) {
  const user = currentUser();
  const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
  const [ledger, customers, docs] = await Promise.all([all('ledger_entries'), all('customers'), all('documents')]);
  const tenant = row => !row.exchange_code || row.exchange_code === code;
  const entries = ledger.filter(row => tenant(row) && !row.deleted);

  if (/سند|روزنامچه|ثبت/.test(question)) {
    return `در این دستگاه ${money(docs.filter(tenant).length)} سند ثبت شده است. ثبت سند جدید از ماژول «دفتر روزنامچه» یا بخش عملیات میز کار انجام می‌شود.`;
  }

  if (/بدهکار|بستانکار|مشتری/.test(question)) {
    const byCustomer = new Map();
    entries.filter(row => row.account_type === 'customer').forEach(row => {
      const key = row.account_name || 'مشتری';
      byCustomer.set(key, num(byCustomer.get(key)) + num(row.debit) - num(row.credit));
    });
    const open = [...byCustomer.entries()].filter(([, balance]) => Math.abs(balance) > 0.004);
    if (!open.length) return 'ماندهٔ بازی برای مشتریان ثبت نشده است.';
    return 'ماندهٔ مشتریان: ' + open.slice(0, 5).map(([name, balance]) => `${name} ${money(Math.abs(balance))} ${balance > 0 ? 'بدهکار' : 'بستانکار'}`).join(' · ');
  }

  if (/صندوق|موجودی|نقد/.test(question)) {
    const byCurrency = new Map();
    entries.filter(row => row.account_type === 'cash').forEach(row => {
      const key = row.currency || 'AFN';
      byCurrency.set(key, num(byCurrency.get(key)) + num(row.debit) - num(row.credit));
    });
    if (!byCurrency.size) return 'گردش صندوقی در دفتر کل ثبت نشده است.';
    return 'موجودی صندوق‌ها بر پایهٔ دفتر کل: ' + [...byCurrency.entries()].map(([currency, balance]) => `${currency} ${money(balance)}`).join(' · ');
  }

  if (/مشتریان|تعداد/.test(question)) {
    return `${money(customers.filter(tenant).length)} مشتری در این صراف ثبت شده است. فهرست کامل در بخش «مشتریان» است.`;
  }

  return 'این دستیار نمایشی فقط سه پرسش را پاسخ می‌دهد: موجودی صندوق‌ها، ماندهٔ مشتریان و تعداد اسناد ثبت‌شده. برای پرسش دیگر، عبارت «صندوق»، «مشتری» یا «سند» را در جمله بیاورید.';
}

export default function Assistant() {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [busy, setBusy] = useState(false);

  const ask = async event => {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true);
    setThread(prev => [...prev, { role: 'user', text }]);
    setQuestion('');
    try {
      const reply = await answer(text);
      setThread(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setThread(prev => [...prev, { role: 'assistant', text: 'پاسخ‌دهی انجام نشد: ' + (error?.message || 'خطای نامشخص') }]);
    } finally { setBusy(false); }
  };

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><Bot className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">دستیار هوش مصنوعی (نمایشی)</h1>
          <p className="text-[10px] text-slate-500">پاسخ از دادهٔ محلی · بدون مدل و بدون اینترنت</p>
        </div>
      </header>

      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10.5px] leading-6 text-amber-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        در این پیش‌نمایش هیچ درخواستی به سرویس هوش مصنوعی ارسال نمی‌شود؛ پاسخ‌ها با جمع‌زدن ردیف‌های دفتر کل همین دستگاه ساخته می‌شوند.
      </p>

      <section className="min-h-[240px] space-y-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        {!thread.length ? <p className="py-6 text-center text-[11px] text-slate-500">پرسش خود را بنویسید؛ مثلاً «موجودی صندوق‌ها چقدر است؟»</p>
          : thread.map((item, index) => (
            <div key={index} className={'rounded-lg p-2 text-[11px] ' + (item.role === 'user' ? 'bg-[#eaf2fa] text-[#102b4c]' : 'border border-[#eef3f7] bg-[#f9fbfd] text-slate-700')}>
              <b className="mb-1 block text-[10px] text-[#1e4776]">{item.role === 'user' ? 'شما' : 'دستیار'}</b>
              {item.text}
            </div>
          ))}
        {busy ? <p className="text-[10.5px] text-slate-500">در حال محاسبه…</p> : null}
      </section>

      <form onSubmit={ask} className="flex gap-1.5">
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="مثلاً ماندهٔ مشتریان چقدر است؟" className="h-9 w-full rounded-lg border border-[#d5e2f0] bg-white px-2 text-[12px]" />
        <button type="submit" disabled={busy} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#164b87] px-3 text-[11px] font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> پرسش</button>
      </form>
    </div>
  );
}