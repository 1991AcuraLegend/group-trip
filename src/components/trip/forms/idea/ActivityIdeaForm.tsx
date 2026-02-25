'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { useCreateIdea, useUpdateEntry } from '@/hooks/useEntries';
import { useTrip } from '@/hooks/useTrips';
import type { Activity } from '@prisma/client';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  category: z.string().optional(),
  attendeeIds: z.array(z.string()).optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingIdea?: Activity };

export function ActivityIdeaForm({ tripId, onClose, existingIdea }: Props) {
  const createIdea = useCreateIdea(tripId);
  const updateEntry = useUpdateEntry(tripId);
  const { data: trip } = useTrip(tripId);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingIdea ? {
      name: existingIdea.name,
      address: existingIdea.address ?? '',
      lat: existingIdea.lat ?? undefined,
      lng: existingIdea.lng ?? undefined,
      category: existingIdea.category ?? '',
      attendeeIds: existingIdea.attendeeIds ?? [],
      cost: existingIdea.cost ?? undefined,
      notes: existingIdea.notes ?? '',
    } : { attendeeIds: [] },
  });

  const attendeeIds = watch('attendeeIds') ?? [];

  function toggleAttendee(userId: string) {
    const current = attendeeIds;
    if (current.includes(userId)) {
      setValue('attendeeIds', current.filter((id) => id !== userId));
    } else {
      setValue('attendeeIds', [...current, userId]);
    }
  }

  async function onSubmit(data: FormValues) {
    if (existingIdea) {
      await updateEntry.mutateAsync({
        entryId: existingIdea.id,
        type: 'activity',
        data: {
          name: data.name, address: data.address || undefined,
          lat: data.lat, lng: data.lng,
          category: data.category || undefined,
          attendeeIds: data.attendeeIds ?? [],
          cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
          notes: data.notes || undefined,
        },
      });
    } else {
      await createIdea.mutateAsync({
        type: 'activity', isIdea: true,
        name: data.name, address: data.address || undefined,
        lat: data.lat, lng: data.lng,
        category: data.category || undefined,
        attendeeIds: data.attendeeIds ?? [],
        cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
        notes: data.notes || undefined,
      });
    }
    onClose();
  }

  const isLoading = createIdea.isPending || updateEntry.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Activity name" error={errors.name?.message} {...register('name')} />
      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Location (optional)"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => {
              field.onChange(result.displayName);
              setValue('lat', result.lat);
              setValue('lng', result.lng);
            }}
          />
        )}
      />
      <Input label="Category (optional)" placeholder="Museum, Hiking, Tour..." {...register('category')} />
      <Input label="Estimated cost" type="number" min="0" step="0.01" placeholder="0.00" {...register('cost')} />
      {trip && trip.members.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-sand-700">Attendees</label>
          <div className="flex flex-col gap-1 rounded-md border border-sand-300 p-2">
            {trip.members.map((m) => (
              <label key={m.userId} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-sand-300 text-ocean-600"
                  checked={attendeeIds.includes(m.userId)}
                  onChange={() => toggleAttendee(m.userId)}
                />
                <span className="text-sand-700">{m.user.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
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
