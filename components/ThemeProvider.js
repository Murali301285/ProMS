'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { setCookie, getCookie } from 'cookies-next';

const ThemeContext = createContext({
    theme: 'light',
    toggleTheme: () => { },
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load saved theme or default to system preference
        const savedTheme = getCookie('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        setCookie('theme', theme, { maxAge: 60 * 60 * 24 * 365 }); // 1 Year
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    if (!mounted) return <div style={{ visibility: 'hidden' }}>{children}</div>; // Prevent flash

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
