import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'موردی ثبت نشده است', description, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-card text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <p className="text-[13px] font-bold text-foreground">{title}</p>
      {description ? <p className="max-w-md text-[11.5px] leading-6 text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}