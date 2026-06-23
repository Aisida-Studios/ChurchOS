import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  active?: boolean
}

export function Card({ children, className, onClick, active }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass p-4 transition-all duration-150',
        onClick && 'cursor-pointer hover:border-[#3a3d4a]',
        active && 'border-[#c8a96e]/50 bg-[#c8a96e]/5',
        className
      )}
    >
      {children}
    </div>
  )
}
