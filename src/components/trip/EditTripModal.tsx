'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Trip } from '@prisma/client';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUpdateTrip } from '@/hooks/useTrips';
import { toDateInput } from '@/components/trip/forms/shared';

const editTripSchema = z
  .object({
    name: z.string().min(1, 'Trip name is required').max(100),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['endDate'] }
  );

type EditTripFormValues = z.infer<typeof editTripSchema>;

type Props = {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
};

export function EditTripModal({ trip, isOpen, onClose }: Props) {
  const updateTrip = useUpdateTrip(trip.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTripFormValues>({
    resolver: zodResolver(editTripSchema),
    defaultValues: {
      name: trip.name,
      startDate: toDateInput(trip.startDate),
      endDate: toDateInput(trip.endDate),
    },
  });

  // Sync form values when the trip changes or the modal reopens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: trip.name,
        startDate: toDateInput(trip.startDate),
        endDate: toDateInput(trip.endDate),
      });
    }
  }, [isOpen, trip, reset]);

  async function onSubmit(values: EditTripFormValues) {
    await updateTrip.mutateAsync({
      name: values.name,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Trip">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Trip name"
          placeholder="e.g. Tokyo Adventure"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        {updateTrip.isError && (
          <p className="text-sm text-coral-600">Failed to save changes. Please try again.</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting || updateTrip.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
