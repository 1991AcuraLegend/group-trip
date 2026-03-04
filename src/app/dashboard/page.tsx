'use client';

import { useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { TripGrid } from '@/components/dashboard/TripGrid';
import { CreateTripModal } from '@/components/dashboard/CreateTripModal';
import { DashboardMenu } from '@/components/dashboard/DashboardMenu';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: session } = useSession();

  const handleOpenModal = useCallback(() => setShowModal(true), []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top header with icon, greeting and sign out */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/TravelPlannerIcon.png"
              alt="TravelPlanner"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <div className="flex flex-col text-left">
              <h2 className="text-lg md:text-xl font-semibold text-ocean-800">
                Where are we going today,
              </h2>
              <h2 className="text-lg md:text-xl font-semibold text-ocean-800">
                {session?.user?.name}?
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: kebab menu */}
            <div className="lg:hidden">
              <DashboardMenu />
            </div>
            {/* Desktop: inline buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/settings">
                <Button variant="secondary" size="sm">Settings</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={() => signOut({ callbackUrl: `${window.location.origin}/` })}>Sign Out</Button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-ocean-900">My Trips</h1>
          <Button onClick={handleOpenModal}>+ Create Trip</Button>
        </div>

        <TripGrid onCreateTrip={handleOpenModal} />

        <CreateTripModal isOpen={showModal} onClose={handleCloseModal} />
      </div>
    </div>
  );
}
