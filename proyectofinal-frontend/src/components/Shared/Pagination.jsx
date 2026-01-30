import React from 'react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * Componente de paginación reutilizable con estilos consistentes
 * @param {number} currentPage - Página actual (1-indexed)
 * @param {number} totalPages - Total de páginas
 * @param {function} onPageChange - Callback cuando cambia la página
 * @param {number} totalItems - Total de items (opcional, para mostrar contador)
 * @param {number} itemsPerPage - Items por página (opcional, para mostrar contador)
 * @param {boolean} showItemCount - Mostrar contador de items
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems = 0,
  itemsPerPage = 10,
  showItemCount = true
}) => {
  if (totalPages <= 1) return null;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      onPageChange(newPage);
    }
  };

  // Generar array de números de página a mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con elipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      marginTop: '1.5rem',
      padding: '1rem 0'
    }}>
      {/* Contador de items */}
      {showItemCount && totalItems > 0 && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)'
        }}>
          Mostrando {startItem}-{endItem} de {totalItems} resultados
        </div>
      )}

      {/* Controles de paginación */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Botón primera página */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-shadow)',
            background: currentPage === 1 ? 'var(--color-panel)' : 'var(--color-panel-solid)',
            color: currentPage === 1 ? 'var(--color-text-secondary)' : 'var(--color-text-main)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
          title="Primera página"
        >
          <FaAngleDoubleLeft size={14} />
        </button>

        {/* Botón página anterior */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-shadow)',
            background: currentPage === 1 ? 'var(--color-panel)' : 'var(--color-panel-solid)',
            color: currentPage === 1 ? 'var(--color-text-secondary)' : 'var(--color-text-main)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
          title="Página anterior"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Números de página */}
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: '0.5rem 0.75rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem'
              }}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              style={{
                padding: '0.5rem 0.75rem',
                minWidth: '36px',
                borderRadius: '8px',
                border: page === currentPage 
                  ? '2px solid var(--color-primary)' 
                  : '1px solid var(--color-shadow)',
                background: page === currentPage 
                  ? 'var(--color-primary)' 
                  : 'var(--color-panel-solid)',
                color: page === currentPage 
                  ? 'white' 
                  : 'var(--color-text-main)',
                cursor: 'pointer',
                fontWeight: page === currentPage ? '600' : '400',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (page !== currentPage) {
                  e.target.style.background = 'var(--color-primary-light, rgba(124, 77, 255, 0.1))';
                  e.target.style.borderColor = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== currentPage) {
                  e.target.style.background = 'var(--color-panel-solid)';
                  e.target.style.borderColor = 'var(--color-shadow)';
                }
              }}
            >
              {page}
            </button>
          )
        ))}

        {/* Botón página siguiente */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-shadow)',
            background: currentPage === totalPages ? 'var(--color-panel)' : 'var(--color-panel-solid)',
            color: currentPage === totalPages ? 'var(--color-text-secondary)' : 'var(--color-text-main)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
          title="Página siguiente"
        >
          <FaChevronRight size={14} />
        </button>

        {/* Botón última página */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '0.5rem',
            borderRadius: '8px',
            border: '1px solid var(--color-shadow)',
            background: currentPage === totalPages ? 'var(--color-panel)' : 'var(--color-panel-solid)',
            color: currentPage === totalPages ? 'var(--color-text-secondary)' : 'var(--color-text-main)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
          title="Última página"
        >
          <FaAngleDoubleRight size={14} />
        </button>
      </div>

      {/* Selector de página (para muchas páginas) */}
      {totalPages > 10 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)'
        }}>
          <span>Ir a página:</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            defaultValue={currentPage}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt(e.target.value, 10);
                if (value >= 1 && value <= totalPages) {
                  handlePageChange(value);
                }
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value, 10);
              if (value >= 1 && value <= totalPages) {
                handlePageChange(value);
              } else {
                e.target.value = currentPage;
              }
            }}
            style={{
              width: '60px',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid var(--color-shadow)',
              background: 'var(--color-panel)',
              color: 'var(--color-text-main)',
              textAlign: 'center',
              fontSize: '0.85rem'
            }}
          />
          <span>de {totalPages}</span>
        </div>
      )}
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  totalItems: PropTypes.number,
  itemsPerPage: PropTypes.number,
  showItemCount: PropTypes.bool
};

export default Pagination;
