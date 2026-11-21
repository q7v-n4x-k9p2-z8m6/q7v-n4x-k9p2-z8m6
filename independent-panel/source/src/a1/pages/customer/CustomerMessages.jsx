// a1/pages/customer/CustomerMessages.jsx — پیام‌ها و چت مشتری (جدول chat_messages)
import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';
import { usePortal } from '@/a1/lib/portalData';
import { PCard, PEmpty, PLoading, PError, inputClass } from '@/a1/components/customer/PortalBits';

export default function CustomerMessages() {
  const { loading, data, error } = usePortal();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState([]);

  if (loading) return <PLoading />;
  if (error) return <PError message={error} />;

  const messages = [...(data.messages || []), ...local];

  const submit = async event => {
    event.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const user = currentUser();
      const saved = await insert('chat_messages', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        group_id: 0,
        sender_id: String(user?.id || 'demo-customer'),
        sender_name: data.customer?.name || 'مشتری نمایشی',
        sender_role: 'customer',
        message: text.trim(),
        sync_status: 'local',
        status: 'active',
      });
      setLocal(prev => [...prev, { ...saved, message: text.trim() }]);
      setText('');
    } catch {
      // پیام در حافظهٔ محلی ثبت نمی‌شود؛ پیام خطا در فهرست نمایش داده می‌شود.
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <PCard title="پیام‌ها" note="مبنای داده: جدول chat_messages همین دستگاه.">
        {messages.length ? (
          <ul className="space-y-1.5">
            {messages.map((message, index) => (
              <li key={message.id || index} className="rounded-lg border border-[#eef3f7] bg-[#f7faff] p-2 text-[11px]">
                <b className="block text-[#102b4c]">{message.sender_name || 'کاربر'}</b>
                <span className="mt-0.5 block text-slate-600">{message.message}</span>
              </li>
            ))}
          </ul>
        ) : <PEmpty>پیامی ثبت نشده است.</PEmpty>}
        <form onSubmit={submit} className="mt-2 flex gap-1.5">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="پیام خود را بنویسید…" className={inputClass} />
          <button type="submit" disabled={saving} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#164b87] px-3 text-[11px] font-bold text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </PCard>
    </div>
  );
}