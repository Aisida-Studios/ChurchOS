'use client'
import { useEffect, useState } from 'react'
import { ControlPanel } from '@/components/live/ControlPanel'
import { useLiveStore } from '@/lib/state/live-store'
import { useLiveSession } from '@/hooks/useLiveSession'
import { Loader2, AlertCircle } from 'lucide-react'

export function LivePageClient({ serviceId }: { serviceId: string }) {
  const [service, setService] = useState<any>(null)
  const [error, setError] = useState('')
  const { initSession } = useLiveStore()
  const sessionId = `session-${serviceId}`

  useEffect(() => {
    fetch(`/api/services/${serviceId}`)
      .then(r => r.json())
      .then(svc => {
        if (svc.error) { setError(svc.error); return }
        setService(svc)
        initSession(sessionId, serviceId, 'site-1')
      })
      .catch(e => setError(e.message))
  }, [serviceId])

  useLiveSession(service ? sessionId : null)

  if (error) return (
    <div className="flex items-center justify-center h-screen bg-[#0d0f14] text-red-400 gap-2">
      <AlertCircle size={18} /> Error: {error}
    </div>
  )
  if (!service) return (
    <div className="flex items-center justify-center h-screen bg-[#0d0f14] text-[#555]">
      <Loader2 size={20} className="animate-spin mr-2" /> Loading service…
    </div>
  )

  return <ControlPanel service={service} sessionId={sessionId} />
}
