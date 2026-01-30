import React from 'react';
import { FaPlay, FaEye } from 'react-icons/fa';

const TherapeuticGames = ({
  estadoInicial = 'estable',
  juegosRecomendados = [],
  onStart = () => {},
  onView = () => {},
  loading = false,
}) => {
  return (
    <div className="therapeutic-games">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Juegos recomendados — estado: {estadoInicial}</h3>
      </div>

      {juegosRecomendados.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>No hay juegos recomendados por ahora.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {juegosRecomendados.map((j) => (
            <div key={j.id || j.id_juego} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0' }}>{j.nombre || j.titulo || j.nombre_juego}</h4>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{j.descripcion || j.descripcion_corta || ''}</p>
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="auth-button" onClick={() => onStart(j)} disabled={loading}>
                  <FaPlay style={{ marginRight: 8 }} /> {loading ? 'Iniciando...' : 'Iniciar'}
                </button>
                <button className="auth-button" onClick={() => onView(j)} style={{ background: 'transparent', border: '1px solid var(--color-panel)', color: 'var(--color-text-main)' }}>
                  <FaEye style={{ marginRight: 8 }} /> Ver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TherapeuticGames;
