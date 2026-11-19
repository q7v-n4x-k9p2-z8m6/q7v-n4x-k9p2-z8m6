import React, { useState } from 'react';
import { useAgents, useAgentLedgerBalances, useCreateAgent, useUpdateAgent } from '@/lib/useSarraaf';
import { PageHeader, EmptyState, LoadingState } from '@/components/sarraaf/Pieces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatNumber, formatAmount } from '@/lib/sarraaf';
import { Network, Plus, Pencil, Send, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Agents() {
  const { data: agents, isLoading } = useAgents();
  const { data: agentBalancesData } = useAgentLedgerBalances();
  const createMut = useCreateAgent();
  const updateMut = useUpdateAgent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', city: '', code: '', status: 'active', notes: '' });

  const openCreate = () => { setEditId(null); setForm({ name: '', phone: '', city: '', code: '', status: 'active', notes: '' }); setDialogOpen(true); };
  const openEdit = (a) => { setEditId(a.id); setForm({ name: a.name, phone: a.phone, city: a.city, code: a.code, status: a.status, notes: a.notes }); setDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) await updateMut.mutateAsync({ id: editId, data: form });
    else await createMut.mutateAsync(form);
    setDialogOpen(false);
  };

  const getAgentBal = (agentId) => {
    const result = {};
    for (const row of (agentBalancesData || [])) {
      if (String(row.agent_id) === String(agentId)) {
        const currency = row.currency || 'AFN';
        result[currency] = (result[currency] || 0) + (Number(row.balance) || 0);
      }
    }
    return result;
  };
  const totalsByCurrency = {};
  for (const row of (agentBalancesData || [])) {
    const currency = row.currency || 'AFN';
    totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + (Number(row.balance) || 0);
  }

  return (
    <>
      <PageHeader title="نمایندگی‌ها" icon={Network}
        actions={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> افزودن</Button>}
      />
      {isLoading ? <LoadingState /> : (agents || []).length === 0 ? <EmptyState icon={Network} title="نماینده‌ای نیست" /> : (
        <div className="w-full overflow-x-auto rounded-xl border bg-card">
          <table dir="rtl" className="w-full min-w-[850px] border-collapse text-right text-xs">
            <thead className="bg-muted/80">
              <tr>
                <th className="border-b px-3 py-3">نام نمایندگی</th>
                <th className="border-b px-3 py-3">کد</th>
                <th className="border-b px-3 py-3">تماس / شهر</th>
                <th className="border-b px-3 py-3">مانده به تفکیک ارز</th>
                <th className="border-b px-3 py-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {(agents || []).map((a, index) => {
                const bal = getAgentBal(a.id);
                return (
                  <tr key={a.id} className={index % 2 ? 'bg-muted/20' : ''}>
                    <td className="border-b px-3 py-3 font-semibold whitespace-nowrap">{a.name || '—'}</td>
                    <td className="border-b px-3 py-3 whitespace-nowrap">{a.code || '—'}</td>
                    <td className="border-b px-3 py-3 whitespace-nowrap">{[a.phone, a.city].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="border-b px-3 py-3">
                      {Object.entries(bal).map(([cur, val]) => <span key={cur} className="inline-block ml-3 whitespace-nowrap font-bold">{formatAmount(Math.abs(val), cur)} {val > 0 ? 'بدهکار' : val < 0 ? 'بستانکار' : ''}</span>)}
                      {Object.keys(bal).length === 0 ? '—' : ''}
                    </td>
                    <td className="border-b px-3 py-3 whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Link to={`/transfers/send?agent=${a.id}`}><Button size="sm" variant="outline"><Send className="w-3.5 h-3.5" /> ارسال</Button></Link>
                      <Link to={`/transfers/receive?agent=${a.id}`}><Button size="sm" variant="outline"><Download className="w-3.5 h-3.5" /> دریافت</Button></Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#eaf1f9] font-bold">
              <tr><td colSpan={5} className="border-t-2 border-primary px-3 py-3">
                جمع حساب نمایندگی‌ها: {Object.entries(totalsByCurrency).map(([cur, val]) => <span key={cur} className="inline-block ml-4 whitespace-nowrap">{cur}: {formatAmount(Math.abs(val), cur)} {val > 0 ? 'بدهکار' : val < 0 ? 'بستانکار' : 'تسویه'}</span>)}
              </td></tr>
            </tfoot>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'ویرایش نماینده' : 'افزودن نماینده'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><Label>نام</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>موبایل</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              <div><Label>کد</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></div>
            </div>
            <div><Label>شهر</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>ذخیره</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}