import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'live'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  { variant = 'secondary', size = 'md', className, children, ...props }, ref
) => {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        {
          'text-xs px-3 py-1.5': size === 'sm',
          'text-sm px-4 py-2': size === 'md',
          'text-base px-6 py-3': size === 'lg',
          'bg-[var(--brand-gold)] text-[var(--brand-bg)] hover:bg-[var(--brand-gold-hover)] active:scale-[0.98]': variant === 'primary',
          'bg-[var(--brand-surface)] text-[var(--brand-text)] border border-[var(--brand-border)] hover:bg-[var(--brand-surface-hover)] hover:border-[var(--brand-border-hover)]': variant === 'secondary',
          'text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] hover:bg-[var(--brand-surface)]': variant === 'ghost',
          'bg-red-900/40 text-red-300 border border-red-800 hover:bg-red-900/60': variant === 'danger',
          'bg-red-600 text-white hover:bg-red-500': variant === 'live',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = 'Button'
