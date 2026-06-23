import ServiceBuilder from '@/components/services/ServiceBuilder'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ServiceBuilder serviceId={id} />
}
