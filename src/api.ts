// API URL resolution:
// 1. If VITE_API_URL is set at build time, use it
// 2. If served from the API itself (Tailscale Funnel), use same-origin (empty string)
// 3. Fallback to localhost for local dev
function getApiBase(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // If we're served from the Tailscale Funnel or the API server, use same-origin
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.endsWith('.ts.net') || host === 'localhost' || host === '127.0.0.1') {
      return '/api'
    }
  }
  return 'http://localhost:8787/api'
}

const API_BASE = getApiBase()

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers as Record<string, string> }
  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API ${res.status}: ${body}`)
  }
  return res.json()
}

// Types
export interface Task {
  id: number
  name: string
  prompt: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked'
  priority: number
  working_dir: string
  model: string
  depends_on: string // JSON array
  worker_id: number | null
  session_id: string | null
  output: string
  promise_tag: string | null
  error: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  budget_usd: number
}

export interface Worker {
  id: number
  pid: number
  task_id: number
  status: 'running' | 'completed' | 'failed' | 'killed'
  session_id: string
  model: string
  started_at: string
  last_output_at: string | null
  output_lines: number
  total_cost_usd: number
}

export interface Decision {
  id: number
  task_id: number
  worker_id: number
  decision_type: string
  reasoning: string
  next_prompt: string
  created_at: string
}

export interface HumanRequest {
  id: number
  task_id: number
  question: string
  context: string
  response: string | null
  status: 'pending' | 'answered'
  created_at: string
  answered_at: string | null
}

export interface EventLog {
  id: number
  event_type: string
  details: string // JSON
  created_at: string
}

export interface Session {
  pid: number
  tty: string
  cpu_percent: number
  mem_mb: number
  status: string
  start_time: string
  cwd: string
  command: string
  session_id: string
  session_slug: string
  session_title: string
  last_activity: string
}

export interface Stats {
  total_tasks: number
  pending: number
  running: number
  completed: number
  failed: number
  active_workers: number
  total_cost: number
}

export interface SessionSummary {
  session_id: string
  slug: string
  cwd: string
  last_user_message: string
  last_assistant_message: string
  recent_tools: string[]
  recent_files: string[]
  transcript_size_mb: number
}

export interface AutomationSetting {
  session_id: string
  enabled: number
  last_prompt_at: string | null
  prompt_count: number
  created_at: string
}

export interface PromptHistoryEntry {
  id: number
  event_type: string
  created_at: string
  prompt_preview: string
  prompt_full: string
  session_slug: string
  source: 'auto' | 'manual'
}

export interface SprintEntry {
  id: number
  session_id: string
  pid: number
  sprint_pid: number
  tty: string
  cwd: string
  prompt: string
  status: 'running' | 'completed' | 'failed'
  output_path: string
  output_size: number
  output_tail: string
  started_at: string
  completed_at: string | null
  source: string
}

export interface MemoryEntry {
  id: number
  project: string
  entry_type: string
  title: string
  content: string | null
  metadata: string | null
  created_at: string
  sprint_id: number | null
}

export interface ProjectContext {
  project: string
  config: Record<string, string>
  changelog: Array<{ title: string; content: string; created_at: string }>
  errors: Array<{ title: string; content: string; created_at: string }>
  priorities: Array<{ title: string; content: string }>
  notes: Array<{ title: string; content: string }>
  monitor_events: Array<{ event_type: string; severity: string; title: string; details: string; created_at: string }>
}

export interface Monitor {
  id: number
  project: string
  prod_url: string
  health_url: string
  enabled: number
  check_interval: number
  last_check_at: string | null
  last_status: string
  consecutive_failures: number
  config: string | null
}

export interface MonitorSummary extends Monitor {
  recent_events: MonitorEvent[]
}

export interface MonitorEvent {
  id: number
  project: string
  event_type: string
  severity: string
  title: string
  details: string
  created_at: string
  resolved_at: string | null
  fix_sprint_id: number | null
}

// Gen4 types
export interface Gen4Dashboard {
  enabled: boolean
  experiments: Record<string, boolean>
  recent_activity: Array<{ type: string; detail: string; created_at: string }>
  genome_fitness_trend: Array<{ id: number; fitness: number; wins: number; losses: number; generation: number }>
  active_interventions: Array<{ id: number; trigger_pattern: string; task_id: number; intervention: string; context: Record<string, unknown>; created_at: string }>
}

export interface Gen4Genome {
  id: number
  genome: Record<string, string>
  fitness: number
  wins: number
  losses: number
  generation: number
  is_elite: number
  parent_ids: number[]
  created_at: string
  last_used_at: string | null
}

export interface Gen4Prediction {
  project: string
  recommended_model: string
  recommended_mode: string
  confidence: number
  reasoning: string[]
}

// API functions
export const api = {
  health: () => request<{ status: string }>('/health'),
  stats: () => request<Stats>('/stats'),

  tasks: {
    list: () => request<Task[]>('/tasks'),
    get: (id: number) => request<Task>(`/tasks/${id}`),
    create: (data: {
      name: string; prompt: string; model?: string; priority?: number;
      working_dir?: string; depends_on?: number[]; promise_tag?: string; budget_usd?: number;
    }) => request<{ id: number; name: string }>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Record<string, unknown>) =>
      request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ deleted: number }>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  workers: {
    list: () => request<Worker[]>('/workers'),
    active: () => request<Worker[]>('/workers/active'),
  },

  decisions: {
    list: () => request<Decision[]>('/decisions'),
  },

  humanRequests: {
    list: () => request<HumanRequest[]>('/human-requests'),
    answer: (id: number, response: string) =>
      request<{ answered: number }>(`/human-requests/${id}/answer`, {
        method: 'POST', body: JSON.stringify({ response }),
      }),
  },

  sessions: {
    list: () => request<Session[]>('/sessions'),
    summary: (sessionId: string) => request<SessionSummary>(`/sessions/${sessionId}/summary`),
    summaries: () => request<Record<string, SessionSummary>>('/sessions/summaries'),
    sendPrompt: (pid: number, prompt: string) =>
      request<{ sent: boolean; pid: number; tty: string; prompt_length: number }>(
        `/sessions/${pid}/prompt`,
        { method: 'POST', body: JSON.stringify({ prompt }) },
      ),
    automation: () => request<Record<string, AutomationSetting>>('/sessions/automation'),
    setAutomation: (sessionId: string, enabled: boolean) =>
      request<{ session_id: string; enabled: boolean }>(
        `/sessions/${sessionId}/automation`,
        { method: 'PUT', body: JSON.stringify({ enabled }) },
      ),
    promptHistory: (sessionId: string) =>
      request<PromptHistoryEntry[]>(`/sessions/${sessionId}/prompts`),
    sprints: (sessionId: string) =>
      request<SprintEntry[]>(`/sprints/by-session/${sessionId}`),
  },

  sprints: {
    list: (limit = 20) => request<SprintEntry[]>(`/sprints?limit=${limit}`),
    output: (sprintId: number) =>
      request<{ sprint_id: number; output: string; lines: number; status: string }>(`/sprints/${sprintId}/output`),
  },

  events: {
    list: (limit = 30) => request<EventLog[]>(`/events?limit=${limit}`),
  },

  memory: {
    get: (project: string, entryType?: string) =>
      request<MemoryEntry[]>(`/memory/${project}${entryType ? `?entry_type=${entryType}` : ''}`),
    context: (project: string) => request<ProjectContext>(`/memory/${project}/context`),
    add: (entry: { project: string; entry_type: string; title: string; content?: string; metadata?: Record<string, unknown> }) =>
      request<{ status: string }>('/memory', { method: 'POST', body: JSON.stringify(entry) }),
    delete: (entryId: number) => request<{ status: string }>(`/memory/${entryId}`, { method: 'DELETE' }),
  },

  monitors: {
    list: () => request<Monitor[]>('/monitors'),
    summary: () => request<MonitorSummary[]>('/monitors/summary'),
    create: (m: { project: string; prod_url: string; health_url?: string; check_interval?: number }) =>
      request<{ status: string }>('/monitors', { method: 'POST', body: JSON.stringify(m) }),
    toggle: (project: string, enabled: boolean) =>
      request<{ status: string }>(`/monitors/${project}?enabled=${enabled}`, { method: 'PATCH' }),
    events: (project: string, limit = 50) =>
      request<MonitorEvent[]>(`/monitors/${project}/events?limit=${limit}`),
  },

  clear: () => request<{ cleared: boolean }>('/clear', { method: 'POST' }),

  import: (tasks: Array<{
    name: string; prompt: string; model?: string; priority?: number;
    depends_on?: number[]; promise_tag?: string;
  }>) => request<{ imported: number; ids: number[] }>('/import', {
    method: 'POST', body: JSON.stringify({ tasks }),
  }),

  gen4: {
    dashboard: () => request<Gen4Dashboard>('/gen4/dashboard'),
    metrics: () => request<Record<string, unknown>>('/gen4/metrics'),
    genomes: () => request<{ genomes: Gen4Genome[] }>('/gen4/genomes'),
    predict: (project: string) => request<Gen4Prediction>(`/gen4/predict/${project}`),
    config: () => request<Record<string, unknown>>('/gen4/config'),
    projectConfig: (project: string) => request<{ project: string; experiments: Record<string, boolean> }>(`/gen4/projects/${project}`),
  },

  terminals: {
    poolStatus: () => request<{ pool_size: number; max_size: number; in_use: number; idle: number; active_sessions: number }>('/terminals/pool'),
  },
}
