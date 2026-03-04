import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import { api } from '../api'
import type { Session, SessionSummary, AutomationSetting } from '../api'
import { usePolling } from '../hooks/usePolling'

export default function SessionsPage() {
  const { data: sessions } = usePolling<Session[]>(useCallback(() => api.sessions.list(), []), 3000)
  const [automationSettings, setAutomationSettings] = useState<Record<string, AutomationSetting>>({})

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
                automationEnabled={!!automationSettings[session.session_id]?.enabled}
                onToggleAutomation={handleToggleAutomation}
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

function SessionCard({ session: s, automationEnabled, onToggleAutomation }: {
  session: Session
  automationEnabled: boolean
  onToggleAutomation: (sessionId: string, enabled: boolean) => void
}) {
  const isRunning = s.status === 'running'
  const glowColor = isRunning ? '#00f5a0' : '#6b7280'
  const [showPrompt, setShowPrompt] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)

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

  const handleLoadSummary = async () => {
    if (showSummary) {
      setShowSummary(false)
      return
    }
    if (!s.session_id) return
    setLoadingSummary(true)
    setShowSummary(true)
    try {
      const data = await api.sessions.summary(s.session_id)
      setSummary(data)
    } catch {
      setSummary(null)
    } finally {
      setLoadingSummary(false)
    }
  }

  return (
    <GlassCard glowColor={glowColor} padding="20px">
      <div className="flex flex-wrap items-start justify-between" style={{ marginBottom: '12px', gap: '8px' }}>
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
          {isRunning && s.session_id && (
            <button
              onClick={handleLoadSummary}
              className={`text-xs font-medium rounded-full transition-all ${
                showSummary
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/40'
                  : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.1] border border-white/[0.1]'
              }`}
              style={{ padding: '4px 12px' }}
            >
              {showSummary ? 'Hide' : 'Summary'}
            </button>
          )}
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

      <div style={{ marginTop: '12px' }}>
        <span className="text-xs text-gray-500">Working Directory</span>
        <div className="text-sm font-mono text-neon-blue truncate">{s.cwd}</div>
      </div>

      {s.session_slug && (
        <div style={{ marginTop: '8px' }}>
          <span className="text-xs text-gray-500">Session</span>
          <div className="text-sm font-mono text-neon-purple">{s.session_slug}</div>
        </div>
      )}

      {s.command && (
        <div style={{ marginTop: '8px' }}>
          <span className="text-xs text-gray-500">Command</span>
          <div className="text-xs font-mono text-gray-400 truncate">{s.command}</div>
        </div>
      )}

      {/* Automation Toggle */}
      {isRunning && s.session_id && (
        <div
          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02]"
          style={{ marginTop: '12px', padding: '10px 14px' }}
        >
          <div className="flex items-center" style={{ gap: '10px' }}>
            <span className="text-xs text-gray-400">Auto-Conductor</span>
            <span className="text-xs text-gray-600">
              {automationEnabled ? 'Conductor will auto-prompt this session' : 'Manual prompts only'}
            </span>
          </div>
          <button
            onClick={() => onToggleAutomation(s.session_id, !automationEnabled)}
            className="relative rounded-full transition-all"
            style={{
              width: '40px',
              height: '22px',
              backgroundColor: automationEnabled ? 'rgba(0, 245, 160, 0.3)' : 'rgba(107, 114, 128, 0.3)',
              border: `1px solid ${automationEnabled ? 'rgba(0, 245, 160, 0.5)' : 'rgba(107, 114, 128, 0.3)'}`,
            }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: '16px',
                height: '16px',
                position: 'absolute',
                top: '2px',
                backgroundColor: automationEnabled ? '#00f5a0' : '#6b7280',
              }}
              animate={{ left: automationEnabled ? '20px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      )}

      {/* Summary Panel */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <div
              className="rounded-lg border border-neon-blue/30 bg-neon-blue/5"
              style={{ padding: '14px' }}
            >
              {loadingSummary ? (
                <div className="text-xs text-gray-400">Loading summary...</div>
              ) : summary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="text-xs text-neon-blue font-semibold">Session Activity Summary</div>

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
                      <div className="text-xs text-gray-300 font-mono rounded bg-black/30" style={{ padding: '8px', marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '120px', overflow: 'auto' }}>
                        {summary.last_assistant_message}
                      </div>
                    </div>
                  )}

                  {summary.recent_tools.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Recent Tools Used</span>
                      <div className="flex flex-wrap" style={{ gap: '4px', marginTop: '4px' }}>
                        {summary.recent_tools.map(tool => (
                          <span key={tool} className="text-xs rounded-full bg-neon-purple/10 text-neon-purple/80 border border-neon-purple/20" style={{ padding: '2px 8px' }}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {summary.recent_files.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Recent Files</span>
                      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {summary.recent_files.slice(-5).map(file => (
                          <div key={file} className="text-xs font-mono text-gray-400 truncate">{file}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center" style={{ gap: '16px' }}>
                    <span className="text-xs text-gray-600">Transcript: {summary.transcript_size_mb} MB</span>
                    {summary.cwd && (
                      <span className="text-xs text-gray-600">CWD: {summary.cwd}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">No summary available (session may not have a transcript yet)</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Input */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginTop: '12px' }}
          >
            <div
              className="rounded-lg border border-neon-purple/30 bg-neon-purple/5"
              style={{ padding: '14px' }}
            >
              <div className="text-xs text-neon-purple font-semibold" style={{ marginBottom: '8px' }}>
                Send prompt to {s.tty} (PID {s.pid})
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your prompt here... (will be sent as keyboard input to the session)"
                className="w-full bg-black/40 text-white text-sm font-mono rounded-lg border border-white/10 focus:border-neon-purple/50 focus:outline-none resize-none"
                style={{ padding: '10px', minHeight: '80px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSendPrompt()
                  }
                }}
              />
              <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
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
