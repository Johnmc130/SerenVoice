// Utilidad para centralizar la gestión del tema (oscuro/claro).
const THEME_KEY = "theme";

function applyClass(theme) {
  if (typeof document === "undefined") return;
  if (theme === "dark") document.documentElement.classList.add("dark-mode");
  else document.documentElement.classList.remove("dark-mode");
}

export function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    applyClass(theme);
    return theme;
  } catch {
    return null;
  }
}

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
  applyClass(theme);
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export default {
  initTheme,
  getTheme,
  setTheme,
  toggleTheme,
};
