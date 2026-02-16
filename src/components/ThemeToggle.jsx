// src/components/ThemeToggle.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full bg-gray-200 dark:bg-gray-700 transition-all duration-300 hover:scale-110"
            aria-label="Toggle theme"
        >
            <div className="relative w-6 h-6">
                {theme === 'light' ? (
                    <Moon className="h-6 w-6 text-gray-800 transition-transform duration-300 rotate-0" />
                ) : (
                    <Sun className="h-6 w-6 text-yellow-400 transition-transform duration-300 rotate-180" />
                )}
            </div>
        </button>
    );
};
