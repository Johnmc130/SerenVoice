import React, { useContext } from "react";
import { Link } from "react-router-dom";
import "../../global.css";
import {
  FaHeart,
  FaShieldAlt,
  FaUsers,
  FaLightbulb,
  FaArrowLeft,
  FaGamepad,
  FaChartBar,
  FaBell,
  FaBrain,
  FaInfinity,
  FaChartLine,
} from "react-icons/fa";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";

const Sobre = () => {
  const { isDark } = useContext(ThemeContext);
  return (
    <>
      <NavbarPublic />

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
        <div className="card wide-card" style={{ textAlign: "center" }}>
          <h2>Sobre SerenVoice</h2>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.8" }}>
            SerenVoice es una plataforma innovadora dedicada a mejorar el
            bienestar emocional mediante el análisis inteligente de patrones
            vocales. Creemos que la voz es un reflejo profundo de nuestro estado
            emocional.
          </p>
        </div>

        <div className="card wide-card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
            <FaHeart style={{ marginRight: "0.5rem" }} />
            Nuestra Misión
          </h3>
          <p style={{ lineHeight: "1.8" }}>
            Proporcionar a las personas una herramienta accesible y confiable
            para monitorear su salud emocional, detectar niveles de estrés y
            ansiedad, y promover un bienestar integral a través de la tecnología
            de análisis de voz de última generación.
          </p>
        </div>

        <div className="card wide-card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
            <FaLightbulb style={{ marginRight: "0.5rem" }} />
            Nuestra Visión
          </h3>
          <p style={{ lineHeight: "1.8" }}>
            Ser la plataforma líder en análisis emocional basado en voz,
            ayudando a millones de personas a entender mejor su salud mental y
            tomar decisiones más informadas sobre su bienestar.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            width: "100%",
          }}
        >
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ textAlign: "center" }}>
              <FaShieldAlt
                size={40}
                style={{ color: "#9c27b0", marginBottom: "1rem" }}
              />
              <h4
                style={{
                  color: "var(--color-text-main)",
                  marginBottom: "0.5rem",
                }}
              >
                Privacidad
              </h4>
            </div>
            <p>
              Tu información es solo tuya. Protegemos tus datos y grabaciones 
              para que te sientas seguro al usar nuestra plataforma.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ textAlign: "center" }}>
              <FaLightbulb
                size={40}
                style={{ color: "#ff9800", marginBottom: "1rem" }}
              />
              <h4
                style={{
                  color: "var(--color-text-main)",
                  marginBottom: "0.5rem",
                }}
              >
                Precisión
              </h4>
            </div>
            <p>
              Analizamos tu voz con tecnología avanzada para darte resultados 
              confiables que realmente reflejen cómo te sientes.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ textAlign: "center" }}>
              <FaUsers
                size={40}
                style={{ color: "#4caf50", marginBottom: "1rem" }}
              />
              <h4
                style={{
                  color: "var(--color-text-main)",
                  marginBottom: "0.5rem",
                }}
              >
                Accesibilidad
              </h4>
            </div>
            <p>
              Creemos que todos merecen cuidar su bienestar emocional. 
              Por eso SerenVoice es gratuito y fácil de usar.
            </p>
          </div>
        </div>

        {/* Nueva sección: Funcionalidades */}
        <div className="card wide-card" style={{ textAlign: "center" }}>
          <h3 style={{ color: "var(--color-primary)" }}>
            Nuestras Funcionalidades
          </h3>
        </div>
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
            width: "100%",
          }}
        >
          <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
            <FaBrain
              size={36}
              style={{ color: "#2196f3", marginBottom: "0.75rem" }}
            />
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
              Análisis Emocional
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Descubre cómo te sientes a través del análisis de tu voz.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
            <FaGamepad
              size={36}
              style={{ color: "#ff9800", marginBottom: "0.75rem" }}
            />
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
              5 Juegos Terapéuticos
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Relájate con actividades diseñadas para reducir el estrés.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
            <FaUsers
              size={36}
              style={{ color: "#4caf50", marginBottom: "0.75rem" }}
            />
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
              Grupos de Apoyo
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Conecta con personas que comparten tus objetivos.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
            <FaChartBar
              size={36}
              style={{ color: "#9c27b0", marginBottom: "0.75rem" }}
            />
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
              Reportes Detallados
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Visualiza tu progreso con gráficos claros y fáciles de entender.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
            <FaLightbulb
              size={36}
              style={{ color: "#00bcd4", marginBottom: "0.75rem" }}
            />
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
              Recomendaciones Personalizadas
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Recibe consejos adaptados a cómo te sientes.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
            <FaBell
              size={36}
              style={{ color: "#ff6b6b", marginBottom: "0.75rem" }}
            />
            <h4 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
              Alertas Inteligentes
            </h4>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Te avisamos cuando debas prestar atención a tu bienestar.
            </p>
          </div>
        </div>

        <div className="card wide-card">
          <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>
            Nuestra Historia
          </h3>
          <p style={{ lineHeight: "1.8", marginBottom: "1rem", textAlign: "center" }}>
            SerenVoice nace de una idea simple: tu voz puede decir mucho sobre 
            cómo te sientes. Este proyecto surge como respuesta a una necesidad 
            real en el ámbito del bienestar emocional.
          </p>
          <p style={{ lineHeight: "1.8", marginBottom: "1rem", textAlign: "center" }}>
            Muchas personas no tienen acceso fácil a profesionales de salud mental, 
            ya sea por distancia, costo o disponibilidad. SerenVoice busca ser un 
            <strong> primer paso accesible</strong> para que cualquiera pueda 
            entender mejor sus emociones y cuidar su bienestar día a día.
          </p>
          <p style={{ lineHeight: "1.8", textAlign: "center" }}>
            Importante: SerenVoice es una herramienta de apoyo, <strong>nunca un 
            reemplazo</strong> de la atención profesional. Si necesitas ayuda, 
            siempre recomendamos consultar con un especialista.
          </p>
        </div>

        <div className="card wide-card" style={{ textAlign: "center" }}>
          <h3>¿Listo para unirte?</h3>
          <p>
            Comienza tu viaje hacia un bienestar emocional mejorado hoy mismo.
          </p>
          <Link to="/registro">
            <button>Registrarse Ahora</button>
          </Link>
        </div>
        </div>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
      </footer>
    </>
  );
};

export default Sobre;
