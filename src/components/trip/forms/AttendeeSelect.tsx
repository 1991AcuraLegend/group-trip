'use client';

import { useState, useRef, useEffect } from 'react';
import { useMembers } from '@/hooks/useMembers';

type AttendeeSelectProps = {
  tripId: string;
  value: string[];
  onChange: (ids: string[]) => void;
  variant?: 'plan' | 'idea';
};

export function AttendeeSelect({ tripId, value, onChange, variant = 'plan' }: AttendeeSelectProps) {
  const { data: members, isLoading } = useMembers(tripId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function toggle(userId: string) {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  }

  const labelClass = variant === 'idea'
    ? 'text-sm font-medium text-sand-700'
    : 'text-sm font-medium text-gray-700';

  const pillClass = variant === 'idea'
    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-sand-100 text-sand-700'
    : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-ocean-50 text-ocean-700';

  const containerClass = variant === 'idea'
    ? 'min-h-[38px] flex flex-wrap gap-1 items-center rounded-md border border-sand-300 px-3 py-2 text-sm cursor-pointer focus:outline-none'
    : 'min-h-[38px] flex flex-wrap gap-1 items-center rounded-md border border-gray-300 px-3 py-2 text-sm cursor-pointer focus:outline-none';

  const selectedNames = value
    .map((id) => members?.find((m) => m.userId === id)?.user.name)
    .filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className={labelClass}>Attendees</label>
      <div className={containerClass} onClick={() => setOpen((v) => !v)}>
        {isLoading ? (
          <span className="text-gray-400 text-xs">Loading members...</span>
        ) : selectedNames.length === 0 ? (
          <span className="text-gray-400 text-xs">No attendees selected</span>
        ) : (
          selectedNames.map((name, i) => (
            <span key={i} className={pillClass}>
              {name}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(value[i]); }}
                className="ml-0.5 hover:opacity-70"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      {open && (
        <div className="relative">
          <div className="absolute z-50 top-1 left-0 right-0 rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-gray-400">Loading members...</div>
            ) : !members?.length ? (
              <div className="px-3 py-2 text-sm text-gray-400">No members found</div>
            ) : (
              members.map((member) => (
                <label
                  key={member.userId}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(member.userId)}
                    onChange={() => toggle(member.userId)}
                    className="rounded"
                  />
                  <span>{member.user.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
