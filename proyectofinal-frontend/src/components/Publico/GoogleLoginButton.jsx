import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import secureLogger from '../../utils/secureLogger';
import { GOOGLE_CLIENT_ID } from '../../config/api';

/**
 * GoogleLoginButton - Componente de login con Google
 * 
 * ✅ Este componente SOLO se renderiza si hay un GOOGLE_CLIENT_ID válido configurado.
 * Si no hay Client ID, retorna null (no muestra nada).
 */

// ✅ VERIFICACIÓN TEMPRANA: Si no hay Client ID válido, exportar componente vacío
const isGoogleConfigured = GOOGLE_CLIENT_ID && 
                           GOOGLE_CLIENT_ID.trim() !== '' && 
                           !GOOGLE_CLIENT_ID.includes('your-google-client-id');

// Componente que no usa hooks de Google
const DisabledGoogleButton = () => {
  return null;
};

// Componente real con Google Login
const EnabledGoogleButton = () => {
  // Importación del hook solo si está configurado
  const { useGoogleLogin } = require('@react-oauth/google');
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    scope: 'openid email profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read',
    onSuccess: async (tokenResponse) => {
      try {
        secureLogger.debug('[GOOGLE LOGIN] Iniciando autenticación');
        
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        const peopleResponse = await fetch(
          'https://people.googleapis.com/v1/people/me?personFields=birthdays,genders',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const peopleData = await peopleResponse.json();

        let fechaNacimiento = null;
        let genero = null;

        if (peopleData.birthdays && peopleData.birthdays.length > 0) {
          const birthday = peopleData.birthdays.find(b => b.date?.year) || peopleData.birthdays[0];
          if (birthday.date) {
            const { year, month, day } = birthday.date;
            if (year && month && day) {
              fechaNacimiento = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        }

        if (peopleData.genders && peopleData.genders.length > 0) {
          const gender = peopleData.genders.find(g => g.metadata?.primary) || peopleData.genders[0];
          if (gender.value) {
            const genderMap = { 'male': 'M', 'female': 'F', 'other': 'O', 'unknown': null };
            genero = genderMap[gender.value.toLowerCase()] || null;
          }
        }

        const googleData = {
          google_uid: userInfo.sub,
          correo: userInfo.email,
          nombre: userInfo.given_name || userInfo.name || '',
          apellido: userInfo.family_name || '',
          foto_perfil: userInfo.picture || '',
          fecha_nacimiento: fechaNacimiento,
          genero: genero
        };

        const data = await authService.googleAuth(googleData);
        const userRoles = data.user.roles || ['usuario'];
        const role = userRoles[0].toLowerCase();

        if (!data.user.edad || !data.user.genero) {
          navigate('/actualizar-perfil', { 
            state: { message: 'Por favor completa tu perfil para continuar', fromGoogle: true } 
          });
          return;
        }

        if (role === 'administrador' || role === 'admin') {
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

// ✅ Exportar el componente correcto según la configuración
const GoogleLoginButton = isGoogleConfigured ? EnabledGoogleButton : DisabledGoogleButton;

export default GoogleLoginButton;
