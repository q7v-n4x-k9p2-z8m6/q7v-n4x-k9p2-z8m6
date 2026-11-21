import React from 'react';
import { cn } from '@/lib/utils';

export default function PageHeader({ title, description, icon: Icon, actions, badge }) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {badge ? <span className="chip border border-border bg-muted text-muted-foreground">{badge}</span> : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-[12.5px] leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className={cn('flex flex-wrap items-center gap-2')}>{actions}</div> : null}
    </div>
  );
}