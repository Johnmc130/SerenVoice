import {
  FaBullseye,
  FaChartLine,
  FaLock,
  FaUsers,
  FaSmile,
  FaHeadset,
  FaGamepad,
  FaBell,
  FaLightbulb,
  FaBrain,
  FaHandHoldingHeart,
  FaChartBar,
  FaExclamationTriangle,
} from "react-icons/fa";
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../global.css";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";


const Inicio = () => {
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext);
  return (
    <>
      {/* ---------- Navbar ---------- */}
      <NavbarPublic />

      {/* ---------- Contenido principal ---------- */}
      <main
        className="container"
        style={{
          paddingTop: "2rem",
          paddingBottom: "3rem",
          backgroundImage: `url(${isDark ? PaisajeOscuro : PaisajeClaro})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 2rem", width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div
            className="card wide-card"
            style={{ padding: "2rem", textAlign: "center" }}
          >
            <h2 style={{ marginBottom: "1rem" }}>Bienvenido a SerenVoice</h2>
            <p
              style={{ color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 auto 1.5rem" }}
            >
              <strong>Tu voz dice mucho más de lo que crees.</strong> SerenVoice analiza tu voz para ayudarte 
              a entender cómo te sientes realmente. Detectamos indicadores de estrés, ansiedad y emociones 
              para que puedas cuidar mejor tu bienestar emocional. Simple, gratuito y diseñado para ti.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <button onClick={() => navigate("/probar")} style={{ padding: "0.8rem 2rem" }}>
                Comenzar Análisis Gratuito
              </button>
            </div>
          </div>

          {/* Sección de Características */}
          <div className="card wide-card" style={{ textAlign: "center" }}>
            <h2>Características Principales</h2>
          </div>
          
          <div
            className="features-grid"
            style={{
              width: "100%",
            }}
          >
            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaBullseye
                    style={{
                      fontSize: "2.5rem",
                      color: "#2196f3",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>Análisis Preciso</h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                  Analizamos tu voz para identificar patrones emocionales. 
                  Solo graba unos segundos y obtén resultados al instante.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaChartLine
                    style={{
                      fontSize: "2.5rem",
                      color: "#4caf50",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>
                    Seguimiento Continuo
                  </h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                  Observa cómo evoluciona tu bienestar día a día. Gráficos 
                  claros que te ayudan a entender tu progreso emocional.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <FaLock
                  style={{
                    fontSize: "2.5rem",
                    color: "#9c27b0",
                    marginBottom: "1rem",
                  }}
                />
                <h3 style={{ margin: "0 0 0.75rem 0" }}>
                  Privacidad Garantizada
                </h3>
              </div>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
                Tu información personal está protegida. Tus grabaciones 
                son privadas y solo tú puedes acceder a tus resultados.
              </p>
            </div>
          </div>

          {/* Sección de Funcionalidades Avanzadas */}
          <div className="card wide-card" style={{ textAlign: "center" }}>
            <h2>Todo lo que necesitas para tu bienestar</h2>
          </div>
          
          <div
            className="features-grid"
            style={{
              width: "100%",
            }}
          >
            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaUsers
                    style={{
                      fontSize: "2.5rem",
                      color: "#4caf50",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>Grupos de Apoyo</h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  No estás solo. Únete a comunidades donde puedes compartir 
                  experiencias y participar en actividades que mejoran tu ánimo.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaGamepad
                    style={{
                      fontSize: "2.5rem",
                      color: "#ff9800",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>Juegos Terapéuticos</h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  Relájate con juegos diseñados para reducir el estrés: respiración 
                  guiada, memoria, mandalas, puzzles y mindfulness.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaChartBar
                    style={{
                      fontSize: "2.5rem",
                      color: "#2196f3",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>Reportes Detallados</h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  Visualiza cómo te has sentido a lo largo del tiempo con 
                  gráficos fáciles de entender sobre tus emociones.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaLightbulb
                    style={{
                      fontSize: "2.5rem",
                      color: "#9c27b0",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>Recomendaciones Personalizadas</h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  Después de cada análisis recibirás sugerencias adaptadas a 
                  cómo te sientes: ejercicios, consejos y actividades para ti.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
                <div style={{ textAlign: "center" }}>
                  <FaBell
                    style={{
                      fontSize: "2.5rem",
                      color: "#ff6b6b",
                      marginBottom: "1rem",
                    }}
                  />
                  <h3 style={{ margin: "0 0 0.75rem 0" }}>Alertas Inteligentes</h3>
                </div>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  Te avisamos cuando detectamos que podrías necesitar un 
                  descanso o prestar más atención a tu bienestar emocional.
                </p>
            </div>

            <div
              className="card"
              style={{
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <FaBrain
                  style={{
                    fontSize: "2.5rem",
                    color: "#00bcd4",
                    marginBottom: "1rem",
                  }}
                />
                <h3 style={{ margin: "0 0 0.75rem 0" }}>Análisis Emocional</h3>
              </div>
              <p style={{ margin: 0, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                Detectamos cómo te sientes a través de tu voz: felicidad, 
                tristeza, calma, enojo y más. Conoce mejor tus emociones.
              </p>
            </div>
          </div>

          {/* Sección de Nuestra Misión */}
          <div className="card wide-card" style={{ textAlign: "center" }}>
            <h2>Nuestra Misión</h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--color-text-secondary)", margin: "0 auto" }}>
                Millones de personas en el mundo enfrentan estrés, ansiedad o momentos difíciles, 
                pero no siempre tienen acceso a apoyo profesional. Por eso creamos SerenVoice: 
                para que cualquier persona pueda entender mejor cómo se siente.
              </p>
              <p style={{ fontSize: "1.15rem", lineHeight: 1.8, color: "var(--color-text-main)", margin: "0 auto", fontWeight: 500 }}>
                Queremos ser tu compañero en el camino hacia el bienestar. No reemplazamos 
                a los profesionales de salud mental, pero sí te ofrecemos herramientas 
                <strong> gratuitas y accesibles</strong> para cuidarte día a día.
              </p>
              <div style={{ 
                background: "rgba(255, 152, 0, 0.1)", 
                padding: "1rem 1.5rem", 
                borderRadius: "8px", 
                borderLeft: "4px solid #ff9800",
                margin: "1rem auto 0",
                textAlign: "left"
              }}>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text-secondary)", fontStyle: "italic", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <FaExclamationTriangle style={{ color: "#ff9800", flexShrink: 0, marginTop: "0.15rem" }} />
                  <span><strong>Importante:</strong> SerenVoice es una herramienta de apoyo al bienestar emocional 
                  y no constituye un diagnóstico clínico. Si necesitas ayuda profesional, consulta con un especialista.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Contacto */}
          <div
            className="card wide-card"
            style={{ textAlign: "center" }}
          >
            <h2>¿Listo para comenzar?</h2>
            <p>
              Da el primer paso hacia un mayor bienestar emocional. ¡Analiza tu
              voz ahora!
            </p>
            <Link to="/probar">
              <button>Probar Análisis de Voz</button>
            </Link>
          </div>
        </div>
      </main>
      {/* ---------- Footer ---------- */}
      <footer className="footer">
        © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
      </footer>
    </>
  );
};

export default Inicio;
