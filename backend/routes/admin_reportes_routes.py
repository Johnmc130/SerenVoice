# backend/routes/admin_reportes_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.utils.seguridad import role_required
from backend.database.connection import DatabaseConnection
from datetime import datetime, timedelta
import traceback

bp = Blueprint('admin_reportes', __name__, url_prefix='/api/admin/reportes')

def calcular_fechas_periodo(periodo, fecha_inicio=None, fecha_fin=None):
    """Calcula las fechas según el periodo seleccionado"""
    if fecha_inicio and fecha_fin:
        return fecha_inicio, fecha_fin
    
    fecha_fin = datetime.now().date()
    
    if periodo == '7d':
        fecha_inicio = fecha_fin - timedelta(days=7)
    elif periodo == '30d':
        fecha_inicio = fecha_fin - timedelta(days=30)
    elif periodo == '90d':
        fecha_inicio = fecha_fin - timedelta(days=90)
    else:
        fecha_inicio = fecha_fin - timedelta(days=30)
    
    return str(fecha_inicio), str(fecha_fin)

@bp.route('/resumen-general', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def resumen_general():
    """Obtiene el resumen general de estadísticas"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total usuarios activos en el periodo
        cursor.execute("""
            SELECT COUNT(DISTINCT u.id_usuario) as total
            FROM usuario u
            INNER JOIN audio a ON u.id_usuario = a.id_usuario
            INNER JOIN analisis an ON a.id_audio = an.id_audio
            WHERE DATE(an.fecha_analisis) BETWEEN %s AND %s
        """, (fecha_inicio, fecha_fin))
        usuarios_activos = cursor.fetchone()['total'] or 0
        
        # Total análisis realizados
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM analisis
            WHERE DATE(fecha_analisis) BETWEEN %s AND %s
        """, (fecha_inicio, fecha_fin))
        total_analisis = cursor.fetchone()['total'] or 0
        
        # Promedio de ansiedad
        cursor.execute("""
            SELECT AVG(ra.nivel_ansiedad) as promedio
            FROM resultado_analisis ra
            INNER JOIN analisis a ON ra.id_analisis = a.id_analisis
            WHERE DATE(a.fecha_analisis) BETWEEN %s AND %s
        """, (fecha_inicio, fecha_fin))
        promedio_ansiedad = cursor.fetchone()['promedio'] or 0
        
        # Alertas críticas
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM alerta_analisis aa
            INNER JOIN resultado_analisis ra ON aa.id_resultado = ra.id_resultado
            INNER JOIN analisis a ON ra.id_analisis = a.id_analisis
            WHERE DATE(aa.fecha) BETWEEN %s AND %s
            AND aa.tipo_alerta IN ('alta', 'critica')
        """, (fecha_inicio, fecha_fin))
        alertas_criticas = cursor.fetchone()['total'] or 0
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': {
                'usuarios_activos': usuarios_activos,
                'total_analisis': total_analisis,
                'promedio_ansiedad': round(float(promedio_ansiedad), 2),
                'alertas_criticas': alertas_criticas,
                'cambio_usuarios': None,
                'cambio_analisis': None,
                'cambio_ansiedad': None,
                'cambio_alertas': None
            }
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en resumen general: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener resumen: {str(e)}'
        }), 500

@bp.route('/tendencias-emocionales', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def tendencias_emocionales():
    """Obtiene las tendencias emocionales en el tiempo"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                DATE(a.fecha_analisis) as fecha,
                AVG(ra.nivel_estres) as estres,
                AVG(ra.nivel_ansiedad) as ansiedad,
                AVG(CASE 
                    WHEN ra.emocion_dominante = 'felicidad' THEN 80
                    WHEN ra.emocion_dominante IN ('neutral', 'sorpresa') THEN 50
                    ELSE 20
                END) as felicidad
            FROM analisis a
            INNER JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
            WHERE DATE(a.fecha_analisis) BETWEEN %s AND %s
            GROUP BY DATE(a.fecha_analisis)
            ORDER BY fecha ASC
        """, (fecha_inicio, fecha_fin))
        
        resultados = cursor.fetchall()
        
        # Formatear datos
        datos = []
        for row in resultados:
            datos.append({
                'fecha': row['fecha'].strftime('%d/%m'),
                'estres': round(float(row['estres']) if row['estres'] else 0, 1),
                'ansiedad': round(float(row['ansiedad']) if row['ansiedad'] else 0, 1),
                'felicidad': round(float(row['felicidad']) if row['felicidad'] else 0, 1)
            })
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en tendencias: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener tendencias: {str(e)}'
        }), 500

@bp.route('/distribucion-emociones', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def distribucion_emociones():
    """Obtiene la distribución de emociones dominantes"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                ra.emocion_dominante as emocion,
                COUNT(*) as cantidad
            FROM resultado_analisis ra
            INNER JOIN analisis a ON ra.id_analisis = a.id_analisis
            WHERE DATE(a.fecha_analisis) BETWEEN %s AND %s
            AND ra.emocion_dominante IS NOT NULL
            GROUP BY ra.emocion_dominante
            ORDER BY cantidad DESC
        """, (fecha_inicio, fecha_fin))
        
        resultados = cursor.fetchall()
        total = sum(row['cantidad'] for row in resultados)
        
        datos = []
        for row in resultados:
            datos.append({
                'emocion': row['emocion'],
                'cantidad': row['cantidad'],
                'porcentaje': round((row['cantidad'] / total * 100) if total > 0 else 0, 1)
            })
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en distribución emociones: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener distribución: {str(e)}'
        }), 500

@bp.route('/clasificaciones', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def clasificaciones():
    """Obtiene la distribución por clasificación de nivel"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                ra.clasificacion,
                COUNT(*) as cantidad
            FROM resultado_analisis ra
            INNER JOIN analisis a ON ra.id_analisis = a.id_analisis
            WHERE DATE(a.fecha_analisis) BETWEEN %s AND %s
            AND ra.clasificacion IS NOT NULL
            GROUP BY ra.clasificacion
            ORDER BY 
                CASE ra.clasificacion
                    WHEN 'normal' THEN 1
                    WHEN 'leve' THEN 2
                    WHEN 'moderado' THEN 3
                    WHEN 'alto' THEN 4
                    WHEN 'muy_alto' THEN 5
                    ELSE 6
                END
        """, (fecha_inicio, fecha_fin))
        
        resultados = cursor.fetchall()
        
        datos = [
            {'clasificacion': row['clasificacion'], 'cantidad': row['cantidad']}
            for row in resultados
        ]
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en clasificaciones: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener clasificaciones: {str(e)}'
        }), 500

@bp.route('/grupos-actividad', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def grupos_actividad():
    """Obtiene estadísticas de actividad de grupos"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)

        # Verificar si la tabla `actividades_grupo` existe; si no, devolver lista vacía
        try:
            cursor.execute("SHOW TABLES LIKE 'actividades_grupo'")
            tabla = cursor.fetchone()
            if not tabla:
                cursor.close()
                DatabaseConnection.return_connection(conn)
                return jsonify({
                    'success': True,
                    'data': [],
                    'message': 'Tabla actividades_grupo no encontrada en la base de datos'
                }), 200
        except Exception:
            # Si hay algún error consultando la existencia, seguimos intentando la consulta principal
            pass

        try:
            cursor.execute("""
                SELECT 
                    g.nombre as nombre_grupo,
                    COUNT(DISTINCT CASE 
                        WHEN DATE(pa.fecha_participacion) BETWEEN %s AND %s 
                        THEN pa.id_actividad_grupo 
                    END) as actividades_completadas,
                    COUNT(DISTINCT gm.id_usuario) as miembros_activos,
                    (SELECT COUNT(*) FROM actividades_grupo WHERE id_grupo = g.id_grupo) as total_actividades
                FROM grupos g
                LEFT JOIN grupo_miembro gm ON g.id_grupo = gm.id_grupo
                LEFT JOIN participacion_actividad pa ON g.id_grupo = pa.id_grupo
                GROUP BY g.id_grupo, g.nombre
                HAVING actividades_completadas > 0
                ORDER BY actividades_completadas DESC
                LIMIT 10
            """, (fecha_inicio, fecha_fin))

            resultados = cursor.fetchall()
        except Exception as e:
            # Mensajes específicos para tabla inexistente (MySQL errno 1146)
            msg = str(e)
            print(f"[ERROR] Error en grupos actividad: {msg}")
            if '1146' in msg or "doesn't exist" in msg or 'no existe' in msg:
                cursor.close()
                DatabaseConnection.return_connection(conn)
                return jsonify({
                    'success': True,
                    'data': [],
                    'message': 'Tabla actividades_grupo no encontrada (consulta omitida)'
                }), 200
            # Re-raise para que el manejador externo lo registre
            raise
        
        datos = []
        for row in resultados:
            datos.append({
                'nombre_grupo': row['nombre_grupo'],
                'actividades_completadas': row['actividades_completadas'] or 0,
                'total_actividades': row['total_actividades'] or 0,
                'miembros_activos': row['miembros_activos'] or 0
            })
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en grupos actividad: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener actividad de grupos: {str(e)}'
        }), 500

