import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    try {
      localStorage.removeItem('pgo-theme-mode');
    } catch {
      // ignore
    }

    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('light-mode');
    root.classList.add('dark-mode', 'dark');
    if (body) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode', 'dark');
    }
    root.style.colorScheme = 'dark';
  }, []);

  const toggleTheme = () => {
    // Light/Dark mode toggling currently disabled per user request
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
