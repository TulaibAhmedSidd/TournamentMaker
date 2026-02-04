'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    indigo: {
        name: 'Indigo Pulse',
        primary: '#4f46e5',
        secondary: '#818cf8',
        accent: '#f59e0b',
        background: '#f9fafb',
        surface: '#ffffff',
        text: '#111827',
        textMuted: '#6b7280',
        border: '#e5e7eb',
    },
    dark: {
        name: 'Midnight',
        primary: '#3b82f6',
        secondary: '#60a5fa',
        accent: '#10b981',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#334155',
    },
    forest: {
        name: 'Emerald Forest',
        primary: '#059669',
        secondary: '#34d399',
        accent: '#f59e0b',
        background: '#f0fdf4',
        surface: '#ffffff',
        text: '#064e3b',
        textMuted: '#374151',
        border: '#d1fae5',
    },
    sunset: {
        name: 'Sunset Glow',
        primary: '#e11d48',
        secondary: '#fb7185',
        accent: '#fcd34d',
        background: '#fff1f2',
        surface: '#ffffff',
        text: '#4c0519',
        textMuted: '#9f1239',
        border: '#ffe4e6',
    }
};

export function ThemeProvider({ children }) {
    const [currentTheme, setCurrentTheme] = useState('indigo');

    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme && themes[savedTheme]) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const theme = themes[currentTheme];
        const root = document.documentElement;

        Object.entries(theme).forEach(([key, value]) => {
            if (key !== 'name') {
                root.style.setProperty(`--brand-${key}`, value);
            }
        });

        localStorage.setItem('app-theme', currentTheme);
    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
