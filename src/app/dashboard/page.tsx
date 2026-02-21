'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { TripGrid } from '@/components/dashboard/TripGrid';
import { CreateTripModal } from '@/components/dashboard/CreateTripModal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top header with greeting and sign out */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ocean-800">
            Where are we going today, {session?.user?.name}?
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="secondary" size="sm">Settings</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => signOut()}>Sign Out</Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-ocean-900">My Trips</h1>
          <Button onClick={() => setShowModal(true)}>+ Create Trip</Button>
        </div>

        <TripGrid onCreateTrip={() => setShowModal(true)} />

        <CreateTripModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </div>
    </div>
  );
}
