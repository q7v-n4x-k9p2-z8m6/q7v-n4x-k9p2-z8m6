import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRole } from '@/lib/role-context';
import { SECTION_MAP } from '@/lib/navigation';

const STAFF_TABS = ['dashboard', 'trade', 'cash', 'transfers', 'customers'];
const CUSTOMER_TABS = ['portal'];

export default function MobileTabs() {
  const { role, can } = useRole();
  const ids = role === 'customer' ? CUSTOMER_TABS : STAFF_TABS;
  const items = ids.map((id) => SECTION_MAP[id]).filter((item) => item && can(item.permission));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/97 backdrop-blur-md safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5 px-1 py-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[9.5px] font-bold transition-colors',
                  isActive ? 'bg-secondary text-primary' : 'text-muted-foreground'
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}