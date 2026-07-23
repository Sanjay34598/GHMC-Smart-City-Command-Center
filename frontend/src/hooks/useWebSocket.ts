import { useEffect, useRef, useState } from 'react'
import { WS_BASE_URL } from '@/constants/site'

type WebSocketOptions = {
  onMessage?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectInterval?: number
  maxRetries?: number
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const optionsRef = useRef(options)

  useEffect(() => {
    optionsRef.current = options
  }, [options])

  const reconnectInterval = options.reconnectInterval ?? 3000

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let isComponentMounted = true

    function connect() {
      if (!isComponentMounted) return

      try {
        ws.current = new WebSocket(url)

        ws.current.onopen = () => {
          if (!isComponentMounted) return
          setIsConnected(true)
          retryCount.current = 0
          optionsRef.current.onConnect?.()
        }

        ws.current.onclose = () => {
          if (!isComponentMounted) return
          setIsConnected(false)
          optionsRef.current.onDisconnect?.()
          
          const backoff = Math.min(reconnectInterval * Math.pow(1.5, retryCount.current), 15000)
          retryCount.current += 1
          timeoutId = setTimeout(connect, backoff)
        }

        ws.current.onerror = (e) => {
          console.warn('WebSocket connection error:', e)
        }

        ws.current.onmessage = (event) => {
          if (!isComponentMounted) return
          try {
            const data = JSON.parse(event.data)
            optionsRef.current.onMessage?.(data)
          } catch (e) {
            console.error('Failed to parse WebSocket message', e)
          }
        }
      } catch (err) {
        console.warn('WebSocket connection attempt error:', err)
        const backoff = Math.min(reconnectInterval * Math.pow(1.5, retryCount.current), 15000)
        retryCount.current += 1
        timeoutId = setTimeout(connect, backoff)
      }
    }

    connect()

    return () => {
      isComponentMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url, reconnectInterval])

  return { isConnected }
}

export function useIncidentWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  
  useWebSocket(`${WS_BASE_URL}/incidents`, {
    onMessage: () => setLastUpdate(Date.now())
  })

  return lastUpdate
}
