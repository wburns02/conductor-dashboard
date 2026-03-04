import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'

const galleryItems = [
  {
    id: 1,
    title: 'Nebula Dreams',
    category: 'space',
    gradient: 'from-[#8338ec] via-[#3a0ca3] to-[#00d4ff]',
    desc: 'Swirling colors from deep space',
  },
  {
    id: 2,
    title: 'Electric Sunset',
    category: 'nature',
    gradient: 'from-[#ff006e] via-[#ff6b35] to-[#ffd700]',
    desc: 'Where the sky meets fire',
  },
  {
    id: 3,
    title: 'Digital Rain',
    category: 'tech',
    gradient: 'from-[#00f5a0] via-[#00d4ff] to-[#0a0a0f]',
    desc: 'Cascading data streams',
  },
  {
    id: 4,
    title: 'Cyber Pulse',
    category: 'tech',
    gradient: 'from-[#00d4ff] via-[#8338ec] to-[#ff006e]',
    desc: 'The heartbeat of the machine',
  },
  {
    id: 5,
    title: 'Aurora Flow',
    category: 'nature',
    gradient: 'from-[#00f5a0] via-[#8338ec] to-[#00d4ff]',
    desc: 'Northern lights in motion',
  },
  {
    id: 6,
    title: 'Void Walker',
    category: 'space',
    gradient: 'from-[#0a0a0f] via-[#8338ec] to-[#ff006e]',
    desc: 'Journey into the unknown',
  },
  {
    id: 7,
    title: 'Solar Flare',
    category: 'space',
    gradient: 'from-[#ffd700] via-[#ff6b35] to-[#ff006e]',
    desc: 'Explosive energy burst',
  },
  {
    id: 8,
    title: 'Matrix Core',
    category: 'tech',
    gradient: 'from-[#00f5a0] to-[#0a0a0f]',
    desc: 'The source code of reality',
  },
  {
    id: 9,
    title: 'Coral Reef',
    category: 'nature',
    gradient: 'from-[#ff006e] via-[#ff6b35] to-[#00f5a0]',
    desc: 'Underwater color explosion',
  },
]

const categories = ['all', 'space', 'nature', 'tech']

export default function GalleryPage() {
  const [filter, setFilter] = useState('all')
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered =
    filter === 'all' ? galleryItems : galleryItems.filter((i) => i.category === filter)

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            className="text-4xl sm:text-5xl font-black text-center mb-2 bg-gradient-to-r from-[#8338ec] to-[#00d4ff] bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Gallery
          </motion.h1>
          <motion.p
            className="text-gray-400 text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Hover for 3D tilt. Click to expand. Heart to like.
          </motion.p>

          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize cursor-pointer transition-colors ${
                  filter === cat
                    ? 'bg-[#8338ec] text-white'
                    : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <GlassCard
                    glowColor={item.gradient.includes('#ff006e') ? '#ff006e' : '#8338ec'}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      {/* Gradient preview */}
                      <div
                        className={`h-48 rounded-t-2xl bg-gradient-to-br ${item.gradient} relative overflow-hidden`}
                      >
                        {/* Animated pattern overlay */}
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background:
                              'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                          }}
                          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                          transition={{ duration: 5, repeat: Infinity }}
                        />

                        {/* Like button */}
                        <motion.button
                          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[rgba(0,0,0,0.3)] backdrop-blur-sm flex items-center justify-center cursor-pointer"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={(e) => toggleLike(item.id, e)}
                        >
                          <motion.span
                            animate={liked.has(item.id) ? { scale: [1, 1.4, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {liked.has(item.id) ? '❤️' : '🤍'}
                          </motion.span>
                        </motion.button>

                        {/* Category badge */}
                        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-[rgba(0,0,0,0.4)] backdrop-blur-sm text-xs text-white capitalize">
                          {item.category}
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="text-white font-bold text-lg">{item.title}</h3>
                        <p className="text-gray-400 text-sm">{item.desc}</p>

                        <AnimatePresence>
                          {expandedId === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-[rgba(255,255,255,0.08)]">
                                <p className="text-gray-500 text-xs">
                                  Category: <span className="text-gray-300 capitalize">{item.category}</span>
                                </p>
                                <p className="text-gray-500 text-xs mt-1">
                                  ID: <span className="text-gray-300">#{item.id}</span>
                                </p>
                                <div className="flex gap-1 mt-2">
                                  {['sm', 'md', 'lg'].map((size) => (
                                    <motion.span
                                      key={size}
                                      className="px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)] text-[10px] text-gray-400"
                                      whileHover={{ background: 'rgba(131,56,236,0.2)' }}
                                    >
                                      {size}
                                    </motion.span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Likes counter */}
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ y: 100 }}
            animate={{ y: liked.size > 0 ? 0 : 100 }}
          >
            <GlassCard glowColor="#ff006e">
              <div className="px-4 py-2 flex items-center gap-2">
                <span>❤️</span>
                <span className="text-white font-bold">{liked.size}</span>
                <span className="text-gray-400 text-sm">liked</span>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
