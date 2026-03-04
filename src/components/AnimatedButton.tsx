import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: AnimatedButtonProps) {
  const baseStyles = 'relative px-6 py-3 rounded-xl font-semibold text-sm overflow-hidden cursor-pointer'

  const variants = {
    primary:
      'bg-gradient-to-r from-[#8338ec] to-[#00d4ff] text-white shadow-lg shadow-[#8338ec]/20',
    secondary:
      'bg-[rgba(255,255,255,0.05)] text-white border border-[rgba(255,255,255,0.1)] hover:border-[#8338ec]/50',
    ghost: 'text-gray-300 hover:text-white',
  }

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    >
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#00d4ff] to-[#ff006e] opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  )
}