@bp.route('/efectividad-recomendaciones', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def efectividad_recomendaciones():
    """Obtiene la efectividad de las recomendaciones"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                r.tipo_recomendacion as tipo,
                COUNT(*) as generadas,
                SUM(CASE WHEN r.aplica = TRUE THEN 1 ELSE 0 END) as utiles
            FROM recomendaciones r
            INNER JOIN resultado_analisis ra ON r.id_resultado = ra.id_resultado
            INNER JOIN analisis a ON ra.id_analisis = a.id_analisis
            WHERE DATE(a.fecha_analisis) BETWEEN %s AND %s
            GROUP BY r.tipo_recomendacion
            ORDER BY generadas DESC
        """, (fecha_inicio, fecha_fin))
        
        resultados = cursor.fetchall()
        
        datos = [
            {
                'tipo': row['tipo'] or 'General',
                'generadas': row['generadas'],
                'utiles': row['utiles'] or 0
            }
            for row in resultados
        ]
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en efectividad recomendaciones: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener efectividad: {str(e)}'
        }), 500

@bp.route('/alertas-criticas', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def alertas_criticas():
    """Obtiene las alertas críticas recientes"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                aa.id_alerta,
                u.nombre,
                u.apellido,
                aa.tipo_alerta,
                aa.titulo,
                aa.descripcion,
                aa.fecha,
                ra.nivel_ansiedad,
                ra.nivel_estres,
                ra.clasificacion,
                ra.emocion_dominante
            FROM alerta_analisis aa
            INNER JOIN resultado_analisis ra ON aa.id_resultado = ra.id_resultado
            INNER JOIN analisis a ON ra.id_analisis = a.id_analisis
            INNER JOIN audio au ON a.id_audio = au.id_audio
            INNER JOIN usuario u ON au.id_usuario = u.id_usuario
            WHERE DATE(aa.fecha) BETWEEN %s AND %s
            AND aa.tipo_alerta IN ('alta', 'critica')
            ORDER BY aa.fecha DESC
            LIMIT 20
        """, (fecha_inicio, fecha_fin))
        
        resultados = cursor.fetchall()
        
        datos = []
        for row in resultados:
            datos.append({
                'id_alerta': row['id_alerta'],
                'nombre': row['nombre'],
                'apellido': row['apellido'],
                'tipo_alerta': row['tipo_alerta'],
                'titulo': row['titulo'],
                'descripcion': row['descripcion'],
                'fecha': row['fecha'].isoformat() if row['fecha'] else None,
                'nivel_ansiedad': float(row['nivel_ansiedad']) if row['nivel_ansiedad'] else 0,
                'nivel_estres': float(row['nivel_estres']) if row['nivel_estres'] else 0,
                'clasificacion': row['clasificacion'],
                'emocion_dominante': row['emocion_dominante']
            })
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en alertas críticas: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener alertas: {str(e)}'
        }), 500

