import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./global.css";

// Páginas públicas
import Inicio from "./Pages/PaginasPublicas/Inicio.jsx";
import Login from "./Pages/PaginasPublicas/Login.jsx";
import Registro from "./Pages/PaginasPublicas/Registro.jsx";
import Sobre from "./Pages/PaginasPublicas/Sobre.jsx";
import Contacto from "./Pages/PaginasPublicas/Contacto.jsx";
import ProbarVoz from "./Pages/PaginasPublicas/ProbarVoz.jsx";
import VerificarEmail from "./Pages/PaginasPublicas/VerificarEmail.jsx";
import OlvideMiContrasena from "./Pages/PaginasPublicas/OlvideMiContrasena.jsx";
import ResetearContrasena from "./Pages/PaginasPublicas/ResetearContrasena.jsx";
import RegistroExitoso from "./Pages/PaginasPublicas/RegistroExitoso.jsx";

// Páginas de usuarios
import Dashboard from "./Pages/PaginasUsuarios/Dashboard.jsx";
import ActualizarPerfil from "./Pages/PaginasUsuarios/ActualizarPerfil.jsx";
import Configuracion from "./Pages/PaginasUsuarios/Configuracion.jsx";
import ConfiguracionNotificaciones from "./Pages/PaginasUsuarios/ConfiguracionNotificaciones.jsx";
import Sesiones from "./Pages/PaginasUsuarios/Sesiones.jsx";
import Notificaciones from "./Pages/PaginasUsuarios/Notificaciones.jsx";
import Historial from "./Pages/PaginasUsuarios/Historial.jsx";
import Recomendaciones from "./Pages/PaginasUsuarios/Recomendaciones.jsx";
import ReportesUsuario from "./Pages/PaginasUsuarios/ReportesUsuario.jsx";
import Perfil from "./Pages/PaginasUsuarios/Perfil.jsx";
import AnalizarVoz from "./Pages/PaginasUsuarios/AnalizarVoz.jsx";
import ResultadoDetallado from "./Pages/PaginasUsuarios/ResultadoDetallado.jsx";
import JuegoContainer from './Pages/PaginasUsuarios/JuegoContainer';
import GamesPage from './Pages/PaginasUsuarios/GamesPage.jsx';
import JuegoRecomendado from "./Pages/PaginasUsuarios/JuegoRecomendado.jsx";

// Páginas de administradores
import DashboardAdmin from "./Pages/PaginasAdministradores/DashboardAdmin.jsx";
import ConfiguracionAdmin from "./Pages/PaginasAdministradores/ConfiguracionAdmin.jsx";
import Usuarios from "./Pages/PaginasAdministradores/Usuarios.jsx";
import Alertas from "./Pages/PaginasAdministradores/Alertas.jsx";
import Reportes from "./Pages/PaginasAdministradores/Reportes.jsx";
import PerfilAdmin from "./Pages/PaginasAdministradores/PerfilAdmin.jsx";
import GruposAdmin from "./Pages/PaginasAdministradores/Grupos.jsx";
import GrupoFormAdmin from "./Pages/PaginasAdministradores/GrupoForm.jsx";
import MiembrosAdmin from "./Pages/PaginasAdministradores/Miembros.jsx";
import ActividadesGrupoAdmin from "./Pages/PaginasAdministradores/ActividadesGrupo.jsx";
import AuditoriaAdmin from "./Pages/PaginasAdministradores/Auditoria.jsx";
import NotificacionesAdmin from "./Pages/PaginasAdministradores/Notificaciones.jsx";
import SesionesJuegoAdmin from "./Pages/PaginasAdministradores/SesionesJuego.jsx";
import RecomendacionesAdmin from "./Pages/PaginasAdministradores/Recomendaciones.jsx";
import JuegosAdmin from "./Pages/PaginasAdministradores/JuegosAdmin.jsx";
import AnalisisAdmin from "./Pages/PaginasAdministradores/AnalisisAdmin.jsx";
import PreferenciasNotificacion from "./Pages/PaginasAdministradores/PreferenciasNotificacion.jsx";
import Grupos from "./Pages/PaginasUsuarios/Grupos.jsx";
import BuscarGrupos from "./Pages/PaginasUsuarios/BuscarGrupos.jsx";
import DetalleGrupo from "./Pages/PaginasUsuarios/DetalleGrupo.jsx";
import GrupoForm from "./Pages/PaginasUsuarios/GrupoForm.jsx";
import Miembros from "./Pages/PaginasUsuarios/Miembros.jsx";
import ActividadesGrupo from "./Pages/PaginasUsuarios/ActividadesGrupo.jsx";
import ActividadDetalle from "./Pages/PaginasUsuarios/ActividadDetalle.jsx";
import ReportesUsuarioPage from "./Pages/PaginasUsuarios/Reportes.jsx";
import Invitaciones from "./Pages/PaginasUsuarios/Invitaciones.jsx";

