"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggle: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      const initial = stored || "dark";
      setTheme(initial);
      applyTheme(initial);
    } catch (e) {
      console.error("Failed to load theme from localStorage:", e);
      applyTheme("dark");
    }
    setIsLoaded(true);
  }, []);

  const applyTheme = (t: Theme) => {
    const htmlElement = document.documentElement;
    if (t === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  };

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      console.error("Failed to save theme to localStorage:", e);
    }
  };

  const toggle = async () => {
    const next = theme === "dark" ? "light" : "dark";
    handleSetTheme(next);

    // Persist to backend if authenticated
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
        const tokenType = localStorage.getItem("token_type") ?? "bearer";
        await fetch(`${apiBase}/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${tokenType} ${token}`,
          },
          body: JSON.stringify({ dark_mode: next === "dark" }),
        });
      }
    } catch (e) {
      console.error("Failed to persist theme to backend:", e);
    }
  };

  // Prevent flashing of wrong theme
  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
