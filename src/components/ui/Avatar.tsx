import React from 'react';
import { cn } from '@/utils/cn';
import { initials, toneClass } from '@/utils/format';

export function Avatar({
  name,
  tone = 'navy',
  size = 'md',
  className,
  ring,
  src,
}: {
  name: string;
  tone?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
  src?: string;
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[9.5px]',
    sm: 'h-7.5 w-7.5 text-[10.5px]',
    md: 'h-9 w-9 text-[12px]',
    lg: 'h-11 w-11 text-[14px]',
    xl: 'h-16 w-16 text-[20px]',
  };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', sizes[size], ring && 'ring-2 ring-white', className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm',
        toneClass(tone),
        sizes[size],
        ring && 'ring-2 ring-white',
        className
      )}
      aria-hidden
    >
      {initials(name) || '?'}
    </span>
  );
}

/** Name + secondary line stacked — used in nearly every table. */
export function PersonCell({
  name,
  secondary,
  avatarTone,
  size = 'sm',
  onClick,
}: {
  name: string;
  secondary?: React.ReactNode;
  avatarTone?: string;
  size?: 'xs' | 'sm' | 'md';
  onClick?: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} tone={avatarTone} size={size === 'md' ? 'md' : 'sm'} />
      <div className="min-w-0">
        <p
          onClick={onClick}
          className={cn(
            'truncate text-[13px] font-medium leading-tight text-navy-900',
            onClick && 'cursor-pointer hover:text-brand-600 hover:underline'
          )}
        >
          {name}
        </p>
        {secondary && <p className="mt-0.5 truncate text-[11.5px] leading-tight text-slate-500">{secondary}</p>}
      </div>
    </div>
  );
}
