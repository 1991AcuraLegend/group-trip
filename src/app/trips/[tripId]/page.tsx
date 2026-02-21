import { TripDetailLayout } from '@/components/trip/TripDetailLayout';

export default function TripPage({ params }: { params: { tripId: string } }) {
  return <TripDetailLayout tripId={params.tripId} />;
}
