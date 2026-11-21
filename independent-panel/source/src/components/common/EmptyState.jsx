import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <p className="mt-3.5 text-[13px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}