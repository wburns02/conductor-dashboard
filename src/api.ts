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
    sendPrompt: (pid: number, prompt: string) =>
      request<{ sent: boolean; pid: number; tty: string; prompt_length: number }>(
        `/sessions/${pid}/prompt`,
        { method: 'POST', body: JSON.stringify({ prompt }) },
      ),
  },

  events: {
    list: (limit = 30) => request<EventLog[]>(`/events?limit=${limit}`),
  },

  clear: () => request<{ cleared: boolean }>('/clear', { method: 'POST' }),

  import: (tasks: Array<{
    name: string; prompt: string; model?: string; priority?: number;
    depends_on?: number[]; promise_tag?: string;
  }>) => request<{ imported: number; ids: number[] }>('/import', {
    method: 'POST', body: JSON.stringify({ tasks }),
  }),
}
