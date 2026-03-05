import { useState } from 'react'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Terminal from '../components/Terminal'

interface TerminalInstance {
  id: number
  label: string
  command?: string
}

const PROJECTS = [
  { name: 'BreweryCRM', dir: '~/BreweryCRM', backend: '~/bearded-hop-api', prod: 'https://bearded-hop-frontend-production.up.railway.app' },
  { name: 'CrownHardware', dir: '~/CrownHardware', backend: '~/CrownHardware/backend', prod: '' },
  { name: 'ReactCRM', dir: '~/ReactCRM', backend: '~/react-crm-api', prod: 'https://react.ecbtx.com' },
]

export default function TerminalPage() {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([{ id: 1, label: 'bash' }])
  const [showLauncher, setShowLauncher] = useState(false)

  const addTerminal = (label: string, command?: string) => {
    const id = Math.max(...terminals.map(t => t.id), 0) + 1
    setTerminals(prev => [...prev, { id, label, command }])
    setShowLauncher(false)
  }

  const launchVibeLoop = (project: typeof PROJECTS[0]) => {
    const cmd = `cd ${project.dir} && claude --dangerously-skip-permissions`
    addTerminal(`vibe: ${project.name}`, cmd)
  }

  const launchVibeLoopWithPrompt = (project: typeof PROJECTS[0]) => {
    // Launch headless Claude with -p flag — output appears when done
    const prompt = `Review the current state of the ${project.name} project. Check what pages and features exist, test the production site with Playwright at ${project.prod || 'localhost'}, identify bugs or missing features, then pick the highest-impact improvement and build it. Push to GitHub when done. Test with Playwright, fix failures, iterate up to 30 times.`
    const escaped = prompt.replace(/'/g, "'\\''")
    const cmd = `cd ${project.dir} && claude --dangerously-skip-permissions -p '${escaped}'`
    addTerminal(`sprint: ${project.name}`, cmd)
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '12px', height: 'calc(100vh - 80px)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Terminal</h1>
          <div className="flex items-center" style={{ gap: '8px' }}>
            <button
              onClick={() => setShowLauncher(!showLauncher)}
              className={`text-xs font-medium rounded-full transition-all ${
                showLauncher
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40'
                  : 'bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border border-neon-purple/30'
              }`}
              style={{ padding: '4px 12px' }}
            >
              Launch Vibe Loop
            </button>
            <button
              onClick={() => addTerminal('bash')}
              className="text-xs font-medium rounded-full bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30 transition-all"
              style={{ padding: '4px 12px' }}
            >
              + New Terminal
            </button>
            <span className="text-xs text-gray-500">{terminals.length} open</span>
          </div>
        </div>

        {/* Vibe Loop Launcher */}
        {showLauncher && (
          <GlassCard glowColor="#a855f7" padding="12px">
            <div className="text-xs text-neon-purple font-semibold" style={{ marginBottom: '8px' }}>
              Launch Vibe Loop — pick a project
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PROJECTS.map((project) => (
                <div key={project.name} className="rounded-lg border border-white/[0.08] bg-white/[0.02]" style={{ padding: '10px 14px' }}>
                  <div className="text-sm text-white font-semibold">{project.name}</div>
                  <div className="text-xs text-gray-500 font-mono" style={{ marginBottom: '6px' }}>{project.dir}</div>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    <button
                      onClick={() => launchVibeLoop(project)}
                      className="text-xs rounded-full bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30 transition-all"
                      style={{ padding: '3px 10px' }}
                    >
                      Interactive
                    </button>
                    <button
                      onClick={() => launchVibeLoopWithPrompt(project)}
                      className="text-xs rounded-full bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border border-neon-purple/30 transition-all"
                      style={{ padding: '3px 10px' }}
                    >
                      Auto Sprint
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Terminal Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: terminals.length > 1 ? '1fr 1fr' : '1fr', gap: '10px', minHeight: 0 }}>
          {terminals.map((t) => (
            <GlassCard key={t.id} glowColor={t.command ? '#a855f7' : '#00f5a0'} padding="0">
              <div className="flex items-center justify-between" style={{ padding: '5px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className={`text-xs font-mono ${t.command ? 'text-neon-purple' : 'text-gray-400'}`}>
                  {t.label} #{t.id}
                </span>
                <button
                  onClick={() => {
                    if (terminals.length > 1) {
                      setTerminals(prev => prev.filter(x => x.id !== t.id))
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                  style={{ padding: '0 4px' }}
                >
                  x
                </button>
              </div>
              <div style={{ height: 'calc(100% - 28px)' }}>
                <Terminal initialCommand={t.command} />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
