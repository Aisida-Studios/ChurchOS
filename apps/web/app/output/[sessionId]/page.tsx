import { OutputRenderer } from '@/components/output/OutputRenderer'

// Next.js 14 requires async params
export default async function OutputPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <OutputRenderer sessionId={sessionId} />
    </div>
  )
}
