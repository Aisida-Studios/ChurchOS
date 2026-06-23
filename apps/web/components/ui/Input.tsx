import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-xs text-[#888880] uppercase tracking-widest">{label}</label>}
    <input
      ref={ref}
      className={clsx(
        'w-full px-3 py-2 bg-[#0d0f14] border rounded-lg text-sm text-[#e8e0d0] placeholder-[#444] outline-none transition-colors',
        error ? 'border-red-500 focus:border-red-400' : 'border-[#2a2d38] focus:border-[#c8a96e]',
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
))
Input.displayName = 'Input'
