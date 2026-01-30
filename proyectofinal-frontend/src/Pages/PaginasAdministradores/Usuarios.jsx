import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../services/apiClient";
import api from "../../config/api";
import authService from "../../services/authService";
import { ThemeContext } from "../../context/themeContextDef";
import "../../global.css";
import "../../styles/StylesAdmin/AdminPages.css";
import { FaUser, FaUserEdit, FaUserShield, FaUserTimes, FaChartLine, FaFilter, FaDownload, FaEnvelope, FaPhone, FaCalendar, FaBirthdayCake, FaMapMarkerAlt, FaSearch, FaKey, FaVenusMars, FaCheckCircle, FaUsers } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import UserCard from "../../components/Administrador/UserCard";
import RoleEditor from "../../components/Administrador/RoleEditor";
import StatsModal from "../../components/Administrador/StatsModal";
import PageCard from "../../components/Shared/PageCard";

const Usuarios = () => {
  const { isDark } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [filter, setFilter] = useState({ rol: "todos", activo: "todos", busqueda: "", authProvider: "todos", genero: "todos" });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(api.endpoints.usuarios.list);
        const data = res.data?.data || res.data || [];
        setUsers(data);
        setFilteredUsers(data);
        try {
          const me = await authService.getCurrentUser();
          // backend/localStorage may store id as 'id' or 'id_usuario'
          const candidate = me?.id ?? me?.id_usuario ?? me?.user_id ?? me?.userId;
          setCurrentUserId(candidate ? Number(candidate) : null);
        } catch {
          // ignore
        }
      } catch (error) {
        console.error('Error cargando usuarios', error);
        setMsg('Error cargando usuarios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const apply = () => {
      // clonar para evitar mutar el estado
      let list = (users || []).slice();
      if (filter.rol && filter.rol !== 'todos') {
        list = list.filter(u => (u.roles || []).includes(filter.rol));
      }
      if (filter.activo && filter.activo !== 'todos') {
        list = list.filter(u => (filter.activo === 'activos' ? u.activo : !u.activo));
      }
      if (filter.authProvider && filter.authProvider !== 'todos') {
        list = list.filter(u => u.auth_provider === filter.authProvider);
      }
      if (filter.genero && filter.genero !== 'todos') {
        list = list.filter(u => u.genero === filter.genero);
      }
      if (filter.busqueda && filter.busqueda.trim()) {
        const q = filter.busqueda.toLowerCase();
        list = list.filter(u => `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(q));
      }
      // Asegurar que el admin conectado actual aparezca primero en la lista
      if (currentUserId != null) {
        const matchIndex = list.findIndex(u => {
          const uid = u?.id ?? u?.id_usuario ?? u?.user_id ?? u?.userId;
          return uid != null && Number(uid) === Number(currentUserId);
        });
        if (matchIndex > 0) {
          const [me] = list.splice(matchIndex, 1);
          list.unshift(me);
        }
      }
      setFilteredUsers(list);
      setCurrentPage(1);
    };
    apply();
  }, [users, filter, currentUserId]);

  const assignRole = async (id, role) => {
    // Prevent assigning role to yourself
    if (id === currentUserId) {
      setMsg("No puedes cambiar tu propio rol");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    try {
      await apiClient.post(`${api.endpoints.usuarios.detail(id)}/roles`, { role });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, roles: Array.from(new Set([...(u.roles || []), role])) }
            : u
        )
      );
      setMsg(`Rol ${role} asignado correctamente`);
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      console.error("Error al asignar rol:", error);
      setMsg("Error al asignar rol");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const removeRole = async (id, role) => {
    // Verificar si el usuario está intentando cambiar su propio rol
    if (id === currentUserId) {
      setMsg("No puedes cambiar tu propio rol");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    try {
      await apiClient.delete(`${api.endpoints.usuarios.detail(id)}/roles/${role}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, roles: (u.roles || []).filter(r => r !== role) }
            : u
        )
      );
      setMsg(`Rol ${role} eliminado correctamente`);
      setTimeout(() => setMsg(""), 3000);
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      setMsg("Error al eliminar rol");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const openEditRoles = (user) => {
    if (user.id === currentUserId) {
      setMsg("No puedes editar tus propios roles");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const toggleUserStatus = async (id, currentStatus) => {
    // Prevenir que el admin conectado desactive su propia cuenta
    if (id === currentUserId) {
      setMsg("No puedes desactivar tu propia cuenta");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    try {
      await apiClient.patch(`${api.endpoints.usuarios.detail(id)}/estado`, { activo: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, activo: !currentStatus } : u))
      );
      setMsg(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      setMsg("Error al cambiar estado del usuario");
    }
  };

  const viewUserStats = async (user) => {
    try {
      const res = await apiClient.get(`${api.endpoints.usuarios.detail(user.id)}/estadisticas`);
      setEstadisticas(res.data?.data || null);
      setSelectedUser(user);
      setShowModal(true);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      setMsg("Error al cargar estadísticas del usuario");
    }
  };

  const exportUsers = () => {
    const csv = [
      ["ID", "Nombre", "Apellido", "Correo", "Género", "Roles", "Activo", "Último Acceso"].join(","),
      ...filteredUsers.map(u =>
        [
          u.id,
          u.nombre,
          u.apellido,
          u.email,
          u.genero || "N/A",
          u.roles?.join(";") || "Sin rol",
          u.activo ? "Sí" : "No",
          u.ultimoAcceso || "N/A"
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setMsg("Usuarios exportados correctamente");
  };

  return (
    <div className="admin-usuarios-page">
      <div className="admin-page-content">
        {/* Card con título centrado y filtros */}
        <PageCard size="xl">
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", margin: 0 }}>
              <FaUsers style={{ color: "#5ad0d2" }} /> Gestión de Usuarios
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0" }}>
              Administra, filtra y gestiona todos los usuarios del sistema
            </p>
          </div>

          {/* Filtros horizontales dentro del card */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', alignItems: 'flex-end', overflowX: 'auto' }}>
            <div style={{ flex: 2, minWidth: '180px' }}>
              <div className="input-labels">
                <label><FaSearch /> Buscar</label>
              </div>
              <div className="input-group no-icon">
                <input
                  type="text"
                  placeholder="Nombre, apellido o correo..."
                  value={filter.busqueda}
                  onChange={(e) => setFilter({ ...filter, busqueda: e.target.value })}
                />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '120px' }}>
              <div className="input-labels">
                <label><FaUserShield /> Rol</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.rol} onChange={(e) => setFilter({ ...filter, rol: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="admin">Admin</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '110px' }}>
              <div className="input-labels">
                <label><FaKey /> Proveedor</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.authProvider} onChange={(e) => setFilter({ ...filter, authProvider: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="local">Local</option>
                  <option value="google">Google</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '110px' }}>
              <div className="input-labels">
                <label><FaVenusMars /> Género</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.genero} onChange={(e) => setFilter({ ...filter, genero: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="M">Masc.</option>
                  <option value="F">Fem.</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '110px' }}>
              <div className="input-labels">
                <label><FaCheckCircle /> Estado</label>
              </div>
              <div className="input-group no-icon">
                <select value={filter.activo} onChange={(e) => setFilter({ ...filter, activo: e.target.value })}>
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={exportUsers} className="admin-btn admin-btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              <FaDownload /> <span className="admin-hidden-mobile">Exportar</span>
            </button>
          </div>
        </PageCard>

        <p className="admin-text-muted admin-mb-2">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </p>

        {msg && <div className="admin-message admin-message-success">{msg}</div>}

          {loading ? (
            <div className="admin-loading">
              <div className="admin-loading-spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty-state">
              <FaUsers />
              <h3>Sin resultados</h3>
              <p>No hay usuarios que coincidan con los filtros.</p>
            </div>
          ) : (
            <>
            <div className="admin-cards-grid">
              {(() => {
                const total = filteredUsers.length;
                const startIndex = (currentPage - 1) * perPage;
                const endIndex = Math.min(total, currentPage * perPage);
                const pageSlice = filteredUsers.slice(startIndex, endIndex);

                return pageSlice.map(u => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isDark={isDark}
                    currentUserId={currentUserId}
                    onViewStats={viewUserStats}
                    onEditRoles={openEditRoles}
                    onToggleStatus={toggleUserStatus}
                  />
                ));
              })()}
            </div>
            
            {/* Paginación */}
            <div className="admin-pagination">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>

              {(() => {
                const total = filteredUsers.length;
                const totalPages = Math.max(1, Math.ceil(total / perPage));
                const visible = 5;
                let start = Math.max(1, currentPage - Math.floor(visible / 2));
                let end = Math.min(totalPages, start + visible - 1);
                if (end - start + 1 < visible) {
                  start = Math.max(1, end - visible + 1);
                }
                const pages = [];
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map(p => (
                  <button 
                    key={p} 
                    onClick={() => setCurrentPage(p)} 
                    className={p === currentPage ? 'active' : ''}
                  >
                    {p}
                  </button>
                ));
              })()}

              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.max(1, Math.ceil(filteredUsers.length / perPage))}>›</button>
              <button onClick={() => setCurrentPage(Math.max(1, Math.ceil(filteredUsers.length / perPage)))} disabled={currentPage >= Math.max(1, Math.ceil(filteredUsers.length / perPage))}>»</button>

              <select 
                value={perPage} 
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ marginLeft: '0.5rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
              >
                {[5,10,20,50].map(n => <option key={n} value={n}>{n} / pág</option>)}
              </select>
            </div>
            </>
          )}

        {/* Modal de estadísticas del usuario (componente) */}
        {showModal && selectedUser && (
          <StatsModal
            user={selectedUser}
            estadisticas={estadisticas}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* Modal de edición de roles (componente) */}
        {showEditModal && selectedUser && (
          <RoleEditor
            user={selectedUser}
            onClose={() => setShowEditModal(false)}
            assignRole={assignRole}
            removeRole={removeRole}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
};

export default Usuarios;