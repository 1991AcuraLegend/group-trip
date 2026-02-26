'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateEntry, useUpdateEntry, usePromoteToPlan } from '@/hooks/useEntries';
import type { Flight } from '@prisma/client';
import { toDatetimeLocal, toISO } from './shared';
import { getCityFromAirportCode } from '@/lib/airports';
import { AttendeeSelect } from './AttendeeSelect';

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
  attendeeIds: z.array(z.string()).optional().default([]),
});
type FormValues = z.infer<typeof schema>;

type Props = { tripId: string; onClose: () => void; existingFlight?: Flight; moveToPlan?: boolean };

export function FlightForm({ tripId, onClose, existingFlight, moveToPlan }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createEntry = useCreateEntry(tripId);
  const updateEntry = useUpdateEntry(tripId);
  const promoteToPlan = usePromoteToPlan(tripId);

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<FormValues>({
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
          attendeeIds: (existingFlight as { attendeeIds?: string[] }).attendeeIds ?? [],
        }
      : undefined,
  });

  const departureAirport = watch('departureAirport');
  const arrivalAirport = watch('arrivalAirport');
  const lastAutoDepartureCity = useRef<string | null>(null);
  const lastAutoArrivalCity = useRef<string | null>(null);

  useEffect(() => {
    if (departureAirport) {
      const city = getCityFromAirportCode(departureAirport);
      if (city) {
        const current = watch('departureCity');
        if (!current || current === lastAutoDepartureCity.current) {
          setValue('departureCity', city, { shouldValidate: true });
          lastAutoDepartureCity.current = city;
        }
      }
    }
  }, [departureAirport, setValue, watch]);

  useEffect(() => {
    if (arrivalAirport) {
      const city = getCityFromAirportCode(arrivalAirport);
      if (city) {
        const current = watch('arrivalCity');
        if (!current || current === lastAutoArrivalCity.current) {
          setValue('arrivalCity', city, { shouldValidate: true });
          lastAutoArrivalCity.current = city;
        }
      }
    }
  }, [arrivalAirport, setValue, watch]);

  async function onSubmit(data: FormValues) {
    setSubmitError(null);
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
      attendeeIds: data.attendeeIds ?? [],
    };

    try {
      if (moveToPlan && existingFlight) {
        await promoteToPlan.mutateAsync({ entryId: existingFlight.id, type: 'flight', data: payload });
      } else if (existingFlight) {
        await updateEntry.mutateAsync({ entryId: existingFlight.id, type: 'flight', data: payload });
      } else {
        await createEntry.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save flight');
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
      <div className="grid grid-cols-2 gap-3">
        <Input label="Airline" error={errors.airline?.message} {...register('airline')} />
        <Input label="Flight number" {...register('flightNumber')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Departure airport" placeholder="JFK" {...register('departureAirport')} />
        <Input label="Arrival airport" placeholder="CDG" {...register('arrivalAirport')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Departure city" error={errors.departureCity?.message} {...register('departureCity')} />
        <Input label="Arrival city" error={errors.arrivalCity?.message} {...register('arrivalCity')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Departure date & time" type="datetime-local" error={errors.departureDate?.message} {...register('departureDate')} />
        <Input label="Arrival date & time" type="datetime-local" error={errors.arrivalDate?.message} {...register('arrivalDate')} />
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
        <Button type="submit" loading={isLoading}>{moveToPlan ? 'Move to Plan' : existingFlight ? 'Update' : 'Add'} flight</Button>
      </div>
    </form>
  );
}
