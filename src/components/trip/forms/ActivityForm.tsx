'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { useCreateEntry, useUpdateEntry, usePromoteToPlan } from '@/hooks/useEntries';
import type { Activity } from '@prisma/client';
import { toDateInput, toISO } from './shared';
import { AttendeeSelect } from './AttendeeSelect';
import { logger } from '@/lib/logger';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.string().optional(),
  bookingRef: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
  attendeeIds: z.array(z.string()).optional().default([]),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingActivity?: Activity; moveToPlan?: boolean };

export function ActivityForm({ tripId, onClose, existingActivity, moveToPlan }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createEntry = useCreateEntry(tripId);
  const updateEntry = useUpdateEntry(tripId);
  const promoteToPlan = usePromoteToPlan(tripId);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingActivity
      ? {
          name: existingActivity.name,
          address: existingActivity.address ?? '',
          date: toDateInput(existingActivity.date),
          startTime: existingActivity.startTime ?? '',
          endTime: existingActivity.endTime ?? '',
          lat: existingActivity.lat ?? undefined,
          lng: existingActivity.lng ?? undefined,
          category: existingActivity.category ?? '',
          bookingRef: existingActivity.bookingRef ?? '',
          cost: existingActivity.cost ?? undefined,
          notes: existingActivity.notes ?? '',
          attendeeIds: (existingActivity as { attendeeIds?: string[] }).attendeeIds ?? [],
        }
      : {
          name: '',
          address: '',
          date: '',
          startTime: '',
          endTime: '',
          lat: undefined as number | undefined,
          lng: undefined as number | undefined,
          category: '',
          bookingRef: '',
          cost: undefined as number | undefined,
          notes: '',
          attendeeIds: [] as string[],
        },
  });

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
    const payload = {
      type: 'activity' as const,
      name: data.name,
      address: data.address || undefined,
      date: toISO(data.date)!,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      lat: data.lat,
      lng: data.lng,
      category: data.category || undefined,
      bookingRef: data.bookingRef || undefined,
      cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
      notes: data.notes || undefined,
      attendeeIds: data.attendeeIds ?? [],
    };
    try {
      logger.debug('ActivityForm', 'Form submission started', { tripId, action: existingActivity ? 'edit' : 'create', payload });
      if (moveToPlan && existingActivity) {
        logger.info('ActivityForm', 'Promoting idea to plan', { entryId: existingActivity.id });
        await promoteToPlan.mutateAsync({ entryId: existingActivity.id, type: 'activity', data: payload });
      } else if (existingActivity) {
        logger.info('ActivityForm', 'Updating activity', { entryId: existingActivity.id });
        await updateEntry.mutateAsync({ entryId: existingActivity.id, type: 'activity', data: payload });
      } else {
        logger.info('ActivityForm', 'Creating new activity', { tripId });
        await createEntry.mutateAsync(payload);
      }
      logger.info('ActivityForm', 'Activity saved successfully');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save activity';
      logger.error('ActivityForm', 'Failed to save activity', { error: errorMessage });
      setSubmitError(errorMessage);
    }
  }

  const isLoading = createEntry.isPending || updateEntry.isPending || promoteToPlan.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      {submitError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {submitError}
        </div>
      )}
      <Input label="Activity name" error={errors.name?.message} {...register('name')} />
      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Address (optional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => {
              field.onChange(result.displayName);
              setValue('lat', result.lat);
              setValue('lng', result.lng);
            }}
            placeholder="Search place name or address..."
          />
        )}
      />
      <input type="hidden" {...register('lat', { setValueAs: (v) => (v === '' || v == null) ? undefined : Number(v) })} />
      <input type="hidden" {...register('lng', { setValueAs: (v) => (v === '' || v == null) ? undefined : Number(v) })} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Start time" type="time" {...register('startTime')} />
        <Input label="End time" type="time" {...register('endTime')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Category" placeholder="Museum, Hiking…" {...register('category')} />
        <Input label="Booking ref" {...register('bookingRef')} />
      </div>
      <Input label="Cost ($)" type="number" step="0.01" min="0" {...register('cost')} />
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
        <Button type="submit" loading={isLoading}>{moveToPlan ? 'Move to Plan' : existingActivity ? 'Update' : 'Add'} activity</Button>
      </div>
    </form>
  );
}
