import { useMemo } from 'react';
import { useRecords } from '@/hooks/useRecords';

/** فهرست یکپارچهٔ صندوق‌ها و حساب‌های بانکی به‌عنوان «طرف حساب نقدی» */
export function useCounters() {
  const { items: safes } = useRecords('Safe', { active: true });
  const { items: banks } = useRecords('BankAccount', { active: true });

  const counters = useMemo(
    () => [
      ...safes
        .slice()
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        .map((safe) => ({
          key: `safe:${safe.id}`,
          type: 'safe',
          id: safe.id,
          name: safe.name,
          currency: safe.currency,
          label: `صندوق — ${safe.name} (${safe.currency})`,
        })),
      ...banks.map((bank) => ({
        key: `bank:${bank.id}`,
        type: 'bank',
        id: bank.id,
        name: `${bank.bank_name} — ${bank.account_number}`,
        currency: bank.currency,
        label: `بانک — ${bank.bank_name} (${bank.currency})`,
      })),
    ],
    [safes, banks]
  );

  return { counters, safes, banks };
}

export function findCounter(counters, key) {
  return counters.find((counter) => counter.key === key);
}