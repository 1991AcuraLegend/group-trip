import { IdeasLayout } from '@/components/trip/IdeasLayout';

export default function IdeasPage({ params }: { params: { tripId: string } }) {
  return <IdeasLayout tripId={params.tripId} />;
}
