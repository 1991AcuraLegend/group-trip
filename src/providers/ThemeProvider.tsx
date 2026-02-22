'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export type Theme = 'coastal' | 'y2k';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'coastal',
  setTheme: () => {},
});

function themeKey(userId: string) {
  return `theme:${userId}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('coastal');
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Reset to default theme when signed out
      setThemeState('coastal');
      document.documentElement.setAttribute('data-theme', 'coastal');
      return;
    }

    // Authenticated: load the user-specific theme from localStorage
    const userId = session?.user?.id;
    if (!userId) return;
    const stored = localStorage.getItem(themeKey(userId)) as Theme | null;
    const resolved: Theme = stored === 'coastal' || stored === 'y2k' ? stored : 'coastal';
    setThemeState(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [status, session?.user?.id]);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    const userId = session?.user?.id;
    if (userId) {
      localStorage.setItem(themeKey(userId), next);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
