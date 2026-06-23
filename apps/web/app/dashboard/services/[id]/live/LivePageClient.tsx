'use client'
import { ControlPanel } from '@/components/live/ControlPanel'

export function LivePageClient({ serviceId }: { serviceId: string }) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0d0f14] flex flex-col">
      <ControlPanel serviceId={serviceId} />
    </div>
  )
}