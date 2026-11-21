// a1/hooks/useMobileShell.js — مرز پوستهٔ موبایل/لپ‌تاپ
// زیر ۷۶۸ پیکسل پوستهٔ مستقل موبایل فعال می‌شود؛ از ۷۶۸ به بالا چیدمان موجود لپ‌تاپ دست‌نخورده می‌ماند.
import { useEffect, useState } from 'react';

export const MOBILE_SHELL_MAX_WIDTH = 767;

export default function useMobileShell(maxWidth = MOBILE_SHELL_MAX_WIDTH) {
  const query = `(max-width: ${maxWidth}px)`;
  const [isMobileShell, setIsMobileShell] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (event) => setIsMobileShell(event.matches);
    setIsMobileShell(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobileShell;
}