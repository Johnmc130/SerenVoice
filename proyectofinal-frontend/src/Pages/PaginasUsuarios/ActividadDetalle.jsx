import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendar, FaUsers, FaClock, FaCheck, FaPlay, 
  FaGamepad, FaHeart, FaLungs, FaComment, FaTasks, FaEllipsisH,
  FaLightbulb, FaSmile, FaMeh, FaFrown, FaStar, FaMusic,
  FaMicrophone, FaStop, FaSpinner, FaChartBar, FaSync
} from 'react-icons/fa';
import { MdPsychology } from 'react-icons/md';
import { GiMeditation } from 'react-icons/gi';
import groupsService from '../../services/groupsService';
import audioService from '../../services/audioService';
import authService from '../../services/authService';
import PageCard from '../../components/Shared/PageCard';
import Spinner from '../../components/Publico/Spinner';
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

// Componentes específicos para cada tipo de actividad
// eslint-disable-next-line no-unused-vars
const JuegoGrupalActivity = ({ actividad, onComplete, participacion }) => {
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Preguntas de ejemplo para el juego de bienestar emocional
  const questions = [
    { 
      question: "¿Cuál es una técnica efectiva para manejar el estrés?",
      options: ["Respiración profunda", "Contener la respiración", "Respirar rápido", "Ignorar el estrés"],
      correct: 0
    },
    {
      question: "¿Qué emoción representa el color azul comúnmente?",
      options: ["Ira", "Calma", "Miedo", "Alegría"],
      correct: 1
    },
    {
      question: "¿Cuál de estas actividades ayuda a reducir la ansiedad?",
      options: ["Ver noticias constantemente", "Meditación", "Aislarse completamente", "Consumir cafeína"],
      correct: 1
    }
  ];

  const handleAnswer = (optionIndex) => {
    if (optionIndex === questions[currentQuestion].correct) {
      setScore(s => s + 1);
    }
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      setGameEnded(true);
    }
  };

  const handleFinish = () => {
    onComplete({ 
      notas: `Juego completado con puntuación: ${score}/${questions.length}`,
      estado_emocional_despues: score >= 2 ? 'positivo' : 'neutral'
    });
  };

  if (!gameStarted) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FaGamepad size={64} color="var(--color-primary)" />
        <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>Juego de Bienestar Emocional</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Responde preguntas sobre bienestar emocional y aprende técnicas útiles.
        </p>
        <button 
          onClick={() => setGameStarted(true)} 
          className="auth-button"
          style={{ margin: '0 auto' }}
        >
          <FaPlay style={{ marginRight: '0.5rem' }} /> Comenzar Juego
        </button>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FaStar size={64} color="#ffc107" />
        <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>¡Juego Completado!</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.5rem', fontWeight: '600' }}>
          Puntuación: {score}/{questions.length}
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {score === questions.length ? '¡Excelente! Dominas el tema.' : 
           score >= 2 ? '¡Muy bien! Sigue practicando.' : 
           'Sigue aprendiendo, mejorarás pronto.'}
        </p>
        <button onClick={handleFinish} className="auth-button" style={{ margin: '1rem auto 0' }}>
          <FaCheck style={{ marginRight: '0.5rem' }} /> Finalizar Actividad
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '1rem',
        color: 'var(--color-text-secondary)'
      }}>
        <span>Pregunta {currentQuestion + 1} de {questions.length}</span>
        <span>Puntuación: {score}</span>
      </div>
      
      <div style={{
        background: 'var(--color-panel)',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid var(--color-shadow)'
      }}>
        <h4 style={{ color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
          {questions[currentQuestion].question}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {questions[currentQuestion].options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-shadow)',
                background: 'var(--color-panel-solid)',
                color: 'var(--color-text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.target.style.background = 'var(--color-primary)'}
              onMouseOut={e => e.target.style.background = 'var(--color-panel-solid)'}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const EjercicioRespiracionActivity = ({ actividad, onComplete, participacion }) => {
  const [phase, setPhase] = useState('intro'); // intro, inhale, hold, exhale, complete
  const [cycles, setCycles] = useState(0);
  const [timer, setTimer] = useState(0);
  const totalCycles = 4;
  const TIEMPO_INHALAR = 4;
  const TIEMPO_MANTENER = 4;
  const TIEMPO_EXHALAR = 6;

  useEffect(() => {
    if (phase === 'intro') return;
    
    const durations = { inhale: TIEMPO_INHALAR, hold: TIEMPO_MANTENER, exhale: TIEMPO_EXHALAR };
    const nextPhase = { inhale: 'hold', hold: 'exhale', exhale: cycles + 1 >= totalCycles ? 'complete' : 'inhale' };
    
    if (phase === 'complete') return;
    
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          if (phase === 'exhale') setCycles(c => c + 1);
          setPhase(nextPhase[phase]);
          return durations[nextPhase[phase]] || 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, cycles]);

  const startExercise = () => {
    setPhase('inhale');
    setTimer(TIEMPO_INHALAR);
    setCycles(0);
  };

  const handleFinish = () => {
    onComplete({
      notas: `Ejercicio de respiración completado: ${totalCycles} ciclos`,
      estado_emocional_despues: 'relajado'
    });
  };

  const getPhaseText = () => {
    switch(phase) {
      case 'inhale': return 'Inhala profundamente';
      case 'hold': return 'Mantén el aire';
      case 'exhale': return 'Exhala lentamente';
      default: return '';
    }
  };

  const getPhaseColor = () => {
    switch(phase) {
      case 'inhale': return 'var(--color-success)';
      case 'hold': return '#2196F3';
      case 'exhale': return '#FF9800';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getCircleSize = () => {
    if (phase === 'inhale') {
      return 120 + (TIEMPO_INHALAR - timer) * 25;
    } else if (phase === 'exhale') {
      return 220 - (TIEMPO_EXHALAR - timer) * 15;
    }
    return 220;
  };

  if (phase === 'intro') {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🫁</div>
        <h2 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Ejercicio de Respiración 4-4-6</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Esta técnica de respiración consciente ayuda a reducir el estrés y la ansiedad.
        </p>
        
        <div style={{
          background: 'var(--color-panel)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          maxWidth: '400px',
          margin: '0 auto 2rem',
          border: '1px solid var(--color-shadow)'
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-main)' }}>📋 Instrucciones</h3>
          <ul style={{ 
            textAlign: 'left', 
            color: 'var(--color-text-secondary)',
            listStyle: 'none',
            padding: 0,
            lineHeight: '2'
          }}>
            <li>🟢 Inhala profundamente por {TIEMPO_INHALAR} segundos</li>
            <li>🔵 Mantén el aire por {TIEMPO_MANTENER} segundos</li>
            <li>🟠 Exhala lentamente por {TIEMPO_EXHALAR} segundos</li>
            <li>🔄 Repite {totalCycles} ciclos completos</li>
          </ul>
        </div>
        
        <button 
          onClick={startExercise} 
          style={{
            background: 'linear-gradient(135deg, var(--color-success), #4caf50)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)'
          }}
        >
          ▶️ Comenzar Ejercicio
        </button>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>¡Ejercicio Completado!</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Has completado {totalCycles} ciclos de respiración consciente.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          ¿Cómo te sientes ahora?
        </p>
        <button 
          onClick={handleFinish} 
          style={{
            background: 'linear-gradient(135deg, var(--color-success), #4caf50)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '1rem 2.5rem',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)'
          }}
        >
          <FaCheck style={{ marginRight: '0.5rem' }} /> Finalizar Actividad
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '2.5rem' }}>
      {/* Progress indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
          Ciclo {cycles + 1} de {totalCycles}
        </p>
        <div style={{
          width: '100%',
          maxWidth: '300px',
          height: '8px',
          background: 'var(--color-shadow)',
          borderRadius: '4px',
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((cycles + 1) / totalCycles) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))',
            borderRadius: '4px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Breathing bubble */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '280px',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: getCircleSize(),
          height: getCircleSize(),
          borderRadius: '50%',
          background: `radial-gradient(circle, ${getPhaseColor()}40, ${getPhaseColor()}80)`,
          boxShadow: `0 0 40px ${getPhaseColor()}60`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.5s ease-in-out'
        }}>
          <div style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700',
            color: getPhaseColor()
          }}>
            {timer}
          </div>
          <div style={{ 
            fontSize: '1rem',
            fontWeight: '500',
            color: getPhaseColor(),
            marginTop: '0.25rem'
          }}>
            {getPhaseText()}
          </div>
        </div>
      </div>

      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        Sigue el ritmo del círculo para guiar tu respiración
      </p>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const MeditacionGuiadaActivity = ({ actividad, onComplete, participacion }) => {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const steps = [
    { title: "Preparación", duration: 30, text: "Encuentra un lugar cómodo. Siéntate o acuéstate. Cierra los ojos suavemente." },
    { title: "Conexión con el cuerpo", duration: 60, text: "Nota cómo tu cuerpo hace contacto con la superficie. Siente el peso de tu cuerpo relajándose." },
    { title: "Respiración consciente", duration: 60, text: "Lleva tu atención a la respiración. No intentes cambiarla, solo obsérvala." },
    { title: "Relajación progresiva", duration: 90, text: "Relaja los músculos de tu rostro, cuello, hombros, brazos, manos, torso, piernas y pies." },
    { title: "Visualización", duration: 60, text: "Imagina un lugar seguro y tranquilo. Puede ser una playa, un bosque, o cualquier lugar que te brinde paz." },
    { title: "Gratitud", duration: 45, text: "Piensa en tres cosas por las que estás agradecido/a hoy. Permítete sentir esa gratitud." },
    { title: "Regreso", duration: 30, text: "Poco a poco, vuelve a ser consciente de tu entorno. Mueve suavemente los dedos, abre los ojos." }
  ];

  useEffect(() => {
    if (!playing || step >= steps.length) return;
    
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          if (step < steps.length - 1) {
            setStep(s => s + 1);
            return steps[step + 1].duration;
          } else {
            setPlaying(false);
            setStep(steps.length);
            return 0;
          }
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step]);

  const startMeditation = () => {
    setStep(0);
    setTimer(steps[0].duration);
    setPlaying(true);
  };

  const handleFinish = () => {
    onComplete({
      notas: 'Meditación guiada completada',
      estado_emocional_despues: 'tranquilo'
    });
  };

  if (step === 0 && !playing) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <GiMeditation size={64} color="var(--color-primary)" />
        <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>Meditación Guiada</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Una sesión de {Math.round(steps.reduce((acc, s) => acc + s.duration, 0) / 60)} minutos para relajarte y conectar contigo mismo.
        </p>
        <button onClick={startMeditation} className="auth-button" style={{ margin: '0 auto' }}>
          <FaPlay style={{ marginRight: '0.5rem' }} /> Comenzar Meditación
        </button>
      </div>
    );
  }

  if (step >= steps.length) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FaSmile size={64} color="#4caf50" />
        <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>Meditación Completada</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Tómate un momento antes de continuar con tu día.
          ¿Cómo te sientes ahora?
        </p>
        <button onClick={handleFinish} className="auth-button" style={{ margin: '0 auto' }}>
          <FaCheck style={{ marginRight: '0.5rem' }} /> Finalizar Actividad
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={{
        background: 'var(--color-panel)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid var(--color-shadow)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '1rem',
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem'
        }}>
          <span>Paso {step + 1} de {steps.length}</span>
          <span>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
        </div>
        
        <h3 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
          {steps[step].title}
        </h3>
        
        <p style={{ 
          color: 'var(--color-text-main)', 
          fontSize: '1.1rem', 
          lineHeight: '1.8',
          fontStyle: 'italic'
        }}>
          "{steps[step].text}"
        </p>
        
        <div style={{ 
          width: '100%', 
          height: '4px', 
          background: 'var(--color-shadow)', 
          borderRadius: '2px',
          marginTop: '1.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(timer / steps[step].duration) * 100}%`,
            height: '100%',
            background: 'var(--color-primary)',
            transition: 'width 1s linear'
          }} />
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const ReflexionActivity = ({ actividad, onComplete, participacion }) => {
  const [respuestas, setRespuestas] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  
  const preguntas = [
    "¿Qué momento del día te hizo sentir más agradecido/a?",
    "¿Qué aprendiste hoy sobre ti mismo/a?",
    "¿Qué pequeña acción puedes hacer mañana para cuidar tu bienestar?"
  ];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleFinish = () => {
    onComplete({
      notas: respuestas.join(' | '),
      estado_emocional_despues: 'reflexivo'
    });
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <FaLightbulb size={64} color="#ffc107" />
        <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>¡Reflexión Guardada!</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Gracias por tomarte este tiempo para reflexionar.
          Estas reflexiones son valiosas para tu crecimiento personal.
        </p>
        <button onClick={handleFinish} className="auth-button" style={{ margin: '0 auto' }}>
          <FaCheck style={{ marginRight: '0.5rem' }} /> Finalizar Actividad
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <FaComment size={48} color="var(--color-primary)" />
        <h3 style={{ color: 'var(--color-text-main)', marginTop: '0.5rem' }}>Reflexión Personal</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Tómate unos minutos para responder estas preguntas con honestidad.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        {preguntas.map((pregunta, idx) => (
          <div key={idx}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'var(--color-text-main)',
              fontWeight: '500'
            }}>
              {idx + 1}. {pregunta}
            </label>
            <textarea
              value={respuestas[idx]}
              onChange={e => {
                const newRespuestas = [...respuestas];
                newRespuestas[idx] = e.target.value;
                setRespuestas(newRespuestas);
              }}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--color-shadow)',
                background: 'var(--color-panel-solid)',
                color: 'var(--color-text-main)',
                resize: 'vertical'
              }}
              placeholder="Escribe tu respuesta..."
            />
          </div>
        ))}
        
        <button 
          onClick={handleSubmit} 
          className="auth-button"
          disabled={respuestas.every(r => !r.trim())}
          style={{ alignSelf: 'center' }}
        >
          <FaCheck style={{ marginRight: '0.5rem' }} /> Guardar Reflexión
        </button>
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const TareaActivity = ({ actividad, onComplete, participacion }) => {
  // Estados para grabación
  const [grabando, setGrabando] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [tiempoGrabacion, setTiempoGrabacion] = useState(0);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para resultados
  const [miResultado, setMiResultado] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [resultadoGrupal, setResultadoGrupal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mostrarResultadoGrupal, setMostrarResultadoGrupal] = useState(false);
  const [mostrarTodasEmociones, setMostrarTodasEmociones] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const autoRefreshRef = useRef(null);
  const loadingParticipantesRef = useRef(false);
  const ultimaCargaRef = useRef(0);
  
  const currentUser = authService.getUser();

  // Cargar participantes con protección contra llamadas duplicadas
  const cargarParticipantes = useCallback(async () => {
    // Evitar llamadas múltiples simultáneas
    if (loadingParticipantesRef.current) return;
    
    // Evitar llamadas muy frecuentes (mínimo 5 segundos entre llamadas)
    const ahora = Date.now();
    if (ahora - ultimaCargaRef.current < 5000) return;
    
    try {
      loadingParticipantesRef.current = true;
      ultimaCargaRef.current = ahora;
      
      const data = await groupsService.obtenerParticipantesActividad(actividad.id_actividad);
      const parts = data?.participantes || data || [];
      setParticipantes(parts);
      
      // Verificar si todos completaron
      const completados = parts.filter(p => p.estado === 'completado' && p.resultado_analisis);
      
      if (completados.length > 0 && completados.length === parts.length) {
        calcularResultadoGrupal(completados);
      }
      
      // Buscar mi resultado si ya participé
      const miPart = parts.find(p => p.id_usuario === (currentUser?.id_usuario || currentUser?.id));
      if (miPart?.resultado_analisis) {
        setMiResultado(miPart.resultado_analisis);
      }
    } catch (e) {
      // Si es error 429, NO reintentar automáticamente
      if (e.response?.status === 429) {
        console.log('⏸️ Rate limit alcanzado. Usa el botón de actualizar para reintentar.');
        return;
      }
      console.error('Error cargando participantes:', e.message);
    } finally {
      loadingParticipantesRef.current = false;
    }
  }, [actividad.id_actividad, currentUser]);

  // Calcular resultado grupal localmente
  const calcularResultadoGrupal = (completados) => {
    if (!completados || completados.length === 0) return;
    
    const resultados = completados.map(p => p.resultado_analisis).filter(Boolean);
    if (resultados.length === 0) return;
    
    const safeAvg = (key) => {
      const values = resultados.map(r => r[key] || 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };
    
    const emociones = {
      felicidad: safeAvg('nivel_felicidad'),
      tristeza: safeAvg('nivel_tristeza'),
      enojo: safeAvg('nivel_enojo'),
      miedo: safeAvg('nivel_miedo'),
      sorpresa: safeAvg('nivel_sorpresa'),
      neutral: safeAvg('nivel_neutral'),
    };
    
    const emocionPredominante = Object.entries(emociones).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const estresPromedio = safeAvg('nivel_estres');
    const ansiedadPromedio = safeAvg('nivel_ansiedad');
    const felicidadPromedio = emociones.felicidad;
    
    const bienestar = Math.max(0, Math.min(100, 
      (100 - estresPromedio * 0.3 - ansiedadPromedio * 0.3 + felicidadPromedio * 0.4)
    ));
    
    setResultadoGrupal({
      promedio_felicidad: emociones.felicidad,
      promedio_tristeza: emociones.tristeza,
      promedio_enojo: emociones.enojo,
      promedio_miedo: emociones.miedo,
      promedio_sorpresa: emociones.sorpresa,
      promedio_neutral: emociones.neutral,
      promedio_estres: estresPromedio,
      promedio_ansiedad: ansiedadPromedio,
      emocion_predominante: emocionPredominante,
      nivel_bienestar_grupal: bienestar,
      total_participantes: resultados.length
    });
  };

  // Cargar participantes al montar SOLO si NO está completada
  useEffect(() => {
    // CRÍTICO: Si la actividad ya está completada, NO cargar automáticamente
    // para evitar rate limiting. El usuario usará el botón de actualizar.
    if (participacion?.completada) {
      console.log('📝 Actividad completada. Use el botón 🔄 para cargar resultados.');
      return;
    }
    
    // Solo cargar si no está completada
    const timer = setTimeout(() => {
      cargarParticipantes();
    }, 500); // Delay para evitar llamadas duplicadas en React StrictMode
    
    return () => clearTimeout(timer);
  }, [cargarParticipantes, participacion?.completada]);

  // Auto-actualizar cuando el resultado grupal esté listo
  useEffect(() => {
    if (resultadoGrupal) {
      setMostrarResultadoGrupal(true);
    }
  }, [resultadoGrupal]);

  // Auto-refresh cada 10 segundos mientras esperamos a otros
  useEffect(() => {
    if (miResultado && !resultadoGrupal) {
      autoRefreshRef.current = setInterval(() => {
        cargarParticipantes();
      }, 10000);
      return () => clearInterval(autoRefreshRef.current);
    }
  }, [miResultado, resultadoGrupal, cargarParticipantes]);

  // Iniciar grabación
  const iniciarGrabacion = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorder.start();
      setGrabando(true);
      setTiempoGrabacion(0);
      
      timerRef.current = setInterval(() => {
        setTiempoGrabacion(t => t + 1);
      }, 1000);
      
    } catch (e) {
      setError('No se pudo acceder al micrófono');
    }
  };

  // Detener grabación
  const detenerGrabacion = () => {
    if (mediaRecorderRef.current && grabando) {
      mediaRecorderRef.current.stop();
      setGrabando(false);
      clearInterval(timerRef.current);
    }
  };

  // Analizar y enviar
  const analizarYEnviar = async () => {
    if (!audioBlob) return;
    
    setAnalizando(true);
    setError('');
    
    try {
      const userId = currentUser?.id_usuario || currentUser?.id;
      
      // Analizar audio
      const resultadoAudio = await audioService.analyzeAudio(audioBlob, tiempoGrabacion, userId);
      
      // Guardar en actividad
      await onComplete({
        notas: `Análisis de voz completado`,
        estado_emocional_despues: resultadoAudio?.resultado?.emocion_dominante || 'neutral',
        id_audio: resultadoAudio?.audio?.id_audio,
        id_analisis: resultadoAudio?.analisis?.id_analisis,
        id_resultado: resultadoAudio?.resultado?.id_resultado,
        resultado_analisis: resultadoAudio?.resultado
      });
      
      setMiResultado(resultadoAudio?.resultado);
      setAudioBlob(null);
      
      // Recargar participantes y mostrar resultado grupal después de 3 segundos
      setTimeout(() => {
        cargarParticipantes();
        // Esperar 3 segundos antes de mostrar resultado grupal
        setTimeout(() => {
          setMostrarResultadoGrupal(true);
        }, 3000);
      }, 1000);
      
    } catch (e) {
      setError(e.message || 'Error al analizar el audio');
    } finally {
      setAnalizando(false);
    }
  };

  // Formatear tiempo
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Barra de emoción
  const EmotionBar = ({ emotion, value, color }) => (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{emotion}</span>
        <span style={{ fontSize: '0.8rem', color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ background: 'var(--color-shadow)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );

  const completados = participantes.filter(p => p.estado === 'completado');
  const pendientes = participantes.filter(p => p.estado !== 'completado');

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {participacion?.completada ? (
          <>
            <FaCheck size={48} color="#4caf50" />
            <h3 style={{ color: 'var(--color-text-main)', marginTop: '0.5rem' }}>Resultados del Análisis de Voz</h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              Actividad completada el {new Date(participacion.fecha_completada).toLocaleDateString('es-ES')}
            </p>
          </>
        ) : (
          <>
            <FaMicrophone size={48} color="var(--color-primary)" />
            <h3 style={{ color: 'var(--color-text-main)', marginTop: '0.5rem' }}>Análisis de Voz Grupal</h3>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              {actividad.descripcion || 'Graba tu voz para analizar tus emociones junto con el grupo.'}
            </p>
          </>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Estado de participantes */}
      {participacion?.completada && participantes.length === 0 && (
        <div style={{
          background: 'rgba(90, 208, 210, 0.1)',
          border: '1px solid var(--color-primary)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--color-text-main)', margin: '0 0 1rem' }}>
            Haz clic en el botón de actualizar para cargar los resultados del grupo
          </p>
          <button
            onClick={cargarParticipantes}
            disabled={loading}
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
          >
            <FaSync style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Cargando...' : 'Cargar Resultados'}
          </button>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'var(--color-panel)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaUsers color="var(--color-primary)" />
          <span style={{ color: 'var(--color-text-main)' }}>
            {completados.length}/{participantes.length || '?'} completados
          </span>
        </div>
        {!participacion?.completada && (
          <button 
            onClick={cargarParticipantes} 
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }}
            title="Actualizar"
          >
            <FaSync style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}
      </div>

      {/* Si no he participado - Mostrar grabación */}
      {!miResultado && !participacion?.completada && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(90, 208, 210, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)', 
          padding: '2rem', 
          borderRadius: '16px', 
          marginBottom: '1.5rem',
          border: '1px solid rgba(90, 208, 210, 0.3)'
        }}>
          {!audioBlob ? (
            // Interfaz de grabación
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: 120, 
                height: 120, 
                borderRadius: '50%', 
                background: grabando ? 'rgba(244, 67, 54, 0.2)' : 'rgba(90, 208, 210, 0.2)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                border: grabando ? '3px solid #f44336' : '3px solid var(--color-primary)',
                animation: grabando ? 'pulse 1.5s infinite' : 'none'
              }}>
                {grabando ? (
                  <FaStop size={40} color="#f44336" />
                ) : (
                  <FaMicrophone size={40} color="var(--color-primary)" />
                )}
              </div>
              
              {grabando && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-main)', margin: 0 }}>
                    {formatTime(tiempoGrabacion)}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>Grabando...</p>
                </div>
              )}
              
              <button
                onClick={grabando ? detenerGrabacion : iniciarGrabacion}
                className="auth-button"
                style={{ 
                  margin: '0 auto',
                  background: grabando ? '#f44336' : undefined,
                  minWidth: '200px'
                }}
              >
                {grabando ? (
                  <><FaStop style={{ marginRight: '0.5rem' }} /> Detener Grabación</>
                ) : (
                  <><FaMicrophone style={{ marginRight: '0.5rem' }} /> Iniciar Grabación</>
                )}
              </button>
              
              {!grabando && (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>
                  Habla sobre cómo te sientes, tu día, o cualquier pensamiento (mínimo 5 segundos)
                </p>
              )}
            </div>
          ) : (
            // Audio grabado - listo para analizar
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                background: 'rgba(76, 175, 80, 0.2)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '3px solid #4caf50'
              }}>
                <FaCheck size={32} color="#4caf50" />
              </div>
              
              <p style={{ color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>
                Audio grabado: {formatTime(tiempoGrabacion)}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={() => { setAudioBlob(null); setTiempoGrabacion(0); }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-shadow)',
                    background: 'var(--color-panel)',
                    color: 'var(--color-text-main)',
                    cursor: 'pointer'
                  }}
                >
                  Volver a grabar
                </button>
                
                <button
                  onClick={analizarYEnviar}
                  className="auth-button"
                  disabled={analizando || tiempoGrabacion < 3}
                >
                  {analizando ? (
                    <><FaSpinner className="spin" style={{ marginRight: '0.5rem' }} /> Analizando...</>
                  ) : (
                    <><FaChartBar style={{ marginRight: '0.5rem' }} /> Analizar y Enviar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mi resultado individual */}
      {miResultado && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '1px solid #4caf50'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartBar style={{ color: 'var(--color-primary)' }} /> Tu Resultado
            </h4>
            <span style={{ color: '#4caf50', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaCheck size={12} /> Completado
            </span>
          </div>
          
          {(miResultado.emocion_dominante || miResultado.emocion_predominante) && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-panel)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Emoción Predominante</p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1rem', 
                borderRadius: '20px', 
                background: `${getEmotionColor(miResultado.emocion_dominante || miResultado.emocion_predominante)}20`, 
                color: getEmotionColor(miResultado.emocion_dominante || miResultado.emocion_predominante), 
                fontWeight: '600', 
                fontSize: '1.1rem', 
                textTransform: 'capitalize' 
              }}>
                {miResultado.emocion_dominante || miResultado.emocion_predominante}
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            {miResultado.nivel_felicidad != null && <EmotionBar emotion="felicidad" value={miResultado.nivel_felicidad} color={getEmotionColor('felicidad')} />}
            {miResultado.nivel_tristeza != null && <EmotionBar emotion="tristeza" value={miResultado.nivel_tristeza} color={getEmotionColor('tristeza')} />}
            {miResultado.nivel_enojo != null && <EmotionBar emotion="enojo" value={miResultado.nivel_enojo} color={getEmotionColor('enojo')} />}
            {miResultado.nivel_miedo != null && <EmotionBar emotion="miedo" value={miResultado.nivel_miedo} color={getEmotionColor('miedo')} />}
          </div>
          
          {(miResultado.nivel_estres != null || miResultado.nivel_ansiedad != null) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--color-panel)', borderRadius: '8px' }}>
              {miResultado.nivel_estres != null && (
                <div style={{ textAlign: 'center' }}>
                  <FaHeart style={{ color: '#fb923c', fontSize: '1.25rem', marginBottom: '0.25rem' }} />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Estrés</p>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#fb923c' }}>{Math.round(miResultado.nivel_estres)}%</p>
                </div>
              )}
              {miResultado.nivel_ansiedad != null && (
                <div style={{ textAlign: 'center' }}>
                  <MdPsychology style={{ color: '#f472b6', fontSize: '1.25rem', marginBottom: '0.25rem' }} />
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Ansiedad</p>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#f472b6' }}>{Math.round(miResultado.nivel_ansiedad)}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resultados de todos los participantes */}
      {participantes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: 'var(--color-text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUsers /> Resultados de Participantes
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {participantes.map(p => {
              const esYo = p.id_usuario === (currentUser?.id_usuario || currentUser?.id);
              return (
                <div 
                  key={p.id_usuario} 
                  style={{ 
                    background: esYo ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)' : 'var(--color-panel)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: `1px solid ${esYo ? '#4caf50' : 'var(--color-shadow)'}`
                  }}
                >
                  {/* Encabezado del participante */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: esYo ? '600' : '500', color: 'var(--color-text-main)' }}>
                        {p.nombre || 'Participante'} {esYo && '(Tú)'}
                      </span>
                    </div>
                    {p.estado === 'completado' && p.resultado_analisis ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#4caf50', fontSize: '0.8rem' }}>
                        <FaCheck size={12} />
                        <span>Completado</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        <FaClock size={12} />
                        <span>Esperando...</span>
                      </div>
                    )}
                  </div>

                  {/* Resultado del análisis si existe */}
                  {p.resultado_analisis ? (
                    <>
                      {/* Emoción predominante */}
                      {p.resultado_analisis.emocion_predominante && (
                        <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.4rem 1rem', 
                            borderRadius: '20px', 
                            background: `${getEmotionColor(p.resultado_analisis.emocion_predominante)}20`, 
                            color: getEmotionColor(p.resultado_analisis.emocion_predominante), 
                            fontWeight: '600', 
                            fontSize: '0.9rem', 
                            textTransform: 'capitalize' 
                          }}>
                            {p.resultado_analisis.emocion_predominante}
                          </div>
                        </div>
                      )}

                      {/* Barras de emociones principales */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {p.resultado_analisis.nivel_felicidad != null && p.resultado_analisis.nivel_felicidad > 0 && (
                          <EmotionBar emotion="felicidad" value={p.resultado_analisis.nivel_felicidad} color={getEmotionColor('felicidad')} />
                        )}
                        {p.resultado_analisis.nivel_tristeza != null && p.resultado_analisis.nivel_tristeza > 0 && (
                          <EmotionBar emotion="tristeza" value={p.resultado_analisis.nivel_tristeza} color={getEmotionColor('tristeza')} />
                        )}
                        {p.resultado_analisis.nivel_enojo != null && p.resultado_analisis.nivel_enojo > 0 && (
                          <EmotionBar emotion="enojo" value={p.resultado_analisis.nivel_enojo} color={getEmotionColor('enojo')} />
                        )}
                        {p.resultado_analisis.nivel_miedo != null && p.resultado_analisis.nivel_miedo > 0 && (
                          <EmotionBar emotion="miedo" value={p.resultado_analisis.nivel_miedo} color={getEmotionColor('miedo')} />
                        )}
                      </div>

                      {/* Niveles de estrés y ansiedad si están presentes */}
                      {(p.resultado_analisis.nivel_estres != null || p.resultado_analisis.nivel_ansiedad != null) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                          {p.resultado_analisis.nivel_estres != null && (
                            <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(251, 146, 60, 0.1)', borderRadius: '8px' }}>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Estrés</p>
                              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#fb923c' }}>
                                {Math.round(p.resultado_analisis.nivel_estres)}%
                              </p>
                            </div>
                          )}
                          {p.resultado_analisis.nivel_ansiedad != null && (
                            <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(244, 114, 182, 0.1)', borderRadius: '8px' }}>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Ansiedad</p>
                              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#f472b6' }}>
                                {Math.round(p.resultado_analisis.nivel_ansiedad)}%
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                      Aún no ha completado el análisis
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Esperando a otros */}
      {miResultado && !mostrarResultadoGrupal && pendientes.length > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '1rem', 
          background: 'rgba(251, 191, 36, 0.1)', 
          borderRadius: '8px',
          marginBottom: '1.5rem',
          color: '#fbbf24'
        }}>
          <FaClock />
          <span>Esperando a {pendientes.length} participante(s) para ver el resultado grupal...</span>
        </div>
      )}

      {/* Resultado Grupal - Aparece después de 3 segundos */}
      {mostrarResultadoGrupal && resultadoGrupal && (
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)', 
          padding: '1.5rem', 
          borderRadius: '12px',
          border: '1px solid rgba(90, 208, 210, 0.3)',
          marginTop: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUsers style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }} />
              <h4 style={{ margin: 0, color: '#fff' }}>Resultado Grupal</h4>
            </div>
          </div>
          
          {resultadoGrupal.emocion_predominante && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Emoción Predominante del Grupo</p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1.5rem', 
                borderRadius: '20px', 
                background: `${getEmotionColor(resultadoGrupal.emocion_predominante)}30`, 
                color: getEmotionColor(resultadoGrupal.emocion_predominante), 
                fontWeight: '600', 
                fontSize: '1.3rem', 
                textTransform: 'capitalize' 
              }}>
                {resultadoGrupal.emocion_predominante}
              </div>
            </div>
          )}
          
          {/* Estrés y Ansiedad del grupo destacados */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <FaHeart style={{ color: '#fb923c', fontSize: '1.8rem', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Estrés Grupal</p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#fb923c' }}>{Math.round(resultadoGrupal.promedio_estres || 0)}%</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <MdPsychology style={{ color: '#f472b6', fontSize: '1.8rem', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Ansiedad Grupal</p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#f472b6' }}>{Math.round(resultadoGrupal.promedio_ansiedad || 0)}%</p>
            </div>
          </div>
          
          {/* Botón para mostrar todas las emociones */}
          <div style={{ textAlign: 'center', marginBottom: mostrarTodasEmociones ? '1.5rem' : '0' }}>
            <button
              onClick={() => setMostrarTodasEmociones(!mostrarTodasEmociones)}
              style={{
                background: 'rgba(90, 208, 210, 0.2)',
                border: '1px solid var(--color-primary)',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '0 auto',
                transition: 'all 0.3s'
              }}
            >
              <FaChartBar />
              {mostrarTodasEmociones ? 'Ocultar Emociones' : 'Ver Todas las Emociones'}
            </button>
          </div>
          
          {/* Panel expandible de todas las emociones */}
          {mostrarTodasEmociones && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <p style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.9)', fontWeight: '600', textAlign: 'center' }}>
                Todas las Emociones del Grupo
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Felicidad', value: resultadoGrupal.promedio_felicidad, color: '#4ade80' },
                  { label: 'Tristeza', value: resultadoGrupal.promedio_tristeza, color: '#60a5fa' },
                  { label: 'Enojo', value: resultadoGrupal.promedio_enojo, color: '#f87171' },
                  { label: 'Miedo', value: resultadoGrupal.promedio_miedo, color: '#a78bfa' },
                  { label: 'Sorpresa', value: resultadoGrupal.promedio_sorpresa, color: '#fbbf24' },
                  { label: 'Neutral', value: resultadoGrupal.promedio_neutral, color: '#94a3b8' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                      <span style={{ fontSize: '1rem', fontWeight: '600', color: item.color }}>{Math.round(item.value || 0)}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.value || 0}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
              Basado en {resultadoGrupal.total_participantes} participante(s)
            </span>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// Componente principal
export default function ActividadDetalle() {
  const { grupoId, actividadId } = useParams();
  const navigate = useNavigate();
  const [actividad, setActividad] = useState(null);
  const [participacion, setParticipacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const userData = authService.getUser();

  const cargarActividad = useCallback(async () => {
    try {
      const data = await groupsService.obtenerActividad(actividadId);
      // El backend devuelve { actividad: {...}, participantes: [...] }
      // Extraemos solo el objeto actividad
      setActividad(data?.actividad || data);
      
      // Verificar mi participación
      try {
        const part = await groupsService.obtenerMiParticipacion(actividadId);
        setParticipacion(part?.participacion || null);
      } catch {
        setParticipacion(null);
      }
    } catch (e) {
      console.error(e);
      setError('Error al cargar la actividad');
    } finally {
      setLoading(false);
    }
  }, [actividadId]);

  useEffect(() => {
    cargarActividad();
  }, [cargarActividad]);

  const handleParticipate = async () => {
    try {
      await groupsService.participarActividad(actividadId, {});
      await cargarActividad();
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.error || 'Error al registrar participación');
    }
  };

  const handleComplete = async (data) => {
    if (!participacion) return;
    
    setCompleting(true);
    try {
      await groupsService.completarParticipacion(participacion.id_participacion, data);
      await cargarActividad();
    } catch (e) {
      console.error(e);
      setError('Error al completar la actividad');
    } finally {
      setCompleting(false);
    }
  };

  const getActivityIcon = (tipo) => {
    const icons = {
      'juego_grupal': FaGamepad,
      'ejercicio_respiracion': FaLungs,
      'meditacion_guiada': GiMeditation,
      'reflexion': FaComment,
      'tarea': FaTasks,
      'otro': FaEllipsisH
    };
    return icons[tipo] || FaTasks;
  };

  const getActivityComponent = () => {
    if (participacion?.completada) {
      // Si es una actividad de tipo tarea, mostrar TareaActivity con resultados
      if (actividad.tipo_actividad === 'tarea') {
        return <TareaActivity actividad={actividad} onComplete={handleComplete} participacion={participacion} />;
      }
      
      // Para otros tipos de actividades, mostrar el mensaje de completado tradicional
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FaCheck size={64} color="#4caf50" />
          <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>Actividad Completada</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Completaste esta actividad el {new Date(participacion.fecha_completada).toLocaleDateString('es-ES')}.
          </p>
          {participacion.notas_participante && (
            <div style={{
              background: 'var(--color-panel)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--color-shadow)',
              marginTop: '1rem',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '1rem auto 0'
            }}>
              <strong style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Tus notas:</strong>
              <p style={{ color: 'var(--color-text-main)', margin: '0.5rem 0 0' }}>{participacion.notas_participante}</p>
            </div>
          )}
        </div>
      );
    }

    if (!participacion) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FaPlay size={64} color="var(--color-primary)" />
          <h3 style={{ color: 'var(--color-text-main)', marginTop: '1rem' }}>¿Listo para comenzar?</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Regístrate en esta actividad para comenzar.
          </p>
          <button onClick={handleParticipate} className="auth-button" style={{ margin: '0 auto' }}>
            <FaPlay style={{ marginRight: '0.5rem' }} /> Participar en Actividad
          </button>
        </div>
      );
    }

    const props = { actividad, onComplete: handleComplete, participacion };
    
    switch (actividad.tipo_actividad) {
      case 'juego_grupal':
        return <JuegoGrupalActivity {...props} />;
      case 'ejercicio_respiracion':
        return <EjercicioRespiracionActivity {...props} />;
      case 'meditacion_guiada':
        return <MeditacionGuiadaActivity {...props} />;
      case 'reflexion':
        return <ReflexionActivity {...props} />;
      case 'tarea':
      default:
        return <TareaActivity {...props} />;
    }
  };

  if (loading) {
    return (
      <PageCard title="Cargando actividad...">
        <Spinner />
      </PageCard>
    );
  }

  if (error && !actividad) {
    return (
      <PageCard title="Error">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--color-error)' }}>{error}</p>
          <button onClick={() => navigate(-1)} className="auth-button">
            <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Volver
          </button>
        </div>
      </PageCard>
    );
  }

  const ActivityIcon = getActivityIcon(actividad?.tipo_actividad);

  return (
    <div className="actividad-detalle-content page-content">
      <PageCard size="lg">
        {completing && <Spinner overlay message="Guardando..." />}
        
        {/* Header con botón de volver */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => navigate(`/grupos/${grupoId}`)}
            style={{
              background: 'var(--color-panel)',
              border: '1px solid var(--color-shadow)',
              borderRadius: '8px',
              padding: '0.75rem',
              cursor: 'pointer',
              color: 'var(--color-text-main)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.5rem' }}>
              {actividad.titulo}
            </h1>
            <span style={{ 
              color: 'var(--color-text-secondary)', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.25rem'
            }}>
              <ActivityIcon /> {actividad.tipo_actividad?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            color: '#ff6b6b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Info de la actividad */}
        <div style={{
          background: 'var(--color-panel)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--color-shadow)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
            <FaCalendar />
            <span>{actividad.fecha_inicio ? new Date(actividad.fecha_inicio).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
            <FaUsers />
            <span>{actividad.participantes_completados || 0}/{actividad.participantes_totales || 0} completados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
            <FaClock />
            <span>Creado por {actividad.creador_nombre || 'Facilitador'}</span>
          </div>
        </div>

        {/* Descripción */}
        {actividad.descripcion && (
          <div style={{
            background: 'var(--color-panel)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--color-shadow)',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
              {actividad.descripcion}
            </p>
          </div>
        )}

        {/* Contenido de la actividad */}
        <div style={{
          background: 'var(--color-panel)',
          borderRadius: '16px',
          border: '1px solid var(--color-shadow)',
          overflow: 'hidden',
          minHeight: '400px'
        }}>
          {getActivityComponent()}
        </div>
      </PageCard>
    </div>
  );
}
