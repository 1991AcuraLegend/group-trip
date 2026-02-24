'use client';

import { useState } from 'react';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import { useEntries } from '@/hooks/useEntries';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EntryList } from './EntryList';
import { planFormRegistry, ENTRIES_KEY } from './forms/registry';
import { ENTRY_LABELS } from '@/lib/constants';

type AnyEntry = Flight | Lodging | CarRental | Restaurant | Activity;

type Props = { tripId: string; canEdit: boolean; selectedEntryId: string | null; onSelectEntry: (entryId: string | null) => void };

const TAB_ORDER: EntryType[] = ['flight', 'lodging', 'carRental', 'restaurant', 'activity'];

export function EntryPanel({ tripId, canEdit, selectedEntryId, onSelectEntry }: Props) {
  const { data: entries, isLoading, error } = useEntries(tripId);
  const [activeTab, setActiveTab] = useState<EntryType>('flight');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ type: EntryType; data: AnyEntry } | null>(null);

  const counts = entries
    ? {
        flight: entries.flights.length,
        lodging: entries.lodgings.length,
        carRental: entries.carRentals.length,
        restaurant: entries.restaurants.length,
        activity: entries.activities.length,
      }
    : { flight: 0, lodging: 0, carRental: 0, restaurant: 0, activity: 0 };

  const tabs = TAB_ORDER.map((t) => ({
    value: t,
    label: ENTRY_LABELS[t],
    count: counts[t],
  }));

  function closeForm() {
    setCreateOpen(false);
    setEditingEntry(null);
  }

  function handleEdit(type: EntryType, entry: AnyEntry) {
    setEditingEntry({ type, data: entry });
  }

  const activeType = editingEntry?.type ?? (createOpen ? activeTab : null);
  const modalTitle = editingEntry
    ? `Edit ${ENTRY_LABELS[editingEntry.type]}`
    : `Add ${ENTRY_LABELS[activeTab]}`;

  function renderForm() {
    if (!activeType) return null;
    const FormComponent = planFormRegistry[activeType];
    return <FormComponent tripId={tripId} onClose={closeForm} existingEntry={editingEntry?.data} />;
  }

  function getActiveEntries(): AnyEntry[] {
    if (!entries) return [];
    return entries[ENTRIES_KEY[activeTab]];
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-white">
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={(v) => setActiveTab(v as EntryType)} />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-sand-200">
        <span className="text-sm font-medium text-sand-700">{ENTRY_LABELS[activeTab]}</span>
        {canEdit && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="whitespace-nowrap">
            <span className="hidden sm:inline">+ Add {ENTRY_LABELS[activeTab]}</span>
            <span className="sm:hidden">+ Add</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-500">Failed to load entries</p>
        ) : (
          <EntryList
            entries={getActiveEntries()}
            type={activeTab}
            tripId={tripId}
            canEdit={canEdit}
            onEdit={(entry) => handleEdit(activeTab, entry)}
            selectedEntryId={selectedEntryId}
            onSelectEntry={onSelectEntry}
          />
        )}
      </div>

      <Modal isOpen={!!(createOpen || editingEntry)} onClose={closeForm} title={modalTitle}>
        {renderForm()}
      </Modal>
    </div>
  );
}
