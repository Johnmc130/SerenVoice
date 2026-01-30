# backend/services/actividades_service.py
from backend.database.connection import DatabaseConnection
from datetime import datetime
import json

class ActividadesService:
    
    @staticmethod
    def crear_actividad(id_grupo, id_creador, titulo, descripcion='', tipo_actividad='otro', duracion_estimada=5):
        """Crear una nueva actividad grupal"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                INSERT INTO actividades_grupo
                (id_grupo, id_creador, titulo, descripcion, tipo_actividad, 
                 duracion_estimada, es_actividad_voz, activo, fecha_programada)
                VALUES (%s, %s, %s, %s, %s, %s, 1, 1, NOW())
            """, (id_grupo, id_creador, titulo, descripcion, tipo_actividad, duracion_estimada))
            
            actividad_id = cursor.lastrowid
            conn.commit()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            print(f"✅ Actividad creada con ID: {actividad_id}")
            return actividad_id
            
        except Exception as e:
            print(f"❌ Error creando actividad: {e}")
            return None
    
    @staticmethod
    def agregar_participantes_automaticamente(id_actividad, id_grupo):
        """Agregar todos los miembros activos del grupo como participantes"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Obtener miembros activos del grupo
            cursor.execute("""
                SELECT gm.id_usuario, u.nombre
                FROM grupo_miembros gm
                JOIN usuario u ON gm.id_usuario = u.id_usuario
                WHERE gm.id_grupo = %s AND gm.activo = 1
            """, (id_grupo,))
            
            miembros = cursor.fetchall()
            participantes_agregados = 0
            
            for miembro in miembros:
                try:
                    cursor.execute("""
                        INSERT INTO participacion_actividad 
                        (id_actividad, id_usuario, estado, completada, fecha_registro)
                        VALUES (%s, %s, 'invitado', 0, NOW())
                    """, (id_actividad, miembro['id_usuario']))
                    participantes_agregados += 1
                except Exception as e:
                    print(f"⚠️ Error agregando participante {miembro['nombre']}: {e}")
            
            conn.commit()
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            print(f"✅ {participantes_agregados} participantes agregados")
            return participantes_agregados
            
        except Exception as e:
            print(f"❌ Error agregando participantes: {e}")
            return 0
    
    @staticmethod
    def obtener_actividad(id_actividad):
        """Obtener una actividad por ID"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT 
                    ag.*,
                    u.nombre as nombre_creador
                FROM actividades_grupo ag
                LEFT JOIN usuario u ON ag.id_creador = u.id_usuario
                WHERE ag.id_actividad = %s AND ag.activo = 1
            """, (id_actividad,))
            
            actividad = cursor.fetchone()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return actividad
            
        except Exception as e:
            print(f"❌ Error obteniendo actividad: {e}")
            return None
    
    @staticmethod
    def obtener_actividades_grupo(id_grupo):
        """Obtener todas las actividades de un grupo"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT 
                    ag.*,
                    u.nombre as nombre_creador,
                    (SELECT COUNT(*) FROM participacion_actividad 
                     WHERE id_actividad = ag.id_actividad) as total_participantes,
                    (SELECT COUNT(*) FROM participacion_actividad 
                     WHERE id_actividad = ag.id_actividad AND completada = 1) as participantes_completados
                FROM actividades_grupo ag
                LEFT JOIN usuario u ON ag.id_creador = u.id_usuario
                WHERE ag.id_grupo = %s AND ag.activo = 1
                ORDER BY ag.fecha_programada DESC
            """, (id_grupo,))
            
            actividades = cursor.fetchall()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return actividades
            
        except Exception as e:
            print(f"❌ Error obteniendo actividades: {e}")
            return []
    
    @staticmethod
    def obtener_participantes(id_actividad):
        """Obtener participantes de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT 
                    pa.id_participacion,
                    pa.id_usuario,
                    pa.estado,
                    pa.completada,
                    pa.fecha_registro,
                    pa.fecha_conexion,
                    pa.fecha_completada,
                    pa.notas_participante,
                    pa.estado_emocional_antes,
                    pa.estado_emocional_despues,
                    u.nombre
                FROM participacion_actividad pa
                INNER JOIN usuario u ON pa.id_usuario = u.id_usuario
                WHERE pa.id_actividad = %s
                ORDER BY pa.fecha_registro ASC
            """, (id_actividad,))
            
            participantes = cursor.fetchall()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return participantes
            
        except Exception as e:
            print(f"❌ Error obteniendo participantes: {e}")
            return []
    
    @staticmethod
    def verificar_es_participante(id_actividad, id_usuario):
        """Verificar si un usuario es participante de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT * FROM participacion_actividad
                WHERE id_actividad = %s AND id_usuario = %s
            """, (id_actividad, id_usuario))
            
            participante = cursor.fetchone()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return participante is not None
            
        except Exception as e:
            print(f"❌ Error verificando participante: {e}")
            return False
    
    @staticmethod
    def marcar_participante_conectado(id_actividad, id_usuario):
        """Marcar participante como conectado"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE participacion_actividad
                SET estado = 'conectado', fecha_conexion = NOW()
                WHERE id_actividad = %s AND id_usuario = %s
            """, (id_actividad, id_usuario))
            
            conn.commit()
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return True
            
        except Exception as e:
            print(f"❌ Error marcando conectado: {e}")
            return False
    
    @staticmethod
    def marcar_participante_completado(id_actividad, id_usuario, notas='', estado_antes='', estado_despues=''):
        """Marcar participante como completado"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE participacion_actividad
                SET 
                    estado = 'completado',
                    completada = 1,
                    fecha_completada = NOW(),
                    notas_participante = %s,
                    estado_emocional_antes = %s,
                    estado_emocional_despues = %s
                WHERE id_actividad = %s AND id_usuario = %s
            """, (notas, estado_antes, estado_despues, id_actividad, id_usuario))
            
            conn.commit()
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return True
            
        except Exception as e:
            print(f"❌ Error marcando completado: {e}")
            return False
    
    @staticmethod
    def obtener_estadisticas_actividad(id_actividad):
        """Obtener estadísticas de una actividad"""
        try:
            conn = DatabaseConnection.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completados,
                    SUM(CASE WHEN estado = 'conectado' THEN 1 ELSE 0 END) as conectados,
                    SUM(CASE WHEN estado = 'invitado' THEN 1 ELSE 0 END) as pendientes
                FROM participacion_actividad
                WHERE id_actividad = %s
            """, (id_actividad,))
            
            stats = cursor.fetchone()
            
            cursor.close()
            DatabaseConnection.return_connection(conn)
            
            return stats
            
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return None
    
    @staticmethod
    def verificar_todos_completaron(id_actividad):
        """Verificar si todos los participantes completaron la actividad"""
        try:
            stats = ActividadesService.obtener_estadisticas_actividad(id_actividad)
            if stats:
                return stats['total'] > 0 and stats['completados'] == stats['total']
            return False
            
        except Exception as e:
            print(f"❌ Error verificando completados: {e}")
            return False