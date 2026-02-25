'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateIdea, useUpdateEntry } from '@/hooks/useEntries';
import type { Flight } from '@prisma/client';
import { AttendeeSelect } from '../AttendeeSelect';

const schema = z.object({
  departureCity: z.string().min(1, 'Departure city is required'),
  arrivalCity: z.string().min(1, 'Arrival city is required'),
  airline: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
  attendeeIds: z.array(z.string()).optional().default([]),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingIdea?: Flight };

export function FlightIdeaForm({ tripId, onClose, existingIdea }: Props) {
  const createIdea = useCreateIdea(tripId);
  const updateEntry = useUpdateEntry(tripId);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingIdea ? {
      departureCity: existingIdea.departureCity,
      arrivalCity: existingIdea.arrivalCity,
      airline: existingIdea.airline ?? '',
      cost: existingIdea.cost ?? undefined,
      notes: existingIdea.notes ?? '',
      attendeeIds: (existingIdea as { attendeeIds?: string[] }).attendeeIds ?? [],
    } : undefined,
  });

  async function onSubmit(data: FormValues) {
    if (existingIdea) {
      await updateEntry.mutateAsync({
        entryId: existingIdea.id,
        type: 'flight',
        data: {
          departureCity: data.departureCity,
          arrivalCity: data.arrivalCity,
          airline: data.airline || undefined,
          cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
          notes: data.notes || undefined,
          attendeeIds: data.attendeeIds ?? [],
        },
      });
    } else {
      await createIdea.mutateAsync({
        type: 'flight',
        isIdea: true,
        departureCity: data.departureCity,
        arrivalCity: data.arrivalCity,
        airline: data.airline ?? '',
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
      <div className="grid grid-cols-2 gap-3">
        <Input label="From (city)" placeholder="Paris" error={errors.departureCity?.message} {...register('departureCity')} />
        <Input label="To (city)" placeholder="New York" error={errors.arrivalCity?.message} {...register('arrivalCity')} />
      </div>
      <Input label="Airline (optional)" {...register('airline')} />
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
