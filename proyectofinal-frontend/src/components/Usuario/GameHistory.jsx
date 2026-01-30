import React, { useState, useEffect } from 'react';
import { juegosAPI } from '../../services/apiClient';
import { FaRegCalendarAlt, FaTrophy, FaClock } from 'react-icons/fa';

const GameHistory = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const data = await juegosAPI.historial(10);
      if (data.success) {
        setHistorial(data.historial);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearDuracion = (segundos) => {
    if (!segundos) return 'N/A';
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}m ${segs}s`;
  };

  const getMejoraEmoji = (mejora) => {
    const emojis = {
      mucho_mejor: '😄',
      mejor: '🙂',
      igual: '😐',
      peor: '😟',
      mucho_peor: '😢',
    };
    return emojis[mejora] || '❓';
  };

  if (loading) {
    return <div className="text-center py-8">Cargando historial...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">📜 Historial de Juegos</h2>
      
      {historial.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No has jugado ningún juego aún. ¡Comienza ahora!
        </p>
      ) : (
        <div className="space-y-4">
          {historial.map((sesion) => (
            <div
              key={sesion.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{sesion.juego_nombre?.includes('Respiración') ? '🫁' : 
                                                sesion.juego_nombre?.includes('Puzzle') ? '🧩' :
                                                sesion.juego_nombre?.includes('Memoria') ? '🃏' :
                                                sesion.juego_nombre?.includes('Atención') ? '🧘' : '🎨'}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{sesion.juego_nombre}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(sesion.fecha_inicio).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatearDuracion(sesion.duracion_segundos)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="text-yellow-500" size={20} />
                    <span className="font-bold text-lg">{sesion.puntuacion}</span>
                  </div>
                  {sesion.completado && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      ✓ Completado
                    </span>
                  )}
                </div>
              </div>
              
              {sesion.mejora_percibida && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Cómo te sentiste:</span>
                    <span className="text-2xl">{getMejoraEmoji(sesion.mejora_percibida)}</span>
                    <span className="text-sm font-medium">
                      {sesion.mejora_percibida.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;