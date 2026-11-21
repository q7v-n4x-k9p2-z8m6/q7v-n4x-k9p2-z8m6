// a1/lib/adaptiveLayout.js — موتور مرکزی چیدمان خودتنظیم‌گر
// ورودی: فضای واقعی قابل استفادهٔ صفحه (که در زمان اجرا اندازه‌گیری می‌شود)
// خروجی: یک تصمیم واحد برای همهٔ بخش‌ها (تعداد ستون‌ها، اندازهٔ آیکون و نوشته، نوار ابزار، جدول یا کارت، ستون فرم)
// هیچ نام دستگاهی و هیچ User-Agent در تصمیم‌گیری استفاده نمی‌شود.

const clamp = (min, max, value) => Math.min(max, Math.max(min, value));
const round = value => Math.round(value);

// آستانه‌های محتوایی: از حداقل فضای لازم برای نمایش پوستهٔ دسکتاپ (منو + میان‌بر + نوار پایین) به‌دست آمده‌اند.
export const DESKTOP_MIN_WIDTH = 768;
export const DESKTOP_MIN_HEIGHT = 500;

// اندازه‌گیری فضای واقعی در همین لحظه
export function measureSpace(win = typeof window === 'undefined' ? null : window) {
  if (!win) {
    return { width: 1024, height: 768, outerWidth: 1024, outerHeight: 768, screenWidth: 1024, screenHeight: 768, dpr: 1, pointerCoarse: false, orientation: 'landscape', aspectRatio: 1.33, browserChrome: 0, screenLost: 0 };
  }
  const vv = win.visualViewport;
  const width = round(vv?.width ?? win.innerWidth ?? 0);
  const height = round(vv?.height ?? win.innerHeight ?? 0);
  const screenWidth = round(win.screen?.availWidth || win.screen?.width || width);
  const screenHeight = round(win.screen?.availHeight || win.screen?.height || height);
  return {
    width,
    height,
    outerWidth: round(win.outerWidth || width),
    outerHeight: round(win.outerHeight || height),
    screenWidth,
    screenHeight,
    dpr: Number((win.devicePixelRatio || 1).toFixed(2)),
    pointerCoarse: Boolean(win.matchMedia?.('(pointer: coarse)')?.matches),
    orientation: width >= height ? 'landscape' : 'portrait',
    aspectRatio: Number((width / Math.max(height, 1)).toFixed(2)),
    // فضایی که نوارهای مرورگر و سیستم از ارتفاع گرفته‌اند
    browserChrome: Math.max(0, round((win.innerHeight || height) - height)),
    // فاصلهٔ پنجره با کل نمایشگر (پنجرهٔ کوچک‌شده روی نمایشگر بزرگ)
    screenLost: Math.max(0, round(screenWidth - (win.innerWidth || width))),
  };
}

