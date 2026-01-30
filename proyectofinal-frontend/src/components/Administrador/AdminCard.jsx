import React from "react";

/**
 * AdminCard - Componente de tarjeta reutilizable para el panel de administración
 * @param {Object} props
 * @param {string} props.variant - Tipo de tarjeta: 'stat', 'action', 'header'
 * @param {string} props.title - Título de la tarjeta
 * @param {string|number} props.value - Valor principal (para tarjetas de estadísticas)
 * @param {string} props.subtitle - Texto secundario
 * @param {string} props.description - Descripción (para tarjetas de acción)
 * @param {React.Component} props.icon - Componente de icono de react-icons
 * @param {string} props.color - Color principal
 * @param {string} props.gradient - Gradiente de fondo
 * @param {string} props.buttonText - Texto del botón (para tarjetas de acción)
 * @param {Function} props.onClick - Función al hacer clic en el botón
 * @param {React.ReactNode} props.children - Contenido personalizado
 * @param {Object} props.style - Estilos adicionales
 */
const AdminCard = ({
  variant = "stat",
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  color = "#ff6b6b",
  gradient,
  buttonText,
  onClick,
  children,
  style = {},
}) => {
  // Estilos base de la tarjeta
  const baseCardStyle = {
    ...style,
  };

  // Renderizar tarjeta de estadística
  if (variant === "stat") {
    const cardStyle = {
      ...baseCardStyle,
      background: gradient,
      borderLeft: `4px solid ${color}`,
    };

    const contentStyle = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    };

    const labelStyle = {
      margin: "0 0 0.5rem 0",
      color: "var(--color-text-secondary)",
      fontSize: "0.9rem",
    };

    const valueStyle = {
      margin: "0",
      fontSize: "2rem",
      color: color,
      fontWeight: "700",
    };

    const subtitleStyle = {
      margin: "0.25rem 0 0 0",
      color: "var(--color-text-secondary)",
      fontSize: "0.8rem",
    };

    return (
      <div className="card" style={cardStyle}>
        <div style={contentStyle}>
          <div>
            <p style={labelStyle}>{title}</p>
            <h3 style={valueStyle}>{value}</h3>
            {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          </div>
          {Icon && <Icon size={40} style={{ color: color, opacity: 0.9 }} />}
        </div>
      </div>
    );
  }

  // Renderizar tarjeta de acción
  if (variant === "action") {
    const titleStyle = {
      color: "var(--color-text-main)",
      marginBottom: "0.5rem",
    };

    const descriptionStyle = {
      marginBottom: "1rem",
    };

    const buttonStyle = {
      width: "100%",
      marginTop: "auto",
    };

    const iconStyle = {
      color: color,
      marginBottom: "1rem",
    };

    return (
      <div className="card" style={baseCardStyle}>
        {Icon && <Icon size={40} style={iconStyle} />}
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
        {buttonText && (
          <button onClick={onClick} style={buttonStyle}>
            {buttonText}
          </button>
        )}
        {children}
      </div>
    );
  }

  // Renderizar tarjeta de encabezado
  if (variant === "header") {
    const headerCardStyle = {
      ...baseCardStyle,
      width: "100%",
      maxWidth: "1200px",
    };

    const headerContentStyle = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
    };

    const headerIconStyle = {
      width: 56,
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 28,
      background: gradient || "rgba(255,107,107,0.08)",
    };

    const headerIconSvgStyle = {
      color: color,
      width: "1.4em",
      height: "1.4em",
    };

    const headerTitleStyle = {
      margin: 0,
    };

    const headerDescriptionStyle = {
      marginBottom: "0",
      color: "var(--color-text-secondary)",
    };

    return (
      <div className="card" style={headerCardStyle}>
        <div style={headerContentStyle}>
          {Icon && (
            <div style={headerIconStyle}>
              <Icon style={headerIconSvgStyle} />
            </div>
          )}
          <h2 style={headerTitleStyle}>{title}</h2>
          {description && <p style={headerDescriptionStyle}>{description}</p>}
          {children}
        </div>
      </div>
    );
  }

  // Renderizar tarjeta personalizada
  return (
    <div className="card" style={baseCardStyle}>
      {children}
    </div>
  );
};

export default AdminCard;