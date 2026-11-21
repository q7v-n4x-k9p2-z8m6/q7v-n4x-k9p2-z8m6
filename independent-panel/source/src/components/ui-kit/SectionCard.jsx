import React from 'react';
import { cn } from '@/lib/utils';

export default function SectionCard({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cn('card-flat overflow-hidden', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-3.5 py-2.5">
          <div className="min-w-0">
            {title ? <h2 className="font-heading text-[13.5px] font-extrabold text-foreground">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[10.5px] leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('p-3.5', bodyClassName)}>{children}</div>
    </section>
  );
}