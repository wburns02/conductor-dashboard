import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import ParticleField from './ParticleField'
import { api } from '../api'
import { usePolling } from '../hooks/usePolling'
import type { HumanRequest } from '../api'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/tasks', label: 'Tasks', icon: '▤' },
  { to: '/workers', label: 'Workers', icon: '⚡' },
  { to: '/requests', label: 'Requests', icon: '💬' },
  { to: '/events', label: 'Events', icon: '◎' },
  { to: '/sessions', label: 'Sessions', icon: '🖥' },
  { to: '/terminal', label: 'Terminal', icon: '>' },
  { to: '/intelligence', label: 'Intel', icon: '🧠' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const { data: requests } = usePolling<HumanRequest[]>(
    useCallback(() => api.humanRequests.list(), []),
    5000,
  )

  // Health check
  usePolling(
    useCallback(async () => {
      try {
        await api.health()
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }, []),
    10000,
  )

  const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[rgba(10,10,15,0.8)] border-b border-[rgba(255,255,255,0.06)]">
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.75rem 2rem' }} className="flex items-center justify-between">
          <NavLink to="/">
            <motion.div
              className="flex items-center"
              style={{ gap: '8px' }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-xl">🎭</span>
              <span className="text-lg font-bold bg-gradient-to-r from-[#00d4ff] via-[#8338ec] to-[#ff006e] bg-clip-text text-transparent">
                Conductor AI
              </span>
            </motion.div>
          </NavLink>

          <div className="flex items-center" style={{ gap: '4px' }}>
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`
                }
                style={{ padding: '8px 12px', gap: '6px' }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#8338ec]/30 to-[#00d4ff]/30 border border-[#8338ec]/40"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{icon}</span>
                    <span className="relative z-10 hidden sm:inline">{label}</span>
                    {label === 'Requests' && pendingRequests > 0 && (
                      <motion.span
                        className="relative z-10 rounded-full bg-neon-pink/20 text-neon-pink text-[10px] font-bold"
                        style={{ marginLeft: '4px', padding: '2px 6px' }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        {pendingRequests}
                      </motion.span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center" style={{ gap: '8px' }}>
            <div className={`rounded-full ${connected === true ? 'bg-emerald-400' : connected === false ? 'bg-red-400' : 'bg-gray-600'}`} style={{ width: '8px', height: '8px' }} />
            <span className="text-xs text-gray-500">{connected === true ? 'Connected' : connected === false ? 'Offline' : '...'}</span>
          </div>
        </div>
      </nav>
      {connected === false && !window.location.hostname.endsWith('.ts.net') && !['localhost', '127.0.0.1'].includes(window.location.hostname) && (
        <div style={{ position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 40, padding: '12px 24px', background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
          <span className="text-sm text-red-300">
            Cannot reach local API. Access the dashboard directly at{' '}
            <a href="https://r730.tailad2d5f.ts.net/" className="text-red-200 underline font-bold">
              r730.tailad2d5f.ts.net
            </a>
          </span>
        </div>
      )}
      <main style={{ paddingTop: '80px' }}>{children}</main>
    </div>
  )
}
