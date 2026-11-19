import React from 'react';
import SarraafLogo from '@/components/SarraafLogo';
import { cn } from '@/lib/utils';

/**
 * ExchangeMark — آیکون برند صرافی
 * فقط آیکون در یک مربع برند شده
 */
export default function ExchangeMark({
  size = 'sm',
  className = '',
}) {
  const box = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return (
    <div
      className={cn(
        'rounded-lg flex items-center justify-center shrink-0',
        box[size] || box.sm,
        'bg-transparent',
        className
      )}
    >
      <SarraafLogo size={size === 'lg' ? 40 : size === 'md' ? 34 : 28} className="shrink-0" />
    </div>
  );
}