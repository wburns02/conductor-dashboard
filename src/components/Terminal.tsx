import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  className?: string
  style?: React.CSSProperties
  initialCommand?: string
  delayedCommand?: string  // Sent after a longer delay (e.g. for Claude to start up first)
  autoRepeat?: boolean     // If true, re-send delayedCommand when Claude goes idle
}

function getWsBase(): string {
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${proto}//${host}`
  }
  return 'ws://localhost:8787'
}

export default function Terminal({ className, style, initialCommand, delayedCommand, autoRepeat }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitRef = useRef<FitAddon | null>(null)

  const connect = useCallback(() => {
    if (!containerRef.current) return

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

    // Idle detection for auto-repeat
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    let initialPromptSent = false
    let recentOutput = ''

    const checkIdle = () => {
      if (!delayedCommand || !autoRepeat || !initialPromptSent) return
      // Look for Claude's idle prompt: ❯ at end of output with no activity
      // The ❯ character appears when Claude is waiting for input
      const lastChunk = recentOutput.slice(-200)
      const hasIdlePrompt = lastChunk.includes('❯') || lastChunk.includes('\u276f')
      const hasBypassMsg = lastChunk.includes('bypass permissions')
      if (hasIdlePrompt || hasBypassMsg) {
        // Claude is idle — send the next prompt after a short pause
        term.write('\r\n\x1b[33m[Auto-repeat: sending next sprint prompt...]\x1b[0m\r\n')
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(delayedCommand)
            setTimeout(() => ws.send('\r'), 300)
          }
        }, 3000)
      }
    }

    ws.onopen = () => {
      term.focus()
      // Send initial command after shell prompt appears
      if (initialCommand) {
        setTimeout(() => {
          ws.send(initialCommand + '\n')
        }, 500)
      }
      // Send delayed command (e.g. prompt for Claude after it starts up)
      // Wait 8s for Claude to initialize, then send text + Enter (\r)
      if (delayedCommand) {
        setTimeout(() => {
          ws.send(delayedCommand)
          // Small delay then press Enter via carriage return
          setTimeout(() => {
            ws.send('\r')
            initialPromptSent = true
          }, 300)
        }, 8000)
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

      // Track recent output for idle detection
      if (delayedCommand && autoRepeat && initialPromptSent) {
        recentOutput += text
        // Keep only last 500 chars
        if (recentOutput.length > 1000) {
          recentOutput = recentOutput.slice(-500)
        }
        // Reset idle timer — check for idle after 30s of no new output
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(checkIdle, 30000)
      }
    }

    ws.onclose = () => {
      term.write('\r\n\x1b[31m[Connection closed]\x1b[0m\r\n')
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
