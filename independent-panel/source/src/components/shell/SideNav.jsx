import React from 'react';
import { NavLink } from 'react-router-dom';
import { GROUP_ORDER, SECTIONS } from '@/lib/navigation';
import { useRole } from '@/lib/role-context';
import { cn } from '@/lib/utils';
import { APP_META } from '@/lib/config';
import { Wallet } from 'lucide-react';

export default function SideNav() {
  const { role, can, roleLabel } = useRole();
  const visible = SECTIONS.filter((section) => can(section.permission));

  return (
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Wallet className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-heading text-[13.5px] font-extrabold text-white">{APP_META.name}</p>
          <p className="truncate text-[10px] text-sidebar-foreground/70">{APP_META.edition}</p>
        </div>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-2.5 py-3">
        {GROUP_ORDER.map((group) => {
          const items = visible.filter((section) => section.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-3">
              <p className="px-2 pb-1 text-[9.5px] font-bold uppercase tracking-wide text-sidebar-foreground/45">
                {group}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((section) => {
                  const Icon = section.icon;
                  return (
                    <NavLink
                      key={section.id}
                      to={section.path}
                      end={section.path === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-lg px-2 py-[7px] text-[12px] font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-accent font-bold text-white'
                            : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-white'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                      <span className="truncate">{section.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 text-[10px] leading-5 text-sidebar-foreground/60">
        <p className="font-bold text-sidebar-foreground/80">{roleLabel}</p>
        <p>نقش فعال: {role}</p>
        <p className="mt-1">داده‌های این نسخه نمونه و آزمایشی است.</p>
      </div>
    </aside>
  );
}