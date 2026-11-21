// a1/hooks/useAdaptiveLayout.js — اندازه‌گیری پیوستهٔ فضای واقعی و تصمیم چیدمان
// با تغییر اندازهٔ پنجره، چرخاندن دستگاه و تغییر نوارهای مرورگر، چیدمان بدون بارگذاری مجدد اصلاح می‌شود.
import { useLayoutEffect, useState } from 'react';
import { applyLayoutToDocument, decideLayout, measureSpace } from '@/a1/lib/adaptiveLayout';

const initial = () => {
  if (typeof window === 'undefined') {
    const space = measureSpace(null);
    return { space, layout: decideLayout(space) };
  }
  const space = measureSpace(window);
  return { space, layout: decideLayout(space) };
};

export default function useAdaptiveLayout() {
  const [state, setState] = useState(initial);

  useLayoutEffect(() => {
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const space = measureSpace(window);
        const layout = decideLayout(space);
        applyLayoutToDocument(space, layout);
        setState(current => (
          current.space.width === space.width
          && current.space.height === space.height
          && current.layout.mode === layout.mode
          && current.layout.table === layout.table
          && current.layout.columns.tiles === layout.columns.tiles
          && current.layout.columns.rail === layout.columns.rail
          && current.layout.columns.form === layout.columns.form
            ? current
            : { space, layout }
        ));
      });
    };

    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(sync);
      observer.observe(document.documentElement);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      observer?.disconnect();
    };
  }, []);

  return state;
}