import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import AnimatedButton from '../components/AnimatedButton'
import GlassCard from '../components/GlassCard'

const features = [
  {
    icon: '✨',
    title: 'Interactive Particles',
    desc: 'Move your mouse to watch particles dance around you',
    glow: '#00d4ff',
  },
  {
    icon: '🎨',
    title: 'Playground',
    desc: 'Mix colors, drag elements, and create chaos',
    glow: '#ff006e',
  },
  {
    icon: '🖼️',
    title: 'Gallery',
    desc: 'Explore beautiful cards with 3D tilt effects',
    glow: '#8338ec',
  },
  {
    icon: '💬',
    title: 'Connect',
    desc: 'Animated forms that make input feel alive',
    glow: '#00f5a0',
  },
]

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export default function HeroPage() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8338ec]/15 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-[128px] pointer-events-none" />

        <motion.div
          className="text-center max-w-4xl z-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#8338ec]/15 border border-[#8338ec]/30 text-[#00d4ff] text-xs font-semibold tracking-widest uppercase">
              Interactive Experience
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-7xl font-black tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-white via-[#00d4ff] to-[#8338ec] bg-clip-text text-transparent">
              Feel the Interface
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Every pixel responds to you. Explore a world of animated interactions,
            fluid transitions, and playful micro-moments that make you want to keep clicking.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center mb-20">
            <AnimatedButton onClick={() => navigate('/playground')}>
              Enter the Playground →
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={() => navigate('/gallery')}>
              View Gallery
            </AnimatedButton>
          </motion.div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full z-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <GlassCard glowColor={f.glow} className="h-full">
                <div className="p-6">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="text-white font-bold mb-1">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-2 text-gray-500 text-xs"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>Scroll or explore</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12L2 6h12L8 12z" />
          </svg>
        </motion.div>
      </div>
    </PageTransition>
  )
}
