'use client';

import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { FlightForm } from './forms/FlightForm';
import { LodgingForm } from './forms/LodgingForm';
import { CarRentalForm } from './forms/CarRentalForm';
import { RestaurantForm } from './forms/RestaurantForm';
import { ActivityForm } from './forms/ActivityForm';
import { ENTRY_LABELS } from '@/lib/constants';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  type: EntryType;
  entry: Flight | Lodging | CarRental | Restaurant | Activity;
  tripId: string;
};

export function MoveToPlanModal({ isOpen, onClose, type, entry, tripId }: Props) {
  const title = `Move ${ENTRY_LABELS[type]} to Plan`;

  function renderForm() {
    switch (type) {
      case 'flight':
        return <FlightForm tripId={tripId} onClose={onClose} existingFlight={entry as Flight} moveToPlan />;
      case 'lodging':
        return <LodgingForm tripId={tripId} onClose={onClose} existingLodging={entry as Lodging} moveToPlan />;
      case 'carRental':
        return <CarRentalForm tripId={tripId} onClose={onClose} existingCarRental={entry as CarRental} moveToPlan />;
      case 'restaurant':
        return <RestaurantForm tripId={tripId} onClose={onClose} existingRestaurant={entry as Restaurant} moveToPlan />;
      case 'activity':
        return <ActivityForm tripId={tripId} onClose={onClose} existingActivity={entry as Activity} moveToPlan />;
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {renderForm()}
    </Modal>
  );
}
