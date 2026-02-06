import api from '../config/api';

// URL base para archivos estáticos (uploads, etc.) - NO usa /api prefix
// En producción con Nginx proxy, usar rutas relativas
const RAW_API_URL = import.meta.env.VITE_API_URL || "";
const STATIC_BASE = RAW_API_URL ? RAW_API_URL.replace(/\/+$/, "") : "";

// Extensiones de imagen válidas
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

export function makeFotoUrl(path) {
  if (!path) return null;
  const trimmed = String(path).trim();
  try {
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('http://') || lower.startsWith('https://')) return trimmed;
    if (lower.startsWith('//')) return `https:${trimmed}`;
  } catch {
    return null;
  }
  // Para archivos en /uploads, usar STATIC_BASE (sin /api prefix)
  if (trimmed.startsWith('/uploads')) {
    return `${STATIC_BASE}${trimmed}`;
  }
  // Si es solo un nombre de archivo de imagen (sin ruta), asumir /uploads/usuarios/
  const lower = trimmed.toLowerCase();
  const isImageFile = IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
  if (isImageFile && !trimmed.includes('/')) {
    return `${STATIC_BASE}/uploads/usuarios/${trimmed}`;
  }
  return `${api.baseURL}${trimmed}`;
}

export function makeFotoUrlWithProxy(path) {
  if (!path) return null;
  const trimmed = String(path).trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes('googleusercontent.com') || lower.includes('lh3.googleusercontent.com')) {
    return `${api.baseURL}${api.endpoints.auth.proxyImage}?url=${encodeURIComponent(trimmed)}`;
  }
  return makeFotoUrl(trimmed);
}
