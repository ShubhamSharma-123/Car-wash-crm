import React from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle } from 'lucide-react';

/* ---------------- Field wrapper ---------------- */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-[12.5px] font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-[11.5px] font-medium text-rose-600">
          <AlertCircle className="mt-[1px] h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11.5px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

const baseField =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-[3px] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export const fieldClasses = (invalid?: boolean) =>
  cn(
    baseField,
    'h-9.5 py-2',
    invalid
      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
      : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100'
  );

/* ---------------- Input ---------------- */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, leftIcon, rightSlot, ...props }, ref) => {
    if (leftIcon || rightSlot) {
      return (
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</span>
          )}
          <input
            ref={ref}
            className={cn(fieldClasses(invalid), leftIcon && 'pl-9', rightSlot && 'pr-9', className)}
            {...props}
          />
          {rightSlot && <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>}
        </div>
      );
    }
    return <input ref={ref} className={cn(fieldClasses(invalid), className)} {...props} />;
  }
);
Input.displayName = 'Input';

/* ---------------- Textarea ---------------- */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, rows = 3, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      baseField,
      'h-auto py-2 leading-relaxed',
      invalid
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
        : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

/* ---------------- Select ---------------- */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          fieldClasses(invalid),
          'cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27 stroke-linecap=%27round%27%3E%3Cpath d=%27M4 6l4 4 4-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8',
          !props.value && placeholder && 'text-slate-400',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
);
Select.displayName = 'Select';

/* ---------------- Switch ---------------- */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-start gap-3', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full transition-colors focus-ring',
          checked ? 'bg-brand-600' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-sm transition-transform duration-150',
            checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
          )}
        />
      </button>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-[13px] font-medium text-slate-800">{label}</span>}
          {description && <span className="mt-0.5 block text-[12px] leading-relaxed text-slate-500">{description}</span>}
        </span>
      )}
    </label>
  );
}

/* ---------------- Checkbox ---------------- */
export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  indeterminate?: boolean;
  className?: string;
}) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2', className)}>
      <span className="relative inline-flex h-4 w-4 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-slate-300 bg-white transition-colors checked:border-brand-600 checked:bg-brand-600 focus-ring"
        />
        {indeterminate && !checked ? (
          <span className="pointer-events-none absolute h-[2px] w-2 rounded bg-brand-600" />
        ) : (
          <svg
            viewBox="0 0 16 16"
            className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3.5 8.5l3 3 6-6" />
          </svg>
        )}
      </span>
      {label && <span className="text-[13px] text-slate-700">{label}</span>}
    </label>
  );
}
