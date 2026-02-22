'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressAutocomplete } from '@/components/map/AddressAutocomplete';
import { useCreateEntry, useUpdateEntry, usePromoteToPlan } from '@/hooks/useEntries';
import type { Lodging } from '@prisma/client';
import { toDatetimeLocal, toISO } from './shared';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  confirmationNum: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingLodging?: Lodging; moveToPlan?: boolean };

export function LodgingForm({ tripId, onClose, existingLodging, moveToPlan }: Props) {
  const createEntry = useCreateEntry(tripId);
  const updateEntry = useUpdateEntry(tripId);
  const promoteToPlan = usePromoteToPlan(tripId);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingLodging
      ? {
          name: existingLodging.name,
          address: existingLodging.address,
          checkIn: toDatetimeLocal(existingLodging.checkIn),
          checkOut: toDatetimeLocal(existingLodging.checkOut),
          lat: existingLodging.lat ?? undefined,
          lng: existingLodging.lng ?? undefined,
          confirmationNum: existingLodging.confirmationNum ?? '',
          cost: existingLodging.cost ?? undefined,
          notes: existingLodging.notes ?? '',
        }
      : undefined,
  });

  async function onSubmit(data: FormValues) {
    const payload = {
      type: 'lodging' as const,
      name: data.name,
      address: data.address,
      checkIn: toISO(data.checkIn)!,
      checkOut: toISO(data.checkOut)!,
      lat: data.lat,
      lng: data.lng,
      confirmationNum: data.confirmationNum || undefined,
      cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
      notes: data.notes || undefined,
    };
    if (moveToPlan && existingLodging) {
      await promoteToPlan.mutateAsync({ entryId: existingLodging.id, type: 'lodging', data: payload });
    } else if (existingLodging) {
      await updateEntry.mutateAsync({ entryId: existingLodging.id, type: 'lodging', data: payload });
    } else {
      await createEntry.mutateAsync(payload);
    }
    onClose();
  }

  const isLoading = createEntry.isPending || updateEntry.isPending || promoteToPlan.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <Input label="Hotel / lodging name" error={errors.name?.message} {...register('name')} />
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
            placeholder="Search hotel name or address..."
          />
        )}
      />
      <input type="hidden" {...register('lat', { valueAsNumber: true })} />
      <input type="hidden" {...register('lng', { valueAsNumber: true })} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Check-in" type="datetime-local" error={errors.checkIn?.message} {...register('checkIn')} />
        <Input label="Check-out" type="datetime-local" error={errors.checkOut?.message} {...register('checkOut')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Confirmation #" {...register('confirmationNum')} />
        <Input label="Cost ($)" type="number" step="0.01" min="0" {...register('cost')} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea rows={2} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" {...register('notes')} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" loading={isLoading}>{moveToPlan ? 'Move to Plan' : existingLodging ? 'Update' : 'Add'} lodging</Button>
      </div>
    </form>
  );
}
