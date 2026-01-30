import { useContext } from "react";
import { ThemeContext } from "./themeContextDef";

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de ThemeProvider");
  }
  return context;
}
