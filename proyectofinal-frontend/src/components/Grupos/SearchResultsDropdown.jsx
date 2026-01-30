import React, { useContext } from 'react';
import { FaUser } from 'react-icons/fa';
import { ThemeContext } from '../../context/themeContextDef';
import { makeFotoUrlWithProxy } from '../../utils/avatar';

export default function SearchResultsDropdown({ results = [], error, loading, onSelect, animate = false }){
  const { isDark } = useContext(ThemeContext);

  const cls = `search-dropdown ${isDark ? 'dark' : 'light'} ${animate ? 'enter' : ''}`;

  return (
    <div className={cls} role="listbox">
      {error && (<div className="search-dropdown-error">{error}</div>)}
      {loading && !error && (<div className="search-dropdown-loading">Buscando...</div>)}
      {!loading && !error && results.length === 0 && (
        <div className="search-dropdown-empty">No hay resultados</div>
      )}

      {!loading && results.map(u => (
        <div key={u.id || u.usuario_id || u._id} className="search-dropdown-item" role="option" onClick={() => onSelect && onSelect(u)}>
          <div className="search-dropdown-avatar">
            {u.foto_perfil ? <img src={makeFotoUrlWithProxy(u.foto_perfil)} alt="avatar" /> : <FaUser />}
          </div>
          <div className="search-dropdown-meta">
            <div className="search-dropdown-name">{u.nombre || u.name || `${u.nombre || ''} ${u.apellido || ''}`}</div>
            <div className="search-dropdown-email">{u.correo || u.email}</div>
          </div>
          <div className="search-dropdown-action">Agregar</div>
        </div>
      ))}
    </div>
  );
}
