import React, { useEffect, useState } from "react";
import { getTheme, setTheme } from "../utils/theme";
import { ThemeContext } from "./themeContextDef";

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Inicializar tema al montar desde localStorage
  useEffect(() => {
    const stored = getTheme();
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      // Sin valor almacenado: usar preferencia del sistema
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    }
    setIsReady(true);

    // Escuchar cambios en storage (ej: desde otra pestaña)
    const handleStorageChange = () => {
      const updated = getTheme();
      if (updated) {
        setIsDark(updated === "dark");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Persistir tema cuando isDark cambia
  useEffect(() => {
    if (isReady) {
      setTheme(isDark ? "dark" : "light");
    }
  }, [isDark, isReady]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isReady }}>
      {children}
    </ThemeContext.Provider>
  );
}
