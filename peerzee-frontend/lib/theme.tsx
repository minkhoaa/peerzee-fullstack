"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        // Initialize theme from localStorage on first render (client-side only)
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem("theme") as Theme;
            if (savedTheme) return savedTheme;
            if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
        }
        return "light";
    });
    const [mounted, setMounted] = useState(false);

    // Set mounted state after hydration
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            document.documentElement.classList.toggle("dark", theme === "dark");
            localStorage.setItem("theme", theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light");
    };

    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
