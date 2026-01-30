import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * PageCard - Componente reutilizable para cards de página
 * 
 * @param {string} size - Tamaño de la card: 'sm' (600px), 'md' (900px), 'lg' (1000px), 'xl' (1200px), 'full' (100%)
 * @param {string} align - Alineación del texto: 'center' (default), 'left'
 * @param {boolean} spaced - Agrega margen inferior
 * @param {string} className - Clases adicionales
 * @param {object} children - Contenido de la card
 */
const PageCard = forwardRef(({ 
  size = 'lg', 
  align = 'left',
  spaced = false,
  className = '',
  children,
  ...props 
}, ref) => {
  const sizeClass = size ? `card-${size}` : '';
  const alignClass = align === 'left' ? 'card-left' : '';
  const spacedClass = spaced ? 'card-spaced' : '';
  
  const classes = [
    'card',
    sizeClass,
    alignClass,
    spacedClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

PageCard.displayName = 'PageCard';

PageCard.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  align: PropTypes.oneOf(['center', 'left']),
  spaced: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
};

export default PageCard;
