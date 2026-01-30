// src/utils/sanitize.js
// Utilidades de sanitización para prevenir XSS y otros ataques
// Usadas antes de renderizar datos del usuario/servidor

import DOMPurify from 'dompurify';

/**
 * Entidades HTML para escape básico
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escapa caracteres HTML peligrosos
 * Útil para texto que se insertará en HTML
 * 
 * @param {string} str - Cadena a escapar
 * @returns {string} Cadena escapada
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char]);
};

/**
 * Sanitiza HTML usando DOMPurify
 * Solo usar si realmente necesitas renderizar HTML
 * 
 * @param {string} dirty - HTML potencialmente peligroso
 * @param {Object} options - Opciones de DOMPurify
 * @returns {string} HTML sanitizado
 */
export const sanitizeHtml = (dirty, options = {}) => {
  if (typeof dirty !== 'string') return '';
  
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['class', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ...options
  };
  
  return DOMPurify.sanitize(dirty, defaultOptions);
};

/**
 * Sanitiza texto plano - remueve todo HTML
 * Usar para mostrar texto de usuario
 * 
 * @param {string} str - Cadena con posible HTML
 * @returns {string} Texto plano sin HTML
 */
export const sanitizeText = (str) => {
  if (typeof str !== 'string') return '';
  
  // Remover todas las tags HTML
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
};

/**
 * Sanitiza una URL
 * Previene javascript:, data:, vbscript: y otros protocolos peligrosos
 * 
 * @param {string} url - URL a sanitizar
 * @param {string[]} allowedProtocols - Protocolos permitidos
 * @returns {string} URL sanitizada o cadena vacía si es peligrosa
 */
export const sanitizeUrl = (url, allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']) => {
  if (typeof url !== 'string') return '';
  
  try {
    const trimmed = url.trim();
    
    // Bloquear protocolos peligrosos
    const dangerous = /^(javascript|data|vbscript|file):/i;
    if (dangerous.test(trimmed)) {
      console.warn('Protocolo URL peligroso bloqueado:', trimmed.split(':')[0]);
      return '';
    }
    
    // Validar que sea una URL válida o relativa
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed;
    }
    
    const parsed = new URL(trimmed, window.location.origin);
    
    if (!allowedProtocols.includes(parsed.protocol)) {
      console.warn('URL bloqueada con protocolo no permitido:', parsed.protocol);
      return '';
    }
    
    return parsed.href;
  } catch {
    // Si no es una URL válida, podría ser una ruta relativa
    if (url.match(/^[a-zA-Z0-9/._-]+$/)) {
      return url;
    }
    return '';
  }
};

/**
 * Sanitiza un objeto recursivamente
 * Útil para sanitizar respuestas de API antes de usarlas
 * 
 * @param {Object} obj - Objeto a sanitizar
 * @param {Object} options - Opciones
 * @param {string[]} options.htmlFields - Campos que pueden contener HTML permitido
 * @param {string[]} options.urlFields - Campos que son URLs
 * @param {number} options.maxDepth - Profundidad máxima de recursión
 * @returns {Object} Objeto sanitizado
 */
export const sanitizeObject = (obj, options = {}) => {
  const { 
    htmlFields = [], 
    urlFields = ['url', 'href', 'src', 'foto_perfil', 'avatar'],
    maxDepth = 10 
  } = options;
  
  const sanitizeRecursive = (value, depth = 0) => {
    if (depth > maxDepth) return value;
    
    if (value === null || value === undefined) return value;
    
    if (typeof value === 'string') {
      return sanitizeText(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => sanitizeRecursive(item, depth + 1));
    }
    
    if (typeof value === 'object') {
      const result = {};
      
      for (const [key, val] of Object.entries(value)) {
        if (htmlFields.includes(key)) {
          result[key] = sanitizeHtml(val);
        } else if (urlFields.includes(key)) {
          result[key] = sanitizeUrl(val);
        } else {
          result[key] = sanitizeRecursive(val, depth + 1);
        }
      }
      
      return result;
    }
    
    return value;
  };
  
  return sanitizeRecursive(obj);
};

/**
 * Sanitiza inputs de formulario
 * Remueve espacios extra y caracteres de control
 * 
 * @param {string} input - Input del usuario
 * @param {Object} options
 * @param {boolean} options.trim - Remover espacios al inicio/final
 * @param {boolean} options.lowercase - Convertir a minúsculas
 * @param {number} options.maxLength - Longitud máxima
 * @returns {string} Input sanitizado
 */
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return '';
  
  const { trim = true, lowercase = false, maxLength = 1000 } = options;
  
  let result = input
    // Remover caracteres de control (excepto espacios y newlines)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ');
  
  if (trim) result = result.trim();
  if (lowercase) result = result.toLowerCase();
  if (maxLength && result.length > maxLength) result = result.slice(0, maxLength);
  
  return result;
};

/**
 * Valida y sanitiza un email
 * @param {string} email
 * @returns {{ valid: boolean, sanitized: string }}
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return { valid: false, sanitized: '' };
  
  const sanitized = sanitizeInput(email, { trim: true, lowercase: true });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return {
    valid: emailRegex.test(sanitized),
    sanitized
  };
};

/**
 * Sanitiza un nombre (solo letras, espacios y caracteres acentuados)
 * @param {string} name
 * @returns {string}
 */
export const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  
  return sanitizeInput(name)
    // Solo permitir letras, espacios y acentos
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '');
};

/**
 * Crea un sanitizador con configuración predefinida
 * Útil para crear sanitizadores específicos por contexto
 * 
 * @param {Object} defaultOptions - Opciones por defecto
 * @returns {Object} Objeto con métodos de sanitización configurados
 */
export const createSanitizer = (defaultOptions = {}) => ({
  text: (str) => sanitizeText(str),
  html: (str) => sanitizeHtml(str, defaultOptions.html),
  url: (str) => sanitizeUrl(str, defaultOptions.allowedProtocols),
  input: (str) => sanitizeInput(str, defaultOptions.input),
  object: (obj) => sanitizeObject(obj, defaultOptions.object),
  email: sanitizeEmail,
  name: sanitizeName
});

// Exportar sanitizador por defecto
export default {
  escapeHtml,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeObject,
  sanitizeInput,
  sanitizeEmail,
  sanitizeName,
  createSanitizer
};
