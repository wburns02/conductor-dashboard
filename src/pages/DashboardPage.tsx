import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import StatusBadge from '../components/StatusBadge'
import { api } from '../api'
import type { Stats, Task, Worker, EventLog, Session, Gen4Dashboard, CostSummary } from '../api'
import { usePolling } from '../hooks/usePolling'
import { useSSE } from '../hooks/useSSE'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats } = usePolling<Stats>(useCallback(() => api.stats(), []), 3000)
  const { data: sessions } = usePolling<Session[]>(useCallback(() => api.sessions.list(), []), 3000)
  const { data: tasks } = usePolling<Task[]>(useCallback(() => api.tasks.list(), []), 5000)
  const { data: workers } = usePolling<Worker[]>(useCallback(() => api.workers.active(), []), 5000)
  const { data: events } = usePolling<EventLog[]>(useCallback(() => api.events.list(15), []), 5000)
  const { data: gen4, refresh: refetchGen4 } = usePolling<Gen4Dashboard>(useCallback(() => api.gen4.dashboard(), []), 10000)
  const { data: costs } = usePolling<CostSummary>(useCallback(() => api.costs.summary(), []), 10000)
  const [togglingExp, setTogglingExp] = useState<string | null>(null)

  // SSE for real-time updates (supplements polling with instant push)
  const { connected: sseConnected, lastEvents } = useSSE({
    events: ['stats', 'sprints', 'event', 'gen4_intervention'],
  })

  const running = sessions?.filter(s => s.status === 'running') || []
  const recentTasks = tasks?.slice(0, 6) || []
  const recentEvents = events?.slice(0, 8) || []

  return (
    <PageTransition>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 2rem', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Live Sessions — Hero Section */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div className="flex items-center" style={{ gap: '12px' }}>
              <h2 className="text-xl font-bold text-white">Live Claude Sessions</h2>
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
              {/* SSE connection indicator */}
              <span
                className="rounded-full text-xs"
                style={{
                  padding: '2px 8px',
                  backgroundColor: sseConnected ? 'rgba(0, 245, 160, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: sseConnected ? '#00f5a0' : '#ef4444',
                }}
              >
                {sseConnected ? 'SSE' : 'polling'}
              </span>
            </div>
            <button onClick={() => navigate('/sessions')} className="text-xs text-gray-400 hover:text-white transition-colors">View all →</button>
          </div>

          {sessions && sessions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: '12px' }}>
              {sessions.map((s, i) => (
                <motion.div
                  key={s.pid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate('/sessions')}
                  className="cursor-pointer"
                >
                  <GlassCard glowColor={s.status === 'running' ? '#00f5a0' : '#6b7280'} padding="14px">
                    <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <motion.div
                          className="rounded-full"
                          style={{ width: '8px', height: '8px', backgroundColor: s.status === 'running' ? '#00f5a0' : '#6b7280' }}
                          animate={s.status === 'running' ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <span className="text-sm font-bold text-white truncate" style={{ maxWidth: '160px' }}>
                          {s.session_title || s.tty || `PID ${s.pid}`}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">{s.tty}</span>
                    </div>
                    <div className="grid grid-cols-3 text-xs" style={{ gap: '8px' }}>
                      <div>
                        <span className="text-gray-500">CPU</span>
                        <div className="text-white font-mono">{s.cpu_percent.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Mem</span>
                        <div className="text-white font-mono">{s.mem_mb} MB</div>
                      </div>
                      <div>
                        <span className="text-gray-500">PID</span>
                        <div className="text-white font-mono">{s.pid}</div>
                      </div>
                    </div>
                    {s.session_slug && (
                      <div className="text-xs font-mono text-neon-purple truncate" style={{ marginTop: '6px' }}>{s.session_slug}</div>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : sessions ? (
            <GlassCard glowColor="#6b7280" padding="32px">
              <div className="text-center text-gray-500 text-sm">No Claude sessions detected. Start a Claude session in your terminal to see it here.</div>
            </GlassCard>
          ) : (
            <GlassCard glowColor="#6b7280" padding="32px">
              <div className="text-center text-gray-500 text-sm">Loading sessions...</div>
            </GlassCard>
          )}
        </div>

        {/* Circuit Breaker Banner */}
        {costs?.circuit_breaker_tripped && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border"
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <motion.div
              className="flex items-center justify-between"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{'\u26A0'}</span>
                <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
                  CIRCUIT BREAKER TRIPPED — Automation Paused
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: '#ef4444' }}>
                ${costs.today.total_usd.toFixed(2)} / ${costs.daily_budget_usd.toFixed(2)} budget
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* Cost Tracking */}
        {costs && (costs.today.count > 0 || costs.week.count > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-lg font-semibold text-gray-400" style={{ marginBottom: '12px' }}>Sprint Costs</h2>
            <div className="grid grid-cols-3" style={{ gap: '12px' }}>
              {[
                { label: 'Today', total: costs.today.total_usd, count: costs.today.count, warn: costs.budget_usage_pct > 80 },
                { label: 'This Week', total: costs.week.total_usd, count: costs.week.count, warn: false },
                { label: 'This Month', total: costs.month.total_usd, count: costs.month.count, warn: false },
              ].map(({ label, total, count, warn }) => (
                <GlassCard key={label} glowColor={warn ? '#ff006e' : '#8338ec'} padding="14px">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-xl font-bold font-mono" style={{ color: warn ? '#ff006e' : '#fff', marginTop: '4px' }}>
                    ${total.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500" style={{ marginTop: '2px' }}>{count} sprint{count !== 1 ? 's' : ''}</div>
                  {warn && (
                    <div className="text-xs font-mono" style={{ color: '#ff006e', marginTop: '4px' }}>
                      {costs.budget_usage_pct.toFixed(0)}% of daily budget
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* Gen4 Research Lab Status */}
        {gen4 && gen4.enabled && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <h2 className="text-lg font-semibold text-gray-400">Gen4 Research Lab</h2>
              <div className="flex items-center" style={{ gap: '8px' }}>
                {Object.entries(gen4.experiments).map(([name, enabled]) => (
                  <span
                    key={name}
                    className="text-xs font-mono rounded"
                    style={{
                      padding: '2px 6px',
                      backgroundColor: enabled ? 'rgba(0, 245, 160, 0.08)' : 'rgba(107, 114, 128, 0.1)',
                      color: enabled ? '#00f5a0' : '#6b7280',
                    }}
                  >
                    {name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()).slice(0, 12)}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-3" style={{ gap: '12px' }}>
              {/* Genome Fitness */}
              <GlassCard glowColor="#a855f7" padding="14px">
                <div className="text-xs text-gray-500" style={{ marginBottom: '8px' }}>Top Genomes</div>
                {gen4.genome_fitness_trend.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {gen4.genome_fitness_trend.map(g => (
                      <div key={g.id} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-white">#{g.id} (gen {g.generation})</span>
                        <div className="flex items-center" style={{ gap: '8px' }}>
                          <span className="text-neon-green">{g.wins}W</span>
                          <span className="text-red-400">{g.losses}L</span>
                          <span className="font-bold" style={{ color: g.fitness > 0.6 ? '#00f5a0' : g.fitness > 0.4 ? '#eab308' : '#ef4444' }}>
                            {g.fitness.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">No genome data yet</div>
                )}
              </GlassCard>

              {/* Active Interventions */}
              <GlassCard glowColor="#ff006e" padding="14px">
                <div className="text-xs text-gray-500" style={{ marginBottom: '8px' }}>Metacognition</div>
                {gen4.active_interventions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {gen4.active_interventions.slice(0, 3).map(i => (
                      <div key={i.id} className="rounded bg-white/[0.03] border border-white/[0.05]" style={{ padding: '6px' }}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-neon-pink">{i.trigger_pattern}</span>
                          <span className="text-gray-500">{i.intervention}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-neon-green">No interventions needed</div>
                )}
                {/* Show SSE-pushed intervention if available */}
                {lastEvents.gen4_intervention != null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded bg-neon-pink/10 border border-neon-pink/20 text-xs text-neon-pink"
                    style={{ padding: '6px', marginTop: '6px' }}
                  >
                    {'Live: ' + String((lastEvents.gen4_intervention as { trigger_pattern?: string })?.trigger_pattern ?? 'intervention')}
                  </motion.div>
                )}
              </GlassCard>

              {/* Recent Activity */}
              <GlassCard glowColor="#00d4ff" padding="14px">
                <div className="text-xs text-gray-500" style={{ marginBottom: '8px' }}>Recent Activity</div>
                {gen4.recent_activity.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {gen4.recent_activity.slice(0, 4).map((a, idx) => (
                      <div key={idx} className="flex items-center text-xs" style={{ gap: '6px' }}>
                        <span className="font-mono" style={{
                          color: a.type === 'adversarial' ? '#ff006e' :
                                 a.type === 'evolution' ? '#a855f7' :
                                 a.type === 'distiller' ? '#00d4ff' : '#6b7280'
                        }}>
                          {a.type}
                        </span>
                        <span className="text-gray-400 truncate">{a.detail}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600">No Gen4 activity yet</div>
                )}
              </GlassCard>
            </div>

            {/* Gen4 Experiment Toggle Panel */}
            <div style={{ marginTop: '12px' }}>
              <GlassCard glowColor="#a855f7" padding="16px">
                <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                  <div className="text-xs font-bold text-gray-400">Experiment Controls</div>
                  <button
                    className="text-xs font-mono rounded hover:bg-white/10 transition-colors"
                    style={{ padding: '3px 8px', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' }}
                    onClick={async () => {
                      await api.gen4.resetDefaults()
                      refetchGen4()
                    }}
                  >
                    Reset Defaults
                  </button>
                </div>

                {/* Master Kill Switch */}
                <div
                  className="flex items-center justify-between rounded"
                  style={{ padding: '8px 10px', marginBottom: '8px', backgroundColor: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.15)' }}
                >
                  <span className="text-sm font-bold text-white">Master Switch</span>
                  <button
                    className="rounded-full transition-colors"
                    style={{
                      width: '40px', height: '22px', position: 'relative',
                      backgroundColor: gen4.experiments.prompt_evolution || gen4.experiments.adversarial ? 'rgba(0, 245, 160, 0.4)' : 'rgba(107, 114, 128, 0.3)',
                      border: 'none', cursor: 'pointer',
                    }}
                    onClick={async () => {
                      const anyEnabled = Object.values(gen4.experiments).some(v => v)
                      setTogglingExp('master')
                      await api.gen4.toggleExperiment('gen4_master_enabled', !anyEnabled)
                      setTogglingExp(null)
                      refetchGen4()
                    }}
                    disabled={togglingExp === 'master'}
                  >
                    <motion.div
                      className="rounded-full bg-white"
                      style={{ width: '16px', height: '16px', position: 'absolute', top: '3px' }}
                      animate={{
                        left: (gen4.experiments.prompt_evolution || gen4.experiments.adversarial) ? '21px' : '3px',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Individual Experiment Toggles */}
                <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: '6px' }}>
                  {[
                    { key: 'prompt_evolution', label: 'Prompt Evolution' },
                    { key: 'metacognition', label: 'Metacognition' },
                    { key: 'adversarial', label: 'Adversarial' },
                    { key: 'distiller', label: 'Distiller' },
                    { key: 'blackboard', label: 'Blackboard' },
                    { key: 'speculative', label: 'Speculative' },
                  ].map(({ key, label }) => {
                    const enabled = gen4.experiments[key] ?? false
                    return (
                      <button
                        key={key}
                        className="flex items-center justify-between rounded text-xs transition-all"
                        style={{
                          padding: '6px 8px',
                          backgroundColor: enabled ? 'rgba(0, 245, 160, 0.06)' : 'rgba(107, 114, 128, 0.06)',
                          border: `1px solid ${enabled ? 'rgba(0, 245, 160, 0.2)' : 'rgba(107, 114, 128, 0.15)'}`,
                          cursor: 'pointer',
                          opacity: togglingExp === key ? 0.5 : 1,
                        }}
                        onClick={async () => {
                          setTogglingExp(key)
                          await api.gen4.toggleExperiment(`${key}_enabled`, !enabled)
                          setTogglingExp(null)
                          refetchGen4()
                        }}
                        disabled={togglingExp === key}
                      >
                        <span style={{ color: enabled ? '#00f5a0' : '#6b7280' }}>{label}</span>
                        <span
                          className="rounded-full"
                          style={{
                            width: '8px', height: '8px',
                            backgroundColor: enabled ? '#00f5a0' : '#6b7280',
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* Conductor Stats — Secondary */}
        {stats && (stats.total_tasks > 0 || (workers && workers.length > 0)) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-400" style={{ marginBottom: '12px' }}>Conductor Orchestration</h2>
            <div className="grid grid-cols-3 md:grid-cols-6" style={{ gap: '12px' }}>
              {[
                { val: stats.total_tasks, label: 'Tasks', icon: '\u25C8', color: '#8338ec' },
                { val: stats.running, label: 'Running', icon: '\u25B6', color: '#3b82f6' },
                { val: stats.pending, label: 'Pending', icon: '\u25C7', color: '#eab308' },
                { val: stats.completed, label: 'Done', icon: '\u2713', color: '#10b981' },
                { val: stats.failed, label: 'Failed', icon: '\u2715', color: '#ef4444' },
                { val: stats.active_workers, label: 'Workers', icon: '\u26A1', color: '#00d4ff' },
              ].map(({ val, label, icon, color }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.03 }}>
                  <GlassCard glowColor={color} padding="12px">
                    <div className="text-lg" style={{ color }}>{icon}</div>
                    <div className="text-xl font-bold text-white">{val}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
            {stats.total_cost > 0 && (
              <div style={{ marginTop: '12px' }}>
                <GlassCard glowColor="#ff006e" className="inline-block" padding="12px 16px">
                  <span className="text-gray-400 text-sm" style={{ marginRight: '8px' }}>Total Cost</span>
                  <span className="text-lg font-bold text-neon-pink">${stats.total_cost.toFixed(4)}</span>
                </GlassCard>
              </div>
            )}
          </div>
        )}

        {/* Bottom Grid: Workers, Tasks, Events */}
        <div className="grid lg:grid-cols-3" style={{ gap: '20px' }}>
          {/* Active Workers */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard glowColor="#00d4ff" padding="20px">
              <h2 className="text-lg font-semibold text-neon-blue flex items-center" style={{ marginBottom: '16px', gap: '8px' }}>
                <span className="text-xl">{'\u26A1'}</span> Active Workers
              </h2>
              {workers && workers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {workers.map(w => (
                    <div key={w.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05]" style={{ padding: '10px' }}>
                      <div>
                        <div className="text-sm font-medium text-white">Worker #{w.id}</div>
                        <div className="text-xs text-gray-500">Task #{w.task_id} · {w.model}</div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={w.status} />
                        <div className="text-xs text-gray-500" style={{ marginTop: '4px' }}>${w.total_cost_usd.toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm" style={{ padding: '24px 0' }}>No active workers</div>
              )}
            </GlassCard>
          </motion.div>

          {/* Recent Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <GlassCard glowColor="#8338ec" padding="20px">
              <h2 className="text-lg font-semibold text-neon-purple flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <span className="flex items-center" style={{ gap: '8px' }}><span className="text-xl">{'\u25C8'}</span> Tasks</span>
                <button onClick={() => navigate('/tasks')} className="text-xs text-gray-400 hover:text-white transition-colors">View all →</button>
              </h2>
              {recentTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentTasks.map(t => (
                    <motion.div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-neon-purple/30 transition-colors cursor-pointer"
                      style={{ padding: '10px' }}
                      onClick={() => navigate(`/tasks/${t.id}`)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="text-sm font-medium text-white truncate">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.model} · P{t.priority}</div>
                      </div>
                      <StatusBadge status={t.status} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm" style={{ padding: '24px 0' }}>No tasks yet</div>
              )}
            </GlassCard>
          </motion.div>

          {/* Event Log */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard glowColor="#00f5a0" padding="20px">
              <h2 className="text-lg font-semibold text-neon-green flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <span className="flex items-center" style={{ gap: '8px' }}><span className="text-xl">{'\u25CE'}</span> Events</span>
                <button onClick={() => navigate('/events')} className="text-xs text-gray-400 hover:text-white transition-colors">View all →</button>
              </h2>
              {recentEvents.length > 0 ? (
                <div className="overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', paddingRight: '4px' }}>
                  {recentEvents.map(e => (
                    <div key={e.id} className="rounded-lg bg-white/[0.02] border border-white/[0.05]" style={{ padding: '10px' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-neon-green/80">{e.event_type}</span>
                        <span className="text-xs text-gray-600">{new Date(e.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm" style={{ padding: '24px 0' }}>No events yet</div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
