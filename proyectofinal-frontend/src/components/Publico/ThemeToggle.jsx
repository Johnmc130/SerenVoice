import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../context/useTheme";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div style={{ position: "fixed", bottom: 70, right: 16, zIndex: 1101 }}>
      <button
        aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        title={isDark ? "Tema: oscuro" : "Tema: claro"}
        onClick={toggleTheme}
        style={{
          background: "var(--color-panel)",
          borderRadius: 999,
          padding: "0.5rem 0.6rem",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 10px var(--color-shadow)",
          border: "none",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isDark ? <FaSun color="#FFD34D" /> : <FaMoon color="#111827" />}
      </button>
    </div>
  );
};

export default ThemeToggle;

