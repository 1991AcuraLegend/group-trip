import { useEffect, useState } from 'react';

/**
 * Hook to detect if the device is mobile based on window width.
 * Uses the lg breakpoint (1024px) from Tailwind.
 * Returns true if screen width < 1024px.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set initial value
    setIsMobile(window.innerWidth < 1024);

    // Handle resize
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
