// a1/pages/Cash.jsx
// انتقال مستقیم صفحهٔ صندوق از reference/A1-extracted-source-temp/src/pages/Cash.jsx
// تغییرات فقط در مسیر واردات (لایهٔ محلی A1) است؛ منطق، متن‌ها و ساختار دست‌نخورده مانده‌اند.
import React, { useState } from 'react';
import { useTransactions, useBankAccounts, useSafes, useCreateSafe, useUpdateSafe, useCurrencies, usePostDocument, useTreasuryBalances } from '@/a1/lib/store';
import { PageHeader, BalanceCard, EmptyState, LoadingState } from '@/a1/components/Pieces';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelect, AmountInput } from '@/a1/components/Fields';
import { TX_TYPE_LABELS, formatDate, formatNumber, formatAmount } from '@/a1/lib/format';
import { buildTransferLines, buildOpeningBalanceLines } from '@/a1/lib/ledgerApi';
import { toast } from '@/components/ui/use-toast';
import { Banknote, ArrowRightLeft, Plus, Pencil, Loader2 } from 'lucide-react';

export default function Cash() {
  const { data: txs, isLoading } = useTransactions();
  const { data: bankAccounts } = useBankAccounts();
  const { data: safes, error: safesError } = useSafes();
  const { data: currencies } = useCurrencies();
  const postMut = usePostDocument();
  const createSafeMut = useCreateSafe();
  const updateSafeMut = useUpdateSafe();

  const [transferOpen, setTransferOpen] = useState(false);
  const [fromType, setFromType] = useState('cash');
  const [toType, setToType] = useState('bank');
  const [fromBankId, setFromBankId] = useState('');
  const [toBankId, setToBankId] = useState('');
  const [currency, setCurrency] = useState('AFN');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  const [safeDialogOpen, setSafeDialogOpen] = useState(false);
  const [editingSafe, setEditingSafe] = useState(null);
  const [safeForm, setSafeForm] = useState({ name: '', currency: 'AFN', opening_balance: 0 });

  const { data: treasuryBalances } = useTreasuryBalances();
  const balances = {};
  for (const balance of (treasuryBalances || [])) {
    balances[balance.currency] = balance.balance;
  }
  const cashTxs = (txs || []).filter((tx) => tx.counter_type === 'cash' || tx.related_type === 'safe').slice(0, 20);
  const safeList = safes || [];

  const openSafeDialog = (safe = null) => {
    if (safe) {
      setEditingSafe(safe);
      setSafeForm({ name: safe.name, currency: safe.currency, opening_balance: safe.opening_balance || 0 });
    } else {
      setEditingSafe(null);
      setSafeForm({ name: '', currency: 'AFN', opening_balance: 0 });
    }
    setSafeDialogOpen(true);
  };

  const handleSaveSafe = async (event) => {
    event.preventDefault();
    if (!safeForm.name || !safeForm.currency) return;

    if (!editingSafe && safeList.length >= 4) {
      toast({ title: 'هشدار', description: 'هر صراف نهایتاً می‌تواند ۴ صندوق ایجاد کند.', variant: 'destructive' });
      return;
    }

    const duplicate = safeList.find((safe) => safe.currency === safeForm.currency && safe.id !== editingSafe?.id);
    if (duplicate) {
      toast({
        title: 'هشدار',
        description: `صندوقی با ارز ${safeForm.currency} قبلاً ثبت شده است. هر صندوق باید ارز منحصراً فرد داشته باشد.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingSafe) {
        await updateSafeMut.mutateAsync({ id: editingSafe.id, data: safeForm });
        toast({ title: 'صندوق ویرایش شد' });
      } else {
        const order = safeList.length;
        const created = await createSafeMut.mutateAsync({ ...safeForm, display_order: order, active: true });
        setSafeDialogOpen(false);

        if (safeForm.opening_balance && Number(safeForm.opening_balance) > 0) {
          const lines = buildOpeningBalanceLines({
            customer_id: created.id,
            customer_name: safeForm.name,
            currency: safeForm.currency,
            amount: safeForm.opening_balance,
          });
          try {
            await postMut.mutateAsync({
              doc_type: 'open_balance',
              currency: safeForm.currency,
              amount: safeForm.opening_balance,
              related_type: 'safe',
              related_id: created.id,
              related_name: safeForm.name,
              description: `افتتاح صندوق ${safeForm.name}`,
              counter_type: 'cash',
              lines,
            });
          } catch (openingError) {
            toast({
              title: 'صندوق ایجاد شد؛ ثبت موجودی افتتاحیه ناموفق بود',
              description: openingError.message,
              variant: 'destructive',
            });
            return;
          }
        }
        toast({ title: 'صندوق ایجاد شد' });
      }
      setSafeDialogOpen(false);
    } catch (error) {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    }
  };

  const handleTransfer = async (event) => {
    event.preventDefault();
    if (!amount || amount <= 0) return;
    if (fromType === 'bank' && !fromBankId) {
      toast({ title: 'خطا', description: 'حساب بانکی مبدأ را انتخاب کنید', variant: 'destructive' });
      return;
    }
    if (toType === 'bank' && !toBankId) {
      toast({ title: 'خطا', description: 'حساب بانکی مقصد را انتخاب کنید', variant: 'destructive' });
      return;
    }
    if (fromType === 'bank' && toType === 'bank' && fromBankId === toBankId) {
      toast({ title: 'خطا', description: 'حساب مبدأ و مقصد نمی‌توانند یکسان باشند', variant: 'destructive' });
      return;
    }
    const lines = buildTransferLines({
      from_type: fromType,
      from_id: fromType === 'bank' ? fromBankId : currency,
      to_type: toType,
      to_id: toType === 'bank' ? toBankId : currency,
      currency,
      amount,
    });
    try {
      await postMut.mutateAsync({
        doc_type: 'internal_transfer',
        currency,
        amount,
        description: description || 'انتقال داخلی',
        counter_type: 'cash',
        lines,
      });
      toast({ title: 'ثبت شد' });
      setTransferOpen(false);
      setAmount(0);
    } catch (error) {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <PageHeader title="صندوق" icon={Banknote}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => openSafeDialog(null)}><Plus className="w-4 h-4" /> صندوق جدید</Button>
            <Button size="sm" onClick={() => setTransferOpen(true)}><ArrowRightLeft className="w-4 h-4" /> ثبت جدید</Button>
          </>
        }
      />

      {safesError && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          خطا در بارگذاری صندوق‌ها: {safesError.message}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {safeList.length === 0 ? (
          Object.keys(balances).length === 0 ? (
            <BalanceCard label="صندوق" amounts={{ AFN: 0 }} />
          ) : (
            Object.entries(balances).map(([cur, value]) => (
              <BalanceCard key={cur} label={`صندوق ${cur}`} amounts={{ [cur]: value }} />
            ))
          )
        ) : (
          safeList.map((safe) => {
            const balance = balances[safe.currency] ?? safe.opening_balance ?? 0;
            return (
              <div key={safe.id} className="relative group">
                <BalanceCard label={safe.name} amounts={{ [safe.currency]: balance }} />
                <button type="button" onClick={() => openSafeDialog(safe)}
                  className="absolute left-2 top-2 rounded-md bg-muted/50 p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <h3 className="mb-2 text-sm font-semibold">گردش صندوق</h3>
      {isLoading ? <LoadingState /> : cashTxs.length === 0 ? <EmptyState title="تراکنشی نیست" /> : (
        <div className="w-full overflow-x-auto rounded-xl border bg-card">
          <table dir="rtl" className="w-full min-w-[760px] border-collapse text-right text-xs">
            <thead className="bg-muted/80">
              <tr>
                <th className="border-b px-3 py-3">تاریخ</th>
                <th className="border-b px-3 py-3">نوع عملیات</th>
                <th className="border-b px-3 py-3">شرح</th>
                <th className="border-b px-3 py-3">مبلغ</th>
                <th className="border-b px-3 py-3">ارز</th>
                <th className="border-b px-3 py-3">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {cashTxs.map((tx, index) => (
                <tr key={tx.id} className={index % 2 ? 'bg-muted/20' : ''}>
                  <td className="whitespace-nowrap border-b px-3 py-3">{formatDate(tx.date || tx.created_at) || '—'}</td>
                  <td className="whitespace-nowrap border-b px-3 py-3 font-semibold">{TX_TYPE_LABELS[tx.type] || tx.type || '—'}</td>
                  <td className="min-w-[220px] border-b px-3 py-3">{tx.description || '—'}</td>
                  <td className="whitespace-nowrap border-b px-3 py-3 font-bold">{formatNumber(tx.amount || 0)}</td>
                  <td className="whitespace-nowrap border-b px-3 py-3">{tx.currency || '—'}</td>
                  <td className="whitespace-nowrap border-b px-3 py-3">{tx.deleted ? 'باطل‌شده' : tx.edited ? 'ویرایش‌شده' : 'ثبت‌شده'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#eaf1f9] font-bold">
              <tr><td colSpan={6} className="border-t-2 border-primary px-3 py-3">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <span>جمع مبالغ گردشِ ردیف‌های نمایش‌داده‌شده:</span>
                  {[...new Set(cashTxs.map((tx) => tx.currency || 'AFN'))].map((cur) => {
                    const movement = cashTxs
                      .filter((tx) => (tx.currency || 'AFN') === cur && !tx.deleted)
                      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
                    return <span key={cur}>{cur}: {formatAmount(movement, cur)} · موجودی فعلی صندوق: {formatAmount(balances[cur] || 0, cur)}</span>;
                  })}
                </div>
              </td></tr>
            </tfoot>
          </table>
        </div>
      )}

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>انتقال داخلی</DialogTitle></DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>مبدأ</Label>
                <Select value={fromType} onValueChange={setFromType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">صندوق</SelectItem><SelectItem value="bank">بانک</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>مقصد</Label>
                <Select value={toType} onValueChange={setToType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">صندوق</SelectItem><SelectItem value="bank">بانک</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            {fromType === 'bank' && (
              <div>
                <Label>حساب بانکی مبدأ</Label>
                <Select value={fromBankId} onValueChange={setFromBankId}>
                  <SelectTrigger><SelectValue placeholder="انتخاب حساب مبدأ" /></SelectTrigger>
                  <SelectContent>
                    {(bankAccounts || []).filter((account) => account.currency === currency).map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>{account.bank_name} - {account.account_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {toType === 'bank' && (
              <div>
                <Label>حساب بانکی مقصد</Label>
                <Select value={toBankId} onValueChange={setToBankId}>
                  <SelectTrigger><SelectValue placeholder="انتخاب حساب مقصد" /></SelectTrigger>
                  <SelectContent>
                    {(bankAccounts || []).filter((account) => account.currency === currency).map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>{account.bank_name} - {account.account_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>ارز</Label>
                <CurrencySelect
                  value={currency}
                  onChange={(value) => { setCurrency(value); setFromBankId(''); setToBankId(''); }}
                  currencies={currencies}
                />
              </div>
              <div><Label>مبلغ</Label><AmountInput value={amount} onChange={setAmount} /></div>
            </div>
            <div><Label>توضیحات</Label><Input value={description} onChange={(event) => setDescription(event.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>پایان</Button>
              <Button type="submit" disabled={postMut.isPending}>{postMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ثبت'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={safeDialogOpen} onOpenChange={setSafeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingSafe ? 'ویرایش صندوق' : 'صندوق جدید'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveSafe} className="space-y-3">
            <div><Label>نام صندوق</Label><Input value={safeForm.name} onChange={(event) => setSafeForm({ ...safeForm, name: event.target.value })} placeholder="صندوق اصلی" required /></div>
            <div>
              <Label>ارز</Label>
              <CurrencySelect
                value={safeForm.currency}
                onChange={(value) => setSafeForm({ ...safeForm, currency: value })}
                currencies={currencies}
                disabled={Boolean(editingSafe)}
              />
              {editingSafe && <p className="mt-1 text-xs text-muted-foreground">ارز صندوق پس از ایجاد قابل تغییر نیست</p>}
            </div>
            <div>
              <Label>مبلغ افتتاح صندوق</Label>
              <AmountInput value={safeForm.opening_balance} onChange={(value) => setSafeForm({ ...safeForm, opening_balance: value })} disabled={Boolean(editingSafe)} />
              {editingSafe && <p className="mt-1 text-xs text-muted-foreground">مبلغ افتتاح ثابت است و قابل تغییر نیست</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSafeDialogOpen(false)}>انصراف</Button>
              <Button type="submit" disabled={createSafeMut.isPending || updateSafeMut.isPending}>
                {(createSafeMut.isPending || updateSafeMut.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ذخیره'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}