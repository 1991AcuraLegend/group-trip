'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { useCreateEntry, useUpdateEntry, usePromoteToPlan } from '@/hooks/useEntries';
import type { CarRental } from '@prisma/client';
import { toDatetimeLocal, toISO } from './shared';
import { AttendeeSelect } from './AttendeeSelect';

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  dropoffAddress: z.string().optional(),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  dropoffDate: z.string().min(1, 'Drop-off date is required'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  confirmationNum: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
  attendeeIds: z.array(z.string()).optional().default([]),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingCarRental?: CarRental; moveToPlan?: boolean };

export function CarRentalForm({ tripId, onClose, existingCarRental, moveToPlan }: Props) {
  const createEntry = useCreateEntry(tripId);
  const updateEntry = useUpdateEntry(tripId);
  const promoteToPlan = usePromoteToPlan(tripId);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingCarRental
      ? {
          company: existingCarRental.company,
          pickupAddress: existingCarRental.pickupAddress,
          dropoffAddress: existingCarRental.dropoffAddress ?? '',
          pickupDate: toDatetimeLocal(existingCarRental.pickupDate),
          dropoffDate: toDatetimeLocal(existingCarRental.dropoffDate),
          pickupLat: existingCarRental.pickupLat ?? undefined,
          pickupLng: existingCarRental.pickupLng ?? undefined,
          confirmationNum: existingCarRental.confirmationNum ?? '',
          cost: existingCarRental.cost ?? undefined,
          notes: existingCarRental.notes ?? '',
          attendeeIds: (existingCarRental as { attendeeIds?: string[] }).attendeeIds ?? [],
        }
      : undefined,
  });

  async function onSubmit(data: FormValues) {
    const payload = {
      type: 'carRental' as const,
      company: data.company,
      pickupAddress: data.pickupAddress,
      dropoffAddress: data.dropoffAddress || undefined,
      pickupDate: toISO(data.pickupDate)!,
      dropoffDate: toISO(data.dropoffDate)!,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      confirmationNum: data.confirmationNum || undefined,
      cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
      notes: data.notes || undefined,
      attendeeIds: data.attendeeIds ?? [],
    };
    if (moveToPlan && existingCarRental) {
      await promoteToPlan.mutateAsync({ entryId: existingCarRental.id, type: 'carRental', data: payload });
    } else if (existingCarRental) {
      await updateEntry.mutateAsync({ entryId: existingCarRental.id, type: 'carRental', data: payload });
    } else {
      await createEntry.mutateAsync(payload);
    }
    onClose();
  }

  const isLoading = createEntry.isPending || updateEntry.isPending || promoteToPlan.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Rental company" error={errors.company?.message} {...register('company')} />
      <Controller
        name="pickupAddress"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Pickup address"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => {
              field.onChange(result.displayName);
              setValue('pickupLat', result.lat);
              setValue('pickupLng', result.lng);
            }}
            error={errors.pickupAddress?.message}
            placeholder="Search location name or address..."
          />
        )}
      />
      <Controller
        name="dropoffAddress"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Drop-off address (optional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => field.onChange(result.displayName)}
            placeholder="Search location name or address..."
          />
        )}
      />
      <input type="hidden" {...register('pickupLat', { valueAsNumber: true })} />
      <input type="hidden" {...register('pickupLng', { valueAsNumber: true })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Pickup date & time" type="datetime-local" error={errors.pickupDate?.message} {...register('pickupDate')} />
        <Input label="Drop-off date & time" type="datetime-local" error={errors.dropoffDate?.message} {...register('dropoffDate')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Confirmation #" {...register('confirmationNum')} />
        <Input label="Cost ($)" type="number" step="0.01" min="0" {...register('cost')} />
      </div>
      <Controller
        name="attendeeIds"
        control={control}
        render={({ field }) => (
          <AttendeeSelect tripId={tripId} value={field.value ?? []} onChange={field.onChange} />
        )}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea rows={2} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" {...register('notes')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" loading={isLoading}>{moveToPlan ? 'Move to Plan' : existingCarRental ? 'Update' : 'Add'} car rental</Button>
      </div>
    </form>
  );
}
