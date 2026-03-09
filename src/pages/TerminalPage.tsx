import { useState } from 'react'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import Terminal, { type TerminalStatus } from '../components/Terminal'

interface TerminalInstance {
  id: number
  label: string
  command?: string
  autoPrompt?: string
  autoRepeat?: boolean
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return '' }
}

const STATE_COLORS: Record<string, string> = {
  'starting': 'text-yellow-400',
  'waiting-for-claude': 'text-yellow-400',
  'prompt-sent': 'text-cyan-400',
  'running': 'text-neon-green',
  'idle': 'text-orange-400',
  'disconnected': 'text-red-400',
}

const STATE_LABELS: Record<string, string> = {
  'starting': 'Starting...',
  'waiting-for-claude': 'Waiting for Claude...',
  'prompt-sent': 'Sending prompt...',
  'running': 'Running',
  'idle': 'Idle',
  'disconnected': 'Disconnected',
}

const PROJECTS = [
  { name: 'ReactCRM', dir: '~/ReactCRM', backend: '~/react-crm-api', prod: 'https://react.ecbtx.com' },
  { name: 'SOCDashboard', dir: '~/security-stack/soc-dashboard', backend: '', prod: '' },
  { name: 'BreweryCRM', dir: '~/BreweryCRM', backend: '~/bearded-hop-api', prod: 'https://bearded-hop-frontend-production.up.railway.app' },
  { name: 'LandscapeCRM', dir: '~/LandscapeCRM', backend: '~/landscape-crm-api', prod: '' },
  { name: 'CrownHardware', dir: '~/CrownHardware', backend: '~/CrownHardware/backend', prod: '' },
  { name: 'PeakDipVibe', dir: '~/PeakDipVibe', backend: '', prod: '' },
]

const COMPETITORS: Record<string, string[]> = {
  ReactCRM: ['ServiceTitan (AI dispatch, pricebook management, real-time GPS)', 'Housecall Pro (online booking, automated follow-ups, review requests)', 'FieldEdge (QuickBooks sync, flat-rate pricing, performance dashboards)', 'Workiz (AI call answering, lead scoring, two-way SMS)', 'Service Fusion (estimate-to-invoice pipeline, fleet GPS, customer portal)'],
  SOCDashboard: ['Splunk SOAR (automated playbooks, 300+ integrations, case management)', 'IBM QRadar (AI threat detection, UEBA, network flow analysis)', 'Microsoft Sentinel (cloud-native SIEM, MITRE ATT&CK mapping, automated investigation)', 'Elastic Security (unified SIEM + endpoint, ML anomaly detection, osquery)', 'Wazuh (open-source XDR, file integrity monitoring, vulnerability detection)'],
  BreweryCRM: ['Ekos (grain-to-glass tracking, TTB compliance)', 'Ollie (taproom POS, keg tracking, distributor portal)', 'Breww (real-time tank monitoring, automated batch costing)', 'Arryved (mobile ordering, tab management, event ticketing)', 'Untappd for Business (menu publishing, customer ratings, social integration)'],
  LandscapeCRM: ['Jobber (one-click rebooking, automated invoicing, client hub)', 'ServiceTitan (GPS fleet tracking, real-time dispatch, customer ETA texts)', 'LMN (crew time tracking, job costing, budget vs actual)', 'Aspire (proposal builder, route optimization, chemical tracking)', 'SingleOps (drag-and-drop scheduling, photo documentation, recurring services)'],
  CrownHardware: ['Fishbowl (manufacturing BOM, work orders, inventory forecasting)', 'Katana (visual production planning, batch tracking, live floor control)', 'MRPeasy (capacity planning, quality control, shipping integration)', 'JobBOSS (quoting, shop floor data collection, tool tracking)', 'Odoo Manufacturing (PLM, quality alerts, maintenance scheduling)'],
  PeakDipVibe: ['TradingView (advanced charting, Pine Script alerts, social trading ideas)', 'Thinkorswim (real-time scanners, thinkScript backtesting, options analytics)', 'Trade Ideas (AI-powered scanner, Holly AI bot, simulated trading)', 'Finviz (visual stock screener, heatmaps, insider trading tracker)', 'StockCharts (technical scan workbench, breadth indicators, sector rotation)'],
}

