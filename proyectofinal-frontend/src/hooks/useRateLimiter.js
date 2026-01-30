// src/hooks/useRateLimiter.js
// Hook para implementar limitación de tasa en el cliente
// Previene spam en formularios y protege contra abusos

import { useState, useCallback, useRef, useEffect } from 'react';
import secureLogger from '../utils/secureLogger';

/**
 * Hook para limitación de tasa en formularios y acciones
 * 
 * @param {Object} options
 * @param {number} options.maxAttempts - Máximo de intentos permitidos (por defecto: 5)
 * @param {number} options.windowMs - Ventana de tiempo en ms (por defecto: 60000 = 1 min)
 * @param {number} options.lockoutMs - Tiempo de bloqueo en ms (por defecto: 300000 = 5 min)
 * @param {string} options.storageKey - Clave para persistir en sessionStorage
 * @returns {Object} Estado y funciones del limitador de tasa
 */
const useRateLimiter = ({
  maxAttempts = 5,
  windowMs = 60000,
  lockoutMs = 300000,
  storageKey = null
} = {}) => {
  const [attempts, setAttempts] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState(null);
  const lockoutTimerRef = useRef(null);

  // Cargar estado de sessionStorage si está configurado
  useEffect(() => {
    if (storageKey) {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          const now = Date.now();
          
          // Verificar si hay un bloqueo activo
          if (data.lockoutEnd && data.lockoutEnd > now) {
            setIsLocked(true);
            setLockoutEnd(data.lockoutEnd);
            scheduleLockoutEnd(data.lockoutEnd - now);
          }
          
          // Filtrar intentos dentro de la ventana de tiempo
          const validAttempts = (data.attempts || []).filter(t => now - t < windowMs);
          setAttempts(validAttempts);
        }
      } catch (e) {
        secureLogger.warn('Error cargando estado del limitador de tasa:', e);
      }
    }
    
    return () => {
      if (lockoutTimerRef.current) {
        clearTimeout(lockoutTimerRef.current);
      }
    };
  }, [storageKey, windowMs, scheduleLockoutEnd]);

  // Guardar estado en sessionStorage
  const saveState = useCallback((newAttempts, newLockoutEnd) => {
    if (storageKey) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          attempts: newAttempts,
          lockoutEnd: newLockoutEnd
        }));
      } catch (e) {
        secureLogger.warn('Error guardando estado del limitador de tasa:', e);
      }
    }
  }, [storageKey]);

  // Programar fin del bloqueo
  const scheduleLockoutEnd = useCallback((ms) => {
    if (lockoutTimerRef.current) {
      clearTimeout(lockoutTimerRef.current);
    }
    
    lockoutTimerRef.current = setTimeout(() => {
      setIsLocked(false);
      setLockoutEnd(null);
      setAttempts([]);
      saveState([], null);
      secureLogger.debug('Bloqueo del limitador de tasa terminado');
    }, ms);
  }, [saveState]);

  /**
   * Registra un intento y verifica si se debe bloquear
   * @returns {{ allowed: boolean, remaining: number, retryAfter: number | null }}
   */
  const checkLimit = useCallback(() => {
    const now = Date.now();
    
    // Si está bloqueado, retornar info del bloqueo
    if (isLocked && lockoutEnd && lockoutEnd > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((lockoutEnd - now) / 1000),
        message: `Demasiados intentos. Intenta de nuevo en ${Math.ceil((lockoutEnd - now) / 60000)} minutos.`
      };
    }
    
    // Filtrar intentos dentro de la ventana
    const recentAttempts = attempts.filter(t => now - t < windowMs);
    
    // Verificar si excede el límite
    if (recentAttempts.length >= maxAttempts) {
      const newLockoutEnd = now + lockoutMs;
      setIsLocked(true);
      setLockoutEnd(newLockoutEnd);
      scheduleLockoutEnd(lockoutMs);
      saveState(recentAttempts, newLockoutEnd);
      
      secureLogger.warn('Rate limit exceeded, user locked out');
      
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(lockoutMs / 1000),
        message: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(lockoutMs / 60000)} minutos.`
      };
    }
    
    // Registrar nuevo intento
    const newAttempts = [...recentAttempts, now];
    setAttempts(newAttempts);
    saveState(newAttempts, null);
    
    return {
      allowed: true,
      remaining: maxAttempts - newAttempts.length,
      retryAfter: null,
      message: null
    };
  }, [attempts, isLocked, lockoutEnd, maxAttempts, windowMs, lockoutMs, scheduleLockoutEnd, saveState]);

  /**
   * Ejecuta una función solo si no está rate limited
   * @param {Function} fn - Función a ejecutar
   * @returns {Function} Función envuelta con rate limiting
   */
  const withRateLimit = useCallback((fn) => {
    return async (...args) => {
      const result = checkLimit();
      
      if (!result.allowed) {
        return { rateLimited: true, ...result };
      }
      
      return fn(...args);
    };
  }, [checkLimit]);

  /**
   * Resetea el rate limiter (útil después de login exitoso)
   */
  const reset = useCallback(() => {
    if (lockoutTimerRef.current) {
      clearTimeout(lockoutTimerRef.current);
    }
    setAttempts([]);
    setIsLocked(false);
    setLockoutEnd(null);
    saveState([], null);
  }, [saveState]);

  /**
   * Obtiene el tiempo restante de lockout en formato legible
   */
  const getRemainingLockoutTime = useCallback(() => {
    if (!isLocked || !lockoutEnd) return null;
    
    const remaining = lockoutEnd - Date.now();
    if (remaining <= 0) return null;
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.ceil((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [isLocked, lockoutEnd]);

  return {
    // Estado
    isLocked,
    lockoutEnd,
    attemptsCount: attempts.length,
    remainingAttempts: Math.max(0, maxAttempts - attempts.length),
    
    // Funciones
    checkLimit,
    withRateLimit,
    reset,
    getRemainingLockoutTime
  };
};

export default useRateLimiter;

/**
 * Rate limiter para formularios específicos
 * Configuraciones predefinidas
 */
export const rateLimitConfigs = {
  login: {
    maxAttempts: 5,
    windowMs: 60000,      // 1 minuto
    lockoutMs: 300000,    // 5 minutos
    storageKey: 'rl_login'
  },
  register: {
    maxAttempts: 3,
    windowMs: 60000,      // 1 minuto
    lockoutMs: 600000,    // 10 minutos
    storageKey: 'rl_register'
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 300000,     // 5 minutos
    lockoutMs: 900000,    // 15 minutos
    storageKey: 'rl_pwdreset'
  },
  contact: {
    maxAttempts: 5,
    windowMs: 300000,     // 5 minutos
    lockoutMs: 600000,    // 10 minutos
    storageKey: 'rl_contact'
  },
  audioAnalysis: {
    maxAttempts: 10,
    windowMs: 60000,      // 1 minuto
    lockoutMs: 120000,    // 2 minutos
    storageKey: 'rl_audio'
  }
};
