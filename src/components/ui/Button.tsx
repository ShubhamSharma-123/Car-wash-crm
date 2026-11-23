import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'soft';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-navy-900 text-white shadow-sm hover:bg-navy-800 active:bg-navy-950 border border-navy-900 hover:border-navy-800',
  accent:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 border border-brand-600 hover:border-brand-700',
  secondary:
    'bg-slate-100 text-navy-900 hover:bg-slate-200/80 active:bg-slate-200 border border-transparent',
  outline:
    'bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 hover:text-navy-900 shadow-[0_1px_1px_rgba(15,30,61,0.03)]',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-navy-900 border border-transparent',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-600 shadow-sm',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-9.5 px-4 text-[13px] gap-2 rounded-lg py-2',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg justify-center',
  'icon-sm': 'h-8 w-8 rounded-lg justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'outline', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
);
Button.displayName = 'Button';
