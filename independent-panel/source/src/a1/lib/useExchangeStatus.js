// a1/lib/useExchangeStatus.js — وضعیت اتصال صراف (آنلاین / در حال اتصال / آفلاین)
// یک منبع مشترک برای نوار عنوان و پنجرهٔ شناسه تا وضعیت در دو جا متفاوت نشان داده نشود.
import { useEffect, useState } from 'react';

export default function useExchangeStatus(dbStatus) {
  const [networkOnline, setNetworkOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const sync = () => setNetworkOnline(navigator.onLine);
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!networkOnline || dbStatus === 'error') return { key: 'offline', label: 'آفلاین' };
  if (dbStatus === 'loading') return { key: 'connecting', label: 'در حال اتصال' };
  return { key: 'online', label: 'آنلاین' };
}