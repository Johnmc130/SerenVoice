import React, { useEffect, useState, useCallback, useMemo } from 'react';
import groupsService from '../../services/groupsService';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { FaUsers, FaEdit, FaTrash, FaPlus, FaSearch, FaArrowLeft, FaLock, FaCopy, FaCheck } from 'react-icons/fa';
import authService from '../../services/authService';
import '../../global.css';
import PageCard from '../../components/Shared/PageCard';
import Pagination from '../../components/Shared/Pagination';
import logger from '../../utils/logger';

const ITEMS_PER_PAGE = 9;

export default function Grupos() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = authService.getUser();

  // Función para copiar código al portapapeles
  const copiarCodigo = (codigo, gid, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codigo).then(() => {
      setCopiedCode(gid);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await groupsService.listar();
      const all = data || [];
      logger.debug('[Grupos] respuesta listar():', all);

      const params = new URLSearchParams(location.search);
      if (params.get('owner') === 'me') {
        setGrupos(all);
      } else {
        setGrupos(all.filter(g => g.privacidad === 'publico'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => { cargar(); }, [cargar]);

  const filteredGrupos = useMemo(() => {
    return grupos.filter(g => {
      if (!query) return true;
      const nombre = (g.nombre || g.name || g.nombre_grupo || '').toString().toLowerCase();
      const desc = (g.descripcion || g.description || '').toString().toLowerCase();
      return nombre.includes(query.toLowerCase()) || desc.includes(query.toLowerCase());
    });
  }, [grupos, query]);

  const totalPages = Math.ceil(filteredGrupos.length / ITEMS_PER_PAGE);
  const paginatedGrupos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGrupos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGrupos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const params = new URLSearchParams(location.search);
  const showingMyGroups = params.get('owner') === 'me';

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar grupo?')) return;
    try {
      await groupsService.eliminar(id);
      cargar();
    } catch (e) { console.error(e); }
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

  const userId = userData?.id_usuario || userData?.id;

  return (
    <div className="grupos-content page-content">
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

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',marginBottom:'1.5rem'}}>
          <h2 style={{margin:0,color:'var(--color-text-main)',display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <FaUsers /> {showingMyGroups ? 'Mis Grupos' : 'Explorar Grupos'}
          </h2>
          <div style={{display:'flex',gap:'0.5rem'}}>
            {showingMyGroups ? (
              <button onClick={() => navigate('/buscar-grupos')} className="auth-button" style={{background:'var(--color-panel-solid)'}}>
                <FaSearch style={{marginRight:'0.5rem'}} /> Buscar Grupos
              </button>
            ) : (
              <button onClick={() => navigate('/grupos?owner=me')} className="auth-button" style={{background:'var(--color-panel-solid)'}}>
                <FaUsers style={{marginRight:'0.5rem'}} /> Mis Grupos
              </button>
            )}
            <button onClick={() => navigate('/grupos/nuevo')} className="auth-button">
              <FaPlus style={{marginRight:'0.5rem'}} /> Crear Grupo
            </button>
          </div>
        </div>

        {showingMyGroups && (
          <p style={{color:'var(--color-text-secondary)',marginBottom:'1.5rem'}}>
            Grupos donde eres miembro, co-facilitador o facilitador.
          </p>
        )}

        {/* Barra de búsqueda */}
        <div style={{marginBottom:'1.5rem'}}>
          <div style={{position:'relative',maxWidth:'400px'}}>
            <FaSearch style={{
              position:'absolute',
              left:'1rem',
              top:'50%',
              transform:'translateY(-50%)',
              color:'var(--color-text-secondary)'
            }} />
            <input
              type="text"
              placeholder={showingMyGroups ? "Buscar en mis grupos..." : "Buscar grupos..."}
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
        </div>

        {/* Contador */}
        <div style={{color:'var(--color-text-secondary)',fontSize:'0.9rem',marginBottom:'1rem'}}>
          {filteredGrupos.length} {filteredGrupos.length === 1 ? 'grupo' : 'grupos'}
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'2rem',color:'var(--color-text-secondary)'}}>Cargando...</div>
        ) : (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'1rem'}}>
              {paginatedGrupos.map(g => {
                const gid = g.id || g._id || g.id_grupo;
                const name = g.nombre || g.name || g.nombre_grupo || 'Grupo sin nombre';
                const desc = g.descripcion || g.description || '';
                const tipo = g.tipo_grupo || g.tipo || g.type || 'General';
                const maxP = g.max_participantes || g.maxParticipantes || '—';
                const miembros = g.total_miembros || g.miembros_activos || 0;
                const rolGrupo = g.rol_grupo || g.role || 'participante';
                const codigoAcceso = g.codigo_acceso || g.codigoAcceso || null;
                
                // Determinar si puede editar (facilitador o co_facilitador)
                const esFacilitador = rolGrupo === 'facilitador' || 
                  (g.id_facilitador && Number(g.id_facilitador) === Number(userId));
                const esCoFacilitador = rolGrupo === 'co_facilitador';
                const puedeEditar = esFacilitador || esCoFacilitador;

                return (
                  <div 
                    key={gid} 
                    className="card" 
                    style={{
                      padding:'1.25rem',
                      display:'flex',
                      flexDirection:'column',
                      gap:'0.75rem',
                      background:'var(--color-panel)',
                      border:'1px solid var(--color-shadow)',
                      borderRadius:'12px',
                      transition:'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/grupos/${gid}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px var(--color-shadow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Header con nombre y badge tipo */}
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
                        <span style={{color:'var(--color-text-secondary)'}}>Tu rol:</span>
                        <div style={{
                          color: esFacilitador ? 'var(--color-primary)' : 'var(--color-text-main)',
                          fontWeight:'500',
                          textTransform:'capitalize'
                        }}>
                          {esFacilitador ? 'Facilitador' : rolGrupo}
                        </div>
                      </div>
                      <div>
                        <span style={{color:'var(--color-text-secondary)'}}>Miembros:</span>
                        <div style={{color:'var(--color-text-main)',fontWeight:'500'}}>{miembros} / {maxP}</div>
                      </div>
                    </div>

                    {/* Código de acceso (solo para facilitadores) */}
                    {puedeEditar && codigoAcceso && (
                      <div style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'0.5rem',
                        padding:'0.6rem 0.75rem',
                        background:'rgba(0, 230, 118, 0.1)',
                        borderRadius:'8px',
                        border:'1px solid rgba(0, 230, 118, 0.3)'
                      }} onClick={(e) => e.stopPropagation()}>
                        <FaLock style={{color:'var(--color-primary)',fontSize:'0.85rem'}} />
                        <span style={{color:'var(--color-text-secondary)',fontSize:'0.8rem'}}>Código:</span>
                        <code style={{
                          background:'var(--color-panel-solid)',
                          padding:'2px 8px',
                          borderRadius:'4px',
                          fontWeight:'600',
                          color:'var(--color-primary)',
                          letterSpacing:'1px'
                        }}>{codigoAcceso}</code>
                        <button
                          onClick={(e) => copiarCodigo(codigoAcceso, gid, e)}
                          style={{
                            marginLeft:'auto',
                            padding:'4px 8px',
                            borderRadius:'4px',
                            border:'none',
                            background: copiedCode === gid ? '#4caf50' : 'var(--color-primary)',
                            color:'white',
                            cursor:'pointer',
                            display:'flex',
                            alignItems:'center',
                            gap:'0.25rem',
                            fontSize:'0.75rem'
                          }}
                        >
                          {copiedCode === gid ? <><FaCheck /> Copiado</> : <><FaCopy /> Copiar</>}
                        </button>
                      </div>
                    )}

                    {/* Acciones */}
                    <div style={{display:'flex',gap:'0.5rem',marginTop:'auto',flexWrap:'wrap'}} onClick={(e) => e.stopPropagation()}>
                      {puedeEditar ? (
                        <>
                          <Link 
                            to={`/grupos/${gid}/editar`} 
                            style={{
                              flex:1,
                              textAlign:'center',
                              textDecoration:'none',
                              padding:'0.6rem 1rem',
                              display:'flex',
                              alignItems:'center',
                              justifyContent:'center',
                              gap:'0.5rem',
                              background:'var(--color-primary)',
                              color:'white',
                              borderRadius:'8px',
                              fontWeight:'500',
                              transition:'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-primary)'}
                          >
                            <FaEdit /> Editar
                          </Link>
                          <button 
                            onClick={() => eliminar(gid)} 
                            className="auth-button danger" 
                            style={{padding:'0.6rem 0.8rem'}}
                            title="Eliminar grupo"
                          >
                            <FaTrash />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}

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
                  <FaUsers size={48} style={{opacity:0.3,marginBottom:'1rem'}} />
                  <p style={{margin:0,fontSize:'1rem'}}>
                    {showingMyGroups ? '¡No tienes grupos todavía!' : 'No hay grupos públicos disponibles.'}
                  </p>
                  <p style={{margin:'0.5rem 0 0',fontSize:'0.9rem'}}>
                    {showingMyGroups ? 'Crea uno o únete a alguno.' : 'Intenta buscar con otros términos.'}
                  </p>
                </div>
              )}
            </div>

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
