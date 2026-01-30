import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../global.css";
import Spinner from "../../components/Publico/Spinner";
import authService from "../../services/authService";
import apiClient from "../../services/apiClient";

import {
  FaUser,
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaCalendarAlt,
  FaMars,
  FaVenus,
  FaTransgender,
  FaEye,
  FaEyeSlash,
  FaVenusMars,
  FaBirthdayCake,
  FaCamera,
  FaTrash,
} from "react-icons/fa";
import { makeFotoUrlWithProxy } from '../../utils/avatar';

// Estilos inline para el input bloqueado de Google
const googleLockedStyles = `
  input.google-locked-input {
    border: 2px solid var(--color-error) !important;
    cursor: not-allowed !important;
    opacity: 0.7;
  }
  
  input.google-locked-input:hover {
    border: 2px solid var(--color-error) !important;
    box-shadow: none !important;
    outline: none !important;
    transform: none !important;
  }
  
  input.google-locked-input:focus {
    border: 2px solid var(--color-error) !important;
    box-shadow: none !important;
    outline: none !important;
  }
  
  .input-group:has(input.google-locked-input):hover {
    box-shadow: none !important;
  }
  
  .input-group:has(input.google-locked-input):hover input {
    border: 2px solid var(--color-error) !important;
  }
`;

