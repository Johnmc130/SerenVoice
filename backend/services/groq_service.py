import os
import re
from typing import List, Dict

try:
	from groq import Groq
except Exception:
	Groq = None  # allow import even if package missing


def strip_markdown_json(text: str) -> str:
	"""Remove markdown code fences from JSON response"""
	pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
	match = re.search(pattern, text)
	return match.group(1).strip() if match else text.strip()


def generate_recommendations_with_groq(payload: Dict, recent_recommendations: List[Dict] = None) -> List[Dict]:
	"""Generate recommendations using Groq Llama 3.1 model.

	payload should include keys like: emotions (list), features (dict), summary strings, etc.
	recent_recommendations: list of recent user recommendations to avoid repetition
	Returns a list of dicts with keys: tipo_recomendacion, contenido.
	"""
	api_key = os.getenv("GROQ_API_KEY")
	# Mostrar presencia y una versión enmascarada (no imprimir la clave completa)
	masked = (api_key[:8] + "...") if api_key else ""
	print(f"[groq_service] GROQ_API_KEY presente: {bool(api_key)}, clave_masked={masked}, Groq SDK disponible: {bool(Groq)}")
	if not api_key or Groq is None:
		print(f"[groq_service] No se puede generar recomendaciones: api_key={bool(api_key)}, Groq={bool(Groq)}")
		return []

	client = Groq(api_key=api_key)

	# Construir contexto de historial para evitar repetición
	historial_context = ""
	if recent_recommendations:
		recent_texts = [r.get('contenido', '')[:60] for r in recent_recommendations[:5]]  # Últimas 5
		if recent_texts:
			historial_context = (
				"\n\nRECOMENDACIONES PREVIAS del usuario (EVITA repetir contenido similar):\n"
				+ "\n".join(f"- {t}..." for t in recent_texts if t)
			)
    
	user_content = (
		"Genera EXACTAMENTE 5 recomendaciones prácticas en español basadas en el análisis de voz.\n"
		"Responde SOLO JSON válido sin markdown: lista de objetos con 'tipo_recomendacion' y 'contenido'.\n\n"
		"REQUISITO CRÍTICO - TODAS las recomendaciones DEBEN tener 'tipo_recomendacion' con UNO de estos valores EXACTOS:\n"
		"- 'respiracion' (técnicas de respiración)\n"
		"- 'pausa_activa' (descansos o pausas)\n"
		"- 'meditacion' (meditación, mindfulness, visualización)\n"
		"- 'ejercicio' (actividad física, estiramientos)\n"
		"- 'musica' (canciones que ayuden según las emociones detectadas - USA ESTE TIPO PARA CANCIONES)\n"
		"- 'profesional' (buscar ayuda profesional)\n\n"
		"IMPORTANTE: SIEMPRE incluye AL MENOS 1 recomendación de 'musica' con canciones específicas que se adapten a las emociones detectadas.\n"
		"Formato para música: 'Escucha [Nombre de la canción] de [Artista] - [breve razón por qué ayuda]'\n"
		"Ejemplos de música:\n"
		"- Para felicidad: canciones alegres y energizantes\n"
		"- Para tristeza: canciones reconfortantes o inspiradoras\n"
		"- Para estrés/ansiedad: música relajante, lo-fi, o instrumental\n"
		"- Para enojo: música calmante o catártica según el caso\n\n"
		"PROHIBIDO:\n"
		"❌ NO uses otros tipos como 'habito', 'general', 'ocio'\n"
		"❌ NO dejes el campo 'tipo_recomendacion' vacío o null\n"
		"❌ Cada objeto DEBE tener 'tipo_recomendacion' y 'contenido'\n\n"
		"Si una recomendación no encaja en ningún tipo, cámbiala por una que sí encaje.\n"
		"Cada contenido debe ser específico, accionable, creativo y sin enlaces externos.\n"
		"IMPORTANTE: Varía las técnicas, duraciones y enfoques para que cada recomendación sea única.\n\n"
		"Ejemplo de formato CORRECTO:\n"
		"[\n"
		"  {\"tipo_recomendacion\": \"respiracion\", \"contenido\": \"Practica respiración 4-7-8 durante 5 minutos\"},\n"
		"  {\"tipo_recomendacion\": \"meditacion\", \"contenido\": \"Medita enfocándote en gratitud por 10 minutos\"},\n"
		"  {\"tipo_recomendacion\": \"ejercicio\", \"contenido\": \"Haz 15 minutos de yoga suave\"},\n"
		"  {\"tipo_recomendacion\": \"musica\", \"contenido\": \"Escucha 'Weightless' de Marconi Union - científicamente diseñada para reducir ansiedad\"},\n"
		"  {\"tipo_recomendacion\": \"pausa_activa\", \"contenido\": \"Toma un descanso de 20 minutos al aire libre\"}\n"
		"]\n\n"
		f"Datos del análisis: {payload}"
		f"{historial_context}"
	)

	model_id = os.getenv("GROQ_RECS_MODEL", "llama-3.1-8b-instant")
	print(f"[groq_service] Llamando a Groq con modelo: {model_id}")
	try:
		resp = client.chat.completions.create(
			model=model_id,
			messages=[
				{"role": "system", "content": "Eres un asistente creativo que genera recomendaciones de bienestar diversas y personalizadas basadas en emociones detectadas en la voz. Responde solo JSON válido. Varía tus recomendaciones para que cada una sea única."},
				{"role": "user", "content": user_content},
			],
			temperature=0.7,  # Mayor temperatura para más creatividad
			max_tokens=600,
		)
		content = (resp.choices[0].message.content or "").strip()
		print(f"[groq_service] Respuesta de Groq: {content}")
	except Exception as e:
		print(f"[groq_service] Error llamando a Groq API: {e}")
		# Mensaje específico si la organización está restringida
		err_str = str(e).lower()
		if "organization_restricted" in err_str or "organization has been restricted" in err_str:
			print("[groq_service] ERROR: La organización o la clave API están restringidas en Groq. Genera una nueva clave en una cuenta/organización con acceso o contacta a soporte de Groq.")
		import traceback
		traceback.print_exc()
		return []

	# Intentar parsear JSON simple
	import json
	import re
	try:
		cleaned_content = strip_markdown_json(content)
		data = json.loads(cleaned_content)
		if isinstance(data, list):
			# lista directa de recomendaciones
			recs = data
		elif isinstance(data, dict):
			recs = data.get("recomendaciones") or data.get("recommendations") or [data]
		else:
			recs = []
	except json.JSONDecodeError as e:
		print(f"[groq_service] JSON simple falló: {e}, intentando parsear múltiples objetos...")
		# Groq a veces devuelve múltiples objetos JSON separados
		# Intentar extraer todos los objetos JSON del texto
		recs = []
		try:
			# Buscar todos los objetos JSON en el texto
			json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
			matches = re.findall(json_pattern, cleaned_content, re.DOTALL)
			for match in matches:
				try:
					obj = json.loads(match)
					if isinstance(obj, dict):
						recs.append(obj)
				except:
					pass
			print(f"[groq_service] Extraídos {len(recs)} objetos JSON del texto")
		except Exception as inner_e:
			print(f"[groq_service] Error extrayendo JSONs: {inner_e}")
			recs = []
	except Exception as e:
		print(f"[groq_service] Error parseando JSON de Groq: {e}")
		recs = []

	# Normalizar estructura y filtrar tipos inválidos
	TIPOS_VALIDOS = {"respiracion", "pausa_activa", "meditacion", "ejercicio", "profesional", "musica"}
	normalized = []
	for r in recs:
		tipo = (r.get("tipo_recomendacion") or r.get("tipo") or "").strip().lower()
		contenido = (r.get("contenido") or r.get("texto") or r.get("content") or "").strip()
        
		# Filtrar: requiere contenido Y tipo válido
		print(f"[groq_service] DEBUG: Procesando rec - tipo='{tipo}', valido={tipo in TIPOS_VALIDOS}, contenido_len={len(contenido)}")
		if contenido and tipo in TIPOS_VALIDOS:
			normalized.append({
				"tipo_recomendacion": tipo,
				"contenido": contenido,
			})
			print(f"[groq_service] DEBUG: Recomendacion ACEPTADA")
		elif contenido:
			print(f"[groq_service] WARNING: Recomendacion con tipo invalido '{tipo}' ignorada: {contenido[:50]}...")
		else:
			print(f"[groq_service] WARNING: Recomendacion sin contenido ignorada (tipo='{tipo}')")
    
	print(f"[groq_service] {len(normalized)} recomendaciones válidas normalizadas: {normalized}")
	return normalized
