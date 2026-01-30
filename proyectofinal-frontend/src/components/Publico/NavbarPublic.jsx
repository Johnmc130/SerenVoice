import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/Logo.svg";
import { FaHome, FaInfoCircle, FaEnvelope, FaMicrophone, FaUserPlus, FaSignInAlt, FaBars, FaTimes } from "react-icons/fa";

const NavbarPublic = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img src={logo} alt="SerenVoice Logo" className="nav-logo" />
        <h1 className="nav-title">SerenVoice</h1>
      </div>

      <button
        className={`nav-toggle ${open ? "open" : ""}`}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        {open ? <FaTimes /> : <FaBars />}
      </button>

      <div className={`nav-links ${open ? "open" : ""}`}>
        <Link to="/Inicio" className="nav-link" onClick={() => setOpen(false)}>
          <FaHome /> <span>Inicio</span>
        </Link>

        <Link to="/sobre" className="nav-link" onClick={() => setOpen(false)}>
          <FaInfoCircle /> <span>Sobre</span>
        </Link>

        <Link to="/contacto" className="nav-link" onClick={() => setOpen(false)}>
          <FaEnvelope /> <span>Contacto</span>
        </Link>

        <Link to="/probar" className="nav-link" onClick={() => setOpen(false)}>
          <FaMicrophone /> <span>Prueba de Análisis</span>
        </Link>

        <Link to="/registro" className="nav-link nav-cta" onClick={() => setOpen(false)}>
          <FaUserPlus /> <span>Registrarse</span>
        </Link>

        <Link to="/login" className="nav-link nav-cta" onClick={() => setOpen(false)}>
          <FaSignInAlt /> <span>Iniciar Sesión</span>
        </Link>
      </div>
    </nav>
  );
};

export default NavbarPublic;
