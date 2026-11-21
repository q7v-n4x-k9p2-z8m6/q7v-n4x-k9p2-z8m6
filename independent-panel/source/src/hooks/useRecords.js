import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * بارگذاری سادهٔ رکوردهای یک انتیتی برای محیط آزمایشی.
 * در مقیاس واقعی باید فیلتر و صفحه‌بندی به سرور منتقل شود (در نقشهٔ راه ثبت شده است).
 */
export function useRecords(entityName, query) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterKey = JSON.stringify(query || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await base44.entities[entityName].filter(JSON.parse(filterKey));
      setItems(Array.isArray(result) ? result : result?.items || []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [entityName, filterKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load, setItems };
}

export function useLedger() {
  const { items, loading, reload, error } = useRecords('LedgerEntry');
  const sorted = useMemo(
    () => [...items].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.created_date).localeCompare(String(a.created_date))),
    [items]
  );
  return { entries: sorted, loading, reload, error };
}

export function useCurrencies() {
  // A1: currencies live in the `rates` table (currency + buy/sell/daily rate).
  const { items } = useRecords('Rate', { is_active: true });
  return useMemo(() => {
    if (items.length) {
      return items
        .slice()
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((item) => ({ code: item.currency, name: item.currency, decimals: item.decimals ?? 2 }));
    }
    return [];
  }, [items]);
}