'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'coastal' | 'y2k';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'coastal',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('coastal');

  useEffect(() => {
    // Sync from the data-theme attribute that the FOUC-prevention script set
    const stored = document.documentElement.getAttribute('data-theme') as Theme | null;
    if (stored === 'coastal' || stored === 'y2k') {
      setThemeState(stored);
    }
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
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
