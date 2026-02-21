'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateEntry, useUpdateEntry } from '@/hooks/useEntries';
import type { Flight } from '@prisma/client';
import { toDatetimeLocal, toISO } from './shared';

const schema = z.object({
  airline: z.string().min(1, 'Airline is required'),
  flightNumber: z.string().optional(),
  departureCity: z.string().min(1, 'Departure city is required'),
  arrivalCity: z.string().min(1, 'Arrival city is required'),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  departureDate: z.string().min(1, 'Departure date is required'),
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  confirmationNum: z.string().optional(),
  cost: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingFlight?: Flight };

export function FlightForm({ tripId, onClose, existingFlight }: Props) {
  const createEntry = useCreateEntry(tripId);
  const updateEntry = useUpdateEntry(tripId);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingFlight
      ? {
          airline: existingFlight.airline,
          flightNumber: existingFlight.flightNumber ?? '',
          departureCity: existingFlight.departureCity,
          arrivalCity: existingFlight.arrivalCity,
          departureAirport: existingFlight.departureAirport ?? '',
          arrivalAirport: existingFlight.arrivalAirport ?? '',
          departureDate: toDatetimeLocal(existingFlight.departureDate),
          arrivalDate: toDatetimeLocal(existingFlight.arrivalDate),
          confirmationNum: existingFlight.confirmationNum ?? '',
          cost: existingFlight.cost ?? undefined,
          notes: existingFlight.notes ?? '',
        }
      : undefined,
  });

  async function onSubmit(data: FormValues) {
    const payload = {
      type: 'flight' as const,
      airline: data.airline,
      flightNumber: data.flightNumber || undefined,
      departureCity: data.departureCity,
      arrivalCity: data.arrivalCity,
      departureAirport: data.departureAirport || undefined,
      arrivalAirport: data.arrivalAirport || undefined,
      departureDate: toISO(data.departureDate)!,
      arrivalDate: toISO(data.arrivalDate)!,
      confirmationNum: data.confirmationNum || undefined,
      cost: data.cost !== '' && data.cost !== undefined ? Number(data.cost) : undefined,
      notes: data.notes || undefined,
    };

    if (existingFlight) {
      await updateEntry.mutateAsync({ entryId: existingFlight.id, type: 'flight', data: payload });
    } else {
      await createEntry.mutateAsync(payload);
    }
    onClose();
  }

  const isLoading = createEntry.isPending || updateEntry.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Airline" error={errors.airline?.message} {...register('airline')} />
        <Input label="Flight number" {...register('flightNumber')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Departure city" error={errors.departureCity?.message} {...register('departureCity')} />
        <Input label="Arrival city" error={errors.arrivalCity?.message} {...register('arrivalCity')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Departure airport" placeholder="JFK" {...register('departureAirport')} />
        <Input label="Arrival airport" placeholder="CDG" {...register('arrivalAirport')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Departure date & time" type="datetime-local" error={errors.departureDate?.message} {...register('departureDate')} />
        <Input label="Arrival date & time" type="datetime-local" error={errors.arrivalDate?.message} {...register('arrivalDate')} />
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
        <Button type="submit" loading={isLoading}>{existingFlight ? 'Update' : 'Add'} flight</Button>
      </div>
    </form>
  );
}
