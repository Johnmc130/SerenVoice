
import React, { useState, useEffect, useCallback } from 'react';
import { juegosAPI } from '../../services/apiClient.js';

import { toast } from 'react-hot-toast'; // Instalar: npm install react-hot-toast
import { useNavigate } from 'react-router-dom';
import TherapeuticGames from './TherapeuticGames.jsx';

const GameIntegration = ({ estadoEmocionalUsuario = 'estable' }) => {
  const [juegosRecomendados, setJuegosRecomendados] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarJuegosRecomendados = useCallback(async () => {
    try {
      const data = await juegosAPI.recomendados(estadoEmocionalUsuario);
      if (data.success) {
        setJuegosRecomendados(data.juegos_recomendados);
      }
    } catch (error) {
      console.error('Error al cargar juegos recomendados:', error);
      toast.error('Error al cargar juegos recomendados');
    }
  }, [estadoEmocionalUsuario]);

  useEffect(() => {
    cargarJuegosRecomendados();
  }, [cargarJuegosRecomendados]);

  const handleIniciarJuego = async (juegoId) => {
    setLoading(true);
    try {
      const data = await juegosAPI.iniciar(juegoId, estadoEmocionalUsuario);
      
      if (data.success) {
        toast.success('¡Juego iniciado! Diviértete 🎮');
        return data.sesion_id;
      }
    } catch (error) {
      console.error('Error al iniciar juego:', error);
      toast.error('Error al iniciar el juego');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // `handleFinalizarJuego` removed — not used by this component. Finalization is managed elsewhere.

  const navigate = useNavigate();

  const handleStartAndNavigate = async (juego) => {
    const sesionId = await handleIniciarJuego(juego.id || juego.id_juego || juego.id);
    if (sesionId) {
      navigate(`/juegos/${juego.id || juego.id_juego || juego.id}`, { state: { juego, estadoAntes: estadoEmocionalUsuario } });
    }
  };

  const handleView = (juego) => {
    navigate(`/juegos/${juego.id || juego.id_juego || juego.id}`, { state: { juego, estadoAntes: estadoEmocionalUsuario } });
  };

  return (
    <div className="game-integration-container">
      <TherapeuticGames
        estadoInicial={estadoEmocionalUsuario}
        juegosRecomendados={juegosRecomendados}
        onStart={handleStartAndNavigate}
        onView={handleView}
        loading={loading}
      />
    </div>
  );
};

export default GameIntegration;

