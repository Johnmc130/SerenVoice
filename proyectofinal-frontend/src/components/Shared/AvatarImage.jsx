import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { makeFotoUrlWithProxy } from '../../utils/avatar';

/**
 * Componente de imagen de avatar con manejo de errores.
 * Si la imagen falla en cargar, muestra un ícono de usuario por defecto.
 * 
 * @param {string} src - URL o path de la imagen de perfil
 * @param {string} alt - Texto alternativo
 * @param {number} size - Tamaño del avatar en px (default: 32)
 * @param {object} style - Estilos adicionales
 * @param {string} className - Clases CSS adicionales
 */
export default function AvatarImage({ 
  src, 
  alt = 'Avatar', 
  size = 32, 
  style = {}, 
  className = '',
  iconColor = 'inherit'
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = src ? makeFotoUrlWithProxy(src) : null;

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    display: hasError || !imageUrl ? 'none' : 'block',
    ...style
  };

  const iconStyle = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    color: iconColor,
    fontSize: size * 0.5,
    ...style
  };

  // Si no hay URL o hubo error, mostrar ícono
  if (!imageUrl || hasError) {
    return (
      <div style={iconStyle} className={className}>
        <FaUser />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div style={{ ...iconStyle, opacity: 0.5 }} className={className}>
          <FaUser />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        style={{ ...avatarStyle, display: isLoading ? 'none' : 'block' }}
        className={className}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}
