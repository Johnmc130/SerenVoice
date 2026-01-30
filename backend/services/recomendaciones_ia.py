from typing import List, Dict
import os
import hashlib

from backend.services.groq_service import generate_recommendations_with_groq
from backend.models.recomendacion import Recomendacion


def generar_recomendaciones(payload: Dict, user_id: int = None) -> List[Dict]:
    """Interfaz principal de recomendaciones IA basada en Groq.

    Intenta generar recomendaciones con Groq y normaliza el resultado.
    Pasa historial reciente del usuario para evitar repetición.
    """
    # Permitir desactivar vía env si se requiere
    if os.getenv("DISABLE_GROQ_RECS") == "1":
        return []

    # Obtener historial reciente del usuario para contexto
    recent_recs = []
    if user_id:
        try:
            recent_recs = Recomendacion.get_recent_by_user(user_id, days=7, limit=10) or []
        except Exception:
            pass
    
    recs = generate_recommendations_with_groq(payload, recent_recommendations=recent_recs) or []
    # asegurar estructura mínima y filtrar tipos inválidos
    TIPOS_VALIDOS = {"respiracion", "pausa_activa", "meditacion", "ejercicio", "profesional", "musica"}
    normalized = []
    for r in recs:
        tipo = (r.get("tipo_recomendacion") or r.get("tipo") or "").strip().lower()
        contenido = (r.get("contenido") or r.get("texto") or "").strip()
        
        # Solo agregar si tiene contenido Y tipo válido
        if contenido and tipo in TIPOS_VALIDOS:
            normalized.append({
                "tipo_recomendacion": tipo,
                "contenido": contenido,
                "origen": "ia",
            })
    return normalized


def guardar_en_bd(
    id_resultado: int,
    recs: List[Dict],
    user_id: int = None,
    dedup_user_history: bool = False,  # Cambiar a False por defecto para más variación
) -> int:
        """Guarda recomendaciones en BD para el resultado dado, evitando duplicados.

        Duplicados se detectan por par (tipo_recomendacion, contenido) normalizados
        en minúsculas y con espacios colapsados.
        
        dedup_user_history=False permite que el mismo usuario reciba recomendaciones
        similares en análisis diferentes, aumentando la variación entre sesiones.
        """
        print(f"[guardar_en_bd] Recibidas {len(recs)} recomendaciones para resultado_id={id_resultado}, user_id={user_id}")

        if not recs:
            print("[guardar_en_bd] Lista vacía, retornando 0")
            return 0

        # Construir set de existentes para el resultado
        existentes = Recomendacion.get_by_result(id_resultado) or []

        def _norm_text(s: str) -> str:
            s = (s or "").strip()
            # Colapsar espacios repetidos
            s = " ".join(s.split())
            return s.lower()

        def _key(tipo: str, contenido: str) -> str:
            base = f"{_norm_text(tipo)}|{_norm_text(contenido)}"
            return hashlib.sha256(base.encode("utf-8")).hexdigest()

        existentes_keys = set(
            _key(
                (e.get("tipo_recomendacion") if isinstance(e, dict) else getattr(e, "tipo_recomendacion", "")),
                (e.get("contenido") if isinstance(e, dict) else getattr(e, "contenido", "")),
            )
            for e in existentes
        )

        # Extender claves con historial reciente del usuario (si se provee y está habilitado)
        if user_id is not None and dedup_user_history:
            try:
                recientes = Recomendacion.get_recent_by_user(user_id, days=30, limit=200) or []
                for e in recientes:
                    existentes_keys.add(
                        _key(
                            (e.get("tipo_recomendacion") if isinstance(e, dict) else getattr(e, "tipo_recomendacion", "")),
                            (e.get("contenido") if isinstance(e, dict) else getattr(e, "contenido", "")),
                        )
                    )
            except Exception:
                pass

        # Filtrar payload por nuevos no existentes, y evitar duplicados dentro del mismo lote
        TIPOS_VALIDOS = {"respiracion", "pausa_activa", "meditacion", "ejercicio", "profesional", "musica"}
        payload: List[Dict] = []
        vistos_en_lote = set()
        for r in recs:
            tipo = (r.get("tipo_recomendacion") or r.get("tipo") or "").strip().lower()  # Convertir a minúsculas
            contenido = (r.get("contenido") or "").strip()
            
            print(f"[guardar_en_bd] DEBUG: Procesando tipo='{tipo}' (vacio={not tipo}), valido={tipo in TIPOS_VALIDOS}, contenido_len={len(contenido)}")
            
            # Validar tipo válido antes de procesar - RECHAZAR SI ESTÁ VACÍO
            if not tipo or tipo not in TIPOS_VALIDOS or not contenido:
                print(f"[guardar_en_bd] WARNING: Recomendacion RECHAZADA - tipo='{tipo}' (vacio={not tipo}), valido={tipo in TIPOS_VALIDOS}, contenido={'presente' if contenido else 'vacio'}")
                continue
            
            k = _key(tipo, contenido)
            if k in existentes_keys or k in vistos_en_lote:
                continue
            vistos_en_lote.add(k)
            payload.append({
                "id_resultado": id_resultado,
                "tipo_recomendacion": tipo,
                "contenido": contenido,
            })

        print(f"[guardar_en_bd] Después de dedup: {len(payload)} recomendaciones nuevas a insertar")
        if not payload:
            print("[guardar_en_bd] Payload vacío después de dedup, retornando 0")
            return 0

        try:
            count = Recomendacion.create_multiple(payload)
            print(f"[guardar_en_bd] create_multiple exitoso: {count} filas insertadas")
            return count
        except Exception as e:
            print(f"[guardar_en_bd] create_multiple falló: {e}, intentando inserción individual")
            count = 0
            for r in payload:
                try:
                    Recomendacion.create(r["id_resultado"], r["tipo_recomendacion"], r["contenido"])
                    count += 1
                except Exception as e2:
                    print(f"[guardar_en_bd] Error insertando individual: {e2}")
                    pass
            print(f"[guardar_en_bd] Inserción individual completada: {count} filas")
            return count