export default function TerminalPage() {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([{ id: 1, label: 'bash' }])
  const [showLauncher, setShowLauncher] = useState(false)
  const [statuses, setStatuses] = useState<Record<number, TerminalStatus>>({})

  const addTerminal = (label: string, command?: string) => {
    const id = Math.max(...terminals.map(t => t.id), 0) + 1
    setTerminals(prev => [...prev, { id, label, command }])
    setShowLauncher(false)
  }

  const launchWithPrompt = (project: typeof PROJECTS[0], label: string, prompt: string) => {
    const cmd = `cd ${project.dir} && claude --dangerously-skip-permissions`
    const id = Math.max(...terminals.map(t => t.id), 0) + 1
    setTerminals(prev => [...prev, { id, label: `${label}: ${project.name}`, command: cmd, autoPrompt: prompt, autoRepeat: true }])
    setShowLauncher(false)
  }

  const launchInteractive = (project: typeof PROJECTS[0]) => {
    addTerminal(`vibe: ${project.name}`, `cd ${project.dir} && claude --dangerously-skip-permissions`)
  }

  const launchQASprint = (project: typeof PROJECTS[0]) => {
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
    launchWithPrompt(project, 'qa', prompt)
  }

  const launchVisionarySprint = (project: typeof PROJECTS[0]) => {
    const competitors = COMPETITORS[project.name] || []
    const competitorList = competitors.map((c, i) => `${i + 1}. ${c}`).join('\n')

    const prompt = `You are the world's best SaaS product designer. You've studied every CRM and business platform that achieved $100M+ ARR. You know what makes users fall in love with software — it's not features, it's workflows that feel magical.

PROJECT: ${project.name}
PRODUCTION: ${project.prod || 'not deployed yet'}

TOP COMPETITORS AND THEIR KILLER FEATURES:
${competitorList}

YOUR MISSION — Build ONE feature so good it becomes the reason someone chooses this platform over every competitor.

PHASE 1 — RESEARCH (use Playwright to study the current app at ${project.prod || 'localhost:5173'}):
- Navigate every page, understand what exists
- Identify the #1 gap: what would make a user open this app every morning before their coffee?
- Think about WORKFLOWS not features. Don't build "a dashboard" — build "the thing that tells a business owner exactly what to do today and lets them do it in one click"

PHASE 2 — DESIGN THE KILLER FEATURE:
- It should feel opinionated and magical, not generic
- It should automate something that currently takes 10+ minutes manually
- It should surface insights the user didn't know they needed
- Think: predictive suggestions, one-click actions, real-time status, smart defaults, proactive alerts

PHASE 3 — BUILD IT:
- Create beautiful, polished UI with animations, charts, and micro-interactions
- Use real-looking data (not "Lorem ipsum" or "Test Item 1")
- Mobile responsive
- Loading skeletons for async data
- Empty states that guide the user
- Success/error feedback on every action

PHASE 4 — POLISH (review your own work like an Apple design critic):
- Are the animations smooth and purposeful (not gratuitous)?
- Does every button have hover/active states?
- Are error messages helpful and specific?
- Is the typography hierarchy clear?
- Would a first-time user understand what to do without instructions?

PHASE 5 — VERIFY with Playwright:
- Test every interaction: clicks, form fills, saves, navigation
- Verify data persists after save
- Check console for errors
- Test on different viewport sizes

Push to GitHub after building. Iterate up to 30 times on Playwright failures. Only declare success when EVERYTHING works perfectly.`
    launchWithPrompt(project, 'vision', prompt)
  }

  const launchFullPipeline = (project: typeof PROJECTS[0]) => {
    const competitors = COMPETITORS[project.name] || []
    const competitorList = competitors.map((c, i) => `${i + 1}. ${c}`).join('\n')

    const prompt = `You are running a FULL PRODUCT PIPELINE for ${project.name}. This is a multi-phase sprint that covers research, building, polishing, and QA — like a complete product team compressed into one session.

PRODUCTION: ${project.prod || 'not deployed yet'}

COMPETITORS:
${competitorList}

═══════════════════════════════════════════
PHASE 1 — RESEARCH & AUDIT (15 min)
═══════════════════════════════════════════
Use Playwright to deeply test ${project.prod || 'localhost:5173'}:
- Visit every page, click every button, fill every form, try to save
- Document what works, what's broken, what's missing
- Compare against the competitors above — what do they have that we don't?
- Create a ranked list:
  TOP 5 BUGS (broken buttons, forms that don't save, crashes)
  TOP 3 MISSING FEATURES (things competitors have that would 10x this app)

═══════════════════════════════════════════
PHASE 2 — FIX ALL BUGS (30 min)
═══════════════════════════════════════════
Work through all 5 bugs. For each:
- Fix the root cause
- Verify with Playwright (click, fill, save, confirm)
- Push to GitHub
Do NOT move to Phase 3 until all 5 bugs pass Playwright verification.

═══════════════════════════════════════════
PHASE 3 — BUILD THE #1 MISSING FEATURE (60 min)
═══════════════════════════════════════════
Pick the highest-impact missing feature and build it completely:
- Beautiful, polished UI with animations and micro-interactions
- Real-looking mock data (names, amounts, dates that look genuine)
- Loading skeletons, empty states, success/error feedback
- Mobile responsive
- Integrated into the existing navigation and data flow

═══════════════════════════════════════════
PHASE 4 — POLISH PASS (15 min)
═══════════════════════════════════════════
Review everything you built like a design critic:
- Smooth animations (not janky or gratuitous)
- Consistent spacing, typography, colors
- Every button has hover/active/disabled states
- Empty states guide the user on what to do
- Error messages are specific and helpful
- First-time user can understand the UI without instructions
Fix anything that falls short.

═══════════════════════════════════════════
PHASE 5 — FINAL QA SWEEP (15 min)
═══════════════════════════════════════════
Full Playwright verification of EVERYTHING:
- Every page loads
- Every button works
- Every form saves data
- Every navigation link works
- No console errors
- New feature fully functional

Push final state to GitHub. Only declare success when the full sweep passes.
Iterate up to 30 times on failures.`
    launchWithPrompt(project, 'pipeline', prompt)
  }

  const launchPerformanceSprint = (project: typeof PROJECTS[0]) => {
    const prompt = `You are a senior performance engineer auditing ${project.name}. Your goal is to make this app FAST — sub-second page loads, smooth 60fps animations, minimal bundle size.

PRODUCTION: ${project.prod || 'localhost:5173'}

═══════════════════════════════════════════
PHASE 1 — PERFORMANCE AUDIT
═══════════════════════════════════════════
Use Playwright to measure performance on every page:
- Time each page navigation (goto + domcontentloaded)
- Count network requests per page
- Check for: large images, unoptimized assets, render-blocking scripts
- Look at bundle size — run \`npm run build\` and check the output
- Identify the 3 slowest pages and the root cause of each

═══════════════════════════════════════════
PHASE 2 — OPTIMIZE (fix the top 5 issues)
═══════════════════════════════════════════
Common fixes to apply:
- Add React.lazy() and Suspense for route-level code splitting
- Add loading="lazy" to images
- Replace heavy imports with lighter alternatives
- Add useMemo/useCallback where re-renders are excessive
- Optimize API calls — remove N+1 queries, add pagination
- Add skeleton loaders for perceived performance

═══════════════════════════════════════════
PHASE 3 — VERIFY
═══════════════════════════════════════════
Re-run Playwright timing on every page. Compare before/after.
Target: every page loads in under 2 seconds on localhost.
Push to GitHub. Iterate up to 15 times on failures.`
    launchWithPrompt(project, 'perf', prompt)
  }

  const launchSecuritySprint = (project: typeof PROJECTS[0]) => {
    const prompt = `You are a security engineer doing a thorough security audit of ${project.name}. Find and fix vulnerabilities before attackers do.

PRODUCTION: ${project.prod || 'localhost:5173'}

═══════════════════════════════════════════
PHASE 1 — SECURITY SCAN
═══════════════════════════════════════════
Use Playwright and code review to check for:

FRONTEND:
- XSS: Any user input rendered with dangerouslySetInnerHTML or without sanitization
- Open redirects: URL parameters used in navigation without validation
- Sensitive data in localStorage/sessionStorage (tokens, passwords, PII)
- Console logging sensitive data in production
- CORS misconfigurations

BACKEND (if applicable):
- SQL injection in any raw queries
- Missing input validation on API endpoints
- Missing auth checks on protected routes
- Hardcoded secrets or API keys in source code
- Missing rate limiting on auth endpoints
- File upload without type/size validation

DEPENDENCIES:
- Run \`npm audit\` and check for critical/high vulnerabilities
- Check for outdated packages with known CVEs

═══════════════════════════════════════════
PHASE 2 — FIX ALL FINDINGS
═══════════════════════════════════════════
For each vulnerability:
1. Fix the root cause (not just a band-aid)
2. Add a test that would catch the regression
3. Verify the fix with Playwright

═══════════════════════════════════════════
PHASE 3 — VERIFY
═══════════════════════════════════════════
Re-run all checks. Confirm zero high/critical findings.
Run \`npm audit\` and confirm clean or only low-severity.
Push to GitHub.`
    launchWithPrompt(project, 'security', prompt)
  }

  const launchMobileSprint = (project: typeof PROJECTS[0]) => {
    const prompt = `You are a mobile-first UI/UX expert auditing ${project.name} for mobile responsiveness. Every feature must work perfectly on phone screens.

PRODUCTION: ${project.prod || 'localhost:5173'}

═══════════════════════════════════════════
PHASE 1 — MOBILE AUDIT (use Playwright with mobile viewport)
═══════════════════════════════════════════
Set viewport to iPhone 14 (390x844) and test EVERY page:

await page.setViewportSize({ width: 390, height: 844 });

On each page check:
- Does content overflow horizontally? (horizontal scrollbar = broken)
- Are touch targets at least 44x44px? (tiny buttons = unusable)
- Do tables collapse or scroll properly?
- Do modals/dropdowns fit on screen?
- Does the navigation menu work? (hamburger menu, slide-out, etc.)
- Are fonts readable without zooming? (minimum 14px body text)
- Do charts/graphs resize or become unreadable?

Create a ranked list: TOP 5 worst mobile issues.

═══════════════════════════════════════════
PHASE 2 — FIX ALL 5 ISSUES
═══════════════════════════════════════════
For each issue:
- Use responsive Tailwind classes (sm:, md:, lg:)
- Stack columns vertically on mobile (grid-cols-1 → sm:grid-cols-2)
- Replace horizontal tables with card layouts on mobile
- Make sure touch targets are large enough
- Add proper overflow handling (overflow-x-auto on tables)

═══════════════════════════════════════════
PHASE 3 — VERIFY ON 3 VIEWPORTS
═══════════════════════════════════════════
Test every page at:
1. iPhone 14 (390x844)
2. iPad (768x1024)
3. Desktop (1280x800)

All pages must be fully functional at all 3 sizes.
Push to GitHub. Iterate up to 20 times on failures.`
    launchWithPrompt(project, 'mobile', prompt)
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
              Launch Vibe Loop — pick a project and sprint type
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PROJECTS.map((project) => (
                <div key={project.name} className="rounded-lg border border-white/[0.08] bg-white/[0.02]" style={{ padding: '10px 14px', minWidth: '200px' }}>
                  <div className="text-sm text-white font-semibold">{project.name}</div>
                  <div className="text-xs text-gray-500 font-mono" style={{ marginBottom: '6px' }}>{project.dir}</div>
                  <div className="flex items-center flex-wrap" style={{ gap: '4px' }}>
                    <button
                      onClick={() => launchInteractive(project)}
                      className="text-xs rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      Interactive
                    </button>
                    <button
                      onClick={() => launchQASprint(project)}
                      className="text-xs rounded-full bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      QA Fix 5
                    </button>
                    <button
                      onClick={() => launchVisionarySprint(project)}
                      className="text-xs rounded-full bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border border-neon-purple/30 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      Visionary
                    </button>
                    <button
                      onClick={() => launchFullPipeline(project)}
                      className="text-xs rounded-full bg-[#ff006e]/10 text-[#ff006e] hover:bg-[#ff006e]/20 border border-[#ff006e]/30 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      Full Pipeline
                    </button>
                    <button
                      onClick={() => launchPerformanceSprint(project)}
                      className="text-xs rounded-full bg-[#eab308]/10 text-[#eab308] hover:bg-[#eab308]/20 border border-[#eab308]/30 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      Performance
                    </button>
                    <button
                      onClick={() => launchSecuritySprint(project)}
                      className="text-xs rounded-full bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border border-[#ef4444]/30 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      Security
                    </button>
                    <button
                      onClick={() => launchMobileSprint(project)}
                      className="text-xs rounded-full bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 border border-[#00d4ff]/30 transition-all"
                      style={{ padding: '3px 8px' }}
                    >
                      Mobile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Terminal Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: terminals.length > 1 ? '1fr 1fr' : '1fr', gap: '10px', minHeight: 0 }}>
          {terminals.map((t) => {
            const status = statuses[t.id]
            return (
            <GlassCard key={t.id} glowColor={t.label.startsWith('vision') ? '#a855f7' : t.label.startsWith('pipeline') ? '#ff006e' : t.label.startsWith('qa') ? '#00f5a0' : t.label.startsWith('perf') ? '#eab308' : t.label.startsWith('security') ? '#ef4444' : t.label.startsWith('mobile') ? '#00d4ff' : t.command ? '#00d2ff' : '#00f5a0'} padding="0">
              <div className="flex items-center justify-between" style={{ padding: '5px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <span className={`text-xs font-mono ${t.command ? 'text-neon-purple' : 'text-gray-400'}`}>
                    {t.label} #{t.id}
                  </span>
                  {status && (
                    <>
                      <span className={`text-xs font-mono ${STATE_COLORS[status.state] || 'text-gray-500'}`}>
                        {STATE_LABELS[status.state] || status.state}
                      </span>
                      {status.sprintCount > 0 && (
                        <span className="text-xs font-mono text-gray-500">
                          Sprint #{status.sprintCount}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  {status && (
                    <span className="text-xs font-mono text-gray-600">
                      {formatTime(status.startedAt)} | Last: {formatTime(status.lastActivity)}
                    </span>
                  )}
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
              </div>
              <div style={{ height: 'calc(100% - 28px)' }}>
                <Terminal
                  initialCommand={t.command}
                  delayedCommand={t.autoPrompt}
                  autoRepeat={t.autoRepeat}
                  onStatusChange={(s) => setStatuses(prev => ({ ...prev, [t.id]: s }))}
                />
              </div>
            </GlassCard>
            )
          })}
        </div>
      </div>
    </PageTransition>
  )
}
