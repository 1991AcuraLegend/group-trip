import { CostBreakdown } from '@/components/trip/CostBreakdown';

export default function CostsPage({ params }: { params: { tripId: string } }) {
  return <CostBreakdown tripId={params.tripId} />;
}
