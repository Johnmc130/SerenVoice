# backend/models/actividad_grupo.py
from backend.database.connection import DatabaseConnection
from datetime import date

class ActividadGrupo:
    """Modelo para la tabla actividades_grupo"""
    
    @staticmethod
    def create(id_grupo, id_creador, titulo, descripcion=None, tipo_actividad='tarea',
               fecha_programada=None, duracion_estimada=None, creador_participa=True):
        """Crear una nueva actividad para un grupo"""
        # Nota: La tabla usa fecha_inicio/fecha_fin, no fecha_programada/duracion_estimada
        # fecha_programada se mapea a fecha_inicio, duracion_estimada se ignora
        query = """
            INSERT INTO actividades_grupo 
            (id_grupo, id_creador, titulo, descripcion, tipo_actividad, fecha_inicio)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query, 
            (id_grupo, id_creador, titulo, descripcion, tipo_actividad, fecha_programada),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_actividad):
        """Obtener actividad por ID"""
        query = """
            SELECT ag.*, u.nombre as creador_nombre, u.apellido as creador_apellido
            FROM actividades_grupo ag
            JOIN usuario u ON ag.id_creador = u.id_usuario
            WHERE ag.id_actividad = %s AND ag.activo = 1
        """
        results = DatabaseConnection.execute_query(query, (id_actividad,))
        return results[0] if results else None
    
    @staticmethod
    def obtener_con_participantes(id_actividad):
        """Obtener actividad con participantes incluidos"""
        # Obtener actividad
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return None
        
        # Obtener participantes
        participantes = ParticipacionActividad.get_activity_participants(id_actividad)
        
        return {
            'actividad': actividad,
            'participantes': participantes or []
        }
    
    @staticmethod
    def get_by_grupo(id_grupo, completada=None):
        """Obtener actividades de un grupo"""
        query = """
            SELECT ag.*, u.nombre as creador_nombre, u.apellido as creador_apellido,
                   COUNT(DISTINCT pa.id_usuario) as participantes_totales,
                   COUNT(DISTINCT CASE WHEN pa.completada = 1 THEN pa.id_usuario END) as participantes_completados
            FROM actividades_grupo ag
            JOIN usuario u ON ag.id_creador = u.id_usuario
            LEFT JOIN participacion_actividad pa ON ag.id_actividad = pa.id_actividad
            WHERE ag.id_grupo = %s AND ag.activo = 1
        """
        params = [id_grupo]
        
        if completada is not None:
            query += " AND ag.completada = %s"
            params.append(completada)
        
        query += """
            GROUP BY ag.id_actividad
            ORDER BY ag.fecha_inicio DESC, ag.id_actividad DESC
        """
        return DatabaseConnection.execute_query(query, tuple(params))
    
    @staticmethod
    def get_upcoming(id_grupo, limit=10):
        """Obtener próximas actividades programadas"""
        query = """
            SELECT ag.*, u.nombre as creador_nombre, u.apellido as creador_apellido
            FROM actividades_grupo ag
            JOIN usuario u ON ag.id_creador = u.id_usuario
            WHERE ag.id_grupo = %s 
              AND ag.activo = 1 
              AND ag.completada = 0
              AND (ag.fecha_inicio IS NULL OR ag.fecha_inicio >= CURDATE())
            ORDER BY ag.fecha_inicio ASC
            LIMIT %s
        """
        return DatabaseConnection.execute_query(query, (id_grupo, limit))
    
    @staticmethod
    def update(id_actividad, **kwargs):
        """Actualizar actividad"""
        allowed_fields = ['titulo', 'descripcion', 'tipo_actividad', 
                 'fecha_inicio', 'completada']
        
        updates = []
        values = []
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(id_actividad)
        query = f"UPDATE actividades_grupo SET {', '.join(updates)} WHERE id_actividad = %s"
        DatabaseConnection.execute_query(query, tuple(values), fetch=False)
        return True
    
    @staticmethod
    def obtener_con_participantes(id_actividad):
        """Obtener actividad con lista de participantes"""
        # Obtener actividad
        actividad = ActividadGrupo.get_by_id(id_actividad)
        if not actividad:
            return None
        
        # Obtener participantes
        query = """
            SELECT DISTINCT
                u.id_usuario as id_participante,
                u.id_usuario,
                CONCAT(u.nombre, ' ', u.apellido) as nombre,
                CASE 
                    WHEN pa.completada = 1 THEN 'completado'
                    WHEN pa.id_participacion IS NOT NULL THEN 'en_progreso'
                    ELSE 'pendiente'
                END as estado,
                pa.fecha_union,
                CASE WHEN ava.id_analisis > 0 THEN 1 ELSE 0 END as voz_analizada,
                COALESCE(ava.nivel_estres, 0) as nivel_estres
            FROM grupo_miembro gm
            JOIN usuario u ON gm.id_usuario = u.id_usuario
            LEFT JOIN participacion_actividad pa ON pa.id_actividad = %s AND pa.id_usuario = u.id_usuario
            LEFT JOIN analisis_voz_actividad ava ON ava.id_actividad = %s AND ava.id_usuario = u.id_usuario
            WHERE gm.id_grupo = %s AND gm.activo = 1
            ORDER BY u.nombre
        """
        participantes = DatabaseConnection.execute_query(
            query, 
            (id_actividad, id_actividad, actividad.get('id_grupo'))
        )
        
        return {
            'actividad': actividad,
            'participantes': participantes or []
        }
    
    @staticmethod
    def mark_completed(id_actividad):
        """Marcar actividad como completada"""
        query = "UPDATE actividades_grupo SET completada = 1 WHERE id_actividad = %s"
        DatabaseConnection.execute_query(query, (id_actividad,), fetch=False)
        return True
    
    @staticmethod
    def delete(id_actividad):
        """Eliminar actividad (soft delete)"""
        query = "UPDATE actividades_grupo SET activo = 0 WHERE id_actividad = %s"
        DatabaseConnection.execute_query(query, (id_actividad,), fetch=False)
        return True


class ParticipacionActividad:
    """Modelo para la tabla participacion_actividad"""
    
    @staticmethod
    def create(id_actividad, id_usuario, estado_emocional_antes=None, notas_participante=None):
        """Registrar participación en una actividad"""
        query = """
            INSERT INTO participacion_actividad 
            (id_actividad, id_usuario, estado_emocional_antes, notas_participante)
            VALUES (%s, %s, %s, %s)
        """
        return DatabaseConnection.execute_query(
            query, 
            (id_actividad, id_usuario, estado_emocional_antes, notas_participante),
            fetch=False
        )
    
    @staticmethod
    def get_by_id(id_participacion):
        """Obtener participación por ID"""
        query = "SELECT * FROM participacion_actividad WHERE id_participacion = %s"
        results = DatabaseConnection.execute_query(query, (id_participacion,))
        return results[0] if results else None
    
    @staticmethod
    def get_user_participation(id_actividad, id_usuario):
        """Obtener participación de un usuario en una actividad"""
        query = """
            SELECT * FROM participacion_actividad 
            WHERE id_actividad = %s AND id_usuario = %s
        """
        results = DatabaseConnection.execute_query(query, (id_actividad, id_usuario))
        return results[0] if results else None
    
    @staticmethod
    def get_activity_participants(id_actividad):
        """Obtener todos los participantes de una actividad con sus resultados de análisis"""
        query = """
            SELECT 
                pa.*, 
                u.nombre, 
                u.apellido, 
                u.correo,
                u.foto_perfil,
                CASE 
                    WHEN pa.completada = 1 THEN 'completado'
                    WHEN pa.conectado = 1 THEN 'conectado'
                    ELSE 'pendiente'
                END as estado_participante,
                ra.id_resultado as ra_id_resultado,
                ra.emocion_dominante as ra_emocion_dominante,
                ra.nivel_felicidad as ra_nivel_felicidad,
                ra.nivel_tristeza as ra_nivel_tristeza,
                ra.nivel_enojo as ra_nivel_enojo,
                ra.nivel_miedo as ra_nivel_miedo,
                ra.nivel_sorpresa as ra_nivel_sorpresa,
                ra.nivel_neutral as ra_nivel_neutral,
                ra.nivel_estres as ra_nivel_estres,
                ra.nivel_ansiedad as ra_nivel_ansiedad
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            LEFT JOIN resultado_analisis ra ON pa.id_resultado = ra.id_resultado
            WHERE pa.id_actividad = %s
            ORDER BY pa.fecha_completada DESC, pa.id DESC
        """
        results = DatabaseConnection.execute_query(query, (id_actividad,))
        
        # Reorganizar resultado_analisis como objeto anidado
        participantes = []
        for p in results:
            participante = {
                'id': p.get('id'),
                'id_actividad': p.get('id_actividad'),
                'id_usuario': p.get('id_usuario'),
                'completada': p.get('completada'),
                'conectado': p.get('conectado'),
                'fecha_completada': p.get('fecha_completada'),
                'estado_emocional_despues': p.get('estado_emocional_despues'),
                'notas_participante': p.get('notas_participante'),
                'id_audio': p.get('id_audio'),
                'id_analisis': p.get('id_analisis'),
                'id_resultado': p.get('id_resultado'),
                'nombre': p.get('nombre'),
                'apellido': p.get('apellido'),
                'correo': p.get('correo'),
                'foto_perfil': p.get('foto_perfil'),
                'estado': p.get('estado_participante')
            }
            
            # Si tiene resultado de análisis, agregarlo como objeto anidado
            if p.get('ra_id_resultado'):
                participante['resultado_analisis'] = {
                    'id_resultado': p.get('ra_id_resultado'),
                    'emocion_predominante': p.get('ra_emocion_dominante'),  # Frontend espera emocion_predominante
                    'nivel_felicidad': p.get('ra_nivel_felicidad'),
                    'nivel_tristeza': p.get('ra_nivel_tristeza'),
                    'nivel_enojo': p.get('ra_nivel_enojo'),
                    'nivel_miedo': p.get('ra_nivel_miedo'),
                    'nivel_sorpresa': p.get('ra_nivel_sorpresa'),
                    'nivel_neutral': p.get('ra_nivel_neutral'),
                    'nivel_estres': p.get('ra_nivel_estres'),
                    'nivel_ansiedad': p.get('ra_nivel_ansiedad')
                }
            else:
                participante['resultado_analisis'] = None
            
            participantes.append(participante)
        
        return participantes
    
    @staticmethod
    def mark_completed(id_participacion, estado_emocional_despues=None, notas_participante=None, 
                       id_audio=None, id_analisis=None, id_resultado=None):
        """Marcar participación como completada con análisis de voz opcional"""
        query = """
            UPDATE participacion_actividad 
            SET completada = 1, 
                fecha_completada = NOW(),
                estado_emocional_despues = %s,
                notas_participante = COALESCE(%s, notas_participante),
                id_audio = COALESCE(%s, id_audio),
                id_analisis = COALESCE(%s, id_analisis),
                id_resultado = COALESCE(%s, id_resultado)
            WHERE id_participacion = %s
        """
        DatabaseConnection.execute_query(
            query, 
            (estado_emocional_despues, notas_participante, id_audio, id_analisis, id_resultado, id_participacion),
            fetch=False
        )
        return True
    
    @staticmethod
    def update_notes(id_participacion, notas):
        """Actualizar notas del participante"""
        query = "UPDATE participacion_actividad SET notas_participante = %s WHERE id_participacion = %s"
        DatabaseConnection.execute_query(query, (notas, id_participacion), fetch=False)
        return True
