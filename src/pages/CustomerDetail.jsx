import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTransactions, useCustomers, useUpdateCustomer, useCustomerLedgerBalances } from '@/lib/useSarraaf';
import { PageHeader, BalanceCard, EmptyState, LoadingState, StatusBadge } from '@/components/sarraaf/Pieces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TX_TYPE_LABELS, CUSTOMER_TYPE_LABELS, formatDate, formatNumber, formatAmount } from '@/lib/sarraaf';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ArrowLeftRight, TrendingUp, Send, Download, Repeat, Pencil } from 'lucide-react';

const QUICK_ACTIONS = (id) => [
  { label: 'دریافت', path: `/dadogereft?customer=${id}`, icon: ArrowLeftRight },
  { label: 'خرید', path: `/trade?customer=${id}&mode=buy`, icon: TrendingUp },
  { label: 'فروش', path: `/trade?customer=${id}&mode=sell`, icon: TrendingUp },
  { label: 'حواله ارسال', path: `/transfers/send?customer=${id}`, icon: Send },
  { label: 'حواله دریافت', path: `/transfers/receive?customer=${id}`, icon: Download },
  { label: 'تبدیل', path: `/convert?customer=${id}`, icon: Repeat },
];

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customers } = useCustomers();
  const { data: txs, isLoading } = useTransactions({ customer_id: id });
  const { data: customerBalancesData } = useCustomerLedgerBalances();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const updateMut = useUpdateCustomer();

  const customer = (customers || []).find(c => c.id === id);
  const balances = {};
  for (const item of (customerBalancesData || [])) {
    if (String(item.customer_id) === String(id)) {
      const currency = item.currency || 'AFN';
      balances[currency] = (balances[currency] || 0) + (Number(item.net_balance) || 0);
    }
  }
  if (customer && Number(customer.opening_balance)) {
    const currency = customer.balance_currency || 'AFN';
    balances[currency] = (balances[currency] || 0) + Number(customer.opening_balance);
  }
  const transactionTotals = {};
  for (const tx of (txs || [])) {
    if (tx.deleted) continue;
    const currency = tx.currency || 'AFN';
    const total = transactionTotals[currency] || { debit: 0, credit: 0 };
    const amount = Number(tx.amount) || 0;
    if (tx.customer_side === 'debit') total.debit += amount;
    if (tx.customer_side === 'credit') total.credit += amount;
    transactionTotals[currency] = total;
  }

  if (!customers) return <LoadingState />;
  if (!customer) return <EmptyState title="مشتری یافت نشد" />;

  const openEdit = () => {
    setForm({
      name: customer.name || '', phone: customer.phone || '', code: customer.code || '',
      customer_type: customer.customer_type || 'permanent', status: customer.status || 'active',
      notes: customer.notes || '',
    });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateMut.mutateAsync({ id: customer.id, data: form });
    setEditOpen(false);
  };

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={customer.code || ''}
        actions={
          <Button size="sm" variant="outline" onClick={openEdit}>
            <Pencil className="w-4 h-4" /> ویرایش
          </Button>
        }
      />

      {/* Info Chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {customer.phone && <span className="px-2 py-1 rounded-lg bg-muted text-xs">{customer.phone}</span>}
        {customer.customer_type && <span className="px-2 py-1 rounded-lg bg-muted text-xs">{CUSTOMER_TYPE_LABELS[customer.customer_type]}</span>}
        <StatusBadge status={customer.status} labels={{ active: 'فعال', inactive: 'غیرفعال' }} />
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {Object.keys(balances).length === 0 ? (
          <BalanceCard label="موجودی" amounts={{ AFN: 0 }} />
        ) : (
          Object.entries(balances).map(([cur, val]) => (
            <BalanceCard key={cur} label={`موجودی ${cur}`} amounts={{ [cur]: val }} accent={val >= 0 ? 'text-success' : 'text-destructive'} />
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {QUICK_ACTIONS(id).map(a => {
          const Icon = a.icon;
          return (
            <Link key={a.label} to={a.path} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 hover:bg-muted">
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-medium">{a.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Transactions */}
      <h3 className="text-sm font-semibold mb-2">گردش حساب</h3>
      {isLoading ? (
        <LoadingState />
      ) : (txs || []).length === 0 ? (
        <EmptyState title="تراکنشی وجود ندارد" />
      ) : (
        <div className="w-full overflow-x-auto rounded-xl border border-[#e0e9f3] bg-white shadow-sm">
          <table dir="rtl" className="w-full min-w-[900px] border-collapse text-right text-xs">
            <thead className="sticky top-0 bg-[#174b7d] text-white">
              <tr>
                <th className="whitespace-nowrap border-l border-white/15 px-3 py-3 font-bold">تاریخ</th>
                <th className="whitespace-nowrap border-l border-white/15 px-3 py-3 font-bold">شماره سند</th>
                <th className="whitespace-nowrap border-l border-white/15 px-3 py-3 font-bold">نوع عملیات</th>
                <th className="whitespace-nowrap border-l border-white/15 px-3 py-3 font-bold">شرح</th>
                <th className="whitespace-nowrap border-l border-white/15 px-3 py-3 font-bold">مبلغ</th>
                <th className="whitespace-nowrap border-l border-white/15 px-3 py-3 font-bold">ارز</th>
                <th className="whitespace-nowrap px-3 py-3 font-bold">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {(txs || []).map((tx, index) => (
                <tr
                  key={tx.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/receipt?type=tx&id=${tx.id}`)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/receipt?type=tx&id=${tx.id}`);
                    }
                  }}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-blue-50',
                    index % 2 === 1 && 'bg-[#f7faff]'
                  )}
                >
                  <td className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3">{formatDate(tx.date || tx.created_at) || '—'}</td>
                  <td className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3" dir="ltr">{tx.document_no || '—'}</td>
                  <td className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3 font-semibold">{TX_TYPE_LABELS[tx.type] || tx.type || '—'}</td>
                  <td className="min-w-[220px] border-b border-[#e5edf5] px-3 py-3">{tx.description || '—'}</td>
                  <td className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3 font-bold tabular-nums">{formatNumber(tx.amount || 0)}</td>
                  <td className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3">{tx.currency || '—'}</td>
                  <td className="whitespace-nowrap border-b border-[#e5edf5] px-3 py-3">
                    {tx.deleted ? <StatusBadge status="inactive" labels={{ inactive: 'باطل‌شده' }} /> : tx.edited ? <StatusBadge status="active" labels={{ active: 'ویرایش‌شده' }} /> : <span className="text-muted-foreground">ثبت‌شده</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#eaf1f9] text-foreground font-bold">
              <tr>
                <td colSpan={7} className="border-t-2 border-[#174b7d] px-3 py-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {Object.entries(transactionTotals).map(([currency, total]) => (
                      <span key={currency} className="whitespace-nowrap">
                        {currency}: جمع بدهکار {formatAmount(total.debit, currency)} · جمع بستانکار {formatAmount(total.credit, currency)} ·
                        مانده حساب {formatAmount(Math.abs(balances[currency] || 0), currency)} {(balances[currency] || 0) > 0 ? 'بدهکار' : (balances[currency] || 0) < 0 ? 'بستانکار' : 'تسویه'}
                      </span>
                    ))}
                    {Object.entries(balances).filter(([currency]) => !transactionTotals[currency]).map(([currency, balance]) => (
                      <span key={currency} className="whitespace-nowrap">
                        {currency}: جمع گردش ۰ · مانده حساب {formatAmount(Math.abs(balance), currency)} {balance > 0 ? 'بدهکار' : balance < 0 ? 'بستانکار' : 'تسویه'}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ویرایش مشتری</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div><Label>نام</Label><Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><Label>موبایل</Label><Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><Label>کد</Label><Input value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>نوع</Label>
                <Select value={form.customer_type} onValueChange={v => setForm({...form, customer_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">دائمی</SelectItem>
                    <SelectItem value="temporary">موقت</SelectItem>
                    <SelectItem value="misc">متفرقه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>وضعیت</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>یادداشت</Label><Input value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={updateMut.isPending}>ذخیره</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}