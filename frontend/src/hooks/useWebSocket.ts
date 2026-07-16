import { useEffect, useRef, useState } from 'react'

type WebSocketOptions = {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectInterval?: number
  maxRetries?: number
}

export function useWebSocket(url: string, options: WebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const maxRetries = options.maxRetries ?? 5
  const reconnectInterval = options.reconnectInterval ?? 3000

  useEffect(() => {
    function connect() {
      if (retryCount.current >= maxRetries) {
        console.error('WebSocket max retries reached')
        return
      }

      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setIsConnected(true)
        retryCount.current = 0
        options.onConnect?.()
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        options.onDisconnect?.()
        // Simple exponential backoff
        setTimeout(() => {
          retryCount.current += 1
          connect()
        }, reconnectInterval * Math.pow(2, retryCount.current))
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          options.onMessage?.(data)
        } catch (e) {
          console.error('Failed to parse WebSocket message', e)
        }
      }
    }

    connect()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url])

  return { isConnected }
}

export function useIncidentWebSocket() {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  
  useWebSocket('ws://localhost:8000/api/v1/incidents/ws', {
    onMessage: () => setLastUpdate(Date.now())
  })

  return lastUpdate
}
