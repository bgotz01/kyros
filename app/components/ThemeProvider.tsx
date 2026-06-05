'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
    theme: Theme;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    toggle: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Always start with 'dark' on the server so SSR and client initial render match.
    // A useEffect then syncs to the actual stored value on the client without a flash,
    // because the inline <script> in layout.tsx already set the correct class on <html>.
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const stored = localStorage.getItem('panteon-theme');
        if (stored === 'light') setTheme('light');
    }, []);

    const toggle = () => {
        setTheme((current) => {
            const next = current === 'dark' ? 'light' : 'dark';
            const root = document.documentElement;
            if (next === 'light') {
                root.classList.add('light');
            } else {
                root.classList.remove('light');
            }
            localStorage.setItem('panteon-theme', next);
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}
