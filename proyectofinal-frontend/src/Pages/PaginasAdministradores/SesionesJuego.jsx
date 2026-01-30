import React, { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import { FaGamepad, FaChartBar, FaDownload, FaEye, FaTimes, FaCalendarAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";
import PageCard from "../../components/Shared/PageCard";
import Spinner from "../../components/Publico/Spinner";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";

const SesionesJuego = () => {
  const [sesiones, setSesiones] = useState([]);
  const [filteredSesiones, setFilteredSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState({ juego: "todos", mejoraPercibida: "todas", completado: "todos", periodo: "todos" });
  const [stats, setStats] = useState({});
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [juegosStats, setJuegosStats] = useState([]);

  useEffect(() => {
    cargarSesiones();
  }, []);

  const cargarSesiones = async () => {
    try {
      const [sesionesRes, statsRes] = await Promise.all([
        apiClient.get(api.endpoints.sesionesJuego.todas),
        apiClient.get(api.endpoints.sesionesJuego.estadisticas),
      ]);
      setSesiones(sesionesRes.data?.data || []);
      setFilteredSesiones(sesionesRes.data?.data || []);
      const statsData = statsRes.data?.data || {};
      setStats(statsData);
      
      // Calcular estadísticas por juego
      const sesionesData = sesionesRes.data?.data || [];
      const juegosMap = {};
      sesionesData.forEach(s => {
        const key = s.nombre_juego || 'Desconocido';
        if (!juegosMap[key]) {
          juegosMap[key] = { 
            nombre: key, 
            total: 0, 
            completadas: 0, 
            mejoras: { alta: 0, media: 0, baja: 0, ninguna: 0 },
            duracionTotal: 0,
            puntuacionTotal: 0,
            puntuacionCount: 0
          };
        }
        juegosMap[key].total++;
        if (s.completado) juegosMap[key].completadas++;
        if (s.mejora_percibida) juegosMap[key].mejoras[s.mejora_percibida]++;
        if (s.duracion_minutos) juegosMap[key].duracionTotal += s.duracion_minutos;
        if (s.puntuacion_final) {
          juegosMap[key].puntuacionTotal += s.puntuacion_final;
          juegosMap[key].puntuacionCount++;
        }
      });
      setJuegosStats(Object.values(juegosMap).map(j => ({
        ...j,
        tasaCompletado: j.total > 0 ? ((j.completadas / j.total) * 100).toFixed(1) : 0,
        duracionPromedio: j.total > 0 ? (j.duracionTotal / j.total).toFixed(1) : 0,
        puntuacionPromedio: j.puntuacionCount > 0 ? (j.puntuacionTotal / j.puntuacionCount).toFixed(1) : 'N/A',
        efectividad: j.total > 0 ? (((j.mejoras.alta * 3 + j.mejoras.media * 2 + j.mejoras.baja) / (j.total * 3)) * 100).toFixed(1) : 0
      })));
    } catch (error) {
      console.error("Error al cargar sesiones de juego:", error);
      setMsg("Error al cargar sesiones de juego");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...sesiones];

    if (filter.juego !== "todos") {
      filtered = filtered.filter(s => s.id_juego == filter.juego);
    }

    if (filter.mejoraPercibida !== "todas") {
      filtered = filtered.filter(s => s.mejora_percibida === filter.mejoraPercibida);
    }

    if (filter.completado === "si") {
      filtered = filtered.filter(s => s.completado);
    } else if (filter.completado === "no") {
      filtered = filtered.filter(s => !s.completado);
    }

    if (filter.periodo !== "todos") {
      const now = new Date();
      const days = filter.periodo === "7d" ? 7 : filter.periodo === "30d" ? 30 : filter.periodo === "90d" ? 90 : 0;
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(s => new Date(s.fecha_inicio) >= cutoff);
      }
    }

    setFilteredSesiones(filtered);
  }, [filter, sesiones]);

  const exportSesiones = () => {
    const csv = [
      ["ID", "Usuario", "Juego", "Inicio", "Fin", "Duración (min)", "Estado Antes", "Estado Después", "Mejora", "Completado", "Puntuación"].join(","),
      ...filteredSesiones.map(s =>
        [
          s.id_sesion,
          s.usuario || "N/A",
          s.nombre_juego || "N/A",
          new Date(s.fecha_inicio).toLocaleString(),
          s.fecha_fin ? new Date(s.fecha_fin).toLocaleString() : "En curso",
          s.duracion_minutos || "N/A",
          s.estado_antes || "N/A",
          s.estado_despues || "N/A",
          s.mejora_percibida || "N/A",
          s.completado ? "Sí" : "No",
          s.puntuacion_final || "N/A"
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sesiones_juego_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setMsg("Sesiones exportadas correctamente");
  };

  const verDetalles = (sesion) => {
    setSelectedSesion(sesion);
    setShowModal(true);
  };

  const getMejoraColor = (mejora) => {
    switch (mejora) {
      case 'alta': return '#4caf50';
      case 'media': return '#ff9800';
      case 'baja': return '#ffc107';
      case 'ninguna': return '#ff6b6b';
      default: return '#9e9e9e';
    }
  };

  const calcularEfectividad = (estadoAntes, estadoDespues) => {
    if (!estadoAntes || !estadoDespues) return null;
    
    const niveles = { 'muy_bajo': 1, 'bajo': 2, 'medio': 3, 'alto': 4, 'muy_alto': 5 };
    const antes = niveles[estadoAntes] || 0;
    const despues = niveles[estadoDespues] || 0;
    const cambio = despues - antes;

    if (cambio > 0) return { texto: "Mejoró", color: "#4caf50", cambio: `+${cambio}` };
    if (cambio < 0) return { texto: "Empeoró", color: "#ff6b6b", cambio };
    return { texto: "Sin cambio", color: "#9e9e9e", cambio: "0" };
  };

  return (
    <div className="admin-sesiones-juego-page">
      <div className="admin-page-content">
        {/* Header y Filtros en PageCard */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaGamepad style={{ color: "#9c27b0" }} /> Sesiones de Juego Terapéutico
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>Visualiza y analiza todas las sesiones de juego terapéutico</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', overflowX: 'auto' }}>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label><FaCalendarAlt /> Periodo</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.periodo} onChange={(e) => setFilter({ ...filter, periodo: e.target.value })}>
                  <option value="todos">Todo el tiempo</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Juego</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.juego} onChange={(e) => setFilter({ ...filter, juego: e.target.value })}>
                  <option value="todos">Todos</option>
                  {stats.juegos?.map(j => (
                    <option key={j.id} value={j.id}>{j.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Mejora Percibida</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.mejoraPercibida} onChange={(e) => setFilter({ ...filter, mejoraPercibida: e.target.value })}>
                  <option value="todas">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                  <option value="ninguna">Ninguna</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px' }}>
              <div className="input-labels">
                <label>Completado</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.completado} onChange={(e) => setFilter({ ...filter, completado: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={() => setShowStatsModal(true)} className="admin-btn admin-btn-info" style={{ whiteSpace: 'nowrap' }}>
              <FaChartBar /> <span className="admin-hidden-mobile">Estadísticas</span>
            </button>
            <button onClick={exportSesiones} className="admin-btn admin-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              <FaDownload /> <span className="admin-hidden-mobile">Exportar</span>
            </button>
          </div>
        </PageCard>

        {/* Estadísticas */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🎮</div>
            <div className="admin-stat-value">{stats.total || sesiones.length}</div>
            <div className="admin-stat-label">Total Sesiones</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">✅</div>
            <div className="admin-stat-value">{stats.completadas || sesiones.filter(s => s.completado).length}</div>
            <div className="admin-stat-label">Completadas</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📈</div>
            <div className="admin-stat-value">
              {sesiones.length > 0 ? ((sesiones.filter(s => s.completado).length / sesiones.length) * 100).toFixed(1) : 0}%
            </div>
            <div className="admin-stat-label">Tasa Completado</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">⏱️</div>
            <div className="admin-stat-value">{stats.duracion_promedio || 0} min</div>
            <div className="admin-stat-label">Duración Promedio</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">⭐</div>
            <div className="admin-stat-value">{stats.puntuacion_promedio || 0}</div>
            <div className="admin-stat-label">Puntuación Media</div>
          </div>
          <div className="admin-stat-card" style={{ borderLeft: "4px solid #4caf50" }}>
            <div className="admin-stat-icon">📊</div>
            <div className="admin-stat-value">
              {sesiones.length > 0 ? ((sesiones.filter(s => s.mejora_percibida === 'alta' || s.mejora_percibida === 'media').length / sesiones.length) * 100).toFixed(1) : 0}%
            </div>
            <div className="admin-stat-label">Tasa de Mejora</div>
          </div>
        </div>

        <p className="admin-text-muted admin-mb-2">
          Mostrando {filteredSesiones.length} de {sesiones.length} sesiones
        </p>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-loading-spinner"></div>
            <p>Cargando sesiones...</p>
          </div>
        ) : filteredSesiones.length === 0 ? (
          <div className="admin-empty-state">
            <FaGamepad />
            <h3>Sin sesiones</h3>
            <p>No hay sesiones que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="admin-cards-grid" style={{ gridTemplateColumns: "1fr" }}>
            {filteredSesiones.map((sesion) => {
              const efectividad = calcularEfectividad(sesion.estado_antes, sesion.estado_despues);
              return (
                <div
                  key={sesion.id_sesion}
                  className="admin-card"
                  style={{ borderLeft: `4px solid ${getMejoraColor(sesion.mejora_percibida)}` }}
                >
                  <div className="admin-card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "250px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1.5rem" }}>🎮</span>
                          <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{sesion.nombre_juego}</span>
                          {sesion.completado && (
                            <span className="admin-badge admin-badge-success">✅ Completado</span>
                          )}
                        </div>

                        <div style={{ fontSize: "0.9rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }} className="admin-text-muted">
                          <div><strong>Usuario:</strong> {sesion.usuario}</div>
                          <div><strong>Inicio:</strong> {new Date(sesion.fecha_inicio).toLocaleString()}</div>
                          {sesion.duracion_minutos && <div><strong>Duración:</strong> {sesion.duracion_minutos} min</div>}
                          {sesion.puntuacion_final && <div><strong>Puntuación:</strong> ⭐ {sesion.puntuacion_final}</div>}
                        </div>

                        {/* Análisis de estado */}
                        {efectividad && (
                          <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "var(--color-card-secondary, rgba(0,0,0,0.03))", borderRadius: "8px" }}>
                            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                              <div>
                                <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>Estado Antes</div>
                                <div style={{ fontWeight: "bold", textTransform: "capitalize" }}>{sesion.estado_antes?.replace('_', ' ')}</div>
                              </div>
                              <div style={{ fontSize: "1.5rem" }}>→</div>
                              <div>
                                <div className="admin-text-muted" style={{ fontSize: "0.85rem" }}>Estado Después</div>
                                <div style={{ fontWeight: "bold", textTransform: "capitalize" }}>{sesion.estado_despues?.replace('_', ' ')}</div>
                              </div>
                              <div style={{ marginLeft: "auto" }}>
                                <span className={`admin-badge ${efectividad.color === '#4caf50' ? 'admin-badge-success' : efectividad.color === '#ff6b6b' ? 'admin-badge-danger' : 'admin-badge-neutral'}`}>
                                  {efectividad.texto} ({efectividad.cambio})
                                </span>
                              </div>
                            </div>

                            {sesion.mejora_percibida && (
                              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <strong>Mejora Percibida:</strong>
                                <span className={`admin-badge ${sesion.mejora_percibida === 'alta' ? 'admin-badge-success' : sesion.mejora_percibida === 'media' ? 'admin-badge-warning' : sesion.mejora_percibida === 'baja' ? 'admin-badge-info' : 'admin-badge-danger'}`}>
                                  {sesion.mejora_percibida}
                                </span>
                              </div>
                            )}

                            {sesion.observaciones && (
                              <div style={{ marginTop: "0.75rem" }}>
                                <strong>Observaciones:</strong> {sesion.observaciones}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <button className="admin-btn admin-btn-secondary admin-btn-icon" onClick={() => verDetalles(sesion)}>
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de detalles */}
        {showModal && selectedSesion && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Detalles de Sesión</h3>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-form-group"><label className="admin-form-label">ID Sesión:</label><p>{selectedSesion.id_sesion}</p></div>
                <div className="admin-form-group"><label className="admin-form-label">Usuario:</label><p>{selectedSesion.usuario}</p></div>
                <div className="admin-form-group"><label className="admin-form-label">Juego:</label><p>{selectedSesion.nombre_juego}</p></div>
                <div className="admin-form-group"><label className="admin-form-label">Descripción:</label><p>{selectedSesion.descripcion_juego}</p></div>
                <div className="admin-form-row">
                  <div className="admin-form-group"><label className="admin-form-label">Inicio:</label><p>{new Date(selectedSesion.fecha_inicio).toLocaleString()}</p></div>
                  {selectedSesion.fecha_fin && <div className="admin-form-group"><label className="admin-form-label">Fin:</label><p>{new Date(selectedSesion.fecha_fin).toLocaleString()}</p></div>}
                </div>
                {selectedSesion.duracion_minutos && <div className="admin-form-group"><label className="admin-form-label">Duración:</label><p>{selectedSesion.duracion_minutos} minutos</p></div>}
                <div className="admin-form-row">
                  <div className="admin-form-group"><label className="admin-form-label">Estado Antes:</label><p>{selectedSesion.estado_antes?.replace('_', ' ')}</p></div>
                  <div className="admin-form-group"><label className="admin-form-label">Estado Después:</label><p>{selectedSesion.estado_despues?.replace('_', ' ')}</p></div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Mejora Percibida:</label>
                    <span className={`admin-badge ${selectedSesion.mejora_percibida === 'alta' ? 'admin-badge-success' : selectedSesion.mejora_percibida === 'media' ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                      {selectedSesion.mejora_percibida}
                    </span>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Completado:</label>
                    <p>{selectedSesion.completado ? "Sí ✅" : "No ❌"}</p>
                  </div>
                </div>
                {selectedSesion.puntuacion_final && <div className="admin-form-group"><label className="admin-form-label">Puntuación Final:</label><p>⭐ {selectedSesion.puntuacion_final}</p></div>}
                {selectedSesion.observaciones && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Observaciones:</label>
                    <p style={{ padding: "0.75rem", backgroundColor: "var(--color-card-secondary, rgba(0,0,0,0.03))", borderRadius: "8px" }}>
                      {selectedSesion.observaciones}
                    </p>
                  </div>
                )}
              </div>

              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Estadísticas por Juego */}
        {showStatsModal && (
          <div className="admin-modal-overlay" onClick={() => setShowStatsModal(false)}>
            <div className="admin-modal" style={{ maxWidth: "900px" }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title"><FaChartBar /> Estadísticas por Juego</h3>
                <button className="admin-modal-close" onClick={() => setShowStatsModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="admin-modal-body">
                {juegosStats.length > 0 ? (
                  <div className="admin-stats-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Juego</th>
                          <th>Sesiones</th>
                          <th>Completadas</th>
                          <th>Tasa</th>
                          <th>Duración Prom.</th>
                          <th>Puntuación</th>
                          <th>Efectividad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {juegosStats.sort((a, b) => b.total - a.total).map((juego, index) => (
                          <tr key={index}>
                            <td><strong>{juego.nombre}</strong></td>
                            <td>{juego.total}</td>
                            <td>{juego.completadas}</td>
                            <td>
                              <span className={`admin-badge ${parseFloat(juego.tasaCompletado) >= 70 ? 'admin-badge-success' : parseFloat(juego.tasaCompletado) >= 50 ? 'admin-badge-warning' : 'admin-badge-danger'}`}>
                                {juego.tasaCompletado}%
                              </span>
                            </td>
                            <td>{juego.duracionPromedio} min</td>
                            <td>{juego.puntuacionPromedio !== 'N/A' ? `⭐ ${juego.puntuacionPromedio}` : 'N/A'}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div className="admin-mini-progress" style={{ width: "60px", height: "8px", background: "var(--color-border)", borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ 
                                    width: `${juego.efectividad}%`, 
                                    height: "100%", 
                                    background: parseFloat(juego.efectividad) >= 60 ? "#4caf50" : parseFloat(juego.efectividad) >= 40 ? "#ff9800" : "#ff6b6b",
                                    borderRadius: "4px"
                                  }} />
                                </div>
                                <span style={{ fontSize: "0.85rem" }}>{juego.efectividad}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <FaChartBar />
                    <p>No hay datos suficientes para mostrar estadísticas</p>
                  </div>
                )}

                {/* Resumen de mejoras */}
                <div style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ marginBottom: "1rem" }}>Distribución de Mejoras Percibidas</h4>
                  <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <div className="admin-stat-card admin-stat-card-sm" style={{ borderLeft: "4px solid #4caf50" }}>
                      <div className="admin-stat-icon"><FaArrowUp style={{ color: "#4caf50" }} /></div>
                      <div className="admin-stat-value">{sesiones.filter(s => s.mejora_percibida === 'alta').length}</div>
                      <div className="admin-stat-label">Mejora Alta</div>
                    </div>
                    <div className="admin-stat-card admin-stat-card-sm" style={{ borderLeft: "4px solid #ff9800" }}>
                      <div className="admin-stat-icon"><FaArrowUp style={{ color: "#ff9800" }} /></div>
                      <div className="admin-stat-value">{sesiones.filter(s => s.mejora_percibida === 'media').length}</div>
                      <div className="admin-stat-label">Mejora Media</div>
                    </div>
                    <div className="admin-stat-card admin-stat-card-sm" style={{ borderLeft: "4px solid #ffc107" }}>
                      <div className="admin-stat-icon"><FaArrowDown style={{ color: "#ffc107" }} /></div>
                      <div className="admin-stat-value">{sesiones.filter(s => s.mejora_percibida === 'baja').length}</div>
                      <div className="admin-stat-label">Mejora Baja</div>
                    </div>
                    <div className="admin-stat-card admin-stat-card-sm" style={{ borderLeft: "4px solid #ff6b6b" }}>
                      <div className="admin-stat-icon"><FaTimes style={{ color: "#ff6b6b" }} /></div>
                      <div className="admin-stat-value">{sesiones.filter(s => s.mejora_percibida === 'ninguna').length}</div>
                      <div className="admin-stat-label">Sin Mejora</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowStatsModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SesionesJuego;
