const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class JuegosService {
  // Obtener todos los juegos terapéuticos
  async obtenerJuegos() {
    try {
      const response = await fetch(`${API_URL}/api/juegos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener juegos');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo juegos:', error);
      throw error;
    }
  }

  // Obtener un juego específico por ID
  async obtenerJuegoPorId(juegoId) {
    try {
      const response = await fetch(`${API_URL}/api/juegos/${juegoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener el juego');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo juego:', error);
      throw error;
    }
  }

  // Crear una nueva sesión de juego
  async crearSesionJuego(usuarioId, juegoId) {
    try {
      const response = await fetch(`${API_URL}/api/juegos/sesiones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: usuarioId,
          juego_id: juegoId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear sesión de juego');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando sesión de juego:', error);
      throw error;
    }
  }

  // Actualizar progreso de sesión de juego
  async actualizarSesionJuego(sesionId, datos) {
    try {
      const response = await fetch(`${API_URL}/api/juegos/sesiones/${sesionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar sesión de juego');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando sesión de juego:', error);
      throw error;
    }
  }

  // Obtener sesiones de juego de un usuario
  async obtenerSesionesUsuario(usuarioId) {
    try {
      const response = await fetch(`${API_URL}/api/juegos/sesiones/usuario/${usuarioId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener sesiones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      throw error;
    }
  }

  // Obtener juegos recomendados para un usuario
  async obtenerJuegosRecomendados(usuarioId) {
    try {
      const response = await fetch(`${API_URL}/api/recomendaciones/usuario/${usuarioId}/juegos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener juegos recomendados');
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo juegos recomendados:', error);
      throw error;
    }
  }
}

export default new JuegosService();
