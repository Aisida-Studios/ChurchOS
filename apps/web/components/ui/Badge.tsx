import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'live' | 'warning' | 'success' | 'ai'
  className?: string
  style?: React.CSSProperties
}

export function Badge({ children, variant = 'default', className, style }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
      {
        'bg-[var(--brand-surface)] text-[var(--brand-text-muted)]': variant === 'default',
        'bg-red-900/40 text-red-300 border border-red-700': variant === 'live',
        'bg-yellow-900/40 text-yellow-300': variant === 'warning',
        'bg-green-900/40 text-green-300': variant === 'success',
        'bg-purple-900/40 text-purple-300': variant === 'ai',
      },
      className
    )} style={style}>
      {variant === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 live-dot" />}
      {children}
    </span>
  )
}
