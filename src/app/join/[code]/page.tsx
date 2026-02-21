import { JoinTripPage } from '@/components/sharing/JoinTripPage';

export default function JoinPage({ params }: { params: { code: string } }) {
  return <JoinTripPage code={params.code} />;
}
