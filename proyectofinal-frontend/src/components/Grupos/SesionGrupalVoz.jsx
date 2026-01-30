import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FaMicrophone, FaStop, FaSpinner, FaCheck, FaTimes, FaUsers, FaPlay,
  FaClock, FaChartBar, FaCloudUploadAlt, FaSync,
  FaSmile, FaSadTear, FaAngry, FaMeh, FaSurprise, FaHeartbeat
} from 'react-icons/fa';
import { MdPsychology } from 'react-icons/md';
import sesionesGrupalesService from '../../services/sesionesGrupalesService';
import audioService from '../../services/audioService';
import authService from '../../services/authService';
import '../../global.css';

// Colores de emociones
const EMOTION_COLORS = {
  felicidad: '#4ade80',
  tristeza: '#60a5fa',
  enojo: '#f87171',
  miedo: '#a78bfa',
  sorpresa: '#fbbf24',
  neutral: '#94a3b8',
};

const getEmotionColor = (emotion) => {
  return EMOTION_COLORS[emotion?.toLowerCase()] || '#5ad0d2';
};

const getEmotionIcon = (emotion) => {
  switch(emotion?.toLowerCase()) {
    case 'felicidad': return <FaSmile />;
    case 'tristeza': return <FaSadTear />;
    case 'enojo': return <FaAngry />;
    case 'miedo': return <MdPsychology />;
    case 'sorpresa': return <FaSurprise />;
    default: return <FaMeh />;
  }
};

