import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  className?: string
  style?: React.CSSProperties
  initialCommand?: string
  delayedCommand?: string  // Sent after Claude shows its ready prompt
  autoRepeat?: boolean     // If true, re-send delayedCommand when Claude goes idle
  onStatusChange?: (status: TerminalStatus) => void
}

export interface TerminalStatus {
  state: 'starting' | 'waiting-for-claude' | 'prompt-sent' | 'running' | 'idle' | 'disconnected'
  startedAt: string
  lastActivity: string
  sprintCount: number
}

// Strip ALL terminal escape codes for text matching
function stripAnsi(str: string): string {
  return str
    .replace(/\x1b\[\??[0-9;]*[a-zA-Z]/g, '')  // CSI sequences (including ? mode)
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')  // OSC sequences
    .replace(/\x1b[()][0-9A-B]/g, '')  // Character set
    .replace(/\x1b[=>MNOP78]/g, '')  // Simple escapes
    .replace(/\x1bP[^\x1b]*\x1b\\/g, '')  // DCS sequences
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')  // Control chars (keep \n \r \t)
}

function getWsBase(): string {
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${proto}//${host}`
  }
  return 'ws://localhost:8787'
}

export default function Terminal({ className, style, initialCommand, delayedCommand, autoRepeat, onStatusChange }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<FitAddon | null>(null)

  const connect = useCallback(() => {
    if (!containerRef.current) return

    const startedAt = new Date().toISOString()
    let sprintCount = 0

    const updateStatus = (state: TerminalStatus['state']) => {
      onStatusChange?.({
        state,
        startedAt,
        lastActivity: new Date().toISOString(),
        sprintCount,
      })
    }

    updateStatus('starting')

    // Create terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#0a0a0f',
        foreground: '#e0e0e0',
        cursor: '#00f5a0',
        selectionBackground: 'rgba(0, 245, 160, 0.2)',
        black: '#1c1c1c',
        red: '#ff5555',
        green: '#00f5a0',
        yellow: '#f1c40f',
        blue: '#6c5ce7',
        magenta: '#a855f7',
        cyan: '#00d2ff',
        white: '#e0e0e0',
        brightBlack: '#6b7280',
        brightRed: '#ff6b6b',
        brightGreen: '#55ffc4',
        brightYellow: '#ffe66d',
        brightBlue: '#818cf8',
        brightMagenta: '#c084fc',
        brightCyan: '#67e8f9',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    const linksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(linksAddon)
    term.open(containerRef.current)

    // Fit to container
    try { fitAddon.fit() } catch {}

    termRef.current = term
    fitRef.current = fitAddon

    // Connect WebSocket
    const cols = term.cols
    const rows = term.rows
    const ws = new WebSocket(`${getWsBase()}/api/ws/terminal?cols=${cols}&rows=${rows}`)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    // State tracking
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    let readyDetected = false  // Guard: only detect Claude ready ONCE
    let promptSent = false     // True after first prompt fully sent + Enter pressed
    let sendingPrompt = false  // True while a prompt is being chunked out
    let recentOutput = ''
    let allOutput = ''

    // Send the prompt text in chunks to avoid PTY buffer overflow
    const sendPrompt = (command: string) => {
      if (ws.readyState !== WebSocket.OPEN || sendingPrompt) return
      sendingPrompt = true
      const CHUNK_SIZE = 256
      let i = 0
      const sendChunk = () => {
        if (i >= command.length) {
          // All text sent — now press Enter
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('\r')
              promptSent = true
              sendingPrompt = false
              sprintCount++
              recentOutput = ''  // Reset so idle detection starts fresh
              updateStatus('running')
              term.write(`\r\n\x1b[36m[Sprint #${sprintCount} submitted at ${new Date().toLocaleTimeString()}]\x1b[0m\r\n`)
            }
          }, 500)
          return
        }
        const chunk = command.slice(i, i + CHUNK_SIZE)
        ws.send(chunk)
        i += CHUNK_SIZE
        setTimeout(sendChunk, 50)
      }
      sendChunk()
    }

    const checkIdle = () => {
      if (!delayedCommand || !autoRepeat || !promptSent || sendingPrompt) return
      const lastChunk = recentOutput.slice(-300)
      // Look for Claude's idle state: the ❯ prompt appearing AFTER output stops
      // This only fires after 30s of silence, so the ❯ is the idle prompt, not the status bar
      const hasIdlePrompt = lastChunk.includes('\u276f') || lastChunk.includes('❯')
      const hasBypassMsg = lastChunk.includes('bypass permissions')
      if (hasIdlePrompt || hasBypassMsg) {
        updateStatus('idle')
        term.write(`\r\n\x1b[33m[Auto-repeat: Claude idle at ${new Date().toLocaleTimeString()} — sending next sprint...]\x1b[0m\r\n`)
        promptSent = false  // Reset so sendPrompt sets it again
        setTimeout(() => sendPrompt(delayedCommand), 3000)
      }
    }

    ws.onopen = () => {
      term.focus()
      updateStatus('starting')
      if (initialCommand) {
        setTimeout(() => {
          ws.send(initialCommand + '\n')
          if (delayedCommand) {
            updateStatus('waiting-for-claude')
            // Fallback: if detection hasn't fired after 15s, send prompt anyway
            setTimeout(() => {
              if (!readyDetected) {
                readyDetected = true
                allOutput = ''
                term.write(`\r\n\x1b[33m[Fallback: sending prompt after 15s timeout at ${new Date().toLocaleTimeString()}...]\x1b[0m\r\n`)
                updateStatus('prompt-sent')
                setTimeout(() => sendPrompt(delayedCommand), 1000)
              }
            }, 15000)
          }
        }, 500)
      }
    }

    ws.onmessage = (event) => {
      let text = ''
      if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data)
        term.write(bytes)
        text = new TextDecoder().decode(bytes)
      } else {
        term.write(event.data)
        text = event.data
      }

      // Track output for Claude ready detection (fires exactly ONCE)
      if (delayedCommand && !readyDetected) {
        const clean = stripAnsi(text)
        allOutput += clean
        if (allOutput.length > 5000) {
          allOutput = allOutput.slice(-2000)
        }

        // Auto-dismiss trust dialog: "Is this a project you created or one you trust?"
        if (allOutput.includes('trust this folder') && allOutput.includes('Enter to confirm')) {
          allOutput = ''
          term.write(`\r\n\x1b[33m[Auto-accepting trust dialog...]\x1b[0m\r\n`)
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('\r')
          }, 1000)
          return
        }

        // Detect Claude's ACTUAL ready state: "bypass permissions" in the status bar
        // Only appears after Claude fully initializes, never in trust dialog
        if (allOutput.includes('bypass permissions')) {
          readyDetected = true
          allOutput = ''
          term.write(`\r\n\x1b[36m[Claude ready — sending prompt at ${new Date().toLocaleTimeString()}...]\x1b[0m\r\n`)
          updateStatus('prompt-sent')
          setTimeout(() => sendPrompt(delayedCommand), 2000)
        }
      }

      // Track recent output for idle detection (after first prompt sent)
      if (delayedCommand && autoRepeat && promptSent && !sendingPrompt) {
        recentOutput += stripAnsi(text)
        if (recentOutput.length > 1000) {
          recentOutput = recentOutput.slice(-500)
        }
        updateStatus('running')
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(checkIdle, 30000)
      }
    }

    ws.onclose = () => {
      term.write('\r\n\x1b[31m[Connection closed]\x1b[0m\r\n')
      updateStatus('disconnected')
      if (idleTimer) clearTimeout(idleTimer)
    }

    ws.onerror = () => {
      term.write('\r\n\x1b[31m[WebSocket error]\x1b[0m\r\n')
    }

    // Send keystrokes to backend
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    // Handle resize
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
      }
    })

    // Observe container size changes
    const observer = new ResizeObserver(() => {
      try { fitAddon.fit() } catch {}
    })
    observer.observe(containerRef.current)

    return () => {
      if (idleTimer) clearTimeout(idleTimer)
      observer.disconnect()
      ws.close()
      term.dispose()
    }
  }, [])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style,
      }}
    />
  )
}
