// src/core/gateway/contractTests.js — آزمون قرارداد درگاه داده
// هر پیاده‌سازی (حافظه‌ای امروز، API واقعی فردا) باید از این آزمون‌ها بگذرد.
import { GatewayError } from './contract.js';

const SEED = {
  items: [
    { id: 'i1', name: 'الف', status: 'فعال', currency: 'AFN', date: '2026-01-02' },
    { id: 'i2', name: 'ب', status: 'غیرفعال', currency: 'USD', date: '2026-01-05' },
  ],
  settings: { language: 'فارسی' },
  expenses: [
    { id: 'x1', title: 'کرایه', amount: 1000, fee: 20, status: 'قطعی', currency: 'AFN', date: '2026-01-03', number: 'EX-1' },
  ],
};

const fail = (message) => { throw new Error(message); };
const expect = (condition, message) => { if (!condition) fail(message); };

export async function runGatewayContractTests(factory, seed = SEED) {
  const results = [];
  const run = async (name, fn) => {
    try {
      await fn();
      results.push({ name, ok: true });
    } catch (error) {
      results.push({ name, ok: false, message: error?.message || String(error) });
    }
  };

  const fresh = () => factory(seed);

  await run('snapshot اولیه', async () => {
    const gateway = fresh();
    expect(gateway.snapshot().items.length === seed.items.length, 'فهرست اولیه بارگذاری نشد.');
  });

  await run('create با شناسهٔ یکتا', async () => {
    const gateway = fresh();
    const created = await gateway.create('items', { name: 'ج' });
    expect(Boolean(created.id), 'شناسه ساخته نشد.');
    expect(gateway.snapshot().items.length === 3, 'رکورد اضافه نشد.');
  });

  await run('update فقط رکورد هدف', async () => {
    const gateway = fresh();
    await gateway.update('items', 'i1', { name: 'الف ویرایش' });
    const rows = gateway.snapshot().items;
    expect(rows.find((r) => r.id === 'i1').name === 'الف ویرایش', 'ویرایش اعمال نشد.');
    expect(rows.find((r) => r.id === 'i2').name === 'ب', 'رکورد دیگر تغییر کرد.');
  });

  await run('deactivate وضعیت را غیرفعال می‌کند', async () => {
    const gateway = fresh();
    await gateway.deactivate('items', 'i1');
    expect(gateway.snapshot().items.find((r) => r.id === 'i1').status === 'غیرفعال', 'غیرفعال نشد.');
  });

  await run('remove حذف می‌کند', async () => {
    const gateway = fresh();
    await gateway.remove('items', 'i2');
    expect(gateway.snapshot().items.length === 1, 'حذف انجام نشد.');
  });

  await run('update رکورد ناموجود خطا می‌دهد', async () => {
    const gateway = fresh();
    let code = '';
    try { await gateway.update('items', 'missing', { name: 'x' }); } catch (error) { code = error?.code; }
    expect(code === new GatewayError('NOT_FOUND', '').code, 'خطای NOT_FOUND صادر نشد.');
  });

  await run('list با جستجو و فیلتر', async () => {
    const gateway = fresh();
    const found = await gateway.list('items', { search: 'ب' });
    expect(found.length === 1 && found[0].id === 'i2', 'جستجو نتیجهٔ درست نداد.');
    const byCurrency = await gateway.list('items', { currency: 'AFN' });
    expect(byCurrency.length === 1 && byCurrency[0].id === 'i1', 'فیلتر ارز کار نکرد.');
  });

  await run('replaceAll مقدار را جایگزین می‌کند', async () => {
    const gateway = fresh();
    await gateway.replaceAll('settings', { language: 'English' });
    expect(gateway.snapshot().settings.language === 'English', 'جایگزینی انجام نشد.');
  });

  await run('clearExcept کلیدهای نگه‌داشتنی را حفظ می‌کند', async () => {
    const gateway = fresh();
    await gateway.clearExcept(['settings']);
    expect(gateway.snapshot().items.length === 0, 'فهرست پاک نشد.');
    expect(gateway.snapshot().settings.language === 'فارسی', 'کلید نگه‌داشتنی پاک شد.');
  });

  await run('reset دادهٔ اولیه را برمی‌گرداند', async () => {
    const gateway = fresh();
    await gateway.remove('items', 'i1');
    await gateway.reset();
    expect(gateway.snapshot().items.length === seed.items.length, 'بازنشانی انجام نشد.');
  });

  await run('subscribe اطلاع می‌دهد و لغو می‌شود', async () => {
    const gateway = fresh();
    let calls = 0;
    const unsubscribe = gateway.subscribe(() => { calls += 1; });
    await gateway.create('items', { name: 'د' });
    expect(calls === 1, 'رویداد تغییر اعلام نشد.');
    unsubscribe();
    await gateway.create('items', { name: 'ه' });
    expect(calls === 1, 'لغو اشتراک کار نکرد.');
  });

  await run('reverse creates counter document and locks original', async () => {
    const gateway = fresh();
    const result = await gateway.reverse('expenses', 'x1', 'wrong amount');
    const rows = gateway.snapshot().expenses;
    expect(result.counter.amount === -1000, 'counter amount not negated');
    expect(rows.length === 2, 'counter document not added');
    expect(rows.find((r) => r.id === 'x1').status === 'ابطال شده', 'original not reversed');
    expect(rows.find((r) => r.reversalOf === 'x1'), 'counter link missing');
    expect(gateway.snapshot().activity?.[0]?.action === 'reverse', 'activity log missing');
  });

  await run('reversed document is locked for update', async () => {
    const gateway = fresh();
    await gateway.reverse('expenses', 'x1', 'wrong amount');
    let code = '';
    try { await gateway.update('expenses', 'x1', { title: 'change' }); } catch (error) { code = error?.code; }
    expect(code === 'LOCKED', 'reversed document was not locked');
  });

  await run('reverse rejects short reason and double reversal', async () => {
    const gateway = fresh();
    let short = '';
    try { await gateway.reverse('expenses', 'x1', 'a'); } catch (error) { short = error.message; }
    expect(Boolean(short), 'short reason accepted');
    await gateway.reverse('expenses', 'x1', 'wrong amount');
    let again = '';
    try { await gateway.reverse('expenses', 'x1', 'again'); } catch (error) { again = error.message; }
    expect(Boolean(again), 'double reversal accepted');
  });

  await run('master record is deactivated instead of reversed', async () => {
    const gateway = fresh();
    let message = '';
    try { await gateway.reverse('items', 'i1', 'test reason'); } catch (error) { message = error.message; }
    expect(Boolean(message), 'master record reversal accepted');
    await gateway.deactivate('items', 'i1');
    expect(gateway.snapshot().items.find((r) => r.id === 'i1').status === 'غیرفعال', 'deactivate failed');
  });

  const failed = results.filter((item) => !item.ok);
  return { total: results.length, passed: results.length - failed.length, failed: failed.length, results };
}