'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useLiveStore } from '@/lib/state/live-store'
import type { LiveAction, LiveSessionState } from '@churchos/shared-types'

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000]

export function useLiveSession(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const { setConnected, applyRemoteState } = useLiveStore()

  const connect = useCallback(() => {
    if (!sessionId || typeof window === 'undefined') return
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${proto}//${host}/ws/session/${sessionId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      reconnectAttempt.current = 0
      console.log('[ChurchOS] Live session connected:', sessionId)
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'STATE_SYNC') applyRemoteState(msg.payload as LiveSessionState)
      } catch (e) { console.error('[ChurchOS] WS parse error', e) }
    }
    ws.onclose = () => {
      setConnected(false)
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)]
      reconnectAttempt.current++
      reconnectTimer.current = setTimeout(connect, delay)
    }
    ws.onerror = () => ws.close()
  }, [sessionId, setConnected, applyRemoteState])

  useEffect(() => {
    if (!sessionId) return
    const handler = (e: Event) => {
      const action = (e as CustomEvent<LiveAction>).detail
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ACTION', payload: action }))
      }
    }
    window.addEventListener('churchos:action', handler)
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      window.removeEventListener('churchos:action', handler)
      wsRef.current?.close()
    }
  }, [sessionId, connect])
}