const SesionGrupalVoz = ({ 
  grupo, 
  sesionActiva, 
  onClose, 
  onSesionUpdated,
  puedeIniciar = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado de sesión
  const [sesion, setSesion] = useState(sesionActiva || null);
  const [participantes, setParticipantes] = useState([]);
  const [miParticipacion, setMiParticipacion] = useState(null);
  const [resultadoIndividual, setResultadoIndividual] = useState(null);
  const [resultadoGrupal, setResultadoGrupal] = useState(null);
  
  // Estado de grabación
  const [grabando, setGrabando] = useState(false);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);
  
  // Nueva sesión
  const [showNuevaSesion, setShowNuevaSesion] = useState(false);
  const [nuevaSesion, setNuevaSesion] = useState({ titulo: '', descripcion: '', duracion_horas: 24 });
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const autoRefreshRef = useRef(null);

  // Usuario actual
  const currentUser = authService.getUser();
  
  // Cargar datos de sesión
  const cargarSesion = useCallback(async () => {
    if (!sesionActiva?.id_sesion && !sesion?.id_sesion) return;
    
    const sesionId = sesionActiva?.id_sesion || sesion?.id_sesion;
    
    try {
      const [detalleRes, participantesRes, miPartRes] = await Promise.all([
        sesionesGrupalesService.obtenerDetalle(sesionId),
        sesionesGrupalesService.listarParticipantes(sesionId),
        sesionesGrupalesService.obtenerMiParticipacion(sesionId).catch(() => null)
      ]);
      
      const sesionData = detalleRes?.sesion || detalleRes?.data || detalleRes;
      setSesion(sesionData);
      setParticipantes(Array.isArray(participantesRes) ? participantesRes : participantesRes?.data || []);
      
      if (miPartRes?.participacion) {
        setMiParticipacion(miPartRes.participacion);
      }
      // El resultado viene separado de la participación
      if (miPartRes?.resultado) {
        setResultadoIndividual(miPartRes.resultado);
      }
      
      // Si la sesión está completada, cargar resultado grupal
      if (sesionData?.estado === 'completada') {
        try {
          const data = await sesionesGrupalesService.obtenerResultadosGrupales(sesionId);
          if (data?.success && data?.resultado) {
            setResultadoGrupal(data.resultado);
          }
        } catch (e) {
          console.log('No se pudo cargar resultado grupal:', e);
        }
      }
      
    } catch (e) {
      console.error('Error cargando sesión:', e);
    }
  }, [sesionActiva, sesion?.id_sesion]);
  
  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  // Auto-refresh cada 10 segundos si la sesión está en progreso
  useEffect(() => {
    if (sesion?.estado === 'en_progreso' && !grabando && !subiendo) {
      autoRefreshRef.current = setInterval(() => {
        cargarSesion();
      }, 10000);
    }
    
    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [sesion?.estado, grabando, subiendo, cargarSesion]);
  
  // Iniciar grabación
  const iniciarGrabacion = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorder.start(250);
      setGrabando(true);
      setTiempoGrabacion(0);
      
      timerRef.current = setInterval(() => {
        setTiempoGrabacion(prev => prev + 1);
      }, 1000);
      
    } catch (e) {
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
      console.error('Error accessing microphone:', e);
    }
  };
  
  // Detener grabación
  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabando) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setGrabando(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Cancelar grabación
  const cancelarGrabacion = () => {
    if (mediaRecorderRef.current && grabando) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setGrabando(false);
    setAudioBlob(null);
    setTiempoGrabacion(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
  
  // Subir audio y participar
  const subirAudioYParticipar = async () => {
    if (!audioBlob || !sesion?.id_sesion) return;
    
    setSubiendo(true);
    setError('');
    setProgresoSubida(0);
    
    try {
      const userId = currentUser?.id_usuario || currentUser?.id;
      
      setProgresoSubida(30);
      
      const resultadoAudio = await audioService.analyzeAudio(audioBlob, tiempoGrabacion, userId);
      
      setProgresoSubida(80);
      
      const participacionData = {
        id_audio: resultadoAudio.audio?.id_audio || resultadoAudio.id_audio,
        id_analisis: resultadoAudio.analisis?.id_analisis || resultadoAudio.id_analisis,
        id_resultado: resultadoAudio.resultado?.id_resultado || resultadoAudio.id_resultado
      };
      
      await sesionesGrupalesService.registrarParticipacion(sesion.id_sesion, participacionData);
      
      setProgresoSubida(100);
      setSuccess('¡Participación registrada exitosamente!');
      setAudioBlob(null);
      setTiempoGrabacion(0);
      
      if (resultadoAudio?.resultado) {
        setResultadoIndividual(resultadoAudio.resultado);
      }
      
      await cargarSesion();
      if (onSesionUpdated) onSesionUpdated();
      
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Error al subir el audio');
    } finally {
      setSubiendo(false);
    }
  };
  
  // Crear nueva sesión
  const crearSesion = async (e) => {
    e.preventDefault();
    if (!nuevaSesion.titulo.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await sesionesGrupalesService.iniciarSesion(grupo.id_grupo, nuevaSesion);
      
      if (res.success) {
        setSuccess('Sesión creada exitosamente');
        setSesion(res.sesion);
        setShowNuevaSesion(false);
        setNuevaSesion({ titulo: '', descripcion: '', duracion_horas: 24 });
        if (onSesionUpdated) onSesionUpdated();
      } else {
        setError(res.error || 'Error al crear la sesión');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear la sesión');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const yaParticipo = miParticipacion?.estado === 'completado';
  const sesionCompletada = sesion?.estado === 'completada' || sesion?.estado === 'cancelada';
  const porcentajeProgreso = sesion?.total_participantes > 0 
    ? Math.round((sesion?.participantes_completados || 0) / sesion.total_participantes * 100) 
    : 0;
  
  const EmotionBar = ({ emotion, value, color }) => (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
          {emotion}
        </span>
        <span style={{ fontSize: '0.85rem', color: color, fontWeight: '600' }}>
          {Math.round(value || 0)}%
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--color-shadow)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${value || 0}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--color-panel)',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid var(--color-shadow)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaMicrophone style={{ color: 'var(--color-primary)' }} /> Sesión de Análisis de Voz Grupal
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {sesion && !sesionCompletada && (
            <button 
              onClick={cargarSesion}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center' }}
              title="Actualizar"
            >
              <FaSync size={16} />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
              <FaTimes size={20} />
            </button>
          )}
        </div>
      </div>
      
      {/* Mensajes */}
      {error && (
        <div style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaTimes /> {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCheck /> {success}
        </div>
      )}
      
      {/* Sin sesión activa */}
      {!sesion && !showNuevaSesion && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }}>🎤</div>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>No hay sesión de voz activa en este grupo.</p>
          {puedeIniciar && (
            <button onClick={() => setShowNuevaSesion(true)} className="auth-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaPlay /> Iniciar Sesión de Voz
            </button>
          )}
        </div>
      )}
      
      {/* Formulario nueva sesión */}
      {showNuevaSesion && (
        <form onSubmit={crearSesion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Título de la sesión *</label>
            <input type="text" placeholder="Ej: Reflexión del día..." value={nuevaSesion.titulo} onChange={e => setNuevaSesion({ ...nuevaSesion, titulo: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-shadow)', background: 'var(--color-panel-solid)', color: 'var(--color-text-main)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Descripción (opcional)</label>
            <textarea placeholder="Instrucciones..." value={nuevaSesion.descripcion} onChange={e => setNuevaSesion({ ...nuevaSesion, descripcion: e.target.value })} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-shadow)', background: 'var(--color-panel-solid)', color: 'var(--color-text-main)', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Duración límite (horas)</label>
            <select value={nuevaSesion.duracion_horas} onChange={e => setNuevaSesion({ ...nuevaSesion, duracion_horas: parseInt(e.target.value) })} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-shadow)', background: 'var(--color-panel-solid)', color: 'var(--color-text-main)' }}>
              <option value={1}>1 hora</option>
              <option value={6}>6 horas</option>
              <option value={12}>12 horas</option>
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="auth-button" disabled={loading}>{loading ? <><FaSpinner className="spin" /> Creando...</> : 'Crear Sesión'}</button>
            <button type="button" onClick={() => setShowNuevaSesion(false)} className="auth-button" style={{ background: 'var(--color-panel-solid)', color: 'var(--color-text-main)' }}>Cancelar</button>
          </div>
        </form>
      )}
      
      {/* Sesión activa */}
      {sesion && !showNuevaSesion && (
        <div>
          {/* Progreso del grupo */}
          <div style={{ background: 'var(--color-panel-solid)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--color-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-main)' }}>{sesion.titulo}</h4>
                {sesion.descripcion && <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{sesion.descripcion}</p>}
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  <FaUsers style={{ marginRight: '0.25rem' }} />{sesion.participantes_completados || 0} de {sesion.total_participantes || 0} han completado
                </p>
              </div>
              <div style={{ padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: sesionCompletada ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 191, 36, 0.2)', color: sesionCompletada ? '#4ade80' : '#fbbf24' }}>
                {sesionCompletada ? 'Completada' : 'En Progreso'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: 8, background: 'var(--color-shadow)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${porcentajeProgreso}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), #2196f3)', borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ color: 'var(--color-text-main)', fontWeight: '600', fontSize: '0.9rem', minWidth: '40px' }}>{porcentajeProgreso}%</span>
            </div>
          </div>
          
          {/* Área de grabación */}
          {!yaParticipo && !sesionCompletada && (
            <div style={{ background: 'var(--color-panel-solid)', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid var(--color-shadow)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <FaMicrophone style={{ color: 'var(--color-primary)' }} /> Tu Participación
              </h4>
              
              {!audioBlob ? (
                <>
                  {!grabando ? (
                    <div>
                      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Graba un audio expresando cómo te sientes hoy</p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Habla durante al menos 10 segundos para un mejor análisis</p>
                      <div onClick={iniciarGrabacion} style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, #2196f3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer', boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)', transition: 'all 0.3s ease' }}>
                        <FaMicrophone size={36} style={{ color: 'white' }} />
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>Toca para comenzar a grabar</p>
                    </div>
                  ) : (
                    <div>
                      <div onClick={tiempoGrabacion >= 5 ? detenerGrabacion : undefined} style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5722 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', cursor: tiempoGrabacion >= 5 ? 'pointer' : 'not-allowed', boxShadow: '0 0 0 8px rgba(255, 107, 107, 0.2), 0 8px 20px rgba(255, 107, 107, 0.3)', animation: 'pulse 1.5s infinite' }}>
                        <FaStop size={36} style={{ color: 'white' }} />
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ff6b6b', marginBottom: '0.5rem' }}>{formatTime(tiempoGrabacion)}</div>
                      <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 1rem' }}>{tiempoGrabacion < 5 ? `Espera ${5 - tiempoGrabacion} segundos...` : 'Toca el botón para detener'}</p>
                      <button onClick={cancelarGrabacion} style={{ background: 'transparent', border: '1px solid var(--color-shadow)', color: 'var(--color-text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <FaCheck size={50} style={{ color: '#4caf50', marginBottom: '1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>¡Audio grabado!</h4>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Duración: {formatTime(tiempoGrabacion)}</p>
                  </div>
                  {subiendo && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ height: 8, background: 'var(--color-shadow)', borderRadius: 4, overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{ width: `${progresoSubida}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>{progresoSubida < 70 ? 'Subiendo audio...' : progresoSubida < 90 ? 'Analizando emociones...' : 'Finalizando...'}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={subirAudioYParticipar} disabled={subiendo} className="auth-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {subiendo ? <><FaSpinner className="spin" /> Procesando...</> : <><FaCloudUploadAlt /> Enviar y Participar</>}
                    </button>
                    <button onClick={() => { setAudioBlob(null); setTiempoGrabacion(0); }} disabled={subiendo} className="auth-button" style={{ background: 'var(--color-panel)', color: 'var(--color-text-main)' }}>Grabar de nuevo</button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Mi resultado individual */}
          {yaParticipo && resultadoIndividual && (
            <div style={{ background: 'linear-gradient(135deg, rgba(90, 208, 210, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaChartBar style={{ color: 'var(--color-primary)' }} /> Tu Resultado
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4ade80', fontSize: '0.85rem' }}>
                  <FaCheck size={12} /> Completado
                </div>
              </div>
              
              {(resultadoIndividual.emocion_dominante || resultadoIndividual.emocion_predominante) && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-panel-solid)', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Emoción Predominante</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px', background: `${getEmotionColor(resultadoIndividual.emocion_dominante || resultadoIndividual.emocion_predominante)}20`, color: getEmotionColor(resultadoIndividual.emocion_dominante || resultadoIndividual.emocion_predominante), fontWeight: '600', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                    {getEmotionIcon(resultadoIndividual.emocion_dominante || resultadoIndividual.emocion_predominante)}
                    {resultadoIndividual.emocion_dominante || resultadoIndividual.emocion_predominante}
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                {/* Barras de emociones basadas en los campos nivel_* */}
                {resultadoIndividual.nivel_felicidad != null && <EmotionBar emotion="felicidad" value={resultadoIndividual.nivel_felicidad} color={getEmotionColor('felicidad')} />}
                {resultadoIndividual.nivel_tristeza != null && <EmotionBar emotion="tristeza" value={resultadoIndividual.nivel_tristeza} color={getEmotionColor('tristeza')} />}
                {resultadoIndividual.nivel_enojo != null && <EmotionBar emotion="enojo" value={resultadoIndividual.nivel_enojo} color={getEmotionColor('enojo')} />}
                {resultadoIndividual.nivel_miedo != null && <EmotionBar emotion="miedo" value={resultadoIndividual.nivel_miedo} color={getEmotionColor('miedo')} />}
                {resultadoIndividual.nivel_sorpresa != null && <EmotionBar emotion="sorpresa" value={resultadoIndividual.nivel_sorpresa} color={getEmotionColor('sorpresa')} />}
                {resultadoIndividual.nivel_neutral != null && <EmotionBar emotion="neutral" value={resultadoIndividual.nivel_neutral} color={getEmotionColor('neutral')} />}
                {/* Fallback: si hay objeto emociones, usarlo */}
                {resultadoIndividual.emociones && Object.entries(resultadoIndividual.emociones).map(([emotion, value]) => (
                  <EmotionBar key={emotion} emotion={emotion} value={value} color={getEmotionColor(emotion)} />
                ))}
              </div>
              
              {(resultadoIndividual.nivel_estres !== undefined || resultadoIndividual.nivel_ansiedad !== undefined) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--color-panel-solid)', borderRadius: '8px', marginBottom: '1rem' }}>
                  {resultadoIndividual.nivel_estres !== undefined && (
                    <div style={{ textAlign: 'center' }}>
                      <FaHeartbeat style={{ color: '#fb923c', fontSize: '1.5rem', marginBottom: '0.25rem' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Estrés</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#fb923c' }}>{Math.round(resultadoIndividual.nivel_estres)}%</p>
                    </div>
                  )}
                  {resultadoIndividual.nivel_ansiedad !== undefined && (
                    <div style={{ textAlign: 'center' }}>
                      <MdPsychology style={{ color: '#f472b6', fontSize: '1.5rem', marginBottom: '0.25rem' }} />
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Ansiedad</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#f472b6' }}>{Math.round(resultadoIndividual.nivel_ansiedad)}%</p>
                    </div>
                  )}
                </div>
              )}
              
              {!sesionCompletada && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', color: '#fbbf24', fontSize: '0.9rem' }}>
                  <FaClock /> Esperando a que los demás miembros completen para ver el resultado grupal...
                </div>
              )}
            </div>
          )}
          
          {/* Ya participó pero sin resultado */}
          {yaParticipo && !resultadoIndividual && (
            <div style={{ background: 'rgba(76, 175, 80, 0.1)', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem' }}>
              <FaCheck size={40} style={{ color: '#4caf50', marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#4caf50' }}>¡Ya participaste en esta sesión!</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Tu análisis ha sido registrado. Espera a que finalice la sesión para ver los resultados.</p>
            </div>
          )}
          
          {/* Sesión completada sin participar */}
          {sesionCompletada && !yaParticipo && (
            <div style={{ background: 'rgba(158, 158, 158, 0.1)', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem' }}>
              <FaClock size={40} style={{ color: '#9e9e9e', marginBottom: '1rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)' }}>Esta sesión ha finalizado</h4>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No pudiste participar a tiempo. Espera la próxima sesión.</p>
            </div>
          )}
          
          {/* Resultado Grupal */}
          {sesionCompletada && resultadoGrupal && (
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(90, 208, 210, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <FaUsers style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }} />
                <h4 style={{ margin: 0, color: '#fff' }}>Resultado Grupal</h4>
              </div>
              
              {resultadoGrupal.nivel_bienestar_grupal !== undefined && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Nivel de Bienestar Grupal</p>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(90, 208, 210, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '3px solid var(--color-primary)' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{Math.round(resultadoGrupal.nivel_bienestar_grupal)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>/100</span>
                  </div>
                </div>
              )}
              
              {resultadoGrupal.emocion_predominante && (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Emoción Predominante del Grupo</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem', borderRadius: '20px', background: `${getEmotionColor(resultadoGrupal.emocion_predominante)}30`, color: getEmotionColor(resultadoGrupal.emocion_predominante), fontWeight: '600', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                    {getEmotionIcon(resultadoGrupal.emocion_predominante)}
                    {resultadoGrupal.emocion_predominante}
                  </div>
                </div>
              )}
              
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>Promedios del Grupo</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Felicidad', value: resultadoGrupal.promedio_felicidad, color: '#4ade80' },
                    { label: 'Tristeza', value: resultadoGrupal.promedio_tristeza, color: '#60a5fa' },
                    { label: 'Enojo', value: resultadoGrupal.promedio_enojo, color: '#f87171' },
                    { label: 'Miedo', value: resultadoGrupal.promedio_miedo, color: '#a78bfa' },
                    { label: 'Estrés', value: resultadoGrupal.promedio_estres, color: '#fb923c' },
                    { label: 'Ansiedad', value: resultadoGrupal.promedio_ansiedad, color: '#f472b6' },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, margin: '0 auto 0.25rem' }} />
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: item.color }}>{Math.round(item.value || 0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {resultadoGrupal.recomendacion_grupal && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>💡</span>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: 1.5 }}>{resultadoGrupal.recomendacion_grupal}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Lista de participantes */}
          {participantes.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUsers style={{ color: 'var(--color-text-secondary)' }} /> Participantes ({participantes.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {participantes.map(p => {
                  const esYo = p.id_usuario === (currentUser?.id_usuario || currentUser?.id);
                  const completado = p.estado === 'completado';
                  return (
                    <div key={p.id_participacion || p.id_usuario} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: esYo ? 'rgba(90, 208, 210, 0.1)' : 'var(--color-panel-solid)', borderRadius: '10px', border: esYo ? '1px solid var(--color-primary)' : '1px solid var(--color-shadow)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: completado ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'var(--color-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: completado ? 'white' : 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>
                          {p.nombre?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ margin: 0, color: 'var(--color-text-main)', fontWeight: esYo ? '600' : '400', fontSize: '0.95rem' }}>
                            {p.nombre} {p.apellido} {esYo && <span style={{ color: 'var(--color-primary)' }}>(Tú)</span>}
                          </p>
                          <p style={{ margin: 0, color: completado ? '#4ade80' : 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                            {completado ? '✓ Completado' : p.estado || 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      {completado ? <FaCheck style={{ color: '#4ade80' }} /> : <FaClock style={{ color: 'var(--color-text-secondary)' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255, 107, 107, 0.2); }
          50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(255, 107, 107, 0.1); }
          100% { transform: scale(1); box-shadow: 0 0 0 8px rgba(255, 107, 107, 0.2); }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SesionGrupalVoz;
