import { useState } from 'react'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Terminal from '../components/Terminal'

interface TerminalInstance {
  id: number
  label: string
  command?: string
  autoPrompt?: string
}

const PROJECTS = [
  { name: 'BreweryCRM', dir: '~/BreweryCRM', backend: '~/bearded-hop-api', prod: 'https://bearded-hop-frontend-production.up.railway.app' },
  { name: 'LandscapeCRM', dir: '~/LandscapeCRM', backend: '~/landscape-crm-api', prod: '' },
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
    // Launch Claude interactively with --dangerously-skip-permissions
    // The prompt is sent as a second initialCommand after Claude starts up
    const prompt = `You are doing a deep QA audit of ${project.name}. Use Playwright to test the production site at ${project.prod || 'localhost:5173'}.

STEP 1 — DEEP SCAN: Open every page. On each page:
- Click every button, link, tab, and dropdown
- Fill out every form and hit Save/Submit — verify it actually saves (check for success toast, network response, or data appearing)
- Check for console errors, broken layouts, missing data, buttons that do nothing
- Test navigation between pages

STEP 2 — RANK: From everything you found, list the TOP 5 most critical issues (bugs, broken features, non-functional buttons, forms that don't save, pages that crash).

STEP 3 — FIX ALL 5: Work through each issue one by one. For each:
1. Fix the root cause in the code
2. Test with Playwright to verify the fix works (click the button, submit the form, confirm it saves)
3. If the fix breaks something else, fix that too

STEP 4 — FINAL VERIFICATION: Run a full Playwright pass across all pages to confirm everything works. Click buttons, submit forms, verify saves.

Push to GitHub after each fix. Iterate up to 30 times if needed. Do not stop until all 5 issues are verified fixed.`
    const cmd = `cd ${project.dir} && claude --dangerously-skip-permissions`
    const id = Math.max(...terminals.map(t => t.id), 0) + 1
    setTerminals(prev => [...prev, { id, label: `sprint: ${project.name}`, command: cmd, autoPrompt: prompt }])
    setShowLauncher(false)
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
                <Terminal initialCommand={t.command} delayedCommand={t.autoPrompt} />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
