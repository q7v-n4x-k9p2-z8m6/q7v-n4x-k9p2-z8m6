// a1/pages/Chat.jsx — گروه‌ها و گفت‌وگوی صرافان (ساختار: ChatGroups / ChatGroupDetail / SarraafChat سورس A1)
// پیام‌ها فقط در جدول‌های chat_groups و chat_messages همین دستگاه ذخیره می‌شوند؛ هیچ کانال بیرونی وجود ندارد.
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, MessageSquare, Plus, Send, Users } from 'lucide-react';
import { all, insert } from '@/a1/lib/db';
import { currentUser, DEMO_EXCHANGE_CODE } from '@/a1/lib/v21Session';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, groups: [], messages: [], error: '' });
  const [groupName, setGroupName] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const user = currentUser();
      const code = user?.exchange_code || DEMO_EXCHANGE_CODE;
      const [groups, messages] = await Promise.all([all('chat_groups'), all('chat_messages')]);
      const inTenant = row => !row.exchange_code || row.exchange_code === code;
      setState({
        loading: false,
        groups: groups.filter(inTenant),
        messages: messages.filter(row => inTenant(row) && (!id || String(row.group_id) === String(id))),
        error: '',
      });
    } catch (error) {
      setState({ loading: false, groups: [], messages: [], error: error?.message || 'خواندن گفت‌وگوها ناموفق بود.' });
    }
  };

  useEffect(() => { load(); }, [id]);

  const createGroup = async event => {
    event.preventDefault();
    if (!groupName.trim() || busy) return;
    setBusy(true);
    try {
      const user = currentUser();
      const saved = await insert('chat_groups', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        name: groupName.trim(), created_by_name: user?.full_name || 'کاربر نمایشی',
        status: 'active', members_count: 1, channel: 'local-demo',
      });
      setGroupName('');
      await load();
      navigate(`/chat/group/${saved.id}`);
    } catch (error) {
      setNotice('ساخت گروه انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setBusy(false); }
  };

  const send = async event => {
    event.preventDefault();
    if (!text.trim() || !id || busy) return;
    setBusy(true);
    try {
      const user = currentUser();
      await insert('chat_messages', {
        exchange_code: user?.exchange_code || DEMO_EXCHANGE_CODE,
        group_id: Number(id), sender_id: String(user?.id || ''), sender_name: user?.full_name || 'کاربر نمایشی',
        sender_role: user?.role || 'sarraaf', message: text.trim(), sync_status: 'local', status: 'active',
      });
      setText('');
      await load();
    } catch (error) {
      setNotice('ارسال پیام انجام نشد: ' + (error?.message || 'خطای نامشخص'));
    } finally { setBusy(false); }
  };

  const current = state.groups.find(group => String(group.id) === String(id));

  return (
    <div dir="rtl" lang="fa" className="space-y-3 text-[#253746]">
      <header className="flex items-center gap-2 rounded-xl border border-[#c9d7e3] bg-white p-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e4776] text-white"><MessageSquare className="h-5 w-5" /></span>
        <div>
          <h1 className="text-sm font-extrabold text-[#1e4776]">{current ? current.name : 'گروه و چت صرافان'}</h1>
          <p className="text-[10px] text-slate-500">گفت‌وگوی محلی همین دستگاه · بدون سرور پیام</p>
        </div>
      </header>

      {current ? (
        <>
          <button type="button" onClick={() => navigate('/chat')} className="rounded-lg border border-[#c9d7e3] bg-white px-2.5 py-1.5 text-[11px] text-[#1e4776]">بازگشت به گروه‌ها</button>
          <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
            <div className="max-h-[46vh] space-y-1.5 overflow-y-auto p-3">
              {state.loading ? <p className="py-5 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
                : !state.messages.length ? <p className="py-5 text-center text-[11px] text-slate-500">پیامی در این گروه ثبت نشده است.</p>
                  : state.messages.map(row => (
                    <div key={row.id} className="rounded-lg border border-[#eef3f7] bg-[#f7faff] p-2 text-[11px]">
                      <b className="block text-[#102b4c]">{row.sender_name || 'کاربر'}</b>
                      <span className="mt-0.5 block text-slate-600">{row.message}</span>
                    </div>
                  ))}
            </div>
            <form onSubmit={send} className="flex gap-1.5 border-t border-[#eef3f7] p-2">
              <input value={text} onChange={e => setText(e.target.value)} placeholder="پیام خود را بنویسید…" className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2 text-[12px]" />
              <button type="submit" disabled={busy} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#164b87] px-3 text-[11px] font-bold text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </section>
        </>
      ) : (
        <>
          <form onSubmit={createGroup} className="flex gap-1.5 rounded-xl border border-[#c9d7e3] bg-white p-3">
            <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="نام گروه جدید…" className="h-9 w-full rounded-lg border border-[#d5e2f0] px-2 text-[12px]" />
            <button type="submit" disabled={busy} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#164b87] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> گروه</button>
          </form>
          {notice ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10.5px] text-rose-800">{notice}</p> : null}

          <section className="overflow-hidden rounded-xl border border-[#c9d7e3] bg-white">
            <h2 className="border-b border-[#eef3f7] bg-[#f7fafd] px-3 py-2 text-[11px] font-bold text-[#1e4776]">گروه‌ها</h2>
            {state.loading ? <p className="p-5 text-center text-[11px] text-slate-500">در حال بارگذاری…</p>
              : state.error ? <p className="p-5 text-center text-[11px] text-rose-700">{state.error}</p>
                : !state.groups.length ? <p className="p-5 text-center text-[11px] text-slate-500">گروهی ساخته نشده است.</p>
                  : (
                    <ul className="divide-y divide-[#eef3f7]">
                      {state.groups.map(group => (
                        <li key={group.id}>
                          <button type="button" onClick={() => navigate(`/chat/group/${group.id}`)} className="flex w-full items-center gap-2 p-3 text-right text-[11px] hover:bg-[#f7faff]">
                            <Users className="h-4 w-4 text-[#1e4776]" />
                            <b className="min-w-0 flex-1 truncate text-[#102b4c]">{group.name}</b>
                            <span className="shrink-0 text-[9px] text-slate-400">{group.status === 'active' ? 'فعال' : group.status || ''}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
          </section>
        </>
      )}
    </div>
  );
}