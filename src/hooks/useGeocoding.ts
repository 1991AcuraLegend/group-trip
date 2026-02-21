import { useState, useEffect, useRef } from 'react';
import { searchAddress } from '@/lib/geocoding';
import type { GeocodingResult } from '@/types';

export function useGeocoding(query: string) {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const data = await searchAddress(query);
      setResults(data);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return { results, isLoading };
}
