'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Trip } from '@prisma/client';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useUpdateTrip, useUploadImage } from '@/hooks/useTrips';
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
  const uploadImage = useUploadImage();

  const [imagePreview, setImagePreview] = useState<string | null>(trip.coverImage ?? null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

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

  // Sync form values and image state when the trip changes or the modal reopens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: trip.name,
        startDate: toDateInput(trip.startDate),
        endDate: toDateInput(trip.endDate),
      });
      setImagePreview(trip.coverImage ?? null);
      setPendingFile(null);
      setImageRemoved(false);
    }
  }, [isOpen, trip, reset]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImageRemoved(false);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setPendingFile(null);
    setImageRemoved(true);
  }

  async function onSubmit(values: EditTripFormValues) {
    let coverImage: string | null | undefined;

    if (pendingFile) {
      const result = await uploadImage.mutateAsync(pendingFile);
      coverImage = result.url;
    } else if (imageRemoved) {
      coverImage = null;
    }

    await updateTrip.mutateAsync({
      name: values.name,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      ...(coverImage !== undefined ? { coverImage } : {}),
    });
    onClose();
  }

  const isLoading = isSubmitting || updateTrip.isPending || uploadImage.isPending;
  const errorMessage = updateTrip.error?.message || uploadImage.error?.message;

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

        {/* Cover image */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-sand-700">Cover image</label>
          {imagePreview && (
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                aria-label="Remove image"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="text-sm text-sand-500 file:mr-3 file:rounded-md file:border-0 file:bg-ocean-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-700 hover:file:bg-ocean-100"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-coral-600">{errorMessage}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isLoading}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