@bp.route('/usuarios-estadisticas', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def usuarios_estadisticas():
    """Obtiene estadísticas de usuarios"""
    try:
        periodo = request.args.get('periodo', '30d')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        fecha_inicio, fecha_fin = calcular_fechas_periodo(periodo, fecha_inicio, fecha_fin)
        
        conn = DatabaseConnection.get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                u.id_usuario,
                u.nombre,
                u.apellido,
                u.correo,
                COUNT(DISTINCT a.id_analisis) as total_analisis,
                AVG(ra.nivel_ansiedad) as promedio_ansiedad,
                AVG(ra.nivel_estres) as promedio_estres,
                MAX(a.fecha_analisis) as ultimo_analisis
            FROM usuario u
            INNER JOIN audio au ON u.id_usuario = au.id_usuario
            INNER JOIN analisis a ON au.id_audio = a.id_audio
            INNER JOIN resultado_analisis ra ON a.id_analisis = ra.id_analisis
            WHERE DATE(a.fecha_analisis) BETWEEN %s AND %s
            GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo
            HAVING promedio_ansiedad IS NOT NULL
            ORDER BY promedio_ansiedad DESC
            LIMIT 50
        """, (fecha_inicio, fecha_fin))
        
        resultados = cursor.fetchall()
        
        datos = []
        for row in resultados:
            datos.append({
                'id_usuario': row['id_usuario'],
                'nombre': row['nombre'],
                'apellido': row['apellido'],
                'correo': row['correo'],
                'total_analisis': row['total_analisis'],
                'promedio_ansiedad': round(float(row['promedio_ansiedad']), 1) if row['promedio_ansiedad'] else 0,
                'promedio_estres': round(float(row['promedio_estres']), 1) if row['promedio_estres'] else 0,
                'ultimo_analisis': row['ultimo_analisis'].isoformat() if row['ultimo_analisis'] else None
            })
        
        cursor.close()
        DatabaseConnection.return_connection(conn)
        
        return jsonify({
            'success': True,
            'data': datos
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en usuarios estadísticas: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al obtener usuarios: {str(e)}'
        }), 500

@bp.route('/exportar', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def exportar():
    """Exporta un reporte en el formato especificado"""
    try:
        data = request.json
        tipo = data.get('tipo', 'completo')
        formato = data.get('formato', 'pdf')
        filtros = data.get('filtros', {})
        
        # Por ahora retornamos un mensaje
        # En el futuro se puede implementar generación de PDF/Excel con reportlab/openpyxl
        return jsonify({
            'success': True,
            'message': 'Funcionalidad de exportación en desarrollo',
            'data': {
                'tipo': tipo,
                'formato': formato,
                'filtros': filtros
            }
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error en exportar: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al exportar: {str(e)}'
        }), 500
