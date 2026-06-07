import { useState, useRef, useCallback, useEffect } from 'react'

export interface ToolProgress {
  tool: string
  status: string
  emoji: string
  label: string
}

interface UseChatStreamOptions {
  onToken?: (token: string) => void
  onDone?: (fullContent: string) => void
  onError?: (error: string) => void
  onToolProgress?: (progress: ToolProgress) => void
}

export interface UseChatStreamReturn {
  isStreaming: boolean
  error: string | null
  stop: () => void
  stream: (messages: Array<{ role: string; content: string }>, model?: string) => Promise<void>
}

const API = 'http://localhost:7777'

export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const accumulatorRef = useRef('')

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsStreaming(false)
    // Return accumulated content even on stop
    if (accumulatorRef.current) {
      options.onDone?.(accumulatorRef.current)
    }
  }, [options])

  const stream = useCallback(async (messages: Array<{ role: string; content: string }>, model?: string) => {
    if (isStreaming) return

    const controller = new AbortController()
    abortRef.current = controller
    setIsStreaming(true)
    setError(null)
    accumulatorRef.current = ''

    let reconnectAttempts = 0
    const maxReconnects = 2

    async function doStream() {
      try {
        const res = await fetch(`${API}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            model,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errBody = await res.text().catch(() => '')
          throw new Error(`Stream failed (${res.status}): ${errBody}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No readable stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                options.onDone?.(accumulatorRef.current)
                break
              }
              try {
                const parsed = JSON.parse(data)
                // Tool progress events
                if (parsed.type === 'tool_progress') {
                  options.onToolProgress?.(parsed as ToolProgress)
                  continue
                }
                const token = parsed.token || parsed.content || parsed.delta || ''
                if (token) {
                  accumulatorRef.current += token
                  options.onToken?.(token)
                }
              } catch {
                // Not JSON — treat as raw token
                if (data) {
                  accumulatorRef.current += data
                  options.onToken?.(data)
                }
              }
            }
          }
        }

        // Final done callback
        if (accumulatorRef.current) {
          options.onDone?.(accumulatorRef.current)
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Expected — user stopped
          return
        }

        if (reconnectAttempts < maxReconnects) {
          reconnectAttempts++
          console.warn(`Stream reconnect attempt ${reconnectAttempts}`)
          await new Promise(r => setTimeout(r, 1000 * reconnectAttempts))
          if (!controller.signal.aborted) {
            return doStream()
          }
        } else {
          const msg = err.name === 'AbortError' ? '' : (err.message || 'Streaming error')
          if (msg) {
            setError(msg)
            options.onError?.(msg)
          }
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    }

    doStream()
  }, [isStreaming, options])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  return { isStreaming, error, stop, stream }
}
