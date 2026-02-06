from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import traceback
from backend.database.connection import DatabaseConnection
from pydub import AudioSegment
import uuid

bp = Blueprint('audio', __name__, url_prefix='/api/audio')

# Extensiones permitidas
ALLOWED_EXTENSIONS = {'webm', 'wav', 'mp3', 'ogg', 'm4a'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ======================================================================
# 🟦 Endpoint: ANALIZAR AUDIO
# ======================================================================
@bp.route('/analyze', methods=['POST'])
def analyze_voice():

    filepath = None  # evitar errores si ocurre algo antes

    try:
        service = current_app.audio_service
        if not service:
            return jsonify({'success': False, 'error': 'Servicio de análisis no disponible'}), 500

        # --------------------------------------------------------
        # 1) Validar archivo
        # --------------------------------------------------------
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No se encontró el archivo de audio'}), 400

        file = request.files['audio']

        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nombre de archivo vacío'}), 400

        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Formato no permitido'}), 400

        # Duración enviada por el frontend
        duration_raw = request.form.get('duration', '0')
        duration = float(duration_raw) if duration_raw not in (None, "", "null") else 0.0

        # ID usuario (modo autenticado o modo prueba)
        user_id_raw = request.form.get('user_id')
        user_id = int(user_id_raw) if user_id_raw not in (None, "", "null", "undefined") else None

        # Intentar obtener user_id desde JWT si no vino en el formulario
        if user_id is None:
            try:
                verify_jwt_in_request(optional=True)
                identity = get_jwt_identity()
                # identity puede ser un número (id) o un dict con campos
                if isinstance(identity, dict):
                    possible_keys = ('user_id', 'id', 'uid', 'sub')
                    for k in possible_keys:
                        if k in identity and identity[k]:
                            user_id = int(identity[k])
                            break
                elif identity is not None:
                    user_id = int(identity)
            except Exception as jwt_err:
                # JWT no presente o inválido; continuar como modo invitado
                print('[audio_routes] JWT inválido o ausente:', jwt_err)

        print(f"[audio_routes] Identidad derivada: user_id={user_id}")

        # --------------------------------------------------------
        # 2) Guardar archivo temporal
        # --------------------------------------------------------
        # Usar carpeta absoluta bajo app.root_path
        upload_folder_name = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        # Guardar directamente en 'uploads'
        upload_folder = os.path.join(current_app.root_path, upload_folder_name)
        os.makedirs(upload_folder, exist_ok=True)

        # Nombre final deseado: <YYYYMMDD_HHMMSS_micro>_<rand6>_grabacion.wav
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        rand = uuid.uuid4().hex[:6]
        orig_ext = os.path.splitext(file.filename)[1].lower()
        base_stub = f"{timestamp}_{rand}_grabacion"
        # Nombre temporal con extensión original, luego convertimos
        filename = secure_filename(f"{base_stub}{orig_ext}")

        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)

        # Log tamaño del archivo guardado para depuración
        try:
            saved_size = os.path.getsize(filepath)
        except Exception:
            saved_size = None

        print(f"[audio_routes] Archivo guardado temporalmente en {filepath} (size={saved_size})")

        # --------------------------------------------------------
        # 2.1) Convertir a WAV si no lo es
        # --------------------------------------------------------
        try:
            if orig_ext != '.wav':
                # cargar con pydub y exportar a wav
                audio_seg = AudioSegment.from_file(filepath)
                wav_filename = f"{base_stub}.wav"
                wav_path = os.path.join(upload_folder, wav_filename)
                audio_seg.export(wav_path, format='wav')
                # borrar el archivo original para evitar duplicados
                try:
                    os.remove(filepath)
                except Exception:
                    pass
                # actualizar punteros a nuevo archivo
                filename = wav_filename
                filepath = wav_path
                print(f"[audio_routes] Convertido a WAV: {wav_path} (size={os.path.getsize(wav_path) if os.path.exists(wav_path) else 'nop'})")
        except Exception as conv_err:
            print(f"[audio_routes] Error convirtiendo a WAV con pydub: {conv_err}")
            # Intentar fallback con ffmpeg CLI si está disponible
            try:
                import subprocess
                wav_filename = f"{base_stub}.wav"
                wav_path = os.path.join(upload_folder, wav_filename)
                print(f"[audio_routes] Intentando conversión con ffmpeg CLI: {wav_path}")
                subprocess.run(['ffmpeg', '-y', '-i', filepath, wav_path], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                try:
                    os.remove(filepath)
                except Exception:
                    pass
                filename = wav_filename
                filepath = wav_path
                print(f"[audio_routes] Convertido a WAV con ffmpeg: {wav_path} (size={os.path.getsize(wav_path) if os.path.exists(wav_path) else 'nop'})")
            except Exception as ff_err:
                print(f"[audio_routes] Fallback ffmpeg falló: {ff_err}")

        # --------------------------------------------------------
        # 3) Analizar audio con IA
        # --------------------------------------------------------
        # Verificar que el archivo final existe y tiene datos antes de analizar
        try:
            if not filepath or not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
                raise Exception(f"Archivo de audio inexistente o vacío antes de análisis: {filepath}")
        except Exception as size_check_err:
            print(f"[audio_routes] Error de integridad del archivo: {size_check_err}")
            raise

        results = service.analyze_audio(filepath, duration)

        if not results:
            raise Exception("El servicio de análisis devolvió una respuesta vacía.")

        # --------------------------------------------------------
        # 3.1) Manejar formato de respuesta del AudioService
        # --------------------------------------------------------
        # El AudioService puede devolver:
        # - Nuevo formato: {success: True, data: {emotions, confidence, features}}
        # - Formato legacy: {emotions, confidence, features}
        
        print(f"[DEBUG] audio_routes recibió results type={type(results)}, keys={results.keys() if isinstance(results, dict) else 'not dict'}")
        
        if results.get('success') is True and 'data' in results:
            # Nuevo formato: extraer datos del campo 'data'
            analysis_data = results['data']
            emotions = analysis_data.get("emotions", []) or []
            confidence = float(analysis_data.get("confidence", 0.0)) * 100.0
            print(f"[DEBUG] Formato NUEVO - Extraídas {len(emotions)} emociones, confidence={confidence}")
        else:
            # Formato legacy: datos directamente en el resultado
            emotions = results.get("emotions", []) or []
            confidence = float(results.get("confidence", 0.0)) * 100.0
            print(f"[DEBUG] Formato LEGACY - Extraídas {len(emotions)} emociones, confidence={confidence}")

        # --------------------------------------------------------
        # 4) Preparar datos del análisis ANTES de guardar en BD
        # --------------------------------------------------------
        # Primero generamos las recomendaciones de IA. Si fallan, NO guardamos nada.
        
        analisis_id = None
        resultado_id = None
        audio_db_id = None
        recomendaciones_list = []
        
        # Calcular métricas desde las emociones devueltas

        # Inicializar todos los valores de emociones
        nivel_estres = 0.0
        nivel_ansiedad = 0.0
        nivel_felicidad = 0.0
        nivel_tristeza = 0.0
        nivel_miedo = 0.0
        nivel_neutral = 0.0
        nivel_enojo = 0.0
        nivel_sorpresa = 0.0
        emocion_dominante = None
        max_emotion_value = 0.0

        # Buscar y extraer todas las emociones por nombre
        # EVITAR DUPLICADOS: normalizar nombres de emociones
        emotions_map = {}  # {nombre_normalizado: valor_maximo}
        
        for e in emotions:
            name_original = (e.get("name") or "")
            name = name_original.lower().strip()
            val = float(e.get("value") or 0.0)
            
            # Normalizar nombres (remover acentos y unificar)
            if "estr" in name:  # estrés o estres
                name = "estres"
            elif "felic" in name or "alegr" in name or "joy" in name:
                name = "felicidad"
            elif "trist" in name or "sad" in name:
                name = "tristeza"
            elif "mied" in name or "fear" in name:
                name = "miedo"
            elif "enoj" in name or "ira" in name or "anger" in name:
                name = "enojo"
            elif "sorp" in name or "surprise" in name:
                name = "sorpresa"
            elif "neutr" in name:
                name = "neutral"
            elif "ansie" in name or "anxiety" in name:
                name = "ansiedad"
            
            # Guardar el valor máximo para cada emoción normalizada
            if name in emotions_map:
                emotions_map[name] = max(emotions_map[name], val)
            else:
                emotions_map[name] = val
            
            # Detectar emoción dominante
            if val > max_emotion_value:
                max_emotion_value = val
                emocion_dominante = name_original
        
        # Asignar valores desde el mapa normalizado
        nivel_estres = emotions_map.get("estres", 0.0)
        nivel_ansiedad = emotions_map.get("ansiedad", 0.0)
        nivel_felicidad = emotions_map.get("felicidad", 0.0)
        nivel_tristeza = emotions_map.get("tristeza", 0.0)
        nivel_miedo = emotions_map.get("miedo", 0.0)
        nivel_neutral = emotions_map.get("neutral", 0.0)
        nivel_enojo = emotions_map.get("enojo", 0.0)
        nivel_sorpresa = emotions_map.get("sorpresa", 0.0)
        
        print(f"[audio_routes] DEBUG - Emociones mapeadas:")
        print(f"  - emotions originales count: {len(emotions)}")
        print(f"  - emotions_map keys: {list(emotions_map.keys())}")
        print(f"  - emotions_map values: {list(emotions_map.values())}")
        print(f"  - Nivel felicidad: {nivel_felicidad}, tristeza: {nivel_tristeza}, enojo: {nivel_enojo}")

        # Si no hay etiquetas explícitas de estrés/ansiedad, estimar con otras señales
        if nivel_estres == 0.0:
            nivel_estres = max(nivel_enojo * 0.6, nivel_sorpresa * 0.4)
            emotions_map["estres"] = nivel_estres  # Agregar al map normalizado
        if nivel_ansiedad == 0.0:
            nivel_ansiedad = max(nivel_miedo * 0.6, nivel_tristeza * 0.4)
            emotions_map["ansiedad"] = nivel_ansiedad  # Agregar al map normalizado

        # Convertir emotions_map de vuelta a lista para respuesta (EVITA DUPLICADOS)
        # IMPORTANTE: Mantener el formato original de emotions con colores
        color_map = {
            "felicidad": "#FFD700",
            "tristeza": "#4169E1",
            "enojo": "#FF6347",
            "neutral": "#808080",
            "sorpresa": "#FF69B4",
            "miedo": "#9370DB",
            "estres": "#FF4500",
            "ansiedad": "#9b5de5"
        }
        
        # Capitalizar nombres para respuesta
        name_display = {
            "felicidad": "Felicidad",
            "tristeza": "Tristeza",
            "enojo": "Enojo",
            "neutral": "Neutral",
            "sorpresa": "Sorpresa",
            "miedo": "Miedo",
            "estres": "Estrés",
            "ansiedad": "Ansiedad"
        }
        
        emotions_normalized = [
            {
                "name": name_display.get(name, name.capitalize()),
                "value": round(value, 2),
                "color": color_map.get(name, "#888888")
            }
            for name, value in emotions_map.items()
            if value > 0  # Solo emociones con valor > 0
        ]
        
        # Si emotions_normalized está vacío, usar las emociones originales
        if not emotions_normalized and emotions:
            print("[audio_routes] WARNING: emotions_normalized vacío, usando emociones originales")
            emotions_normalized = emotions

        # Clasificación por umbrales
        max_score = max(nivel_estres, nivel_ansiedad)
        if max_score >= 80:
            clasificacion = 'muy_alto'
        elif max_score >= 65:
            clasificacion = 'alto'
        elif max_score >= 50:
            clasificacion = 'moderado'
        elif max_score >= 30:
            clasificacion = 'leve'
        else:
            clasificacion = 'normal'

        # --------------------------------------------------------
        # 4.1) Generar recomendaciones IA ANTES de guardar en BD
        # --------------------------------------------------------
        clean_recs = []
        if user_id:
            try:
                from backend.services.recomendaciones_ia import generar_recomendaciones
                print('[audio_routes] Generando recomendaciones IA con Groq ANTES de guardar...')
                
                resultado_ctx = {
                    'clasificacion': clasificacion,
                    'nivel_estres': nivel_estres,
                    'nivel_ansiedad': nivel_ansiedad,
                    'confianza_modelo': confidence,
                    'duracion': duration,
                    'emocion_dominante': (emotions[0]['name'] if emotions else None),
                    'emotions': emotions,
                }
                
                ia_recs = generar_recomendaciones({ 'resultado': resultado_ctx }, user_id=user_id) or []
                print(f'[audio_routes] Groq devolvió {len(ia_recs)} recomendaciones')
                
                # Filtrar recomendaciones válidas
                TIPOS_VALIDOS = {"respiracion", "pausa_activa", "meditacion", "ejercicio", "profesional", "musica"}
                for r in ia_recs:
                    tipo = (r.get('tipo_recomendacion') or '').strip()
                    contenido = (r.get('contenido') or '').strip()
                    if tipo in TIPOS_VALIDOS and contenido:
                        clean_recs.append({'tipo_recomendacion': tipo, 'contenido': contenido})
                    else:
                        print(f'[audio_routes] WARNING: Recomendacion invalida filtrada: tipo="{tipo}"')
                
                print(f'[audio_routes] {len(clean_recs)} recomendaciones válidas después de filtrar')
                
            except Exception as ia_err:
                print('[audio_routes] ERROR generando recomendaciones IA:', ia_err)
                traceback.print_exc()
                clean_recs = []
        
        # --------------------------------------------------------
        # 4.2) ADVERTENCIA: Si no hay recomendaciones, advertir pero continuar
        # --------------------------------------------------------
        if user_id and len(clean_recs) == 0:
            print('[audio_routes] WARNING: No se generaron recomendaciones de IA, pero se guardará el análisis.')
            # ✅ Ya NO eliminamos el archivo ni abortamos, solo advertimos
        
        # --------------------------------------------------------
        # 5) Guardar en BD (si hay usuario autenticado, con o sin recomendaciones)
        # --------------------------------------------------------
        print(f'[audio_routes] Pre-check: user_id={user_id}, recomendaciones={len(clean_recs)}')
        
        try:
            if user_id:
                print(f'[audio_routes] Guardando audio en BD para user_id={user_id}')
                
                # Usar el modelo Audio actualizado que ahora soporta emociones
                from backend.models.audio import Audio
                
                audio_db_id = Audio.create(
                    id_usuario=user_id,
                    nombre_archivo=filename,
                    ruta_archivo=filename,
                    duracion=duration,
                    nivel_estres=round(nivel_estres, 2),
                    nivel_ansiedad=round(nivel_ansiedad, 2),
                    nivel_felicidad=round(nivel_felicidad, 2),
                    nivel_tristeza=round(nivel_tristeza, 2),
                    nivel_miedo=round(nivel_miedo, 2),
                    nivel_neutral=round(nivel_neutral, 2),
                    nivel_enojo=round(nivel_enojo, 2),
                    nivel_sorpresa=round(nivel_sorpresa, 2),
                    procesado_por_ia=True
                )

                if not audio_db_id:
                    raise Exception('No se pudo guardar el audio en la base de datos')

                print(f"[audio_routes] Audio guardado en BD con ID {audio_db_id} (CON emociones)")
                
                # Crear registro de análisis
                from backend.models.analisis import Analisis
                analisis_id = Analisis.create(
                    id_audio=audio_db_id,
                    id_usuario=user_id,
                    modelo_usado='modelo_v1.0',
                    estado='completado',
                    nivel_estres=round(nivel_estres, 2),
                    nivel_ansiedad=round(nivel_ansiedad, 2),
                    emocion_detectada=emocion_dominante,
                    confianza=round(confidence, 2)
                )

                if not analisis_id:
                    raise Exception('No se pudo crear el registro de análisis')

                print(f'[audio_routes] Análisis creado con ID: {analisis_id}')

                # Crear resultado del análisis con todos los niveles emocionales
                from backend.models.resultado_analisis import ResultadoAnalisis
                resultado_id = ResultadoAnalisis.create(
                    id_analisis=analisis_id,
                    nivel_estres=round(nivel_estres, 2),
                    nivel_ansiedad=round(nivel_ansiedad, 2),
                    clasificacion=clasificacion,
                    confianza_modelo=round(confidence, 2),
                    emocion_dominante=emocion_dominante,
                    nivel_felicidad=round(nivel_felicidad, 2),
                    nivel_tristeza=round(nivel_tristeza, 2),
                    nivel_miedo=round(nivel_miedo, 2),
                    nivel_neutral=round(nivel_neutral, 2),
                    nivel_enojo=round(nivel_enojo, 2),
                    nivel_sorpresa=round(nivel_sorpresa, 2)
                )
                
                print(f'[audio_routes] Resultado creado con ID: {resultado_id}')

                if not resultado_id:
                    raise Exception('No se pudo crear el registro de resultado de análisis')

                # Guardar recomendaciones en BD (ya fueron generadas y validadas antes)
                try:
                    from backend.services.recomendaciones_ia import guardar_en_bd
                    TIPOS_VALIDOS = {"respiracion", "pausa_activa", "meditacion", "ejercicio", "profesional", "musica"}
                    
                    count = guardar_en_bd(resultado_id, clean_recs, user_id=user_id)
                    print(f'[audio_routes] {count} recomendaciones IA persistidas en BD.')
                    
                    # Leer desde BD para respuesta
                    from backend.models.recomendacion import Recomendacion as _Rec
                    guardadas = _Rec.get_by_result(resultado_id) or []
                    print(f'[audio_routes] Leidas {len(guardadas)} recomendaciones desde BD para resultado_id={resultado_id}')
                    
                    # Filtrar tipos inválidos al leer desde BD
                    for idx, g in enumerate(guardadas):
                        tipo_raw = g.get('tipo_recomendacion') if isinstance(g, dict) else getattr(g, 'tipo_recomendacion', None)
                        contenido_raw = g.get('contenido') if isinstance(g, dict) else getattr(g, 'contenido', None)
                        tipo = (tipo_raw or '').strip().lower()
                        contenido = (contenido_raw or '').strip()
                        print(f'[audio_routes] DEBUG [{idx+1}/{len(guardadas)}]: tipo_raw={repr(tipo_raw)}, tipo_lower={repr(tipo)}, valido={tipo in TIPOS_VALIDOS}, contenido_len={len(contenido)}')

                        # Si el tipo está vacío en BD pero hay contenido, intentar inferirlo por heurística
                        if not tipo and contenido:
                            txt = contenido.lower()
                            if any(k in txt for k in ('respir', 'respira', 'diafragm')):
                                tipo = 'respiracion'
                            elif any(k in txt for k in ('medit', 'mindful', 'visualiz')):
                                tipo = 'meditacion'
                            elif any(k in txt for k in ('estir', 'ejerc', 'yoga', 'actividad')):
                                tipo = 'ejercicio'
                            elif any(k in txt for k in ('camina', 'paseo', 'descans', 'pausa')):
                                tipo = 'pausa_activa'
                            else:
                                tipo = ''
                            print(f"[audio_routes] INFO: tipo inferido='{tipo}' para item #{idx+1} desde contenido")

                        if tipo in TIPOS_VALIDOS and contenido:
                            recomendaciones_list.append({
                                'tipo_recomendacion': tipo,
                                'contenido': contenido,
                                'origen': 'ia'
                            })
                            print(f'[audio_routes] DEBUG [{idx+1}]: ACEPTADA')
                        else:
                            print(f'[audio_routes] WARNING [{idx+1}]: Recomendacion RECHAZADA - tipo="{tipo}" (raw: {repr(tipo_raw)}), tiene_contenido={bool(contenido)}')
                    
                except Exception as ia_err:
                    print('[audio_routes] IA recomendaciones fallo:', ia_err)
                    traceback.print_exc()
                    recomendaciones_list = []

                # Generar alerta si la clasificación es alta
                if clasificacion in ('alto', 'muy_alto'):
                    from backend.models.alerta_analisis import AlertaAnalisis
                    alerta_tipo = 'riesgo'
                    descripcion = (
                        f'Niveles elevados detectados: estrés={round(nivel_estres,2)}%, '
                        f'ansiedad={round(nivel_ansiedad,2)}%'
                    )
                    try:
                        AlertaAnalisis.create(resultado_id, alerta_tipo, descripcion)
                    except Exception:
                        pass
            else:
                print(f'[audio_routes] Modo invitado: user_id={user_id}, no se guarda en BD')

        except Exception as pipeline_err:
            print('[audio_routes] Error creando análisis/resultado/recomendaciones/alerta:', pipeline_err)
            traceback.print_exc()
            # Eliminar archivo si hubo error
            if filepath and os.path.exists(filepath):
                try:
                    os.remove(filepath)
                    print(f'[audio_routes] Archivo eliminado tras error: {filepath}')
                except Exception:
                    pass
            return jsonify({'success': False, 'error': str(pipeline_err)}), 500

        # --------------------------------------------------------
        # 6) Guardar features para entrenamiento continuo
        # --------------------------------------------------------
        try:
            # Extraer features del formato correcto (nuevo o legacy)
            if results.get('success') is True and 'data' in results:
                features_data = results['data'].get("features")
            else:
                features_data = results.get("features")
            
            service.save_training_sample(
                audio_db_id=audio_db_id,
                features=features_data,
                emotions=emotions_normalized,  # Usar emociones normalizadas (sin duplicados)
                duration=duration
            )
            print("[audio_routes] Sample de entrenamiento guardado.")
        except Exception as train_err:
            print("[audio_routes] Error guardando sample de entrenamiento:", train_err)

        # --------------------------------------------------------
        # 6.1) Actualizar niveles en la tabla `audio` (si existen emociones)
        # --------------------------------------------------------

        try:
            # Usar directamente emotions_map que ya está normalizado
            niveles = {
                'nivel_estres': emotions_map.get("estres", 0.0),
                'nivel_ansiedad': emotions_map.get("ansiedad", 0.0),
                'nivel_felicidad': emotions_map.get("felicidad", 0.0),
                'nivel_tristeza': emotions_map.get("tristeza", 0.0),
                'nivel_miedo': emotions_map.get("miedo", 0.0),
                'nivel_neutral': emotions_map.get("neutral", 0.0),
                'nivel_enojo': emotions_map.get("enojo", 0.0),
                'nivel_sorpresa': emotions_map.get("sorpresa", 0.0),
            }

            # NOTA: Tabla 'audio' no tiene columnas emocionales, datos se guardan en resultado_analisis
            # Este update está desactivado para evitar errores SQL
            # if audio_db_id:
            #     update_query = """
            #         UPDATE audio SET
            #           nivel_estres = %s, nivel_ansiedad = %s, nivel_felicidad = %s,
            #           nivel_tristeza = %s, nivel_miedo = %s, nivel_neutral = %s,
            #           nivel_enojo = %s, nivel_sorpresa = %s, procesado_por_ia = 1
            #         WHERE id_audio = %s
            #     """
            #     DatabaseConnection.execute_update(update_query, (...))
            
            if audio_db_id:
                print(f"[audio_routes] Niveles calculados para audio_id={audio_db_id}: {niveles}")

        except Exception as persist_levels_err:
            print('[audio_routes] Error guardando niveles en tabla audio:', persist_levels_err)

        # --------------------------------------------------------
        # 7) Respuesta final
        # --------------------------------------------------------
        response_data = {
            "success": True,
            "mode": "authenticated" if user_id else "guest_test",
            "emotions": emotions_normalized,  # Usar emociones normalizadas (sin duplicados)
            "confidence": confidence,  # Usar la variable extraída anteriormente
            "duration": duration,
            "audio_id": audio_db_id,
            "analisis_id": analisis_id,
            "resultado_id": resultado_id,
            "recomendaciones": recomendaciones_list,
            "features": results.get("features") if not (results.get('success') and 'data' in results) else results['data'].get("features"),
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(response_data), 200

    except Exception as e:
        print("[audio_routes] ERROR GENERAL:", e)
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        # Mantener el archivo en uploads para depuración y reproducción.
        # No eliminar el archivo incluso si no se guardó en BD.
        # Si se desea limpieza, implementar un job separado que borre antiguos.
        if filepath and os.path.exists(filepath):
            print(f"[audio_routes] Archivo persistente en uploads: {filepath}")