// تصمیم مرکزی چیدمان بر پایهٔ فضای اندازه‌گیری‌شده
export function decideLayout(space, options = {}) {
  const { width, height, orientation, pointerCoarse, aspectRatio } = space;
  const railItems = options.railItems || 14;
  const railIdeal = pointerCoarse ? 92 : 96;
  const railMin = 68;
  const reasons = [];

  const veryShort = height < 420;
  const short = height < 560;

  // ۱) پوسته: هم عرض و هم ارتفاع واقعی باید کافی باشند
  const desktopChrome = width >= DESKTOP_MIN_WIDTH && height >= DESKTOP_MIN_HEIGHT;
  reasons.push(
    desktopChrome
      ? `عرض ${width}px و ارتفاع ${height}px از حداقل فضای پوستهٔ دسکتاپ (${DESKTOP_MIN_WIDTH}×${DESKTOP_MIN_HEIGHT}) بیشتر است.`
      : `عرض ${width}px یا ارتفاع ${height}px کمتر از حداقل فضای پوستهٔ دسکتاپ است؛ پوستهٔ فضای کوچک انتخاب شد.`,
  );
  if (veryShort) reasons.push(`ارتفاع ${height}px کمتر از ۴۲۰px است؛ چیدمان فشرده و اسکرول عمودی فعال می‌شود.`);

  // ۲) ستون‌های میان‌برها و کارت‌ها از فضای واقعی محاسبه می‌شوند
  // میان‌برها در یک ردیف جا می‌شوند تا وقتی هر دکمه حداقل فضای خوانا داشته باشد؛ در غیر این صورت پیمایش افقی
  const railSpace = width - 16;
  const railCols = clamp(4, railItems, Math.max(Math.floor(railSpace / railIdeal), Math.min(railItems, Math.floor(railSpace / 78))));
  const railScroll = railSpace / railItems < railMin;

  const groupMin = pointerCoarse ? 250 : 230;
  const groupCols = clamp(1, 3, Math.floor((width - 24) / groupMin));
  const groupRows = Math.max(1, Math.ceil(6 / groupCols));

  const tileMin = pointerCoarse ? 88 : 82;
  const groupInner = Math.max(120, (width - 24) / groupCols - 18);
  // حداقل سه کاشی در هر گروه: هر گروه شش‌گانه یک ردیف سه‌تایی می‌ماند و چیدمان یکدست است.
  const tileCols = clamp(3, 4, Math.floor(groupInner / tileMin));

  const cardCols = clamp(1, 2, Math.floor((width - 24) / 300));

  // ۳) اندازه‌های پیوسته (نه پله‌ای): آیکون، نوشته، فاصله
  const iconSize = clamp(14, 30, round(width / 62) - (veryShort ? 2 : 0));
  const labelSize = clamp(9, 14, round(width / 140) + 5);
  const gap = clamp(4, 14, round(width / 150));

  // ۴) جدول کامل یا نسخهٔ کارتی
  const table = width >= 760 && height >= 420 ? 'table' : 'cards';
  if (table === 'cards') reasons.push(`عرض ${width}px یا ارتفاع ${height}px برای جدول کامل کافی نیست؛ نمای کارتی فعال شد.`);

  // ۵) فرم‌ها: تعداد ستون از عرض واقعی پنجرهٔ فرم
  const formWidth = Math.min(width - 24, 672);
  const formCols = veryShort || height < 460 ? 1 : clamp(1, 3, Math.floor(formWidth / 250));
  reasons.push(`پنجرهٔ فرم حدود ${round(formWidth)}px است؛ ${formCols} ستون انتخاب شد.`);

  // ۶) نوار ابزار و نوار پایین
  const toolbar = desktopChrome ? 'top-rail' : 'bottom-bar';

  const mode = desktopChrome
    ? (width >= 1280 ? 'wide-desktop' : width >= 980 ? 'desktop' : 'compact-desktop')
    : (orientation === 'landscape' && width >= 600 ? 'wide-compact' : 'compact');

  const density = veryShort ? 'dense' : short ? 'compact' : pointerCoarse ? 'touch' : 'comfortable';

  if (orientation === 'landscape' && !desktopChrome) reasons.push('نمایش افقی با عرض کم: چیدمان کارتی و اسکرول عمودی انتخاب شد.');
  reasons.push(`میان‌برها: ${railCols} ستون، گروه‌ها: ${groupCols}×${groupRows}، کاشی‌ها: ${tileCols} ستون.`);

  return {
    mode,
    chrome: desktopChrome ? 'desktop' : 'compact',
    orientation,
    density,
    table,
    toolbar,
    railScroll,
    columns: { rail: railCols, groups: groupCols, groupRows, tiles: tileCols, form: formCols, cards: cardCols },
    sizes: { icon: iconSize, label: labelSize, gap },
    aspectRatio,
    reasons,
    space,
  };
}

const CSS_VARS = {
  '--a1-icon': layout => `${layout.sizes.icon}px`,
  '--a1-label': layout => `${layout.sizes.label}px`,
  '--a1-gap': layout => `${layout.sizes.gap}px`,
  '--a1-rail-cols': layout => String(layout.columns.rail),
  '--a1-group-cols': layout => String(layout.columns.groups),
  '--a1-group-rows': layout => String(layout.columns.groupRows),
  '--a1-tile-cols': layout => String(layout.columns.tiles),
  '--a1-form-cols': layout => String(layout.columns.form),
  '--a1-card-cols': layout => String(layout.columns.cards),
};

// نتیجهٔ موتور را روی ریشهٔ سند می‌نویسد تا CSS و همهٔ بخش‌ها از یک منبع استفاده کنند
export function applyLayoutToDocument(space, layout, doc = typeof document === 'undefined' ? null : document) {
  if (!doc) return;
  const root = doc.documentElement;
  root.dataset.a1Mode = layout.mode;
  root.dataset.a1Chrome = layout.chrome;
  root.dataset.a1Table = layout.table;
  root.dataset.a1Density = layout.density;
  root.dataset.a1Orientation = layout.orientation;
  root.dataset.a1Rail = layout.railScroll ? 'scroll' : 'fit';
  root.dataset.a1Viewport = `${space.width}x${space.height}`;
  Object.entries(CSS_VARS).forEach(([name, value]) => root.style.setProperty(name, value(layout)));
}