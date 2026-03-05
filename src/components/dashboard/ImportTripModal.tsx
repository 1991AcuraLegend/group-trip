'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useImportTrip } from '@/hooks/useTrips';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ImportTripModal({ isOpen, onClose }: Props) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTrip = useImportTrip();
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        JSON.parse(text);
        setJsonText(text);
        setError(null);
      } catch {
        setError('The selected file is not valid JSON.');
      }
    };
    reader.readAsText(file);
  }

  function handleClose() {
    setJsonText('');
    setError(null);
    onClose();
  }

  async function handleImport() {
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError('Invalid JSON. Please check the format and try again.');
      return;
    }

    try {
      const result = await importTrip.mutateAsync(parsed);
      handleClose();
      router.push(`/trips/${result.tripId}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to import trip. Please check the format.');
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Trip">
      <div className="space-y-4">
        <p className="text-sm text-sand-600">
          Select a trip JSON file or paste JSON directly into the field below.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="text-sm text-sand-500 file:mr-3 file:rounded-md file:border-0 file:bg-ocean-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ocean-700 hover:file:bg-ocean-100"
        />
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"version": 1, "trip": { ... }, "entries": { ... }}'
          className="w-full h-64 rounded-lg border border-sand-300 bg-sand-50 p-3 text-xs font-mono text-sand-800 placeholder:text-sand-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
        />
        {error && (
          <p className="text-sm text-coral-600">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={!jsonText.trim()}
            loading={importTrip.isPending}
          >
            Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
