'use client';

import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateTrip, useUploadImage } from '@/hooks/useTrips';
import { createTripSchema, type CreateTripInput } from '@/validators/trip';
import { AI_TRIP_PROMPT } from '@/lib/ai-trip-prompt';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateTripModal({ isOpen, onClose }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [tripDescription, setTripDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createTrip = useCreateTrip();
  const uploadImage = useUploadImage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTripInput>({
    resolver: zodResolver(createTripSchema),
  });

  function handleClose() {
    reset();
    setImagePreview(null);
    setPendingFile(null);
    setPromptCopied(false);
    setTripDescription('');
    onClose();
  }

  const handleTripDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTripDescription(e.target.value);
  }, []);

  async function handleCopyPrompt() {
    try {
      const fullPrompt = tripDescription.trim() ? `${tripDescription.trim()}\n\n${AI_TRIP_PROMPT}` : AI_TRIP_PROMPT;
      await navigator.clipboard.writeText(fullPrompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is not available
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function onSubmit(data: CreateTripInput) {
    let coverImage: string | undefined;

    if (pendingFile) {
      const result = await uploadImage.mutateAsync(pendingFile);
      coverImage = result.url;
    }

    // datetime-local inputs give "YYYY-MM-DDTHH:mm"; convert to full ISO string
    const toISO = (v?: string) => (v ? new Date(v).toISOString() : undefined);

    await createTrip.mutateAsync({
      ...data,
      startDate: toISO(data.startDate),
      endDate: toISO(data.endDate),
      ...(coverImage ? { coverImage } : {}),
    });
    handleClose();
  }

  const isLoading = createTrip.isPending || uploadImage.isPending;
  const errorMessage = createTrip.error?.message || uploadImage.error?.message;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Trip">
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Trip name"
            placeholder="Summer in Italy"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-sand-700">Description</label>
            <textarea
              placeholder="A brief description of your trip..."
              rows={3}
              className="rounded-lg border border-sand-300 px-3 py-2 text-sm shadow-sm placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-coral-600">{errors.description.message}</p>
            )}
          </div>

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

          {/* Cover image upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-sand-700">Cover image</label>
            {imagePreview && (
              <div className="relative h-32 w-full overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setPendingFile(null); }}
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

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Create trip
            </Button>
          </div>
        </form>

        {/* AI Prompt section - outside form to prevent focus issues */}
        <details className="border border-sand-300 rounded-lg p-4 bg-sand-50">
          <summary className="cursor-pointer font-medium text-sand-800 hover:text-sand-900">
            Want to create a trip using AI?
          </summary>
          <div className="mt-4 space-y-3">
            <ol className="text-sm text-sand-600 list-decimal list-inside space-y-2">
              <li>Describe your ideal trip in the box below. What dates will it span? Where do you want to go? What kind of activities? Go crazy with it!</li>
              <li>Press the &quot;Copy Prompt&quot; button, then paste the result into your AI of choice.</li>
              <li>Copy the AI&#39;s output and paste it into the Import Trip section under Settings.</li>
            </ol>
            <textarea
              ref={textareaRef}
              value={tripDescription}
              onChange={handleTripDescriptionChange}
              onKeyDown={(e) => {
                // Prevent Enter from triggering any parent behaviors
                if (e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              placeholder="I want to visit Paris from June 1-7. I love art museums, cafes, and romantic walks along the Seine..."
              rows={4}
              className="w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 resize-none"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyPrompt}
            >
              {promptCopied ? 'Copied!' : 'Copy Prompt'}
            </Button>
          </div>
        </details>
      </div>
    </Modal>
  );
}
