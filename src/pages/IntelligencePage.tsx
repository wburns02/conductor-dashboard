import { useState, useCallback } from 'react'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import { api } from '../api'
import { usePolling } from '../hooks/usePolling'
import type { MonitorSummary, MemoryEntry } from '../api'

const PROJECTS = ['BreweryCRM', 'LandscapeCRM', 'CrownHardware', 'ReactCRM']

const STATUS_COLORS: Record<string, string> = {
  healthy: '#00f5a0',
  degraded: '#f1c40f',
  down: '#ff5555',
  error: '#ff5555',
  unknown: '#6b7280',
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#00d2ff',
  warning: '#f1c40f',
  critical: '#ff5555',
}

const ENTRY_TYPE_COLORS: Record<string, string> = {
  changelog: '#00f5a0',
  error: '#ff5555',
  priority: '#a855f7',
  note: '#00d2ff',
  autofix: '#f1c40f',
}

export default function IntelligencePage() {
  const [selectedProject, setSelectedProject] = useState<string>(PROJECTS[0])
  const [newEntry, setNewEntry] = useState({ type: 'priority', title: '', content: '' })
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: monitors } = usePolling<MonitorSummary[]>(
    useCallback(() => api.monitors.summary(), []),
    15000,
  )

  const { data: memory, refresh: refreshMemory } = usePolling<MemoryEntry[]>(
    useCallback(() => api.memory.get(selectedProject), [selectedProject]),
    10000,
  )

  const monitorForProject = monitors?.find(m => m.project === selectedProject)

  const addEntry = async () => {
    if (!newEntry.title.trim()) return
    await api.memory.add({
      project: selectedProject,
      entry_type: newEntry.type,
      title: newEntry.title,
      content: newEntry.content || undefined,
    })
    setNewEntry({ type: 'priority', title: '', content: '' })
    setShowAddForm(false)
    refreshMemory()
  }

  const deleteEntry = async (id: number) => {
    await api.memory.delete(id)
    refreshMemory()
  }

  return (
    <PageTransition>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Intelligence</h1>
          <div className="flex items-center" style={{ gap: '8px' }}>
            {PROJECTS.map(p => (
              <button
                key={p}
                onClick={() => setSelectedProject(p)}
                className={`text-xs font-medium rounded-full transition-all ${
                  selectedProject === p
                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
                style={{ padding: '4px 12px' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Production Monitor Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {monitors?.map(m => (
            <GlassCard key={m.project} glowColor={STATUS_COLORS[m.last_status] || '#6b7280'} padding="14px">
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <div
                    className="rounded-full"
                    style={{
                      width: '10px', height: '10px',
                      backgroundColor: STATUS_COLORS[m.last_status] || '#6b7280',
                      boxShadow: m.last_status === 'healthy' ? `0 0 8px ${STATUS_COLORS.healthy}` : undefined,
                    }}
                  />
                  <span className="text-sm font-semibold text-white">{m.project}</span>
                </div>
                <span
                  className="text-xs font-mono rounded-full"
                  style={{
                    padding: '2px 8px',
                    color: STATUS_COLORS[m.last_status] || '#6b7280',
                    border: `1px solid ${STATUS_COLORS[m.last_status] || '#6b7280'}40`,
                    background: `${STATUS_COLORS[m.last_status] || '#6b7280'}15`,
                  }}
                >
                  {m.last_status}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-mono" style={{ marginBottom: '4px' }}>
                {m.prod_url || 'No prod URL'}
              </div>
              {m.consecutive_failures > 0 && (
                <div className="text-xs text-red-400" style={{ marginBottom: '4px' }}>
                  {m.consecutive_failures} consecutive failure{m.consecutive_failures > 1 ? 's' : ''}
                </div>
              )}
              {m.last_check_at && (
                <div className="text-xs text-gray-600">
                  Last check: {new Date(m.last_check_at).toLocaleTimeString()}
                </div>
              )}
              {m.recent_events && m.recent_events.length > 0 && (
                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                  {m.recent_events.slice(0, 3).map((e, i) => (
                    <div key={i} className="flex items-center" style={{ gap: '6px', marginBottom: '2px' }}>
                      <div
                        className="rounded-full"
                        style={{ width: '6px', height: '6px', backgroundColor: SEVERITY_COLORS[e.severity] || '#6b7280', flexShrink: 0 }}
                      />
                      <span className="text-xs text-gray-400 truncate">{e.title?.slice(0, 60)}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          ))}
          {(!monitors || monitors.length === 0) && (
            <GlassCard glowColor="#6b7280" padding="20px">
              <div className="text-sm text-gray-400">No monitors configured yet. Projects with production URLs are auto-monitored.</div>
            </GlassCard>
          )}
        </div>

        {/* Project Memory */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Memory entries */}
          <GlassCard glowColor="#a855f7" padding="16px">
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <div>
                <div className="text-sm font-semibold text-white">Project Memory</div>
                <div className="text-xs text-gray-500">{selectedProject} — {memory?.length || 0} entries</div>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs font-medium rounded-full bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border border-neon-purple/30 transition-all"
                style={{ padding: '4px 10px' }}
              >
                + Add
              </button>
            </div>

            {showAddForm && (
              <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div className="flex items-center" style={{ gap: '6px', marginBottom: '8px' }}>
                  {['priority', 'note', 'error'].map(t => (
                    <button
                      key={t}
                      onClick={() => setNewEntry(e => ({ ...e, type: t }))}
                      className="text-xs rounded-full transition-all"
                      style={{
                        padding: '2px 8px',
                        color: ENTRY_TYPE_COLORS[t],
                        border: `1px solid ${newEntry.type === t ? ENTRY_TYPE_COLORS[t] : 'transparent'}`,
                        background: newEntry.type === t ? `${ENTRY_TYPE_COLORS[t]}20` : 'transparent',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Title (e.g. 'Add dark mode toggle')"
                  value={newEntry.title}
                  onChange={e => setNewEntry(n => ({ ...n, title: e.target.value }))}
                  className="w-full text-xs text-white bg-transparent border border-white/10 rounded px-2 py-1"
                  style={{ marginBottom: '6px' }}
                />
                <textarea
                  placeholder="Details (optional)"
                  value={newEntry.content}
                  onChange={e => setNewEntry(n => ({ ...n, content: e.target.value }))}
                  className="w-full text-xs text-white bg-transparent border border-white/10 rounded px-2 py-1"
                  rows={2}
                  style={{ marginBottom: '6px', resize: 'vertical' }}
                />
                <button
                  onClick={addEntry}
                  className="text-xs font-medium rounded-full bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30 transition-all"
                  style={{ padding: '3px 10px' }}
                >
                  Save
                </button>
              </div>
            )}

            <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {memory?.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-lg"
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${ENTRY_TYPE_COLORS[entry.entry_type] || '#6b7280'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center" style={{ gap: '6px' }}>
                      <span
                        className="text-[10px] font-mono rounded-full"
                        style={{
                          padding: '1px 6px',
                          color: ENTRY_TYPE_COLORS[entry.entry_type] || '#6b7280',
                          background: `${ENTRY_TYPE_COLORS[entry.entry_type] || '#6b7280'}15`,
                        }}
                      >
                        {entry.entry_type}
                      </span>
                      <span className="text-xs text-white font-medium">{entry.title}</span>
                    </div>
                    <div className="flex items-center" style={{ gap: '6px' }}>
                      <span className="text-[10px] text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-[10px] text-gray-600 hover:text-red-400 transition-colors"
                      >
                        x
                      </button>
                    </div>
                  </div>
                  {entry.content && (
                    <div className="text-xs text-gray-400" style={{ marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                      {entry.content}
                    </div>
                  )}
                </div>
              ))}
              {(!memory || memory.length === 0) && (
                <div className="text-xs text-gray-500" style={{ padding: '20px', textAlign: 'center' }}>
                  No memory entries yet. Add priorities, notes, or they'll be auto-populated from sprints.
                </div>
              )}
            </div>
          </GlassCard>

          {/* Monitor Events */}
          <GlassCard glowColor={monitorForProject?.last_status === 'healthy' ? '#00f5a0' : '#ff5555'} padding="16px">
            <div style={{ marginBottom: '12px' }}>
              <div className="text-sm font-semibold text-white">Production Monitor</div>
              <div className="text-xs text-gray-500">
                {selectedProject} — {monitorForProject?.prod_url || 'No production URL'}
              </div>
            </div>

            {monitorForProject ? (
              <div>
                <div className="flex items-center" style={{ gap: '12px', marginBottom: '12px' }}>
                  <div
                    className="rounded-lg text-center"
                    style={{
                      padding: '12px 20px',
                      background: `${STATUS_COLORS[monitorForProject.last_status] || '#6b7280'}10`,
                      border: `1px solid ${STATUS_COLORS[monitorForProject.last_status] || '#6b7280'}30`,
                      flex: 1,
                    }}
                  >
                    <div
                      className="text-lg font-bold"
                      style={{ color: STATUS_COLORS[monitorForProject.last_status] }}
                    >
                      {monitorForProject.last_status.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                  <div
                    className="rounded-lg text-center"
                    style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', flex: 1 }}
                  >
                    <div className="text-lg font-bold text-white">{monitorForProject.consecutive_failures}</div>
                    <div className="text-xs text-gray-500">Failures</div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 font-semibold" style={{ marginBottom: '6px' }}>Recent Events</div>
                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {monitorForProject.recent_events?.map((e, i) => (
                    <div key={i} className="flex items-start" style={{ gap: '8px', padding: '6px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                      <div
                        className="rounded-full"
                        style={{ width: '8px', height: '8px', marginTop: '4px', flexShrink: 0, backgroundColor: SEVERITY_COLORS[e.severity] || '#6b7280' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-xs text-white truncate">{e.title}</div>
                        <div className="text-[10px] text-gray-600">
                          {e.event_type} — {new Date(e.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!monitorForProject.recent_events || monitorForProject.recent_events.length === 0) && (
                    <div className="text-xs text-gray-500" style={{ padding: '20px', textAlign: 'center' }}>
                      No events yet — monitor will start checking soon.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500" style={{ padding: '20px', textAlign: 'center' }}>
                No monitor configured for {selectedProject}. Add a production URL to enable monitoring.
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  )
}
