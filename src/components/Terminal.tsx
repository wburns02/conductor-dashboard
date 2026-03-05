import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  className?: string
  style?: React.CSSProperties
  initialCommand?: string
}

function getWsBase(): string {
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${proto}//${host}`
  }
  return 'ws://localhost:8787'
}

export default function Terminal({ className, style, initialCommand }: TerminalProps) {
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

    ws.onopen = () => {
      term.focus()
      // Send initial command after shell prompt appears
      if (initialCommand) {
        setTimeout(() => {
          ws.send(initialCommand + '\n')
        }, 500)
      }
    }

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data))
      } else {
        term.write(event.data)
      }
    }

    ws.onclose = () => {
      term.write('\r\n\x1b[31m[Connection closed]\x1b[0m\r\n')
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
