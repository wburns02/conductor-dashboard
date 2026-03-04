import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import { api } from '../api'
import type { Session, SessionSummary, AutomationSetting } from '../api'
import { usePolling } from '../hooks/usePolling'

export default function SessionsPage() {
  const { data: sessions } = usePolling<Session[]>(useCallback(() => api.sessions.list(), []), 3000)
  const [summaries, setSummaries] = useState<Record<string, SessionSummary>>({})
  const [automationSettings, setAutomationSettings] = useState<Record<string, AutomationSetting>>({})
  const [summariesLoading, setSummariesLoading] = useState(true)

  // Load all summaries on mount and poll every 30s
  useEffect(() => {
    let active = true
    const load = () => {
      api.sessions.summaries()
        .then(data => { if (active) { setSummaries(data); setSummariesLoading(false) } })
        .catch(() => { if (active) setSummariesLoading(false) })
    }
    load()
    const interval = setInterval(load, 30000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  // Load automation settings
  useEffect(() => {
    api.sessions.automation().then(setAutomationSettings).catch(() => {})
  }, [])

  const running = sessions?.filter(s => s.status === 'running') || []

  const handleToggleAutomation = async (sessionId: string, enabled: boolean) => {
    try {
      await api.sessions.setAutomation(sessionId, enabled)
      setAutomationSettings(prev => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], session_id: sessionId, enabled: enabled ? 1 : 0, last_prompt_at: prev[sessionId]?.last_prompt_at ?? null, prompt_count: prev[sessionId]?.prompt_count ?? 0, created_at: prev[sessionId]?.created_at ?? '' },
      }))
    } catch {
      // ignore
    }
  }

  const handleRefreshSummary = async (sessionId: string) => {
    try {
      const data = await api.sessions.summary(sessionId)
      setSummaries(prev => ({ ...prev, [sessionId]: data }))
    } catch {
      // ignore
    }
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '2rem 2rem', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <h1 className="text-2xl font-bold text-white">Live Sessions</h1>
          {running.length > 0 && (
            <motion.span
              className="rounded-full bg-neon-green/15 text-neon-green text-xs font-bold"
              style={{ padding: '4px 10px' }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {running.length} active
            </motion.span>
          )}
          {summariesLoading && (
            <span className="text-xs text-gray-500">Loading summaries...</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sessions?.map((session, i) => (
            <motion.div
              key={session.pid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SessionCard
                session={session}
                summary={summaries[session.session_id] || null}
                automationEnabled={!!automationSettings[session.session_id]?.enabled}
                onToggleAutomation={handleToggleAutomation}
                onRefreshSummary={handleRefreshSummary}
              />
            </motion.div>
          ))}

          {!sessions && (
            <div className="text-center text-gray-500" style={{ padding: '64px 0' }}>Loading sessions...</div>
          )}
          {sessions && sessions.length === 0 && (
            <div className="text-center text-gray-500" style={{ padding: '64px 0' }}>
              No Claude sessions detected. Start a Claude session in your terminal to see it here.
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function SessionCard({ session: s, summary, automationEnabled, onToggleAutomation, onRefreshSummary }: {
  session: Session
  summary: SessionSummary | null
  automationEnabled: boolean
  onToggleAutomation: (sessionId: string, enabled: boolean) => void
  onRefreshSummary: (sessionId: string) => void
}) {
  const isRunning = s.status === 'running'
  const glowColor = isRunning ? '#00f5a0' : '#6b7280'
  const [showPrompt, setShowPrompt] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return
    setSending(true)
    setResult(null)
    try {
      await api.sessions.sendPrompt(s.pid, prompt)
      setResult({ type: 'success', message: `Prompt sent to ${s.tty}` })
      setPrompt('')
      setTimeout(() => {
        setResult(null)
        setShowPrompt(false)
      }, 3000)
    } catch (err) {
      setResult({ type: 'error', message: err instanceof Error ? err.message : 'Failed to send' })
    } finally {
      setSending(false)
    }
  }

  // Derive a short "what is this session doing" description
  const taskDescription = summary?.last_user_message || summary?.last_assistant_message || null

  return (
    <GlassCard glowColor={glowColor} padding="20px">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between" style={{ marginBottom: '8px', gap: '8px' }}>
        <div className="flex items-center" style={{ gap: '12px', minWidth: 0 }}>
          <motion.div
            className="rounded-full shrink-0"
            style={{ width: '10px', height: '10px', backgroundColor: glowColor }}
            animate={isRunning ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-sm font-bold text-white truncate">
            {s.session_title || s.tty || `PID ${s.pid}`}
          </span>
          <span className="text-xs text-gray-500 font-mono shrink-0">{s.tty}</span>
        </div>
        <div className="flex items-center flex-wrap" style={{ gap: '6px' }}>
          {isRunning && (
            <button
              onClick={() => { setShowPrompt(!showPrompt); setResult(null) }}
              className={`text-xs font-medium rounded-full transition-all ${
                showPrompt
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40'
                  : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.1] border border-white/[0.1]'
              }`}
              style={{ padding: '4px 12px' }}
            >
              {showPrompt ? 'Cancel' : 'Send Prompt'}
            </button>
          )}
          <span
            className={`text-xs rounded-full shrink-0 ${isRunning ? 'bg-neon-green/15 text-neon-green' : 'bg-gray-500/15 text-gray-400'}`}
            style={{ padding: '2px 8px' }}
          >
            {s.status}
          </span>
        </div>
      </div>

      {/* Inline Summary — always visible */}
      {taskDescription && (
        <div
          className="rounded-lg border border-neon-blue/20 bg-neon-blue/5"
          style={{ padding: '10px 12px', marginBottom: '10px' }}
        >
          <div className="flex items-start justify-between" style={{ gap: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-xs text-neon-blue/70 font-semibold" style={{ marginBottom: '4px' }}>
                Current Activity
                {summary?.cwd && summary.cwd !== '/home/will' && (
                  <span className="text-gray-600 font-normal" style={{ marginLeft: '8px' }}>
                    {summary.cwd.replace('/home/will/', '~/')}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-300" style={{ lineHeight: '1.5', maxHeight: '3em', overflow: 'hidden', wordBreak: 'break-word' }}>
                {taskDescription.length > 200 ? taskDescription.slice(0, 200) + '...' : taskDescription}
              </div>
              {summary && summary.recent_tools.length > 0 && (
                <div className="flex flex-wrap items-center" style={{ gap: '4px', marginTop: '6px' }}>
                  {summary.recent_tools.map(tool => (
                    <span key={tool} className="text-xs rounded-full bg-neon-purple/10 text-neon-purple/70" style={{ padding: '1px 6px' }}>
                      {tool}
                    </span>
                  ))}
                  <span className="text-xs text-gray-600" style={{ marginLeft: '4px' }}>
                    {summary.transcript_size_mb} MB
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center shrink-0" style={{ gap: '4px' }}>
              {s.session_id && (
                <button
                  onClick={() => onRefreshSummary(s.session_id)}
                  className="text-xs text-gray-500 hover:text-neon-blue transition-colors"
                  title="Refresh summary"
                >
                  ↻
                </button>
              )}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                {showDetails ? '▲' : '▼'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No summary available indicator */}
      {!taskDescription && s.session_id && (
        <div
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-gray-500"
          style={{ padding: '8px 12px', marginBottom: '10px' }}
        >
          No activity summary available
          {s.session_id && (
            <button
              onClick={() => onRefreshSummary(s.session_id)}
              className="text-gray-400 hover:text-white transition-colors"
              style={{ marginLeft: '8px' }}
            >
              ↻ Refresh
            </button>
          )}
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: '10px' }}
          >
            <div
              className="rounded-lg border border-neon-blue/30 bg-neon-blue/5"
              style={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.last_user_message && (
                  <div>
                    <span className="text-xs text-gray-500">Last User Message</span>
                    <div className="text-xs text-gray-300 font-mono rounded bg-black/30" style={{ padding: '8px', marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {summary.last_user_message}
                    </div>
                  </div>
                )}

                {summary.last_assistant_message && (
                  <div>
                    <span className="text-xs text-gray-500">Last Assistant Response</span>
                    <div className="text-xs text-gray-300 font-mono rounded bg-black/30" style={{ padding: '8px', marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '150px', overflow: 'auto' }}>
                      {summary.last_assistant_message}
                    </div>
                  </div>
                )}

                {summary.recent_files.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Recent Files</span>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {summary.recent_files.map(file => (
                        <div key={file} className="text-xs font-mono text-gray-400 truncate">{file}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 text-xs" style={{ gap: '16px' }}>
        <div>
          <span className="text-gray-500">PID</span>
          <div className="text-white font-mono">{s.pid}</div>
        </div>
        <div>
          <span className="text-gray-500">CPU</span>
          <div className="text-white font-mono">{s.cpu_percent.toFixed(1)}%</div>
        </div>
        <div>
          <span className="text-gray-500">Memory</span>
          <div className="text-white font-mono">{s.mem_mb} MB</div>
        </div>
        <div>
          <span className="text-gray-500">Started</span>
          <div className="text-white">{s.start_time}</div>
        </div>
      </div>

      {s.session_slug && (
        <div className="text-xs font-mono text-neon-purple truncate" style={{ marginTop: '8px' }}>
          {s.session_slug}
        </div>
      )}

      {/* Automation Toggle */}
      {isRunning && s.session_id && (
        <div
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02]"
          style={{ marginTop: '10px', padding: '8px 12px' }}
        >
          <div className="flex items-center" style={{ gap: '8px' }}>
            <span className="text-xs text-gray-400">Auto-Conductor</span>
            <span className="text-xs text-gray-600">
              {automationEnabled ? 'Auto-prompting enabled' : 'Manual only'}
            </span>
          </div>
          <button
            onClick={() => onToggleAutomation(s.session_id, !automationEnabled)}
            className="relative rounded-full transition-all"
            style={{
              width: '36px',
              height: '20px',
              backgroundColor: automationEnabled ? 'rgba(0, 245, 160, 0.3)' : 'rgba(107, 114, 128, 0.3)',
              border: `1px solid ${automationEnabled ? 'rgba(0, 245, 160, 0.5)' : 'rgba(107, 114, 128, 0.3)'}`,
            }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: '14px',
                height: '14px',
                position: 'absolute',
                top: '2px',
                backgroundColor: automationEnabled ? '#00f5a0' : '#6b7280',
              }}
              animate={{ left: automationEnabled ? '18px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      )}

      {/* Prompt Input */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginTop: '10px' }}
          >
            <div
              className="rounded-lg border border-neon-purple/30 bg-neon-purple/5"
              style={{ padding: '12px' }}
            >
              <div className="text-xs text-neon-purple font-semibold" style={{ marginBottom: '6px' }}>
                Send prompt to {s.tty} (PID {s.pid})
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt here..."
                className="w-full bg-black/40 text-white text-sm font-mono rounded-lg border border-white/10 focus:border-neon-purple/50 focus:outline-none resize-none"
                style={{ padding: '10px', minHeight: '80px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSendPrompt()
                  }
                }}
              />
              <div className="flex items-center justify-between" style={{ marginTop: '6px' }}>
                <span className="text-xs text-gray-500">Ctrl+Enter to send</span>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  {result && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs ${result.type === 'success' ? 'text-neon-green' : 'text-red-400'}`}
                    >
                      {result.message}
                    </motion.span>
                  )}
                  <button
                    onClick={handleSendPrompt}
                    disabled={sending || !prompt.trim()}
                    className={`text-xs font-bold rounded-full transition-all ${
                      sending || !prompt.trim()
                        ? 'bg-gray-600/30 text-gray-500 cursor-not-allowed'
                        : 'bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 border border-neon-purple/40'
                    }`}
                    style={{ padding: '6px 16px' }}
                  >
                    {sending ? 'Sending...' : 'Send Prompt'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
