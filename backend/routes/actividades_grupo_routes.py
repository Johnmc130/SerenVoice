# backend/routes/actividades_grupo_routes.py
"""
🎯 SISTEMA COMPLETO DE ACTIVIDADES GRUPALES CON ANÁLISIS EMOCIONAL
- Crear actividad y agregar participantes automáticamente
- Iniciar actividad y enviar notificaciones en tiempo real
- Los participantes se conectan y graban su voz
- Cuando TODOS completan, se calcula el promedio grupal automáticamente
- Se notifica a todos con los resultados
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from backend.services.audio_service import AudioService
from backend.services.notificaciones_service import NotificacionesService
from backend.utils.security_middleware import secure_log, limiter
from backend.database.connection import DatabaseConnection
import traceback
import os
import json
from datetime import datetime
from collections import Counter
import statistics

bp = Blueprint('actividades_grupo', __name__, url_prefix='/api/actividades_grupo')


# ============================================================
# 1. CREAR ACTIVIDAD Y AGREGAR PARTICIPANTES AUTOMÁTICAMENTE
# ============================================================
@bp.route('/<int:grupo_id>/crear', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def crear_actividad(grupo_id):
    """
    Crear actividad grupal y agregar AUTOMÁTICAMENTE a todos los miembros del grupo
    """
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()

        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        tipo_actividad = data.get('tipo_actividad', 'otro')
        duracion_minutos = data.get('duracion_minutos', 5)

        if not nombre:
            return jsonify({'success': False, 'error': 'Nombre requerido'}), 400
        
        # Validar longitud del nombre
        nombre = nombre.strip()
        if len(nombre) < 3:
            return jsonify({'success': False, 'error': 'El nombre debe tener al menos 3 caracteres'}), 400
        if len(nombre) > 200:
            return jsonify({'success': False, 'error': 'El nombre no puede exceder 200 caracteres'}), 400
        
        # Validar descripción
        if descripcion and len(descripcion) > 1000:
            return jsonify({'success': False, 'error': 'La descripción no puede exceder 1000 caracteres'}), 400
        
        # Validar duración
        try:
            duracion_minutos = int(duracion_minutos)
            if duracion_minutos < 1:
                return jsonify({'success': False, 'error': 'La duración debe ser al menos 1 minuto'}), 400
            if duracion_minutos > 480:  # 8 horas máximo
                return jsonify({'success': False, 'error': 'La duración no puede exceder 480 minutos (8 horas)'}), 400
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': 'La duración debe ser un número válido'}), 400
        
        # Validar fecha_inicio si se proporciona
        fecha_inicio_str = data.get('fecha_inicio')
        if fecha_inicio_str:
            try:
                from datetime import datetime
                # Intentar parsear la fecha
                fecha_inicio_parsed = None
                for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M', '%Y-%m-%d %H:%M:%S']:
                    try:
                        fecha_inicio_parsed = datetime.strptime(fecha_inicio_str, fmt)
                        break
                    except ValueError:
                        continue
                
                if fecha_inicio_parsed:
                    # Validar que no sea una fecha pasada
                    if fecha_inicio_parsed.date() < datetime.now().date():
                        return jsonify({'success': False, 'error': 'La fecha de inicio no puede ser anterior a hoy'}), 400
            except Exception as e:
                return jsonify({'success': False, 'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}), 400

        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)

        # Crear actividad (sin campo 'estado' ya que no lo tienes)
        cursor.execute("""
            INSERT INTO actividades_grupo
            (id_grupo, id_creador, titulo, descripcion, tipo_actividad, duracion_estimada, 
             es_actividad_voz, activo, fecha_inicio)
            VALUES (%s, %s, %s, %s, %s, %s, 1, 1, NOW())
        """, (grupo_id, usuario_id, nombre, descripcion, tipo_actividad, duracion_minutos))

        actividad_id = cursor.lastrowid
        conn.commit()

        # Agregar TODOS los miembros del grupo como participantes
        cursor.execute("""
            SELECT gm.id_usuario, u.nombre 
            FROM grupo_miembros gm
            JOIN usuario u ON gm.id_usuario = u.id_usuario
            WHERE gm.id_grupo = %s 
              AND gm.estado = 'activo'
        """, (grupo_id,))
        
        miembros = cursor.fetchall()
        
        # Agregar cada miembro como participante
        participantes_agregados = 0
        for miembro in miembros:
            try:
                cursor.execute("""
                    INSERT INTO participacion_actividad 
                    (id_actividad, id_usuario, completada, conectado)
                    VALUES (%s, %s, 0, 0)
                """, (actividad_id, miembro['id_usuario']))
                participantes_agregados += 1
            except Exception as e:
                print(f"⚠️ Error agregando participante {miembro['nombre']}: {e}")
        
        conn.commit()
        cursor.close()
        DatabaseConnection.return_connection(conn)

        print(f"\n✅ Actividad '{nombre}' creada con {participantes_agregados} participantes")

        return jsonify({
            'success': True,
            'data': {
                'id_actividad': actividad_id,
                'participantes_agregados': participantes_agregados,
                'mensaje': f'Actividad creada con {participantes_agregados} participantes'
            }
        }), 201

    except Exception as e:
        print(f"❌ Error creando actividad: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 2. INICIAR ACTIVIDAD - ENVIAR NOTIFICACIONES A TODOS
# ============================================================
@bp.route('/<int:actividad_id>/iniciar', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def iniciar_actividad(actividad_id):
    """
    El CREADOR inicia la actividad y se envían notificaciones a TODOS los participantes
    """
    try:
        usuario_id = get_jwt_identity()
        # Convertir a int para comparación correcta (JWT puede devolver string)
        usuario_id = int(usuario_id) if usuario_id else None
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verificar que la actividad existe
        cursor.execute("SELECT * FROM actividades_grupo WHERE id_actividad = %s", (actividad_id,))
        actividad = cursor.fetchone()
        
        if not actividad:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Actividad no encontrada'}), 404
            
        # Verificar que el usuario es el creador (asegurar comparación int con int)
        if int(actividad['id_creador']) != usuario_id:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Solo el creador puede iniciar la actividad'}), 403

        # Marcar fecha de inicio (importante para calcular estado 'iniciada')
        cursor.execute("""
            UPDATE actividades_grupo
            SET fecha_inicio = NOW()
            WHERE id_actividad = %s
        """, (actividad_id,))
        conn.commit()

        # Obtener TODOS los participantes
        cursor.execute("""
            SELECT 
                pa.id_usuario,
                u.nombre
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            WHERE pa.id_actividad = %s
        """, (actividad_id,))
        
        participantes = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        print(f"\n{'='*70}")
        print(f"🚀 INICIANDO ACTIVIDAD #{actividad_id}: {actividad['titulo']}")
        print(f"👤 Creador: Usuario #{usuario_id}")
        print(f"👥 Total participantes: {len(participantes)}")
        print(f"{'='*70}\n")
        
        # Enviar notificaciones a cada participante (excepto el creador)
        notificaciones_enviadas = 0
        notificaciones_fallidas = 0
        
        for participante in participantes:
            try:
                # NO notificar al creador
                if participante['id_usuario'] == usuario_id:
                    print(f"⏭️  Saltando creador: {participante['nombre']}")
                    continue
                
                print(f"📨 Enviando notificación a: {participante['nombre']} (ID: {participante['id_usuario']})")
                
                # Crear notificación
                notif_id = NotificacionesService.crear_notificacion(
                    id_usuario=participante['id_usuario'],
                    tipo_notificacion='actividad_grupo',
                    titulo=f"🎯 Actividad iniciada: {actividad['titulo']}",
                    mensaje=f"La actividad grupal ha comenzado. Únete ahora para participar.",
                    prioridad='alta',
                    url_accion=f'/actividades/{actividad_id}',
                    id_referencia=actividad_id,
                    tipo_referencia='actividad'
                )
                
                if notif_id:
                    notificaciones_enviadas += 1
                    print(f"   ✅ Notificación enviada (ID: {notif_id})")
                else:
                    notificaciones_fallidas += 1
                    print(f"   ❌ Error al enviar notificación")
                    
            except Exception as e:
                notificaciones_fallidas += 1
                print(f"   ❌ Error: {str(e)}")

        print(f"\n{'='*70}")
        print(f"📊 RESUMEN:")
        print(f"   ✅ Notificaciones enviadas: {notificaciones_enviadas}")
        print(f"   ❌ Notificaciones fallidas: {notificaciones_fallidas}")
        print(f"   👥 Total participantes: {len(participantes)}")
        print(f"{'='*70}\n")

        return jsonify({
            'success': True,
            'data': {
                'id_actividad': actividad_id,
                'estado': 'iniciada',
                'notificaciones_enviadas': notificaciones_enviadas,
                'total_participantes': len(participantes)
            }
        }), 200

    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 3. MARCAR USUARIO COMO CONECTADO
# ============================================================
@bp.route('/<int:actividad_id>/conectar', methods=['POST'])
@jwt_required()
def marcar_conectado(actividad_id):
    """
    El usuario marca que está conectado y listo para participar
    """
    try:
        usuario_id = get_jwt_identity()
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verificar que es participante
        cursor.execute("""
            SELECT * FROM participacion_actividad
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, usuario_id))
        
        participante = cursor.fetchone()
        
        if not participante:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'No eres participante'}), 403

        # Actualizar a conectado
        cursor.execute("""
            UPDATE participacion_actividad
            SET conectado = 1, fecha_union = NOW()
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, usuario_id))
        
        conn.commit()
        
        # Obtener estadísticas
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN conectado = 1 THEN 1 ELSE 0 END) as conectados,
                SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completados
            FROM participacion_actividad
            WHERE id_actividad = %s
        """, (actividad_id,))
        
        stats = cursor.fetchone()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        print(f"✅ Usuario #{usuario_id} conectado a actividad #{actividad_id}")
        print(f"   📊 {stats['conectados']}/{stats['total']} conectados")

        return jsonify({
            'success': True,
            'data': {
                'mensaje': 'Conectado exitosamente',
                'conectados': stats['conectados'],
                'total': stats['total']
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 4. SUBIR ANÁLISIS DE VOZ DEL PARTICIPANTE
# ============================================================
@bp.route('/<int:actividad_id>/analizar', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def analizar_voz(actividad_id):
    """
    El participante sube su audio para análisis.
    Si TODOS completan, se calcula automáticamente el promedio grupal.
    """
    try:
        usuario_id = get_jwt_identity()
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verificar que es participante y está conectado
        cursor.execute("""
            SELECT * FROM participacion_actividad
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, usuario_id))
        
        participante = cursor.fetchone()
        
        if not participante:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'No eres participante'}), 403

        # Verificar que hay archivo de audio
        if 'audio' not in request.files:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'No se proporcionó archivo de audio'}), 400

        audio_file = request.files['audio']
        
        # Guardar archivo temporalmente con la extensión correcta
        original_filename = audio_file.filename or 'audio.m4a'
        file_extension = original_filename.rsplit('.', 1)[1] if '.' in original_filename else 'm4a'
        filename = secure_filename(f"act_{actividad_id}_user_{usuario_id}_{int(datetime.now().timestamp())}.{file_extension}")
        filepath = os.path.join('uploads/audios', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        audio_file.save(filepath)

        print(f"\n🎤 Analizando audio de Usuario #{usuario_id} en Actividad #{actividad_id}")

        # Analizar audio con AudioService
        audio_service = AudioService()
        resultado_analisis = audio_service.analyze_audio(filepath, usuario_id)

        if not resultado_analisis.get('success'):
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify(resultado_analisis), 400

        datos = resultado_analisis.get('data', {})
        
        # Extraer emoción predominante (la primera en la lista)
        emotions = datos.get('emotions', [])
        emocion_predominante = emotions[0]['name'] if emotions else 'neutral'
        confidence = datos.get('confidence', 0)
        
        # Calcular niveles de estrés y ansiedad basados en emociones
        nivel_estres = 0
        nivel_ansiedad = 0
        for emo in emotions:
            if emo['name'].lower() in ['enojo', 'miedo']:
                nivel_estres += emo['value']
            if emo['name'].lower() in ['miedo', 'tristeza']:
                nivel_ansiedad += emo['value']
        
        # Guardar o actualizar análisis en la base de datos (UPSERT)
        # IMPORTANTE: NO incluir id_sesion - esa columna no existe en analisis_voz_participante
        cursor.execute("""
            INSERT INTO analisis_voz_participante
            (id_actividad, id_usuario, emocion_predominante, nivel_estres, nivel_ansiedad,
             confianza_modelo, emociones_json, duracion_audio, fecha_analisis)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                emocion_predominante = VALUES(emocion_predominante),
                nivel_estres = VALUES(nivel_estres),
                nivel_ansiedad = VALUES(nivel_ansiedad),
                confianza_modelo = VALUES(confianza_modelo),
                emociones_json = VALUES(emociones_json),
                duracion_audio = VALUES(duracion_audio),
                fecha_analisis = NOW()
        """, (
            actividad_id,
            usuario_id,
            emocion_predominante,
            nivel_estres,
            nivel_ansiedad,
            confidence,
            json.dumps({e['name']: e['value'] for e in emotions}),
            0  # duracion_audio no está disponible ahora
        ))
        
        analisis_id = cursor.lastrowid if cursor.lastrowid > 0 else None
        
        # Si fue UPDATE (no INSERT), obtener el ID existente
        if not analisis_id:
            cursor.execute("""
                SELECT id_analisis FROM analisis_voz_participante
                WHERE id_actividad = %s AND id_usuario = %s
            """, (actividad_id, usuario_id))
            result = cursor.fetchone()
            analisis_id = result['id_analisis'] if result else None
        
        # Marcar participante como completado
        cursor.execute("""
            UPDATE participacion_actividad
            SET completada = 1, fecha_completada = NOW()
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, usuario_id))
        
        conn.commit()

        print(f"   ✅ Análisis guardado (ID: {analisis_id})")
        print(f"   🎭 Emoción detectada: {emocion_predominante}")

        # Verificar si TODOS completaron
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completados
            FROM participacion_actividad
            WHERE id_actividad = %s
        """, (actividad_id,))
        
        stats = cursor.fetchone()
        todos_completados = stats['completados'] == stats['total']

        print(f"   📊 Progreso: {stats['completados']}/{stats['total']} completados")

        resultado_grupal = None
        
        # Si TODOS completaron, calcular promedio grupal
        if todos_completados:
            print(f"\n🎉 ¡TODOS COMPLETARON! Calculando resultado grupal...")
            resultado_grupal = calcular_resultado_grupal(cursor, conn, actividad_id)
            
            if resultado_grupal:
                print(f"   ✅ Resultado grupal calculado")
                print(f"   🎭 Emoción dominante del grupo: {resultado_grupal['emocion_dominante']}")
                
                # Notificar a todos los participantes
                notificar_resultados_finales(cursor, conn, actividad_id, resultado_grupal)

        cursor.close()
        DatabaseConnection.return_connection(conn)

        return jsonify({
            'success': True,
            'data': {
                'analisis_id': analisis_id,
                'emocion': emocion_predominante,
                'nivel_estres': nivel_estres,
                'nivel_ansiedad': nivel_ansiedad,
                'todos_completados': todos_completados,
                'resultado_grupal': resultado_grupal
            }
        }), 201

    except Exception as e:
        print(f"❌ Error en análisis: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 5. CALCULAR RESULTADO GRUPAL (PROMEDIOS)
# ============================================================
def calcular_resultado_grupal(cursor, conn, actividad_id):
    """
    Calcula el promedio de todos los análisis de voz del grupo
    """
    try:
        # Obtener todos los análisis
        cursor.execute("""
            SELECT 
                emocion_predominante,
                nivel_estres,
                nivel_ansiedad,
                confianza_modelo,
                emociones_json
            FROM analisis_voz_participante
            WHERE id_actividad = %s
        """, (actividad_id,))
        
        analisis_list = cursor.fetchall()
        
        if not analisis_list:
            return None
        
        # Calcular promedios
        niveles_estres = [float(a['nivel_estres']) for a in analisis_list]
        niveles_ansiedad = [float(a['nivel_ansiedad']) for a in analisis_list]
        confianzas = [float(a['confianza_modelo']) for a in analisis_list]
        
        promedio_estres = statistics.mean(niveles_estres)
        promedio_ansiedad = statistics.mean(niveles_ansiedad)
        promedio_confianza = statistics.mean(confianzas)
        
        # Determinar emoción dominante del grupo (la más frecuente)
        emociones = [a['emocion_predominante'] for a in analisis_list]
        emocion_counter = Counter(emociones)
        emocion_dominante = emocion_counter.most_common(1)[0][0]
        
        # Calcular promedio de cada emoción
        emociones_promedio = {}
        for analisis in analisis_list:
            try:
                emociones_json = json.loads(analisis['emociones_json']) if isinstance(analisis['emociones_json'], str) else analisis['emociones_json']
                for emocion, valor in emociones_json.items():
                    if emocion not in emociones_promedio:
                        emociones_promedio[emocion] = []
                    emociones_promedio[emocion].append(float(valor))
            except:
                pass
        
        # Promediar cada emoción
        for emocion in emociones_promedio:
            emociones_promedio[emocion] = statistics.mean(emociones_promedio[emocion])
        
        # Guardar resultado grupal
        cursor.execute("""
            INSERT INTO resultado_actividad_grupal
            (id_actividad, emocion_dominante, nivel_estres_promedio, nivel_ansiedad_promedio,
             confianza_promedio, emociones_promedio, fecha_calculo)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE
                emocion_dominante = VALUES(emocion_dominante),
                nivel_estres_promedio = VALUES(nivel_estres_promedio),
                nivel_ansiedad_promedio = VALUES(nivel_ansiedad_promedio),
                confianza_promedio = VALUES(confianza_promedio),
                emociones_promedio = VALUES(emociones_promedio),
                fecha_calculo = NOW()
        """, (
            actividad_id,
            emocion_dominante,
            promedio_estres,
            promedio_ansiedad,
            promedio_confianza,
            json.dumps(emociones_promedio)
        ))
        
        resultado_id = cursor.lastrowid
        
        # Marcar actividad como completada
        cursor.execute("""
            UPDATE actividades_grupo
            SET completada = 1
            WHERE id_actividad = %s
        """, (actividad_id,))
        
        conn.commit()
        
        return {
            'id_resultado': resultado_id,
            'emocion_dominante': emocion_dominante,
            'nivel_estres_promedio': round(promedio_estres, 2),
            'nivel_ansiedad_promedio': round(promedio_ansiedad, 2),
            'confianza_promedio': round(promedio_confianza, 2),
            'emociones_promedio': emociones_promedio,
            'total_participantes': len(analisis_list)
        }
        
    except Exception as e:
        print(f"❌ Error calculando resultado grupal: {e}")
        traceback.print_exc()
        return None


# ============================================================
# 6. NOTIFICAR RESULTADOS FINALES A TODOS
# ============================================================
def notificar_resultados_finales(cursor, conn, actividad_id, resultado_grupal):
    """
    Enviar notificación a todos los participantes con los resultados
    """
    try:
        # Obtener actividad
        cursor.execute("SELECT titulo FROM actividades_grupo WHERE id_actividad = %s", (actividad_id,))
        actividad = cursor.fetchone()
        
        # Obtener participantes
        cursor.execute("""
            SELECT pa.id_usuario, u.nombre
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            WHERE pa.id_actividad = %s
        """, (actividad_id,))
        
        participantes = cursor.fetchall()
        
        # Enviar notificación a cada uno
        for participante in participantes:
            try:
                NotificacionesService.crear_notificacion(
                    id_usuario=participante['id_usuario'],
                    tipo_notificacion='actividad_grupo',
                    titulo=f"✅ Actividad completada: {actividad['titulo']}",
                    mensaje=f"¡Todos completaron! Emoción del grupo: {resultado_grupal['emocion_dominante']}. Toca para ver los resultados completos.",
                    prioridad='media',
                    url_accion=f'/actividades/{actividad_id}/resultados',
                    id_referencia=actividad_id,
                    tipo_referencia='resultado'
                )
                print(f"   📨 Resultado enviado a: {participante['nombre']}")
            except Exception as e:
                print(f"   ⚠️ Error notificando a {participante['nombre']}: {e}")
        
    except Exception as e:
        print(f"❌ Error notificando resultados: {e}")


# ============================================================
# 7. OBTENER RESULTADO GRUPAL
# ============================================================
@bp.route('/<int:actividad_id>/resultado', methods=['GET'])
@jwt_required()
def obtener_resultado(actividad_id):
    """
    Obtener el resultado final del análisis grupal
    """
    try:
        usuario_id = get_jwt_identity()
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verificar acceso
        cursor.execute("""
            SELECT * FROM participacion_actividad
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, usuario_id))
        
        if not cursor.fetchone():
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Sin acceso'}), 403

        # Obtener resultado grupal
        cursor.execute("""
            SELECT * FROM resultado_actividad_grupal
            WHERE id_actividad = %s
        """, (actividad_id,))
        
        resultado = cursor.fetchone()
        
        if not resultado:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Resultado no disponible aún'}), 404

        # Obtener análisis individuales
        cursor.execute("""
            SELECT 
                a.*,
                u.nombre as nombre_usuario
            FROM analisis_voz_participante a
            JOIN usuario u ON a.id_usuario = u.id_usuario
            WHERE a.id_actividad = %s
            ORDER BY a.fecha_analisis ASC
        """, (actividad_id,))
        
        analisis_individuales = cursor.fetchall()
        
        # Convertir Decimals a float para resultado grupal
        if resultado:
            resultado['nivel_estres_promedio'] = float(resultado.get('nivel_estres_promedio', 0))
            resultado['nivel_ansiedad_promedio'] = float(resultado.get('nivel_ansiedad_promedio', 0))
            resultado['confianza_promedio'] = float(resultado.get('confianza_promedio', 0))
        
        # Parsear JSON de emociones promedio
        if resultado and resultado.get('emociones_promedio'):
            try:
                # Si es string, parsear; si ya es dict, dejar como está
                if isinstance(resultado['emociones_promedio'], str):
                    resultado['emociones_promedio'] = json.loads(resultado['emociones_promedio'])
            except:
                resultado['emociones_promedio'] = {}
        
        # Convertir Decimals a float para análisis individuales
        for analisis in analisis_individuales:
            analisis['nivel_estres'] = float(analisis.get('nivel_estres', 0))
            analisis['nivel_ansiedad'] = float(analisis.get('nivel_ansiedad', 0))
            analisis['confianza_modelo'] = float(analisis.get('confianza_modelo', 0))
            
            if analisis.get('emociones_json'):
                try:
                    analisis['emociones'] = json.loads(analisis['emociones_json'])
                except:
                    analisis['emociones'] = {}
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': {
                'resultado_grupal': resultado,
                'analisis_individuales': analisis_individuales
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 8. OBTENER ACTIVIDADES DEL GRUPO
# ============================================================
@bp.route('/grupo/<int:grupo_id>', methods=['GET'])
@jwt_required()
def obtener_actividades_grupo(grupo_id):
    """Obtener todas las actividades de un grupo"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                ag.*,
                u.nombre as nombre_creador
            FROM actividades_grupo ag
            LEFT JOIN usuario u ON ag.id_creador = u.id_usuario
            WHERE ag.id_grupo = %s AND ag.activo = 1
            ORDER BY ag.fecha_inicio DESC
        """, (grupo_id,))
        
        actividades = cursor.fetchall()
        
        # Agregar estadísticas de participantes
        for actividad in actividades:
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado IN ('conectado', 'completado') THEN 1 ELSE 0 END) as conectados,
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completados
                FROM participacion_actividad
                WHERE id_actividad = %s
            """, (actividad['id_actividad'],))
            
            stats = cursor.fetchone()
            actividad['total_participantes'] = stats['total'] if stats else 0
            actividad['participantes_conectados'] = stats['conectados'] if stats else 0
            actividad['participantes_completados'] = stats['completados'] if stats else 0
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': actividades
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 9. OBTENER PARTICIPANTES DE ACTIVIDAD
# ============================================================
@bp.route('/<int:id_actividad>/participantes', methods=['GET'])
@jwt_required()
def obtener_participantes(id_actividad):
    """Obtener lista de participantes con sus estados"""
    try:
        # Verificar que el parámetro grupoId viene en la query
        id_grupo = request.args.get('grupoId', type=int)
        
        print(f"\n{'='*60}")
        print(f"📥 GET PARTICIPANTES")
        print(f"   ID Actividad: {id_actividad}")
        print(f"   ID Grupo: {id_grupo}")
        print(f"{'='*60}\n")
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Si viene grupoId, verificar que la actividad pertenece al grupo
        if id_grupo:
            cursor.execute("""
                SELECT * FROM actividades_grupo 
                WHERE id_actividad = %s AND id_grupo = %s AND activo = 1
            """, (id_actividad, id_grupo))
            
            actividad = cursor.fetchone()
            
            if not actividad:
                cursor.close()
                DatabaseConnection.return_connection(conn)
                return jsonify({
                    'success': False,
                    'message': 'Actividad no encontrada'
                }), 404
        
        cursor.execute("""
            SELECT 
                pa.id,
                pa.id_usuario,
                CASE 
                    WHEN pa.completada = 1 THEN 'completado'
                    WHEN pa.conectado = 1 THEN 'conectado'
                    ELSE 'pendiente'
                END as estado,
                pa.completada,
                pa.conectado,
                pa.fecha_union,
                pa.fecha_completada,
                pa.notas_participante,
                pa.estado_emocional_antes,
                pa.estado_emocional_despues,
                u.nombre
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            WHERE pa.id_actividad = %s
            ORDER BY u.nombre ASC
        """, (id_actividad,))
        
        participantes = cursor.fetchall()
        
        # Calcular estadísticas
        total = len(participantes)
        conectados = sum(1 for p in participantes if p.get('conectado') == 1)
        completados = sum(1 for p in participantes if p.get('completada') == 1)
        
        print(f"👥 Participantes: {total} total, {conectados} conectados, {completados} completados")
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': participantes,
            'stats': {
                'total': total,
                'conectados': conectados,
                'completados': completados,
                'todos_conectados': conectados >= total and total > 0
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 10. OBTENER DETALLE DE ACTIVIDAD
# ============================================================
@bp.route('/<int:id_actividad>', methods=['GET'])
@jwt_required()
def obtener_actividad(id_actividad):
    """Obtener detalles de una actividad específica"""
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
        
        if not actividad:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({
                'success': False,
                'message': 'Actividad no encontrada'
            }), 404
        
        # Obtener estadísticas de participantes
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completada = 1 THEN 1 ELSE 0 END) as completados
            FROM participacion_actividad
            WHERE id_actividad = %s
        """, (id_actividad,))
        
        stats = cursor.fetchone()
        actividad['total_participantes'] = stats['total'] if stats else 0
        actividad['participantes_completados'] = stats['completados'] if stats else 0
        
        # ✅ Calcular estado basado en fecha_inicio y completada
        if actividad.get('completada') == 1:
            actividad['estado'] = 'finalizada'
        elif actividad.get('fecha_inicio') is not None:
            actividad['estado'] = 'iniciada'
        else:
            actividad['estado'] = 'pendiente'
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        print(f"📋 Actividad {id_actividad}: estado={actividad['estado']}, participantes={actividad['total_participantes']}")
        
        return jsonify({
            'success': True,
            'data': actividad
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


# ============================================================
# 11. ENDPOINTS DE DEBUG
# ============================================================
@bp.route('/<int:actividad_id>/debug/participantes', methods=['GET'])
@jwt_required()
def debug_participantes(actividad_id):
    """DEBUG: Ver participantes y sus estados"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT pa.*, u.nombre
            FROM participacion_actividad pa
            JOIN usuario u ON pa.id_usuario = u.id_usuario
            WHERE pa.id_actividad = %s
        """, (actividad_id,))
        
        participantes = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': {
                'total': len(participantes),
                'participantes': participantes
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 11. AGREGAR PARTICIPANTE MANUALMENTE
# ============================================================
@bp.route('/<int:actividad_id>/participantes', methods=['POST'])
@jwt_required()
def agregar_participante(actividad_id):
    """Agregar un participante a la actividad manualmente"""
    try:
        usuario_actual = get_jwt_identity()
        data = request.get_json()
        id_usuario = data.get('id_usuario')
        
        if not id_usuario:
            return jsonify({'success': False, 'error': 'id_usuario requerido'}), 400
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verificar que la actividad existe
        cursor.execute("SELECT * FROM actividades_grupo WHERE id_actividad = %s", (actividad_id,))
        actividad = cursor.fetchone()
        
        if not actividad:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Actividad no encontrada'}), 404
        
        # Verificar que el usuario actual es el creador
        if int(actividad['id_creador']) != int(usuario_actual):
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Solo el creador puede agregar participantes'}), 403
        
        # Verificar que el usuario pertenece al grupo
        cursor.execute("""
            SELECT * FROM grupo_miembros 
            WHERE id_grupo = %s AND id_usuario = %s AND estado = 'activo'
        """, (actividad['id_grupo'], id_usuario))
        
        if not cursor.fetchone():
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'El usuario no pertenece al grupo'}), 400
        
        # Verificar que no sea ya participante
        cursor.execute("""
            SELECT * FROM participacion_actividad 
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, id_usuario))
        
        if cursor.fetchone():
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Ya es participante'}), 400
        
        # Agregar como participante
        cursor.execute("""
            INSERT INTO participacion_actividad 
            (id_actividad, id_usuario, completada, conectado)
            VALUES (%s, %s, 0, 0)
        """, (actividad_id, id_usuario))
        
        conn.commit()
        
        # 📬 ENVIAR NOTIFICACIÓN AL USUARIO AGREGADO
        try:
            import json
            metadata = json.dumps({
                'prioridad': 'media',
                'id_referencia': actividad_id,
                'tipo_referencia': 'actividad'
            })
            cursor.execute("""
                INSERT INTO notificaciones 
                (id_usuario, tipo, titulo, mensaje, url_accion, metadata, leida, fecha_creacion)
                VALUES (%s, %s, %s, %s, %s, %s, FALSE, NOW())
            """, (
                id_usuario,
                'invitacion_grupo',
                'Invitación a actividad grupal',
                f"Fuiste invitado a participar en la actividad: {actividad['titulo']}",
                f'/actividades/grupo/{actividad_id}',
                metadata
            ))
            conn.commit()
            print(f"📬 Notificación enviada al usuario {id_usuario}")
        except Exception as notif_error:
            print(f"⚠️ Error al enviar notificación: {notif_error}")
            # No fallar si falla la notificación
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        print(f"✅ Participante {id_usuario} agregado a actividad {actividad_id}")
        
        return jsonify({
            'success': True,
            'data': {'message': 'Participante agregado exitosamente'}
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# 12. ELIMINAR PARTICIPANTE MANUALMENTE
# ============================================================
@bp.route('/<int:actividad_id>/participantes/<int:id_usuario>', methods=['DELETE'])
@jwt_required()
def eliminar_participante(actividad_id, id_usuario):
    """Eliminar un participante de la actividad"""
    try:
        usuario_actual = get_jwt_identity()
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verificar que la actividad existe
        cursor.execute("SELECT * FROM actividades_grupo WHERE id_actividad = %s", (actividad_id,))
        actividad = cursor.fetchone()
        
        if not actividad:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Actividad no encontrada'}), 404
        
        # Verificar que el usuario actual es el creador
        if int(actividad['id_creador']) != int(usuario_actual):
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'Solo el creador puede eliminar participantes'}), 403
        
        # No permitir eliminar al creador si tiene creador_participa=1
        if int(id_usuario) == int(actividad['id_creador']) and actividad.get('creador_participa', 1):
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'No puedes eliminarte como creador'}), 400
        
        # Eliminar participante
        cursor.execute("""
            DELETE FROM participacion_actividad 
            WHERE id_actividad = %s AND id_usuario = %s
        """, (actividad_id, id_usuario))
        
        if cursor.rowcount == 0:
            cursor.close()
            DatabaseConnection.return_connection(conn)
            return jsonify({'success': False, 'error': 'El usuario no era participante'}), 404
        
        conn.commit()
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        print(f"✅ Participante {id_usuario} eliminado de actividad {actividad_id}")
        
        return jsonify({
            'success': True,
            'data': {'message': 'Participante eliminado exitosamente'}
        }), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@bp.route('/debug/notificaciones/<int:usuario_id>', methods=['GET'])
@jwt_required()
def debug_notificaciones_usuario(usuario_id):
    """DEBUG: Ver notificaciones de un usuario"""
    try:
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM notificaciones
            WHERE id_usuario = %s
            ORDER BY fecha_creacion DESC
            LIMIT 20
        """, (usuario_id,))
        
        notificaciones = cursor.fetchall()
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': {
                'total': len(notificaciones),
                'notificaciones': notificaciones
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500