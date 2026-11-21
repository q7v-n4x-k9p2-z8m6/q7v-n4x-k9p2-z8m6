// a1/mobile/useKeyboardInset.js — ارتفاع صفحه‌کلید گوشی
// نوارهای ثابت پایین صفحه با این مقدار درست بالای صفحه‌کلید می‌نشینند و با بسته‌شدن آن
// به جای قبلی خود برمی‌گردند. محاسبه فقط به تغییر اندازهٔ ناحیهٔ دید وابسته است،
// بنابراین اسکرول محتوا نوار را جابه‌جا نمی‌کند.
import { useEffect, useState } from 'react';

const KEYBOARD_MIN = 120; // تغییرهای کوچک نوار آدرس مرورگر به حساب صفحه‌کلید نمی‌آیند
const BAR_SPACE = 78; // ارتفاع نوار دکمه‌ها + فاصله، تا فیلد زیر آن پنهان نشود

// نزدیک‌ترین ناحیهٔ اسکرول‌شونده را فقط به‌اندازهٔ هم‌پوشانی جابه‌جا می‌کند
const revealField = field => {
  const view = window.visualViewport;
  const visibleBottom = view ? view.offsetTop + view.height : window.innerHeight;
  const overlap = field.getBoundingClientRect().bottom - (visibleBottom - BAR_SPACE);
  if (overlap <= 0) return;
  let node = field.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) {
      node.scrollTop += overlap;
      return;
    }
    node = node.parentElement;
  }
  window.scrollBy(0, overlap);
};

export default function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const height = Math.round(window.innerHeight - view.height);
      setInset(height > KEYBOARD_MIN ? height : 0);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    view.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      view.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
    };
  }, []);

  // با باز شدن صفحه‌کلید، فیلد در حال تایپ بالای نوار دکمه‌ها می‌ماند
  useEffect(() => {
    if (!inset) return undefined;
    const field = document.activeElement;
    if (!field || !/^(INPUT|SELECT|TEXTAREA)$/.test(field.tagName)) return undefined;
    const timer = window.setTimeout(() => revealField(field), 80);
    return () => window.clearTimeout(timer);
  }, [inset]);

  return inset;
}