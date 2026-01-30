import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGoogle } from 'react-icons/fa';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import secureLogger from '../../utils/secureLogger';
import { GOOGLE_CLIENT_ID } from '../../config/api';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    scope: 'openid email profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read',
    onSuccess: async (tokenResponse) => {
      try {
        secureLogger.debug('[GOOGLE LOGIN] Iniciando autenticación');
        
        // Obtener información básica del usuario
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const userInfo = await userInfoResponse.json();
        // NO loguear datos personales del usuario

        // Obtener información extendida (fecha de nacimiento y género) usando People API
        const peopleResponse = await fetch(
          'https://people.googleapis.com/v1/people/me?personFields=birthdays,genders',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const peopleData = await peopleResponse.json();
        // NO loguear datos personales sensibles (birthdays, genders)

        // Extraer fecha de nacimiento y género de People API
        let fechaNacimiento = null;
        let genero = null;

        // Procesar fecha de nacimiento
        if (peopleData.birthdays && peopleData.birthdays.length > 0) {
          // Buscar el cumpleaños que tenga año completo (fuente ACCOUNT)
          const birthday = peopleData.birthdays.find(b => b.date?.year) || peopleData.birthdays[0];
          if (birthday.date) {
            const { year, month, day } = birthday.date;
            if (year && month && day) {
              // Formato: YYYY-MM-DD
              fechaNacimiento = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              secureLogger.debug('[GOOGLE LOGIN] Fecha de nacimiento procesada');
            } else {
              secureLogger.debug('[GOOGLE LOGIN] Fecha incompleta, ignorada');
            }
          }
        }

        // Procesar género
        if (peopleData.genders && peopleData.genders.length > 0) {
          const gender = peopleData.genders.find(g => g.metadata?.primary) || peopleData.genders[0];
          if (gender.value) {
            // Google devuelve: male, female, other, unknown
            const genderMap = {
              'male': 'M',
              'female': 'F',
              'other': 'O',
              'unknown': null
            };
            genero = genderMap[gender.value.toLowerCase()] || null;
            secureLogger.debug('[GOOGLE LOGIN] Género procesado');
          }
        }

        // Preparar datos para enviar al backend
        const googleData = {
          google_uid: userInfo.sub,
          correo: userInfo.email,
          nombre: userInfo.given_name || userInfo.name || '',
          apellido: userInfo.family_name || '',
          foto_perfil: userInfo.picture || '',
          fecha_nacimiento: fechaNacimiento,
          genero: genero
        };

        secureLogger.debug('[GOOGLE LOGIN] Enviando datos al backend');

        // Enviar al backend
        const data = await authService.googleAuth(googleData);

        // Extraer roles del backend
        const userRoles = data.user.roles || ['usuario'];
        const role = userRoles[0].toLowerCase();

        // Verificar si el usuario necesita completar su perfil
        if (!data.user.edad || !data.user.genero) {
          secureLogger.debug('[GOOGLE LOGIN] Perfil incompleto, redirigiendo');
          // Redirigir a completar perfil si falta información básica
          navigate('/actualizar-perfil', { 
            state: { 
              message: 'Por favor completa tu perfil para continuar',
              fromGoogle: true 
            } 
          });
          return;
        }

        // Redirigir según el rol si el perfil está completo
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch {
        secureLogger.error('[GOOGLE LOGIN] Error en autenticación');
        alert('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
      }
    },
    onError: () => {
      secureLogger.error('[GOOGLE LOGIN] Error de conexión con Google');
      alert('Error al conectar con Google. Por favor intenta de nuevo.');
    },
  });

  // Si no hay client_id configurado, no renderizar el botón
  if (!GOOGLE_CLIENT_ID) {
    secureLogger.debug('[GOOGLE LOGIN] Client ID no configurado, botón oculto');
    return null;
  }

  return (
    <button
      type="button"
      className="google-button"
      onClick={() => handleGoogleLogin()}
    >
      <FaGoogle className="google-icon" />
      Continuar con Google
    </button>
  );
};

export default GoogleLoginButton;
