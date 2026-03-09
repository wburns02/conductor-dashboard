import { useState, useEffect, useRef, useCallback } from 'react'

interface SSEOptions {
  /** Which event types to listen for */
  events?: string[]
  /** Auto-reconnect on disconnect (default true) */
  reconnect?: boolean
  /** Reconnect delay in ms (default 3000) */
  reconnectDelay?: number
}

interface SSEState<T> {
  data: T | null
  lastEvent: string | null
  connected: boolean
  error: string | null
}

function getSSEUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '/api/sse/events')
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.endsWith('.ts.net') || host === 'localhost' || host === '127.0.0.1') {
      return '/api/sse/events'
    }
  }
  return 'http://localhost:8787/api/sse/events'
}

export function useSSE<T = Record<string, unknown>>(
  options: SSEOptions = {},
): SSEState<T> & { lastEvents: Record<string, unknown> } {
  const {
    events = ['stats', 'sprints', 'event', 'gen4_intervention', 'heartbeat'],
    reconnect = true,
    reconnectDelay = 3000,
  } = options

  const [state, setState] = useState<SSEState<T>>({
    data: null,
    lastEvent: null,
    connected: false,
    error: null,
  })
  const [lastEvents, setLastEvents] = useState<Record<string, unknown>>({})
  const sourceRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const connect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close()
    }

    const url = getSSEUrl()
    const source = new EventSource(url)
    sourceRef.current = source

    source.onopen = () => {
      setState(prev => ({ ...prev, connected: true, error: null }))
    }

    source.onerror = () => {
      setState(prev => ({ ...prev, connected: false, error: 'SSE connection lost' }))
      source.close()
      sourceRef.current = null

      if (reconnect) {
        reconnectTimer.current = setTimeout(connect, reconnectDelay)
      }
    }

    for (const eventType of events) {
      source.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data)
          setState(prev => ({
            ...prev,
            data: parsed as T,
            lastEvent: eventType,
          }))
          setLastEvents(prev => ({
            ...prev,
            [eventType]: parsed,
          }))
        } catch {
          // ignore parse errors
        }
      })
    }
  }, [events, reconnect, reconnectDelay])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (sourceRef.current) {
        sourceRef.current.close()
        sourceRef.current = null
      }
    }
  }, [connect])

  return { ...state, lastEvents }
}
