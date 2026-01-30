// src/utils/secureLogger.js
// Registrador seguro que sanitiza datos sensibles antes de mostrarlos
// Previene exposición accidental de tokens, contraseñas, emails, etc.

const isDev = Boolean(import.meta.env && import.meta.env.DEV);
const isProduction = import.meta.env.PROD || false;

// Patrones de datos sensibles a sanitizar
const SENSITIVE_PATTERNS = {
  // Tokens JWT
  jwt: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
  // Tokens Bearer
  bearer: /Bearer\s+[A-Za-z0-9_-]+/gi,
  // Emails (parcialmente ocultos)
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Contraseñas en objetos
  password: /"(password|contrasena|contraseña|pass|pwd|secret)":\s*"[^"]*"/gi,
  // Tokens en objetos
  tokenField: /"(token|access_token|refresh_token|api_key|apikey)":\s*"[^"]*"/gi,
  // Números de tarjeta (básico)
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // Tokens de Google/OAuth
  oauthToken: /ya29\.[A-Za-z0-9_-]+/g,
  // IDs de sesión largos
  sessionId: /session_id["']?\s*[:=]\s*["']?[a-zA-Z0-9-]{20,}/gi,
};

// Campos sensibles que no deben registrarse
const SENSITIVE_FIELDS = new Set([
  'password', 'contrasena', 'contraseña', 'pass', 'pwd',
  'token', 'access_token', 'refresh_token', 'accessToken', 'refreshToken',
  'secret', 'api_key', 'apikey', 'apiKey',
  'authorization', 'auth',
  'credit_card', 'creditCard', 'cvv', 'cvc',
  'ssn', 'social_security',
  'fecha_nacimiento', 'birthdate', 'birthday'
]);

/**
 * Sanitiza un valor individual
 */
const sanitizeValue = (value) => {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'string') {
    let sanitized = value;
    
    // Aplicar todos los patrones de sanitización
    Object.entries(SENSITIVE_PATTERNS).forEach(([name, pattern]) => {
      if (name === 'email') {
        // Ocultar parcialmente emails
        sanitized = sanitized.replace(pattern, (match) => {
          const [local, domain] = match.split('@');
          if (local.length <= 2) return '***@' + domain;
          return local.charAt(0) + '***' + local.charAt(local.length - 1) + '@' + domain;
        });
      } else {
        sanitized = sanitized.replace(pattern, `[${name.toUpperCase()}_REDACTED]`);
      }
    });
    
    return sanitized;
  }
  
  return value;
};

/**
 * Sanitiza un objeto recursivamente
 */
const sanitizeObject = (obj, depth = 0) => {
  // Prevenir recursión infinita
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  
  if (obj === null || obj === undefined) return obj;
  
  // Manejar errores
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeValue(obj.message),
      stack: isProduction ? '[STACK_HIDDEN_IN_PROD]' : sanitizeValue(obj.stack)
    };
  }
  
  // Manejar arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  // Manejar objetos
  if (typeof obj === 'object') {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Ocultar campos sensibles completamente
      if (SENSITIVE_FIELDS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      
      // Sanitizar recursivamente
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, depth + 1);
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeValue(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  // Strings y primitivos
  if (typeof obj === 'string') {
    return sanitizeValue(obj);
  }
  
  return obj;
};

/**
 * Procesa argumentos de log
 */
const processArgs = (args) => {
  return args.map(arg => {
    if (typeof arg === 'object') {
      return sanitizeObject(arg);
    }
    if (typeof arg === 'string') {
      return sanitizeValue(arg);
    }
    return arg;
  });
};

/**
 * Formatea el mensaje con timestamp
 */
const formatMessage = (level, args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[SerenVoice] ${timestamp} ${level.toUpperCase()}:`;
  return [prefix, ...processArgs(args)];
};

/**
 * Logger seguro - sanitiza automáticamente datos sensibles
 */
const secureLogger = {
  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (...args) => {
    if (isDev) {
      console.log(...formatMessage('debug', args));
    }
  },

  /**
   * Log de información
   */
  info: (...args) => {
    console.info(...formatMessage('info', args));
  },

  /**
   * Log de advertencia
   */
  warn: (...args) => {
    console.warn(...formatMessage('warn', args));
  },

  /**
   * Log de error
   */
  error: (...args) => {
    console.error(...formatMessage('error', args));
  },

  /**
   * Log condicional (solo si la condición es true)
   */
  logIf: (condition, level, ...args) => {
    if (condition && secureLogger[level]) {
      secureLogger[level](...args);
    }
  },

  /**
   * Crea un logger con prefijo
   */
  withPrefix: (prefix) => ({
    debug: (...args) => secureLogger.debug(`[${prefix}]`, ...args),
    info: (...args) => secureLogger.info(`[${prefix}]`, ...args),
    warn: (...args) => secureLogger.warn(`[${prefix}]`, ...args),
    error: (...args) => secureLogger.error(`[${prefix}]`, ...args),
  }),

  /**
   * Sanitiza un objeto sin loguearlo (útil para preparar datos)
   */
  sanitize: sanitizeObject,

  /**
   * Verifica si estamos en desarrollo
   */
  isDev: () => isDev,

  /**
   * Verifica si estamos en producción
   */
  isProduction: () => isProduction
};

export default secureLogger;

// Exportar utilidades individuales para uso directo
export { sanitizeObject, sanitizeValue, SENSITIVE_FIELDS };
