import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../global.css";
import NavbarPublic from "../../components/Publico/NavbarPublic";
import GoogleLoginButton from "../../components/Publico/GoogleLoginButton";
import { ThemeContext } from "../../context/themeContextDef";
import PaisajeClaro from "../../assets/PaisajeClaro.svg";
import PaisajeOscuro from "../../assets/PaisajeOscuro.svg";

import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCalendarAlt,
  FaVenusMars,
  FaMars,
  FaVenus,
  FaTransgender,
  FaBirthdayCake,
} from "react-icons/fa";
import authService from "../../services/authService";

const Registro = () => {
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    genero: "",
    fecha_nacimiento: "",
  });
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPerfilPreview, setFotoPerfilPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [camposConError, setCamposConError] = useState([]);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const errorRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    // Limpiar el error del campo cuando el usuario empieza a escribir
    if (camposConError.includes(name)) {
      setCamposConError(camposConError.filter(campo => campo !== name));
    }
    
    // Limpiar mensaje de error si ya no hay campos con error
    if (camposConError.length === 1 && camposConError.includes(name)) {
      setError("");
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Por favor selecciona una imagen válida (JPG, PNG, GIF o WebP)');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      
      setFotoPerfil(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPerfilPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Scroll to error message when error appears
  useEffect(() => {
    if (error && errorRef.current) {
      // Pequeño delay para asegurar que el DOM se ha actualizado
      setTimeout(() => {
        errorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Focus después del scroll para mejor accesibilidad
        setTimeout(() => {
          errorRef.current.focus();
        }, 300);
      }, 100);
    }
  }, [error]);

  const calcularEdad = (fechaNacimiento) => {
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCamposConError([]);

    // Array para almacenar campos vacíos
    const camposVacios = [];
    const mensajesCampos = {
      nombre: 'Completa el nombre',
      apellido: 'Completa el apellido',
      correo: 'Completa el correo electrónico',
      contrasena: 'Completa la contraseña',
      confirmarContrasena: 'Completa la confirmación de contraseña',
      genero: 'Selecciona un género',
      fecha_nacimiento: 'Completa la fecha de nacimiento'
    };

    // Validar campos requeridos
    if (!formData.nombre.trim()) camposVacios.push('nombre');
    if (!formData.apellido.trim()) camposVacios.push('apellido');
    if (!formData.correo.trim()) camposVacios.push('correo');
    if (!formData.contrasena) camposVacios.push('contrasena');
    if (!formData.confirmarContrasena) camposVacios.push('confirmarContrasena');
    if (!formData.genero) camposVacios.push('genero');
    if (!formData.fecha_nacimiento) camposVacios.push('fecha_nacimiento');

    if (camposVacios.length > 0) {
      setCamposConError(camposVacios);
      // Si es un solo campo, mostrar mensaje específico
      if (camposVacios.length === 1) {
        setError(mensajesCampos[camposVacios[0]]);
      } else if (camposVacios.length === 2 && 
                 camposVacios.includes('contrasena') && 
                 camposVacios.includes('confirmarContrasena')) {
        // Si solo faltan los dos campos de contraseña, mostrar solo "Completa la contraseña"
        setError(mensajesCampos['contrasena']);
      } else {
        // Si son varios, mostrar mensaje genérico
        setError("Por favor completa todos los campos requeridos");
      }
      return;
    }

    // Validar que nombre y apellido solo contengan letras y espacios
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regexLetras.test(formData.nombre)) {
      setError("El nombre solo debe contener letras");
      setCamposConError(['nombre']);
      return;
    }
    if (!regexLetras.test(formData.apellido)) {
      setError("El apellido solo debe contener letras");
      setCamposConError(['apellido']);
      return;
    }

    // Validar formato de correo electrónico
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(formData.correo)) {
      setError("Por favor ingresa un correo electrónico válido");
      setCamposConError(['correo']);
      return;
    }

    // Validar edad
    const edad = calcularEdad(formData.fecha_nacimiento);
    if (edad < 13) {
      setError("Debes ser mayor de edad (13 años) para registrarte");
      setCamposConError(['fecha_nacimiento']);
      return;
    }
    if (edad > 65) {
      setError("Lo sentimos, el registro está limitado a personas de hasta 65 años");
      setCamposConError(['fecha_nacimiento']);
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.contrasena !== formData.confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      setCamposConError(['contrasena', 'confirmarContrasena']);
      return;
    }

    // Validar contraseña segura
    if (formData.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      setCamposConError(['contrasena', 'confirmarContrasena']);
      return;
    }
    
    const tieneNumero = /\d/.test(formData.contrasena);
    const tieneMayuscula = /[A-Z]/.test(formData.contrasena);
    const tieneMinuscula = /[a-z]/.test(formData.contrasena);
    
    if (!tieneNumero || !tieneMayuscula || !tieneMinuscula) {
      setError("La contraseña debe contener al menos una mayúscula, una minúscula y un número");
      setCamposConError(['contrasena', 'confirmarContrasena']);
      return;
    }

    setLoading(true);

    try {
      // Usar FormData si hay foto, sino usar JSON
      let response;
      if (fotoPerfil) {
        const formDataToSend = new FormData();
        formDataToSend.append('nombre', formData.nombre);
        formDataToSend.append('apellido', formData.apellido);
        formDataToSend.append('correo', formData.correo);
        formDataToSend.append('contrasena', formData.contrasena);
        formDataToSend.append('genero', formData.genero);
        formDataToSend.append('fecha_nacimiento', formData.fecha_nacimiento);
        formDataToSend.append('foto_perfil', fotoPerfil);
        
        response = await authService.registerWithPhoto(formDataToSend);
      } else {
        const userData = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          contrasena: formData.contrasena,
          genero: formData.genero,
          fecha_nacimiento: formData.fecha_nacimiento,
        };
        
        response = await authService.register(userData);
      }

      // Si requiere verificación, redirigir a página de confirmación
      if (response.requiresVerification) {
        navigate("/registro-exitoso", { 
          state: { 
            email: formData.correo,
            emailSent: response.emailSent 
          } 
        });
      } else {
        // Login con Google u otro método que no requiere verificación
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error en registro:", err);
      setError(err.message || "Error al registrar usuario. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Google login handled by `GoogleLoginButton` component; removed unused handler.

  return (
    <>
      <NavbarPublic />
      <main
        className="auth-container"
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
        <div className="auth-card wide-card">
          <div className="auth-header">
            <FaUser size={40} className="auth-icon" />
            <h2>Crear Cuenta</h2>
          </div>

          {error && (
            <div 
              ref={errorRef} 
              className="error-message" 
              tabIndex="-1"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Datos personales */}
            <div className="auth-form-section">
              <div className="input-labels">
                <label>
                  <FaUser /> Datos personales
                </label>
              </div>
              <div className="auth-form-grid">
                <div className="form-group">
                  <div className={`input-group ${camposConError.includes('nombre') ? 'error' : ''}`}>
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Nombre"
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className={`input-group ${camposConError.includes('apellido') ? 'error' : ''}`}>
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                      placeholder="Apellido"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Foto de perfil (opcional) */}
            <div className="auth-form-section">
              <div className="input-labels">
                <label>
                  <FaUser /> Foto de perfil (opcional)
                </label>
              </div>
              <div className="auth-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="form-group">
                  <div className="foto-perfil-container" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '1rem' 
                  }}>
                    {fotoPerfilPreview && (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid var(--color-primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <img 
                          src={fotoPerfilPreview} 
                          alt="Preview" 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    )}
                    <label 
                      htmlFor="foto-perfil-input" 
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'var(--color-primary-dark)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'var(--color-primary)'}
                    >
                      {fotoPerfilPreview ? 'Cambiar foto' : 'Seleccionar foto'}
                    </label>
                    <input
                      id="foto-perfil-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFotoChange}
                      style={{ display: 'none' }}
                      disabled={loading}
                    />
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--color-text-secondary)',
                      textAlign: 'center',
                      margin: 0
                    }}>
                      Formato: JPG, PNG, GIF o WebP (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos de contacto */}
            <div className="auth-form-section">
              <div className="input-labels">
                <label>
                  <FaEnvelope /> Datos de contacto
                </label>
              </div>
              <div className="auth-form-grid">
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <div className={`input-group ${camposConError.includes('correo') ? 'error' : ''}`}>
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="Correo electrónico"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seguridad */}
            <div className="auth-form-section" style={{ position: 'relative', zIndex: 10 }}>
              <div className="input-labels">
                <label>
                  <FaLock /> Seguridad
                </label>
              </div>
              <div className="auth-form-grid">
                <div className="form-group" style={{ position: 'relative' }}>
                  <div className={`input-group ${
                    camposConError.includes('contrasena') ||
                    (formData.contrasena &&
                    formData.confirmarContrasena &&
                    formData.contrasena !== formData.confirmarContrasena)
                      ? 'error'
                      : (formData.contrasena && 
                         formData.confirmarContrasena && 
                         formData.contrasena === formData.confirmarContrasena &&
                         formData.contrasena.length >= 8)
                      ? 'success'
                      : ''
                  }`}>
                    <FaLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="contrasena"
                      value={formData.contrasena}
                      onChange={handleChange}
                      onFocus={() => setShowPasswordTooltip(true)}
                      onBlur={() => setShowPasswordTooltip(false)}
                      placeholder="Contraseña"
                      autoComplete="new-password"
                      disabled={loading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  
                  {showPasswordTooltip && (
                    <div className="password-tooltip">
                      <div className="tooltip-title">La contraseña debe tener:</div>
                      <div className={`tooltip-requirement ${formData.contrasena.length >= 8 ? 'valid' : ''}`}>
                        • Mínimo 8 caracteres
                      </div>
                      <div className={`tooltip-requirement ${/[A-Z]/.test(formData.contrasena) ? 'valid' : ''}`}>
                        • Al menos una mayúscula
                      </div>
                      <div className={`tooltip-requirement ${/[a-z]/.test(formData.contrasena) ? 'valid' : ''}`}>
                        • Al menos una minúscula
                      </div>
                      <div className={`tooltip-requirement ${/\d/.test(formData.contrasena) ? 'valid' : ''}`}>
                        • Al menos un número
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <div className={`input-group ${
                    camposConError.includes('confirmarContrasena') ||
                    (formData.contrasena &&
                    formData.confirmarContrasena &&
                    formData.contrasena !== formData.confirmarContrasena)
                      ? 'error'
                      : (formData.contrasena && 
                         formData.confirmarContrasena && 
                         formData.contrasena === formData.confirmarContrasena &&
                         formData.contrasena.length >= 8)
                      ? 'success'
                      : ''
                  }`}>
                    <FaLock className="input-icon" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmarContrasena"
                      value={formData.confirmarContrasena}
                      onChange={handleChange}
                      placeholder="Confirmar contraseña"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={loading}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="auth-form-section" style={{ position: 'relative', zIndex: 1 }}>
              <div className="input-labels">
                <label>
                  <FaVenusMars /> Información adicional
                </label>
              </div>
              <div className="auth-form-grid">
                {/* genero */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.75rem",
                      fontWeight: "600",
                      color: "var(--color-text-main)",
                    }}
                  >
                    <FaVenusMars style={{ marginRight: "0.5rem" }} /> Género
                  </label>

                  <div className={`gender-options ${camposConError.includes('genero') ? 'error' : ''}`} style={{ flex: 1 }}>
                    <div
                      className={`gender-option ${
                        formData.genero === "M" ? "selected" : ""
                      }`}
                      onClick={() =>
                        !loading &&
                        handleChange({ target: { name: "genero", value: "M" } })
                      }
                    >
                      <FaMars />
                      <span>Masculino</span>
                    </div>

                    <div
                      className={`gender-option ${
                        formData.genero === "F" ? "selected" : ""
                      }`}
                      onClick={() =>
                        !loading &&
                        handleChange({ target: { name: "genero", value: "F" } })
                      }
                    >
                      <FaVenus />
                      <span>Femenino</span>
                    </div>

                    <div
                      className={`gender-option ${
                        formData.genero === "O" ? "selected" : ""
                      }`}
                      onClick={() =>
                        !loading &&
                        handleChange({ target: { name: "genero", value: "O" } })
                      }
                    >
                      <FaTransgender />
                      <span>Otro</span>
                    </div>
                  </div>
                </div>

                {/* fecha nacimiento */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.75rem",
                      fontWeight: "600",
                      color: "var(--color-text-main)",
                    }}
                  >
                    <FaCalendarAlt style={{ marginRight: "0.5rem" }} /> Fecha de
                    nacimiento
                  </label>

                  <div className={`input-group ${camposConError.includes('fecha_nacimiento') ? 'error' : ''}`}>
                    <FaCalendarAlt className="input-icon" />
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="input-group" style={{ pointerEvents: 'none', opacity: formData.fecha_nacimiento ? 0.9 : 0.5, marginTop: '0.5rem' }}>
                    <FaBirthdayCake className="input-icon" />
                    <input
                      type="text"
                      value={formData.fecha_nacimiento ? `${calcularEdad(formData.fecha_nacimiento)} años` : 'Edad'}
                      readOnly
                      placeholder="Edad"
                      style={{ cursor: 'default' }}
                    />
                  </div>
                </div>
              </div>
              </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </button>

            <div className="divider">o</div>

            <GoogleLoginButton />

            <p className="auth-link">
              ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </form>
        </div>
        </div>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} SerenVoice — Todos los derechos reservados.
      </footer>
    </>
  );
};

export default Registro;
