import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import AnimatedButton from '../components/AnimatedButton'

interface Orb {
  id: number
  x: number
  y: number
  color: string
  size: number
}

const presetColors = ['#00d4ff', '#ff006e', '#8338ec', '#00f5a0', '#ff6b35', '#ffd700']

export default function PlaygroundPage() {
  const [orbs, setOrbs] = useState<Orb[]>([])
  const [selectedColor, setSelectedColor] = useState(presetColors[0])
  const [counter, setCounter] = useState(0)
  const [toggles, setToggles] = useState([false, false, false])
  const [sliderVal, setSliderVal] = useState(50)
  const nextId = useRef(0)
  const playgroundRef = useRef<HTMLDivElement>(null)

  const addOrb = useCallback(
    (e: React.MouseEvent) => {
      if (!playgroundRef.current) return
      const rect = playgroundRef.current.getBoundingClientRect()
      const newOrb: Orb = {
        id: nextId.current++,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        color: selectedColor,
        size: 30 + Math.random() * 50,
      }
      setOrbs((prev) => [...prev, newOrb])
    },
    [selectedColor]
  )

  const removeOrb = (id: number) => {
    setOrbs((prev) => prev.filter((o) => o.id !== id))
  }

  const clearAll = () => setOrbs([])

  const toggleAt = (idx: number) => {
    setToggles((prev) => prev.map((v, i) => (i === idx ? !v : v)))
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            className="text-4xl sm:text-5xl font-black text-center mb-2 bg-gradient-to-r from-[#ff006e] to-[#ff6b35] bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Playground
          </motion.h1>
          <motion.p
            className="text-gray-400 text-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Click the canvas to spawn orbs. Tap them to pop. Play with the controls below.
          </motion.p>

          {/* Canvas area */}
          <GlassCard glowColor="#ff006e" className="mb-8">
            <div
              ref={playgroundRef}
              className="relative h-80 sm:h-96 overflow-hidden rounded-2xl cursor-crosshair"
              onClick={addOrb}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] to-[#1a1a2e]" />
              <AnimatePresence>
                {orbs.map((orb) => (
                  <motion.div
                    key={orb.id}
                    className="absolute rounded-full cursor-pointer"
                    style={{
                      left: orb.x - orb.size / 2,
                      top: orb.y - orb.size / 2,
                      width: orb.size,
                      height: orb.size,
                      background: `radial-gradient(circle, ${orb.color}cc, ${orb.color}33)`,
                      boxShadow: `0 0 ${orb.size}px ${orb.color}44`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: [0, -10, 0],
                    }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{
                      scale: { type: 'spring', stiffness: 400, damping: 15 },
                      y: { duration: 2 + Math.random() * 2, repeat: Infinity },
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOrb(orb.id)
                    }}
                    whileHover={{ scale: 1.3 }}
                  />
                ))}
              </AnimatePresence>
              {orbs.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                  <motion.span
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Click anywhere to create orbs
                  </motion.span>
                </div>
              )}
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 pointer-events-none">
                {orbs.length} orb{orbs.length !== 1 ? 's' : ''}
              </div>
            </div>
          </GlassCard>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Color picker */}
            <GlassCard glowColor={selectedColor}>
              <div className="p-6">
                <h3 className="text-white font-bold mb-3">Color Palette</h3>
                <div className="flex gap-2 flex-wrap">
                  {presetColors.map((c) => (
                    <motion.button
                      key={c}
                      className="w-10 h-10 rounded-xl cursor-pointer border-2"
                      style={{
                        background: c,
                        borderColor: selectedColor === c ? 'white' : 'transparent',
                      }}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Counter */}
            <GlassCard glowColor="#00d4ff">
              <div className="p-6 text-center">
                <h3 className="text-white font-bold mb-3">Tap Counter</h3>
                <motion.div
                  className="text-5xl font-black text-[#00d4ff] mb-4"
                  key={counter}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {counter}
                </motion.div>
                <div className="flex gap-2 justify-center">
                  <AnimatedButton onClick={() => setCounter((c) => c + 1)}>+1</AnimatedButton>
                  <AnimatedButton variant="secondary" onClick={() => setCounter(0)}>Reset</AnimatedButton>
                </div>
              </div>
            </GlassCard>

            {/* Toggles */}
            <GlassCard glowColor="#00f5a0">
              <div className="p-6">
                <h3 className="text-white font-bold mb-3">Toggles</h3>
                {['Particles', 'Glow Mode', 'Dark Matter'].map((label, i) => (
                  <div key={label} className="flex items-center justify-between mb-3 last:mb-0">
                    <span className="text-gray-300 text-sm">{label}</span>
                    <motion.button
                      className="w-12 h-6 rounded-full relative cursor-pointer"
                      style={{
                        background: toggles[i]
                          ? 'linear-gradient(90deg, #00f5a0, #00d4ff)'
                          : 'rgba(255,255,255,0.1)',
                      }}
                      onClick={() => toggleAt(i)}
                      whileTap={{ scale: 0.9 }}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-white absolute top-0.5"
                        animate={{ left: toggles[i] ? 26 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Slider */}
            <GlassCard glowColor="#ff6b35">
              <div className="p-6">
                <h3 className="text-white font-bold mb-3">Energy Level</h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderVal}
                  onChange={(e) => setSliderVal(Number(e.target.value))}
                  className="w-full accent-[#ff6b35] cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Calm</span>
                  <motion.span
                    className="text-[#ff6b35] font-bold text-lg"
                    key={sliderVal}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                  >
                    {sliderVal}%
                  </motion.span>
                  <span>Chaos</span>
                </div>
              </div>
            </GlassCard>

            {/* Clear button */}
            <GlassCard glowColor="#ff006e">
              <div className="p-6 flex flex-col items-center justify-center h-full">
                <AnimatedButton
                  variant="secondary"
                  onClick={clearAll}
                  className="border-[#ff006e]/30 hover:border-[#ff006e]"
                >
                  Clear All Orbs
                </AnimatedButton>
                <p className="text-gray-500 text-xs mt-2">Remove all orbs from canvas</p>
              </div>
            </GlassCard>

            {/* Animated emoji */}
            <GlassCard glowColor="#ffd700">
              <div className="p-6 flex flex-col items-center justify-center h-full">
                <motion.div
                  className="text-6xl cursor-pointer select-none"
                  animate={{
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileHover={{ scale: 1.5 }}
                  whileTap={{ scale: 0.5, rotate: 360 }}
                >
                  🚀
                </motion.div>
                <p className="text-gray-400 text-xs mt-3">Tap me!</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