// Layout
import LayoutUsuario from "./layouts/LayoutUsuario.jsx";
import LayoutAdmin from "./layouts/LayoutAdmin.jsx";

// Contextos y utilidades
import PageWithTitle from "./utils/PageWithTitle.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./utils/ProtectedRoute.jsx";
import HomeRedirect from "./utils/HomeRedirect.jsx";
import { AlertasProvider } from "./context/AlertasContext.jsx";
import { GOOGLE_CLIENT_ID } from "./config/api.js";

// Wrapper condicional para GoogleOAuthProvider
const GoogleOAuthWrapper = ({ children }) => {
	if (GOOGLE_CLIENT_ID) {
		return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
	}
	return <>{children}</>;
};

function App() {
	return (
		<GoogleOAuthWrapper>
			<ThemeProvider>
				<AuthProvider>
					<AlertasProvider>
						<Router>
						<Routes>
							{/* Ruta raíz - Redirecciona según autenticación */}
							<Route path="/" element={<PageWithTitle title="Inicio"><HomeRedirect /></PageWithTitle>} />
							
							{/* Páginas públicas */}
							<Route path="/Inicio" element={<PageWithTitle title="Inicio"><Inicio /></PageWithTitle>} />
							<Route path="/login" element={<PageWithTitle title="Iniciar Sesión"><Login /></PageWithTitle>} />
							<Route path="/registro" element={<PageWithTitle title="Registro"><Registro /></PageWithTitle>} />
							<Route path="/sobre" element={<PageWithTitle title="Sobre"><Sobre /></PageWithTitle>} />
							<Route path="/contacto" element={<PageWithTitle title="Contacto"><Contacto /></PageWithTitle>} />
							<Route path="/probar" element={<PageWithTitle title="Probar Voz"><ProbarVoz /></PageWithTitle>} />
						<Route path="/verificar-email" element={<PageWithTitle title="Verificar Email"><VerificarEmail /></PageWithTitle>} />
						<Route path="/olvide-mi-contrasena" element={<PageWithTitle title="Recuperar Contraseña"><OlvideMiContrasena /></PageWithTitle>} />
						<Route path="/resetear-contrasena" element={<PageWithTitle title="Restablecer Contraseña"><ResetearContrasena /></PageWithTitle>} />
						<Route path="/registro-exitoso" element={<PageWithTitle title="Registro Exitoso"><RegistroExitoso /></PageWithTitle>} />

						{/* Páginas de usuarios - Con Layout y Sidebar */}
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Dashboard">
										<LayoutUsuario>
											<Dashboard />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/actualizar-perfil"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Actualizar Perfil">
										<LayoutUsuario>
											<ActualizarPerfil />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/historial"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Historial">
										<LayoutUsuario>
											<Historial />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/resultado-detallado/:id"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Resultado Detallado">
										<LayoutUsuario>
											<ResultadoDetallado />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/analizar-voz"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Analizar Voz">
										<LayoutUsuario>
											<AnalizarVoz />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/juegos"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Juegos">
										<LayoutUsuario>
											<GamesPage />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/juegos/:id"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Juego">
										<LayoutUsuario>
											<JuegoContainer />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/recomendaciones"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Recomendaciones">
										<LayoutUsuario>
											<Recomendaciones />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/reportes-personales"
							element={
								<ProtectedRoute>
									<PageWithTitle title="Reportes">
										<LayoutUsuario>
											<ReportesUsuario />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/configuracion"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Configuración">
										<LayoutUsuario>
											<Configuracion />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/sesiones"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Mis Sesiones">
										<LayoutUsuario>
											<Sesiones />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/notificaciones"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Notificaciones">
										<LayoutUsuario>
											<Notificaciones />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/notificaciones/configuracion"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Configuración de Notificaciones">
										<LayoutUsuario>
											<ConfiguracionNotificaciones />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

							{/* Páginas de administradores */}
							<Route
								path="/admin/dashboard"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Panel de Administración">
											<LayoutAdmin>
												<DashboardAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/usuarios"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Gestión de Usuarios">
											<LayoutAdmin>
												<Usuarios />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/perfil"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Perfil Admin">
											<LayoutAdmin>
												<PerfilAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

						<Route
							path="/grupos"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Grupos">
										<LayoutUsuario>
											<Grupos />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/invitaciones"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Invitaciones">
										<LayoutUsuario>
											<Invitaciones />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/buscar-grupos"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Explorar Grupos">
										<LayoutUsuario>
											<BuscarGrupos />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/reportes"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Mis Reportes">
										<LayoutUsuario>
											<ReportesUsuarioPage />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/grupos/nuevo"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Crear Grupo">
										<LayoutUsuario>
											<GrupoForm />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/grupos/:id"
							element={
								<ProtectedRoute requiredRole="usuario">
								<PageWithTitle title="Detalle del Grupo">
									<LayoutUsuario>
										<DetalleGrupo />
									</LayoutUsuario>
								</PageWithTitle>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/grupos/:id/editar"
						element={
							<ProtectedRoute requiredRole="usuario">
								<PageWithTitle title="Editar Grupo">
									<LayoutUsuario>
										<GrupoForm />
									</LayoutUsuario>
								</PageWithTitle>
							</ProtectedRoute>
						}
					/>

						<Route
							path="/grupos/:id/miembros"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Miembros del Grupo">
										<LayoutUsuario>
											<Miembros />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/grupos/:id/actividades"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Actividades del Grupo">
										<LayoutUsuario>
											<ActividadesGrupo />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/grupos/:grupoId/actividad/:actividadId"
							element={
								<ProtectedRoute requiredRole="usuario">
									<PageWithTitle title="Actividad">
										<LayoutUsuario>
											<ActividadDetalle />
										</LayoutUsuario>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

						{/* Páginas de administradores */}
						<Route
							path="/admin/reportes"
							element={
								<ProtectedRoute requiredRole="admin">
									<PageWithTitle title="Reportes">
										<LayoutAdmin>
											<Reportes />
										</LayoutAdmin>
									</PageWithTitle>
								</ProtectedRoute>
							}
						/>

							<Route
								path="/admin/alertas"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Alertas">
											<LayoutAdmin>
												<Alertas />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/configuracion"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Configuración Admin">
											<LayoutAdmin>
												<ConfiguracionAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/grupos"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Grupos Admin">
											<LayoutAdmin>
												<GruposAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/grupos/nuevo"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Crear Grupo">
											<LayoutAdmin>
												<GrupoFormAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/grupos/:id"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Editar Grupo">
											<LayoutAdmin>
												<GrupoFormAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/grupos/:id/miembros"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Miembros del Grupo">
											<LayoutAdmin>
												<MiembrosAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/grupos/:id/actividades"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Actividades del Grupo">
											<LayoutAdmin>
												<ActividadesGrupoAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/notificaciones"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Notificaciones Admin">
											<LayoutAdmin>
												<NotificacionesAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/auditoria"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Auditoría">
											<LayoutAdmin>
												<AuditoriaAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/sesiones-juego"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Sesiones de Juego">
											<LayoutAdmin>
												<SesionesJuegoAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/recomendaciones"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Recomendaciones Admin">
											<LayoutAdmin>
												<RecomendacionesAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/juegos"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Juegos Terapéuticos">
											<LayoutAdmin>
												<JuegosAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/analisis"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Análisis Emocional">
											<LayoutAdmin>
												<AnalisisAdmin />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							<Route
								path="/admin/preferencias-notificacion"
								element={
									<ProtectedRoute requiredRole="admin">
										<PageWithTitle title="Preferencias de Notificación">
											<LayoutAdmin>
												<PreferenciasNotificacion />
											</LayoutAdmin>
										</PageWithTitle>
									</ProtectedRoute>
								}
							/>

							{/* Ruta por defecto */}
							<Route path="*" element={<Navigate to="/Inicio" />} />
						</Routes>
					</Router>
				</AlertasProvider>
			</AuthProvider>
		</ThemeProvider>
		</GoogleOAuthWrapper>
	);
}

export default App;
