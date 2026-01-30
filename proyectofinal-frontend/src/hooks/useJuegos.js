import { useState, useEffect } from 'react';
import { juegosAPI } from '../services/apiClient';

export const useJuegos = () => {
  const [juegos, setJuegos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarJuegos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await juegosAPI.listar();
      if (data.success) {
        setJuegos(data.juegos);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error al cargar juegos:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerRecomendados = async (estado) => {
    setLoading(true);
    setError(null);
    try {
      const data = await juegosAPI.recomendados(estado);
      if (data.success) {
        return data.juegos_recomendados;
      }
    } catch (err) {
      setError(err.message);
      console.error('Error al obtener recomendados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarJuegos();
  }, []);

  return {
    juegos,
    loading,
    error,
    cargarJuegos,
    obtenerRecomendados,
  };
};
