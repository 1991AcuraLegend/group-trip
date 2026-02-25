'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { useCreateIdea, useUpdateEntry } from '@/hooks/useEntries';
import type { CarRental } from '@prisma/client';
import { AttendeeSelect } from '../AttendeeSelect';

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  dropoffAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
  attendeeIds: z.array(z.string()).optional().default([]),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingIdea?: CarRental };

export function CarRentalIdeaForm({ tripId, onClose, existingIdea }: Props) {
  const createIdea = useCreateIdea(tripId);
  const updateEntry = useUpdateEntry(tripId);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingIdea ? {
      company: existingIdea.company,
      pickupAddress: existingIdea.pickupAddress,
      dropoffAddress: existingIdea.dropoffAddress ?? '',
      pickupLat: existingIdea.pickupLat ?? undefined,
      pickupLng: existingIdea.pickupLng ?? undefined,
      cost: existingIdea.cost ?? undefined,
      notes: existingIdea.notes ?? '',
      attendeeIds: (existingIdea as { attendeeIds?: string[] }).attendeeIds ?? [],
    } : undefined,
  });

  async function onSubmit(data: FormValues) {
    if (existingIdea) {
      await updateEntry.mutateAsync({
        entryId: existingIdea.id,
        type: 'carRental',
        data: {
          company: data.company,
          pickupAddress: data.pickupAddress,
          dropoffAddress: data.dropoffAddress || undefined,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
          notes: data.notes || undefined,
          attendeeIds: data.attendeeIds ?? [],
        },
      });
    } else {
      await createIdea.mutateAsync({
        type: 'carRental',
        isIdea: true,
        company: data.company,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress || undefined,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
        notes: data.notes || undefined,
        attendeeIds: data.attendeeIds ?? [],
      });
    }
    onClose();
  }

  const isLoading = createIdea.isPending || updateEntry.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Rental company" error={errors.company?.message} {...register('company')} />
      <Controller
        name="pickupAddress"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Pickup location"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => {
              field.onChange(result.displayName);
              setValue('pickupLat', result.lat);
              setValue('pickupLng', result.lng);
            }}
            error={errors.pickupAddress?.message}
          />
        )}
      />
      <Controller
        name="dropoffAddress"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Drop-off location (optional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => field.onChange(result.displayName)}
          />
        )}
      />
      <Input label="Estimated cost" type="number" min="0" step="0.01" placeholder="0.00" {...register('cost')} />
      <Controller
        name="attendeeIds"
        control={control}
        render={({ field }) => (
          <AttendeeSelect tripId={tripId} value={field.value ?? []} onChange={field.onChange} variant="idea" />
        )}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-sand-700">Notes</label>
        <textarea
          rows={2}
          className="rounded-md border border-sand-300 px-3 py-2 text-sm text-sand-900 placeholder-sand-400 focus:border-ocean-400 focus:outline-none focus:ring-1 focus:ring-ocean-400"
          placeholder="Any notes..."
          {...register('notes')}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm" loading={isLoading}>{existingIdea ? 'Update' : 'Save'} Idea</Button>
      </div>
    </form>
  );
}
