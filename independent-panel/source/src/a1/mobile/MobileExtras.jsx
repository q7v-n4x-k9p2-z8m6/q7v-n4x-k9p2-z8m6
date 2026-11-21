// a1/mobile/MobileExtras.jsx — چهار ماژول تکمیلی در حالت نمایشی و فقط‌حافظه‌ای
import React, { useState } from 'react';
import { Send, ChevronLeft, Bot, ShoppingBag, Plus, Languages, Check } from 'lucide-react';
import { useMobileDemo } from '@/a1/mobile/MobileDemoContext';
import { fmt, currencyLabel, cashBalance, partyTotals } from '@/a1/mobile/demoData';

const LANGUAGES = ['فارسی', 'دری', 'English', 'العربية'];

function ChatBody() {
  const demo = useMobileDemo();
  const [groupId, setGroupId] = useState(null);
  const [text, setText] = useState('');
  const groups = demo.data.chatGroups || [];
  const group = groups.find((row) => row.id === groupId);

  const send = () => {
    const message = text.trim();
    if (!message || !group) return;
    demo.setCollection('chatGroups', (rows) => rows.map((row) => (row.id === group.id
      ? { ...row, messages: [...(row.messages || []), { id: 'mm-' + Date.now(), author: 'من', text: message, time: 'الآن' }] }
      : row)));
    setText('');
  };

  if (!group) {
    return (
      <div style={{ display: 'grid', gap: 7 }}>
        {groups.map((row) => (
          <button key={row.id} type="button" className="a1m-listrow" onClick={() => setGroupId(row.id)}>
            <span className="a1m-listrow__icon"><Send className="h-4 w-4" /></span>
            <span className="a1m-listrow__body">
              <b className="a1m-listrow__title">{row.title}</b>
              <small className="a1m-listrow__sub">{fmt(row.members)} عضو · {(row.messages || []).length} پیام نمایشی</small>
            </span>
            <ChevronLeft className="h-4 w-4" style={{ color: '#9bb0c4' }} />
          </button>
        ))}
        {!groups.length ? <div className="a1m-empty">هیچ گروهی در نمای نمایشی وجود ندارد.</div> : null}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      <button type="button" className="a1m-btn" onClick={() => setGroupId(null)} style={{ height: 36 }}>بازگشت به فهرست گروه‌ها</button>
      <section className="a1m-group" style={{ marginBottom: 0 }}>
        <h3 className="a1m-group__title"><span className="a1m-group__dot" />{group.title}</h3>
        <div style={{ display: 'grid', gap: 6 }}>
          {(group.messages || []).map((message) => (
            <div key={message.id} className="a1m-card" style={{ background: message.author === 'من' ? '#f0f8ff' : '#fff' }}>
              <div className="a1m-card__top">
                <b className="a1m-card__title" style={{ fontSize: 10.5 }}>{message.author}</b>
                <span className="a1m-badge">{message.time}</span>
              </div>
              <p style={{ marginTop: 5, fontSize: 11, lineHeight: 1.8 }}>{message.text}</p>
            </div>
          ))}
          {!(group.messages || []).length ? <div className="a1m-empty">پیامی ثبت نشده است.</div> : null}
        </div>
      </section>
      <div className="a1m-toolbar__row">
        <div className="a1m-search"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="پیام نمایشی..." /></div>
        <button type="button" className="a1m-btn a1m-btn--primary" style={{ flex: '0 0 auto', width: 46, padding: 0 }} onClick={send} aria-label="ارسال پیام">
          <Send className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const answerFor = (question, data) => {
  const text = question.trim();
  if (!text) return '';
  if (/صندوق|موجودی|نقد/.test(text)) {
    const lines = (data.cash || []).slice(0, 5).map((safe) => safe.name + ': ' + fmt(cashBalance(data, safe)) + ' ' + currencyLabel(safe.currency));
    return lines.length ? 'موجودی نمایشی صندوق‌ها:\n' + lines.join('\n') : 'صندوقی در نمای نمایشی نیست.';
  }
  if (/بدهکار|بستانکار|مشتری/.test(text)) {
    const rows = (data.customers || []).slice(0, 4).map((customer) => {
      const totals = partyTotals(data, 'customer', customer.name, customer.opening, customer.currency);
      const net = totals.reduce((sum, item) => sum + item.net, 0);
      return customer.name + ': ' + fmt(Math.abs(net)) + ' ' + currencyLabel(customer.currency) + (net > 0 ? ' (بدهکار)' : net < 0 ? ' (بستانکار)' : ' (تسویه)');
    });
    return rows.length ? 'مانده نمایشی مشتریان:\n' + rows.join('\n') : 'مشتری‌ای ثبت نشده است.';
  }
  if (/حواله/.test(text)) {
    return 'در نمای نمایشی ' + fmt((data.remittance || []).length) + ' حواله وجود دارد؛ جزئیات در «دفتر حواله‌ها» است.';
  }
  if (/مصرف|هزینه/.test(text)) {
    const total = (data.expenses || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return 'جمع نمایشی مصارف: ' + fmt(total) + ' (مجموع ارزهای مختلف، فقط برای نمایش).';
  }
  return 'این پاسخ‌گو فقط نمایشی است و به مدل یا سرویس بیرونی وصل نیست. پرسش‌های نمونه: «موجودی صندوق‌ها»، «مانده مشتریان»، «حواله‌ها»، «مصارف».';
};

function AssistantBody() {
  const { data } = useMobileDemo();
  const [messages, setMessages] = useState([
    { id: 'a0', role: 'bot', text: 'سلام؛ پاسخ‌گوی نمایشی حساب صراف هستم. پرسش‌های نمونه: موجودی صندوق‌ها، مانده مشتریان، حواله‌ها، مصارف.' },
  ]);
  const [text, setText] = useState('');

  const ask = () => {
    const question = text.trim();
    if (!question) return;
    setMessages((current) => [
      ...current,
      { id: 'u-' + Date.now(), role: 'user', text: question },
      { id: 'b-' + Date.now(), role: 'bot', text: answerFor(question, data) },
    ]);
    setText('');
  };

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      <div style={{ display: 'grid', gap: 7 }}>
        {messages.map((message) => (
          <div key={message.id} className="a1m-card" style={{ background: message.role === 'user' ? '#eff7ff' : '#fff' }}>
            <div className="a1m-card__top">
              <b className="a1m-card__title" style={{ fontSize: 10.5 }}>{message.role === 'user' ? 'من' : 'دستیار نمایشی'}</b>
              <Bot className="h-3.5 w-3.5" style={{ color: '#7f97ad' }} />
            </div>
            <p style={{ marginTop: 5, fontSize: 11, lineHeight: 1.9, whiteSpace: 'pre-line' }}>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="a1m-toolbar__row">
        <div className="a1m-search"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="پرسش نمایشی..." /></div>
        <button type="button" className="a1m-btn a1m-btn--primary" style={{ flex: '0 0 auto', width: 46, padding: 0 }} onClick={ask} aria-label="ارسال پرسش">
          <Send className="mx-auto h-4 w-4" />
        </button>
      </div>
      <p className="a1m-note a1m-note--info">هیچ مدل هوش مصنوعی فراخوانی نمی‌شود؛ پاسخ‌ها از دادهٔ همان حافظه ساخته می‌شوند.</p>
    </div>
  );
}

function ProductsBody() {
  const demo = useMobileDemo();
  const [category, setCategory] = useState('همه');
  const products = demo.data.products || [];
  const categories = ['همه', ...new Set(products.map((row) => row.category))];
  const visible = category === 'همه' ? products : products.filter((row) => row.category === category);

  const order = (product) => {
    demo.setCollection('orders', (rows) => [{ id: 'or-' + Date.now(), name: product.name, at: new Date().toLocaleDateString('en-CA'), status: 'ثبت نمایشی' }, ...rows]);
  };

  return (
    <div style={{ display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={'a1m-badge' + (category === item ? ' a1m-badge--blue' : '')}
            style={{ padding: '7px 10px', fontSize: 10 }}
          >
            {item}
          </button>
        ))}
      </div>
      {visible.map((product) => (
        <div key={product.id} className="a1m-card">
          <div className="a1m-card__top">
            <div>
              <b className="a1m-card__title">{product.name}</b>
              <div className="a1m-card__sub">{product.category}</div>
            </div>
            <span className="a1m-amount">{fmt(product.price)} {currencyLabel(product.currency)}</span>
          </div>
          <button type="button" className="a1m-btn" style={{ height: 34, marginTop: 8 }} onClick={() => order(product)}>
            <Plus className="mx-auto h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <section className="a1m-section" style={{ marginTop: 4 }}>
        <div className="a1m-section__head"><h2 className="a1m-section__title">سفارش‌های نمایشی</h2></div>
        <div style={{ display: 'grid', gap: 6 }}>
          {(demo.data.orders || []).map((row) => (
            <div key={row.id} className="a1m-card">
              <div className="a1m-card__top">
                <b className="a1m-card__title" style={{ fontSize: 11 }}>{row.name}</b>
                <span className="a1m-badge a1m-badge--gold">{row.status}</span>
              </div>
              <div className="a1m-card__sub">{row.at}</div>
            </div>
          ))}
          {!(demo.data.orders || []).length ? <div className="a1m-empty">سفارشی ثبت نشده است.</div> : null}
        </div>
      </section>
      <p className="a1m-note">سفارش‌ها فقط به همین حافظه اضافه می‌شوند؛ هیچ پرداخت، اپراتور یا سرویس بیرونی فراخوانی نمی‌شود.</p>
    </div>
  );
}

function LanguageBody() {
  const demo = useMobileDemo();
  const current = demo.data.settings?.language || 'فارسی';
  return (
    <div style={{ display: 'grid', gap: 7 }}>
      {LANGUAGES.map((language) => (
        <button key={language} type="button" className="a1m-menu__item" style={{ borderRadius: 12, borderBottom: 0, background: current === language ? '#eaf4fc' : '#fff', border: '1px solid #e2eaf3' }} onClick={() => demo.updateSettings({ language })}>
          <Languages className="h-4 w-4" style={{ color: '#17527f' }} />
          <span style={{ flex: 1 }}>{language}</span>
          {current === language ? <Check className="h-4 w-4" style={{ color: '#1f7a4d' }} /> : null}
        </button>
      ))}
      <p className="a1m-note a1m-note--info">انتخاب زبان فقط در همین حافظه نگه داشته می‌شود و متن‌های برنامه را تغییر نمی‌دهد.</p>
    </div>
  );
}

export default function MobileExtras({ moduleId }) {
  if (moduleId === 'sarraafGroups') return <ChatBody />;
  if (moduleId === 'assistant') return <AssistantBody />;
  if (moduleId === 'products') return <ProductsBody />;
  if (moduleId === 'language') return <LanguageBody />;
  return <div className="a1m-empty">این بخش در نمای نمایشی موجود نیست.</div>;
}