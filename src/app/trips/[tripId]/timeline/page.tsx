import { TripTimeline } from '@/components/timeline/TripTimeline';

export default function TimelinePage({ params }: { params: { tripId: string } }) {
  return <TripTimeline tripId={params.tripId} />;
}
