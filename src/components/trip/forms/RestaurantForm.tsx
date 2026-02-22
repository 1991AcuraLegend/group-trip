'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { useCreateEntry, useUpdateEntry, usePromoteToPlan } from '@/hooks/useEntries';
import type { Restaurant } from '@prisma/client';
import { toDateInput, toISO } from './shared';

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cuisine: z.string().optional(),
  priceRange: z.string().optional(),
  reservationId: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingRestaurant?: Restaurant; moveToPlan?: boolean };

export function RestaurantForm({ tripId, onClose, existingRestaurant, moveToPlan }: Props) {
  const createEntry = useCreateEntry(tripId);
  const updateEntry = useUpdateEntry(tripId);
  const promoteToPlan = usePromoteToPlan(tripId);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingRestaurant
      ? {
          name: existingRestaurant.name,
          address: existingRestaurant.address,
          date: toDateInput(existingRestaurant.date),
          time: existingRestaurant.time ?? '',
          lat: existingRestaurant.lat ?? undefined,
          lng: existingRestaurant.lng ?? undefined,
          cuisine: existingRestaurant.cuisine ?? '',
          priceRange: existingRestaurant.priceRange ?? '',
          reservationId: existingRestaurant.reservationId ?? '',
          cost: existingRestaurant.cost ?? undefined,
          notes: existingRestaurant.notes ?? '',
        }
      : undefined,
  });

  async function onSubmit(data: FormValues) {
    const payload = {
      type: 'restaurant' as const,
      name: data.name,
      address: data.address,
      date: toISO(data.date)!,
      time: data.time || undefined,
      lat: data.lat,
      lng: data.lng,
      cuisine: data.cuisine || undefined,
      priceRange: data.priceRange || undefined,
      reservationId: data.reservationId || undefined,
      cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
      notes: data.notes || undefined,
    };
    if (moveToPlan && existingRestaurant) {
      await promoteToPlan.mutateAsync({ entryId: existingRestaurant.id, type: 'restaurant', data: payload });
    } else if (existingRestaurant) {
      await updateEntry.mutateAsync({ entryId: existingRestaurant.id, type: 'restaurant', data: payload });
    } else {
      await createEntry.mutateAsync(payload);
    }
    onClose();
  }

  const isLoading = createEntry.isPending || updateEntry.isPending || promoteToPlan.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Restaurant name" error={errors.name?.message} {...register('name')} />
      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Address"
            value={field.value ?? ''}
            onChange={field.onChange}
            onSelect={(result) => {
              field.onChange(result.displayName);
              setValue('lat', result.lat);
              setValue('lng', result.lng);
            }}
            error={errors.address?.message}
            placeholder="Search restaurant name or address..."
          />
        )}
      />
      <input type="hidden" {...register('lat', { valueAsNumber: true })} />
      <input type="hidden" {...register('lng', { valueAsNumber: true })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <Input label="Time" type="time" {...register('time')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Cuisine" placeholder="Italian, Japanese…" {...register('cuisine')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Price range</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('priceRange')}
          >
            <option value="">Select…</option>
            {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Reservation ID" {...register('reservationId')} />
        <Input label="Cost ($)" type="number" step="0.01" min="0" {...register('cost')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea rows={2} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" {...register('notes')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" loading={isLoading}>{moveToPlan ? 'Move to Plan' : existingRestaurant ? 'Update' : 'Add'} restaurant</Button>
      </div>
    </form>
  );
}
