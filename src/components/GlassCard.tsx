import { useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export default function GlassCard({
  children,
  className = '',
  glowColor = '#8338ec',
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -15, y: x * 15 })
  }

  return (
    <motion.div
      ref={ref}
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setTilt({ x: 0, y: 0 })
      }}
      animate={{
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl" />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: hovering
            ? `0 0 30px ${glowColor}33, 0 0 60px ${glowColor}15, inset 0 0 30px ${glowColor}08`
            : `0 0 0px transparent`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Shimmer line */}
      {hovering && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor}88, transparent)`,
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
