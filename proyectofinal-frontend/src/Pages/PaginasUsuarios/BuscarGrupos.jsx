import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FaSearch, FaUsers, FaFilter, FaGlobe, FaTimes, FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import groupsService from '../../services/groupsService';
import authService from '../../services/authService';
import '../../global.css';
import PageCard from '../../components/Shared/PageCard';
import Pagination from '../../components/Shared/Pagination';
import Spinner from '../../components/Publico/Spinner';

const ITEMS_PER_PAGE = 9;

export default function BuscarGrupos() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const userData = authService.getUser();

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupsService.listarPublicos();
      setGrupos(data || []);
    } catch (e) {
      console.error(e);
      setErrorMessage('Error al cargar los grupos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Tipos de grupo disponibles
  const tiposGrupo = ['apoyo', 'terapia', 'taller', 'empresa', 'educativo', 'familiar', 'otro'];

  // Lista filtrada según búsqueda y filtros (excluye grupos donde ya es miembro)
  const filteredGrupos = useMemo(() => {
    return grupos.filter(g => {
      // Excluir grupos donde ya es miembro
      const esMiembro = g.es_miembro || false;
      if (esMiembro) return false;
      
      // Filtro por búsqueda
      const nombre = (g.nombre || g.name || g.nombre_grupo || '').toString().toLowerCase();
      const desc = (g.descripcion || g.description || '').toString().toLowerCase();
      const matchesQuery = !query || nombre.includes(query.toLowerCase()) || desc.includes(query.toLowerCase());
      
      // Filtro por tipo
      const tipo = (g.tipo_grupo || g.tipo || g.type || '').toString().toLowerCase();
      const matchesTipo = !tipoFilter || tipo === tipoFilter.toLowerCase();
      
      return matchesQuery && matchesTipo;
    });
  }, [grupos, query, tipoFilter]);

  // Calcular datos paginados
  const totalPages = Math.ceil(filteredGrupos.length / ITEMS_PER_PAGE);
  const paginatedGrupos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGrupos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGrupos, currentPage]);

  // Reset a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [query, tipoFilter]);

  const unirseGrupo = async (grupoId, codigoAcceso = null) => {
    setJoining(grupoId);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      await groupsService.unirse(grupoId, codigoAcceso);
      setSuccessMessage('¡Te has unido al grupo exitosamente!');
      // Actualizar lista para reflejar el cambio
      setTimeout(() => {
        cargar();
        setSuccessMessage('');
      }, 2000);
    } catch (e) {
      console.error(e);
      setErrorMessage(e.response?.data?.message || 'Error al unirse al grupo');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setJoining(null);
    }
  };

  const limpiarFiltros = () => {
    setQuery('');
    setTipoFilter('');
    setCurrentPage(1);
  };

  const getTipoBadgeColor = (tipo) => {
    const colores = {
      'apoyo': '#4caf50',
      'terapia': '#2196f3',
      'taller': '#ff9800',
      'empresa': '#9c27b0',
      'educativo': '#00bcd4',
      'familiar': '#e91e63',
      'otro': '#607d8b'
    };
    return colores[tipo?.toLowerCase()] || '#607d8b';
  };

  if (!userData) return <Navigate to="/login" replace />;

  return (
    <div className="buscar-grupos-content page-content">
      {loading && <Spinner message="Buscando grupos..." />}
      
      <PageCard size="xl">
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

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',marginBottom:'1.5rem'}}>
          <h2 style={{margin:0,color:'var(--color-text-main)',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <FaGlobe /> Explorar Grupos Públicos
          </h2>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <button 
              onClick={() => navigate('/grupos?owner=me')} 
              className="auth-button"
              style={{background:'var(--color-panel-solid)'}}
            >
              <FaUsers style={{marginRight:'0.5rem'}} /> Mis Grupos
            </button>
            <button 
              onClick={() => navigate('/grupos/nuevo')} 
              className="auth-button"
            >
              Crear Grupo
            </button>
          </div>
        </div>

        <p style={{color:'var(--color-text-secondary)',marginBottom:'1.5rem'}}>
          Encuentra y únete a grupos de apoyo, terapia, talleres y más. Conecta con personas que comparten tus intereses.
        </p>

        {/* Mensajes de éxito/error */}
        {successMessage && (
          <div style={{
            background:'rgba(76, 175, 80, 0.1)',
            color:'#4caf50',
            padding:'1rem',
            borderRadius:'8px',
            marginBottom:'1rem',
            display:'flex',
            alignItems:'center',
            gap:'0.5rem'
          }}>
            ✓ {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{
            background:'rgba(255, 107, 107, 0.1)',
            color:'#ff6b6b',
            padding:'1rem',
            borderRadius:'8px',
            marginBottom:'1rem',
            display:'flex',
            alignItems:'center',
            gap:'0.5rem'
          }}>
            ✕ {errorMessage}
          </div>
        )}

        {/* Barra de búsqueda y filtros */}
        <div style={{
          display:'flex',
          gap:'0.75rem',
          marginBottom:'1.5rem',
          flexWrap:'wrap',
          alignItems:'center'
        }}>
          <div style={{
            flex:'1',
            minWidth:'250px',
            position:'relative'
          }}>
            <FaSearch style={{
              position:'absolute',
              left:'1rem',
              top:'50%',
              transform:'translateY(-50%)',
              color:'var(--color-text-secondary)'
            }} />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width:'100%',
                padding:'0.75rem 1rem 0.75rem 2.5rem',
                borderRadius:'10px',
                border:'1px solid var(--color-shadow)',
                background:'var(--color-panel)',
                color:'var(--color-text-main)',
                fontSize:'0.95rem'
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="auth-button"
            style={{
              background: showFilters || tipoFilter ? 'var(--color-primary)' : 'var(--color-panel-solid)',
              color: showFilters || tipoFilter ? 'white' : 'var(--color-text-main)',
              display:'flex',
              alignItems:'center',
              gap:'0.5rem'
            }}
          >
            <FaFilter /> Filtros {tipoFilter && '(1)'}
          </button>

          {(query || tipoFilter) && (
            <button
              onClick={limpiarFiltros}
              className="auth-button"
              style={{
                background:'transparent',
                border:'1px solid var(--color-shadow)',
                color:'var(--color-text-secondary)',
                display:'flex',
                alignItems:'center',
                gap:'0.5rem'
              }}
            >
              <FaTimes /> Limpiar
            </button>
          )}
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div style={{
            background:'var(--color-panel)',
            padding:'1rem',
            borderRadius:'12px',
            marginBottom:'1.5rem',
            border:'1px solid var(--color-shadow)'
          }}>
            <div style={{marginBottom:'0.75rem',fontWeight:'600',color:'var(--color-text-main)'}}>
              Tipo de grupo
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
              {tiposGrupo.map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setTipoFilter(tipoFilter === tipo ? '' : tipo)}
                  style={{
                    padding:'0.5rem 1rem',
                    borderRadius:'20px',
                    border: tipoFilter === tipo ? 'none' : '1px solid var(--color-shadow)',
                    background: tipoFilter === tipo ? getTipoBadgeColor(tipo) : 'var(--color-panel-solid)',
                    color: tipoFilter === tipo ? 'white' : 'var(--color-text-main)',
                    cursor:'pointer',
                    fontSize:'0.85rem',
                    textTransform:'capitalize',
                    transition:'all 0.2s ease'
                  }}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contador de resultados */}
        <div style={{
          color:'var(--color-text-secondary)',
          fontSize:'0.9rem',
          marginBottom:'1rem'
        }}>
          {filteredGrupos.length} {filteredGrupos.length === 1 ? 'grupo encontrado' : 'grupos encontrados'}
        </div>

        {/* Grid de grupos */}
        {!loading && (
          <>
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',
              gap:'1rem'
            }}>
              {paginatedGrupos.map(g => {
                const gid = g.id || g._id || g.id_grupo;
                const name = g.nombre || g.name || g.nombre_grupo || 'Grupo sin nombre';
                const desc = g.descripcion || g.description || '';
                const tipo = g.tipo_grupo || g.tipo || g.type || 'General';
                const maxP = g.max_participantes || g.maxParticipantes || g.max || '—';
                const miembros = g.total_miembros || g.miembros || 0;
                const facilitador = g.nombre_facilitador || g.facilitador || 'No especificado';
                const esMiembro = g.es_miembro || false;
                // Código de acceso se usará en futuras mejoras
                // const requiereCodigo = g.codigo_acceso && g.codigo_acceso.length > 0;

                return (
                  <div key={gid} className="card" style={{
                    padding:'1.25rem',
                    display:'flex',
                    flexDirection:'column',
                    gap:'0.75rem',
                    background:'var(--color-panel)',
                    border:'1px solid var(--color-shadow)',
                    borderRadius:'12px',
                    transition:'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px var(--color-shadow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  >
                    {/* Header con nombre y tipo */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:'0.5rem'}}>
                      <h3 style={{margin:0,color:'var(--color-text-main)',fontSize:'1.1rem',flex:1}}>{name}</h3>
                      <span style={{
                        fontSize:'0.7rem',
                        padding:'4px 10px',
                        borderRadius:'12px',
                        background: getTipoBadgeColor(tipo),
                        color:'white',
                        fontWeight:'600',
                        whiteSpace:'nowrap',
                        textTransform:'capitalize'
                      }}>
                        {tipo}
                      </span>
                    </div>

                    {/* Descripción */}
                    <p style={{
                      margin:0,
                      color:'var(--color-text-secondary)',
                      fontSize:'0.9rem',
                      lineHeight:'1.5',
                      display:'-webkit-box',
                      WebkitLineClamp:2,
                      WebkitBoxOrient:'vertical',
                      overflow:'hidden'
                    }}>
                      {desc || 'Sin descripción'}
                    </p>

                    {/* Info del grupo */}
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'1fr 1fr',
                      gap:'0.5rem',
                      fontSize:'0.85rem',
                      padding:'0.75rem',
                      background:'var(--color-panel-solid)',
                      borderRadius:'8px'
                    }}>
                      <div>
                        <span style={{color:'var(--color-text-secondary)'}}>Facilitador:</span>
                        <div style={{color:'var(--color-text-main)',fontWeight:'500'}}>{facilitador}</div>
                      </div>
                      <div>
                        <span style={{color:'var(--color-text-secondary)'}}>Miembros:</span>
                        <div style={{color:'var(--color-text-main)',fontWeight:'500'}}>{miembros} / {maxP}</div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{display:'flex',gap:'0.5rem',marginTop:'auto'}}>
                      <Link 
                        to={`/grupos/${gid}`} 
                        className="auth-button" 
                        style={{
                          flex:1,
                          textAlign:'center',
                          textDecoration:'none',
                          padding:'0.6rem 1rem',
                          background:'var(--color-panel-solid)',
                          color:'var(--color-text-main)'
                        }}
                      >
                        Ver Detalles
                      </Link>
                      {esMiembro ? (
                        <span style={{
                          padding:'0.6rem 1rem',
                          borderRadius:'8px',
                          background:'rgba(76, 175, 80, 0.1)',
                          color:'#4caf50',
                          fontSize:'0.9rem',
                          fontWeight:'600',
                          display:'flex',
                          alignItems:'center',
                          gap:'0.5rem'
                        }}>
                          ✓ Miembro
                        </span>
                      ) : (
                        <button 
                          onClick={() => unirseGrupo(gid)}
                          disabled={joining === gid}
                          className="auth-button"
                          style={{
                            display:'flex',
                            alignItems:'center',
                            gap:'0.5rem',
                            padding:'0.6rem 1rem'
                          }}
                        >
                          {joining === gid ? (
                            'Uniéndose...'
                          ) : (
                            <>
                              <FaUserPlus /> Unirse
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Mensaje cuando no hay resultados */}
              {filteredGrupos.length === 0 && (
                <div style={{
                  gridColumn:'1/-1',
                  textAlign:'center',
                  padding:'3rem 1rem',
                  color:'var(--color-text-secondary)',
                  background:'var(--color-panel)',
                  borderRadius:'12px',
                  border:'1px dashed var(--color-shadow)'
                }}>
                  <FaSearch size={48} style={{opacity:0.3,marginBottom:'1rem'}} />
                  <p style={{margin:0,fontSize:'1rem'}}>
                    No se encontraron grupos con los filtros actuales.
                  </p>
                  <p style={{margin:'0.5rem 0 0',fontSize:'0.9rem'}}>
                    Intenta cambiar los términos de búsqueda o{' '}
                    <button 
                      onClick={limpiarFiltros}
                      style={{
                        background:'none',
                        border:'none',
                        color:'var(--color-primary)',
                        cursor:'pointer',
                        textDecoration:'underline',
                        fontSize:'inherit'
                      }}
                    >
                      limpia los filtros
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* Paginación */}
            {filteredGrupos.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredGrupos.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            )}
          </>
        )}
      </PageCard>
    </div>
  );
}
