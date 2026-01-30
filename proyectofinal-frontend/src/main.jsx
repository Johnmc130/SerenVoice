import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./global.css";

// Inicializar tema antes de renderizar: usa localStorage o la preferencia del sistema
(function initTheme() {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    // Guardar en localStorage si no existe
    if (!stored) {
      localStorage.setItem("theme", theme);
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  } catch {
    // ignore
  }
})();

// Inicializador de 'reveal' al hacer scroll: observa bloques comunes y añade
// la clase `.reveal-visible` cuando entran en el viewport.
function setupRevealOnScroll() {
  if (typeof window === "undefined") return;

  const selector = [
    ".card",
    ".auth-card",
    ".feature-card",
    ".wide-card",
    ".auth-form .form-group",
    "section",
    ".auth-header",
    ".google-button",
    ".auth-button",
  ].join(", ");

  const els = Array.from(document.querySelectorAll(selector));
  if (!els.length) return;

  // Añadir la clase base `.reveal` y un ligero desfase (stagger) según la posición
  els.forEach((el, idx) => {
    if (!el.classList.contains("reveal")) el.classList.add("reveal");
    // sólo establecer delay si no está ya especificado en el DOM
    if (!el.dataset.revealdelay) {
      el.dataset.revealdelay = String((idx % 5) + 1); // 1..5
    }
    el.style.transitionDelay = `${
      (parseInt(el.dataset.revealdelay, 10) - 1) * 80
    }ms`;
  });

  // Crear el IntersectionObserver que activa la clase visible y deja de observar
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          // una vez visible, dejar de observar para mejorar rendimiento
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    observer.observe(el);
  });
}

// Ejecutar una vez después de la carga inicial (pequeño retardo para asegurar DOM listo)
window.addEventListener("load", () => setTimeout(setupRevealOnScroll, 120));

// También reinicializar el observador después de navegaciones SPA: envolvemos
// los métodos de historial y disparamos un evento `navigation` para re-ejecutar
// la búsqueda/observación de elementos en la nueva vista.
(function monitorNavigation() {
  const wrap = (type) => {
    const orig = history[type];
    return function () {
      const res = orig.apply(this, arguments);
      window.dispatchEvent(new Event("navigation"));
      return res;
    };
  };
  history.pushState = wrap("pushState");
  history.replaceState = wrap("replaceState");
  window.addEventListener("popstate", () =>
    window.dispatchEvent(new Event("navigation"))
  );
  window.addEventListener("navigation", () =>
    setTimeout(setupRevealOnScroll, 100)
  );
})();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
