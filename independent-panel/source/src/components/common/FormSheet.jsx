import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export default function FormSheet({ open, onOpenChange, title, description, children, footer }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] rounded-t-3xl p-0">
        <div className="flex max-h-[92vh] flex-col">
          <SheetHeader className="border-b border-border/60 px-5 pb-3 pt-5 text-right">
            <SheetTitle className="text-[15px]">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-[11.5px]">{description}</SheetDescription>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer && <div className="border-t border-border/60 bg-card px-5 py-3 safe-bottom">{footer}</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}