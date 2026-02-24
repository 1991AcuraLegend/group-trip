'use client';

import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { planFormRegistry } from './forms/registry';
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
    const FormComponent = planFormRegistry[type];
    return <FormComponent tripId={tripId} onClose={onClose} existingEntry={entry} moveToPlan />;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {renderForm()}
    </Modal>
  );
}
