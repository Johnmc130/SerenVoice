// src/hooks/useSessionTimeout.js
// Hook para manejar tiempo de espera por inactividad de sesión
import { useEffect, useCallback, useRef } from 'react';
import secureStorage from '../utils/secureStorage';
import secureLogger from '../utils/secureLogger';

/**
 * Hook que implementa tiempo de espera por inactividad
 * Cierre de sesión automático después de un período de inactividad del usuario
 * 
 * @param {Object} options
 * @param {number} options.timeoutMinutes - Minutos de inactividad antes de cerrar sesión (por defecto: 30)
 * @param {number} options.warningMinutes - Minutos antes del tiempo de espera para mostrar advertencia (por defecto: 5)
 * @param {Function} options.onTimeout - Callback cuando expira la sesión
 * @param {Function} options.onWarning - Callback cuando se acerca el tiempo de espera
 * @param {boolean} options.enabled - Si el tiempo de espera está activo (por defecto: true)
 */
const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onTimeout,
  onWarning,
  enabled = true
} = {}) => {
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  // Limpiar temporizadores
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  // Manejar tiempo de espera agotado
  const handleTimeout = useCallback(() => {
    secureLogger.info('Sesión expirada por inactividad');
    secureStorage.clearTokens();
    
    // Limpiar datos de sesión en almacenamiento local
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      localStorage.removeItem('userRole');
      localStorage.removeItem('session_id');
    } catch (e) {
      secureLogger.warn('Error limpiando almacenamiento local:', e);
    }

    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);

  // Manejar advertencia
  const handleWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      secureLogger.debug('Advertencia de tiempo de espera de sesión');
      if (onWarning) {
        onWarning(warningMinutes);
      }
    }
  }, [onWarning, warningMinutes]);

  // Reiniciar temporizador de inactividad
  const resetTimer = useCallback(() => {
    if (!enabled || !secureStorage.hasValidToken()) {
      return;
    }

    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    clearTimers();

    // Timer de advertencia
    if (onWarning && warningMinutes > 0) {
      warningRef.current = setTimeout(handleWarning, warningMs);
    }

    // Timer de timeout
    timeoutRef.current = setTimeout(handleTimeout, timeoutMs);
  }, [enabled, clearTimers, handleWarning, handleTimeout, timeoutMs, warningMs, onWarning, warningMinutes]);

  // Eventos de actividad del usuario
  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Throttle para no resetear en cada pixel de movimiento
    let throttleTimer = null;
    const throttledReset = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        resetTimer();
      }, 1000); // Máximo 1 reset por segundo
    };

    // Agregar listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Listener para cambios de visibilidad (usuario vuelve a la pestaña)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Verificar si ya expiró mientras estaba en otra pestaña
        const inactiveTime = Date.now() - lastActivityRef.current;
        if (inactiveTime >= timeoutMs) {
          handleTimeout();
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Iniciar timer
    resetTimer();

    // Limpieza
    return () => {
      clearTimers();
      if (throttleTimer) clearTimeout(throttleTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, resetTimer, clearTimers, handleTimeout, timeoutMs]);

  // Retornar funciones útiles
  return {
    resetTimer,
    clearTimers,
    getInactiveTime: () => Date.now() - lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeoutMs - elapsed);
    }
  };
};

export default useSessionTimeout;
