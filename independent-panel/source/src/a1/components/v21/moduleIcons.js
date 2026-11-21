// a1/components/v21/moduleIcons.js — آیکون مرجع یکتای هر بخش
// یک منبع برای میزکار دسکتاپ، میان‌برها، پوستهٔ موبایل و محیط آزمون.
// شناسه‌ها همان شناسه‌های src/core/registry/modules هستند؛ آیکون‌ها نباید تکرار شوند.
import {
  Home, Users, BookOpen, CircleDollarSign, Building2, BookText, Wallet, Landmark,
  ArrowLeftRight, Send, TrendingUp, Receipt, ScrollText, ClipboardList, ListChecks,
  Coins, FileSpreadsheet, BarChart3, CalendarDays, CircleHelp, Scale, MessagesSquare,
  Bot, ShoppingBag, Languages, ArrowRightLeft,
} from 'lucide-react';

export const MODULE_ICONS = {
  home: Home,
  customers: Users,
  customerLedger: BookOpen,
  debtors: CircleDollarSign,
  branches: Building2,
  branchLedger: BookText,
  cash: Wallet,
  banks: Landmark,
  exchange: ArrowLeftRight,
  remittance: Send,
  rates: TrendingUp,
  expenses: Receipt,
  journal: ScrollText,
  ledger: ClipboardList,
  accounts: ListChecks,
  currencies: Coins,
  reports: FileSpreadsheet,
  profit: BarChart3,
  activity: CalendarDays,
  errors: CircleHelp,
  balance: Scale,
  sarraafGroups: MessagesSquare,
  assistant: Bot,
  products: ShoppingBag,
  language: Languages,
  // مرکز مکمل — بیرون از شماره‌گذاری ۱ تا ۲۵
  transactions: ArrowRightLeft,
};

export const moduleIcon = (id) => MODULE_ICONS[id] || Home;