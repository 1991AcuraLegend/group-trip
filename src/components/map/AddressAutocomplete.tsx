'use client';

import { useState, useRef, useEffect } from 'react';
import { useGeocoding } from '@/hooks/useGeocoding';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { GeocodingResult } from '@/types';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodingResult) => void;
  error?: string;
  placeholder?: string;
};

export function AddressAutocomplete({ label, value, onChange, onSelect, error, placeholder = 'Search address or place name...' }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { results, isLoading } = useGeocoding(value);
  const listRef = useRef<HTMLUListElement>(null);

  // Open dropdown when results arrive
  useEffect(() => {
    if (results.length > 0) {
      setOpen(true);
      setActiveIndex(-1);
    }
  }, [results]);

  function handleSelect(result: GeocodingResult) {
    onChange(result.displayName);
    onSelect(result);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleBlur() {
    // Delay so click on dropdown item fires first
    setTimeout(() => setOpen(false), 150);
  }

  const inputId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="relative flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          className={[
            'w-full rounded-md border px-3 py-2 pr-8 text-sm shadow-sm transition-colors',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
          ].join(' ')}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {results.map((result, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(result)}
              className={[
                'cursor-pointer px-3 py-2 text-sm',
                i === activeIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50',
              ].join(' ')}
            >
              {result.name ? (
                <>
                  <span className="font-medium">{result.name}</span>
                  <span className={['block text-xs truncate', i === activeIndex ? 'text-blue-500' : 'text-gray-400'].join(' ')}>
                    {result.displayName}
                  </span>
                </>
              ) : (
                result.displayName
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