const ActualizarPerfil = () => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const errorRef = useRef(null);

  const user = authService.getUser();
  const isGoogleUser = user?.auth_provider === 'google';

  const [formData, setFormData] = useState({
    nombre: user?.nombre || "",
    apellido: user?.apellido || "",
    correo: user?.correo || "",
    genero: user?.genero ?? "O",
    fecha_nacimiento: user?.fecha_nacimiento
      ? new Date(user.fecha_nacimiento).toISOString().slice(0, 10)
      : "",
    edad: user?.edad || "",
    usa_medicamentos: user?.usa_medicamentos || false,
    contraseñaActual: "", 
    contraseñaNueva: "",
    confirmarContraseña: "",
    notificaciones: user?.notificaciones ?? true,
  });

  // Estado para campos con error (similar a Registro.jsx)
  const [camposConError, setCamposConError] = useState([]);

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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(
    makeFotoUrlWithProxy(user?.foto_perfil) || null
  );
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const els = cardRef.current.querySelectorAll(".reveal");
    els.forEach((el) => el.classList.add("reveal-visible"));
    cardRef.current.classList.add("reveal-visible");
  }, []);

  // Desplazar al mensaje de error cuando aparece
  useEffect(() => {
    if (error && errorRef.current) {
      setTimeout(() => {
        errorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        setTimeout(() => {
          errorRef.current.focus();
        }, 300);
      }, 100);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Solo se permiten imágenes (PNG, JPG, JPEG, GIF, WEBP)');
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no puede superar 5MB');
        return;
      }
      
      setFotoPerfil(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemoverFoto = () => {
    setFotoPerfil(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCamposConError([]);

    // Validar campos requeridos
    const camposVacios = [];
    const mensajesCampos = {
      nombre: 'Completa el nombre',
      apellido: 'Completa el apellido',
      correo: 'Completa el correo electrónico',
      genero: 'Selecciona un género',
      fecha_nacimiento: 'Completa la fecha de nacimiento'
    };

    if (!formData.nombre.trim()) camposVacios.push('nombre');
    if (!formData.apellido.trim()) camposVacios.push('apellido');
    if (!formData.correo.trim()) camposVacios.push('correo');
    if (!formData.genero) camposVacios.push('genero');
    if (!formData.fecha_nacimiento) camposVacios.push('fecha_nacimiento');

    if (camposVacios.length > 0) {
      setCamposConError(camposVacios);
      if (camposVacios.length === 1) {
        setError(mensajesCampos[camposVacios[0]]);
      } else {
        setError("Por favor completa todos los campos requeridos");
      }
      return;
    }

    // Validar formato de correo electrónico
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(formData.correo)) {
      setError("Por favor ingresa un correo electrónico válido");
      setCamposConError(['correo']);
      return;
    }

    // Solo validar contraseñas si NO es usuario de Google
    if (!isGoogleUser) {
      if (
        formData.contraseñaNueva &&
        formData.contraseñaNueva !== formData.confirmarContraseña
      ) {
        setError("Las contraseñas nuevas no coinciden");
        setCamposConError(['contraseñaNueva', 'confirmarContraseña']);
        return;
      }

      if (formData.contraseñaNueva) {
        if (!formData.contraseñaActual) {
          setError("Ingrese su contraseña actual para cambiarla");
          setCamposConError(['contraseñaActual']);
          return;
        }
        if (formData.contraseñaNueva.length < 8) {
          setError("La nueva contraseña debe tener al menos 8 caracteres");
          setCamposConError(['contraseñaNueva']);
          return;
        }
      }
    }

    try {
      setLoading(true);

      // Determinar si hay cambios en la foto
      const hayCambioFoto = fotoPerfil || (fotoPreview === null && user?.foto_perfil);

      let response;
      
      if (hayCambioFoto) {
        // Usar FormData si hay cambios en la foto
        const payload = new FormData();
        
        payload.append('nombre', formData.nombre);
        payload.append('apellido', formData.apellido);
        payload.append('correo', formData.correo);
        payload.append('genero', formData.genero);
                    payload.append('fecha_nacimiento', formData.fecha_nacimiento);
        payload.append('usa_medicamentos', formData.usa_medicamentos);
        payload.append('notificaciones', formData.notificaciones);

        // Solo incluir contraseñas si NO es usuario de Google
        if (!isGoogleUser) {
          if (formData.contraseñaActual) payload.append('contrasenaActual', formData.contraseñaActual);
          if (formData.contraseñaNueva) payload.append('contrasenaNueva', formData.contraseñaNueva);
          if (formData.confirmarContraseña) payload.append('confirmarContrasena', formData.confirmarContraseña);
        }

        // Agregar foto de perfil si existe
        if (fotoPerfil) {
          payload.append('foto_perfil', fotoPerfil);
        } else if (fotoPreview === null && user?.foto_perfil) {
          // Si se removió la foto existente
          payload.append('remover_foto', 'true');
        }

        // No especificar Content-Type manualmente, Axios lo configura automáticamente con el boundary
        response = await apiClient.put("/auth/update", payload);
      } else {
        // Usar JSON si no hay cambios en la foto
        const payload = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.correo,
          genero: formData.genero,
          fecha_nacimiento: formData.fecha_nacimiento,
          usa_medicamentos: formData.usa_medicamentos,
          notificaciones: formData.notificaciones,
        };

        // Solo incluir contraseñas si NO es usuario de Google
        if (!isGoogleUser) {
          if (formData.contraseñaActual) payload.contrasenaActual = formData.contraseñaActual;
          if (formData.contraseñaNueva) payload.contrasenaNueva = formData.contraseñaNueva;
          if (formData.confirmarContraseña) payload.confirmarContrasena = formData.confirmarContraseña;
        }

        response = await apiClient.put("/auth/update", payload);
      }

      if (response.data.success) {
        setSuccess("Perfil actualizado correctamente");

        const updatedUser = {
          ...user,
          ...response.data.user,
        };

        authService.setUser(updatedUser);

        // Actualizar preview de la foto si vino del backend
        if (response.data.user.foto_perfil) {
          setFotoPreview(makeFotoUrlWithProxy(response.data.user.foto_perfil));
        } else {
          setFotoPreview(null);
        }
        
        // Limpiar el archivo seleccionado
        setFotoPerfil(null);
      } else {
        setError(response.data.error || "Error al actualizar perfil");
      }
    } catch (err) {
      console.error("Error actualizando perfil:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="actualizar-perfil-content page-content">
        <style>{googleLockedStyles}</style>
        <div ref={cardRef} className="auth-card auth-card-md reveal">
          {loading && <Spinner overlay message="Guardando cambios..." />}
{/* Botón Volver */}
          <button
            onClick={() => navigate(-1)}
            className="btn-volver"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "var(--color-panel)",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "var(--color-text-main)",
              fontSize: "0.9rem",
              marginBottom: "1rem",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--color-panel)";
              e.currentTarget.style.color = "var(--color-text-main)";
            }}
          >
            <FaArrowLeft /> Volver
          </button>

          
          <div className="auth-header">
            <FaUser size={40} className="auth-icon" />
            <h2>Actualizar Perfil</h2>
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

          {success && (
            <div
              style={{
                background: "rgba(76, 175, 80, 0.1)",
                color: "#4CAF50",
                padding: "0.8rem",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            >
              ✓ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                    {fotoPreview && (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid var(--color-primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <img 
                          src={fotoPreview}
                          alt="Foto de perfil" 
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
                      {fotoPreview ? 'Cambiar foto' : 'Seleccionar foto'}
                    </label>
                    <input
                      id="foto-perfil-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFotoChange}
                      style={{ display: 'none' }}
                      disabled={loading}
                    />
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoverFoto}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'transparent',
                          color: 'var(--color-error)',
                          border: '1px solid var(--color-error)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = 'var(--color-error)';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--color-error)';
                        }}
                      >
                        Quitar foto
                      </button>
                    )}
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
                      required
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
                      required
                    />
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
                      disabled={loading || isGoogleUser}
                      required
                      title={isGoogleUser ? "El correo de Google no se puede modificar" : ""}
                      className={isGoogleUser ? 'google-locked-input' : ''}
                    />
                  </div>
                  {isGoogleUser && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      fontSize: '0.875rem', 
                      color: 'var(--color-error)',
                      fontWeight: '500'
                    }}>
                      <FaLock size={14} />
                      <span>Correo vinculado con Google</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="auth-form-section">
              <div className="input-labels">
                <label>
                  <FaVenusMars /> Información adicional
                </label>
              </div>
              <div className="auth-form-grid">
                {/* Género */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.75rem",
                      fontWeight: "600",
                      color: camposConError.includes('genero') ? "var(--color-error)" : "var(--color-text-main)",
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

                {/* Fecha de nacimiento y edad */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.75rem",
                      fontWeight: "600",
                      color: camposConError.includes('fecha_nacimiento') ? "var(--color-error)" : "var(--color-text-main)",
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
                      required
                    />
                  </div>
                  
                  <div className="input-group" style={{ pointerEvents: 'none', opacity: formData.fechaNacimiento ? 0.9 : 0.5, marginTop: '0.5rem' }}>
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

            {/* Contraseñas - Solo para usuarios locales */}
            {!isGoogleUser && (
              <div className="auth-form-section">
                <div className="input-labels">
                  <label>
                    <FaLock /> Cambiar contraseña (opcional)
                  </label>
                </div>
              <div className="auth-form-grid">
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <div className={`input-group ${camposConError.includes('contraseñaActual') ? 'error' : ''}`}>
                    <FaLock className="input-icon" />
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="contraseñaActual"
                      placeholder="Contraseña actual"
                      value={formData.contraseñaActual}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                      disabled={loading}
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <div className={`input-group ${camposConError.includes('contraseñaNueva') ? 'error' : ''}`}>
                    <FaLock className="input-icon" />
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="contraseñaNueva"
                      placeholder="Nueva contraseña"
                      value={formData.contraseñaNueva}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      disabled={loading}
                    >
                      {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <div className={`input-group ${camposConError.includes('confirmarContraseña') ? 'error' : ''}`}>
                    <FaLock className="input-icon" />
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmarContraseña"
                      placeholder="Confirmar contraseña"
                      value={formData.confirmarContraseña}
                      onChange={handleChange}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      disabled={loading}
                    >
                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Preferencias */}
            <div className="auth-form-section">
              <div className="input-labels">
                <label>
                  <FaUser /> Preferencias
                </label>
              </div>
              <div className="auth-form-grid">
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="usa_medicamentos"
                      checked={formData.usa_medicamentos}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    Uso medicamentos actualmente
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="notificaciones"
                      checked={formData.notificaciones}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    Recibir notificaciones y alertas
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
    </div>
  );
};

export default ActualizarPerfil;
