import numpy as np
import joblib
import os
import json
from datetime import datetime
from backend.utils.audio_processor import AudioProcessor
from backend.utils.feature_extractor import FeatureExtractor
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class AudioService:
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.feature_extractor = FeatureExtractor()
        self.model = None
        self.scaler = None
        self.label_encoder = None
        
        # Rutas correctas para los modelos entrenados
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.models_dir = os.path.join(base_dir, 'models')
        self.model_path = os.path.join(self.models_dir, 'emotion_model.pkl')
        self.training_data_path = os.path.join(self.models_dir, 'training_data.json')
        
        os.makedirs(self.models_dir, exist_ok=True)
        self.load_or_initialize_model()
    
    # ============================================================
    # CARGA DEL MODELO
    # ============================================================
    def load_or_initialize_model(self):
        try:
            if os.path.exists(self.model_path):
                # Cargar el modelo completo (incluye model, scaler, label_encoder)
                model_data = joblib.load(self.model_path)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.label_encoder = model_data['label_encoder']
                print("Modelo de IA cargado correctamente")
                print(f"   - Clases: {list(self.label_encoder.classes_)}")
            else:
                print(" Modelo no encontrado, usando modo heurístico")
                print(f"   - Buscado en: {self.model_path}")
                self.scaler = StandardScaler()
                self.model = None
                self.label_encoder = None
        except Exception as e:
            print(f" Error cargando modelo: {e}")
            self.model = None
            self.scaler = StandardScaler()
            self.label_encoder = None
    
    def is_model_loaded(self):
        return self.model is not None

    # ============================================================
    # MÉTODO PRINCIPAL: ANALIZAR AUDIO
    # ============================================================
    def analyze_audio(self, filepath, duration):
        try:
            import librosa
            print(f"[AudioService] Iniciando análisis de audio: {filepath}")
            
            # Verificar que el archivo existe
            import os
            if not os.path.exists(filepath):
                raise Exception(f"Archivo no encontrado: {filepath}")
            
            file_size = os.path.getsize(filepath)
            print(f"[AudioService] Archivo existe, tamaño: {file_size} bytes")
            
            if file_size < 1000:  # Menos de 1KB probablemente está vacío o corrupto
                print(f"[AudioService] WARNING: Archivo muy pequeño ({file_size} bytes)")
            
            # OPTIMIZACIÓN: Cargar solo primeros 30 segundos para análisis rápido
            max_duration = 30.0  # Limitar a 30 segundos máximo
            
            # Cargar audio con sample rate reducido (8000 Hz) para mayor velocidad
            y, sr = librosa.load(filepath, sr=8000, mono=True, duration=max_duration)
            
            print(f"[AudioService] Audio cargado: samples={len(y)}, sr={sr}, duration={len(y)/sr:.2f}s")
            
            # Verificar que tenemos datos de audio válidos
            if len(y) == 0 or np.max(np.abs(y)) < 0.0001:
                print("[AudioService] WARNING: Audio vacío o silencioso, usando valores por defecto")
                return {
                    'success': True,
                    'data': {
                        'emotions': self._generate_default_emotions(),
                        'confidence': 0.5,
                        'features': {'pitch_mean': 0, 'pitch_variation': 0, 'energy': 0, 'voice_quality': 0}
                    }
                }
            
            audio_data = {
                'y': y,
                'sr': sr,
                'duration': len(y) / sr
            }
            
            features = self.feature_extractor.extract(audio_data)
            print(f"[AudioService] Features extraídos: {len(features) if features is not None else 0}")
            
            # Si FeatureExtractor devuelve array, convertir a lista
            if isinstance(features, np.ndarray):
                features = features.flatten().tolist()

            # Análisis IA o heurístico
            if self.model is not None and self.label_encoder is not None:
                print("[AudioService] Usando modelo ML para análisis")
                emotions, confidence = self._analyze_with_model(features)
            else:
                print("[AudioService] Modelo ML no disponible, usando análisis heurístico")
                emotions, confidence = self._analyze_heuristic(features)

            # Retornar resultados con formato correcto
            result = {
                'success': True,
                'data': {
                    'emotions': emotions,
                    'confidence': float(confidence),
                    'features': self._get_feature_summary(features)
                }
            }
            
            print(f"[DEBUG] AudioService retornando: emotions count={len(emotions)}, confidence={confidence}")
            if emotions:
                print(f"[DEBUG] Primera emoción: {emotions[0]}")
            
            return result
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': f"Error en análisis: {str(e)}"
            }

    # ============================================================
    # ANÁLISIS CON MODELO
    # ============================================================
    def _analyze_with_model(self, features):
        try:
            print(f"[DEBUG] Analizando con modelo IA...")
            print(f"[DEBUG] Features shape: {len(features)}")
            print(f"[DEBUG] Primeros 5 features: {features[:5]}")
            
            # Convertir features a array 2D
            features_array = np.array(features).reshape(1, -1)
            features_scaled = self.scaler.transform(features_array)
            
            # Obtener predicciones
            predictions = self.model.predict_proba(features_scaled)[0]
            
            print(f"[DEBUG] Predicciones raw: {predictions}")
            
            # Mapear a nombres de emociones en español
            emotion_map = {
                'feliz': 'Felicidad',
                'triste': 'Tristeza',
                'enojado': 'Enojo',
                'neutral': 'Neutral',
                'sorprendido': 'Sorpresa',
                'asustado': 'Miedo'
            }
            
            color_map = {
                'Felicidad': '#FFD700',
                'Tristeza': '#4169E1',
                'Enojo': '#FF6347',
                'Neutral': '#808080',
                'Sorpresa': '#FF69B4',
                'Miedo': '#9370DB',
                'Estrés': '#FF4500',
                'Ansiedad': '#9b5de5'
            }
            
            emotions = []
            print(f"[DEBUG] label_encoder.classes_: {list(self.label_encoder.classes_)}")
            print(f"[DEBUG] predictions length: {len(predictions)}")
            
            # Mapear las 6 emociones del modelo
            for i, emotion_key in enumerate(self.label_encoder.classes_):
                emotion_name = emotion_map.get(emotion_key, emotion_key.capitalize())
                prob_value = float(predictions[i] * 100)
                emotions.append({
                    "name": emotion_name,
                    "value": round(prob_value, 1),
                    "color": color_map.get(emotion_name, '#888888')
                })
                print(f"[DEBUG] Emoción {i}: {emotion_key} → {emotion_name} = {prob_value:.1f}%")
            
            # Calcular Estrés y Ansiedad a partir de las emociones base
            emotion_dict = {e['name']: e['value'] for e in emotions}
            estres_value = max(
                emotion_dict.get('Enojo', 0) * 0.7,
                emotion_dict.get('Sorpresa', 0) * 0.5
            )
            ansiedad_value = max(
                emotion_dict.get('Miedo', 0) * 0.8,
                emotion_dict.get('Tristeza', 0) * 0.5
            )
            
            emotions.append({
                "name": "Estrés",
                "value": round(estres_value, 1),
                "color": color_map['Estrés']
            })
            emotions.append({
                "name": "Ansiedad",
                "value": round(ansiedad_value, 1),
                "color": color_map['Ansiedad']
            })
            
            print(f"[DEBUG] Estrés calculado: {estres_value:.1f}%")
            print(f"[DEBUG] Ansiedad calculada: {ansiedad_value:.1f}%")
            
            emotions.sort(key=lambda x: x['value'], reverse=True)
            confidence = float(np.max(predictions))
            
            print(f"[DEBUG] Total emociones creadas: {len(emotions)}")
            print(f"[DEBUG] Predicción exitosa - Emoción dominante: {emotions[0]['name']} ({confidence*100:.1f}%)")
            
            return emotions, confidence
        
        except Exception as e:
            print(f"[ERROR] Error en análisis con modelo: {e}")
            import traceback
            traceback.print_exc()
            return self._analyze_heuristic(features)

    # ============================================================
    # ANÁLISIS HEURÍSTICO
    # ============================================================
    def _analyze_heuristic(self, features):
        print(f"[AudioService] Usando análisis heurístico (modelo ML no cargado)")
        
        # Asegurar que features es una lista
        if isinstance(features, np.ndarray):
            features = features.flatten().tolist()
        
        # Validar que tenemos features válidos
        if not features or len(features) < 5:
            print(f"[AudioService] WARNING: Features insuficientes: {len(features) if features else 0}")
            # Generar emociones por defecto basadas en valores neutros
            return self._generate_default_emotions(), 0.5
            
        pitch_mean = float(features[0]) if len(features) > 0 else 150.0
        pitch_std = float(features[1]) if len(features) > 1 else 50.0
        energy = float(features[2]) if len(features) > 2 else 0.05
        zcr = float(features[4]) if len(features) > 4 else 0.05
        
        print(f"[AudioService] Features: pitch_mean={pitch_mean:.2f}, pitch_std={pitch_std:.2f}, energy={energy:.4f}, zcr={zcr:.4f}")

        # Normalizar valores (evitar división por cero)
        pitch_norm = min(1.0, max(0.0, pitch_mean / 300.0))
        pitch_std_norm = min(1.0, max(0.0, pitch_std / 100.0))
        energy_norm = min(1.0, max(0.0, energy / 0.1))
        zcr_norm = min(1.0, max(0.0, zcr * 10.0))

        happiness = (pitch_norm*0.4 + energy_norm*0.4 + (1-pitch_std_norm)*0.2) * 100
        sadness   = ((1-pitch_norm)*0.4 + (1-energy_norm)*0.4 + (1-pitch_std_norm)*0.2) * 100
        anger     = (pitch_std_norm*0.4 + energy_norm*0.4 + zcr_norm*0.2) * 100
        neutral   = max(5, (1 - abs(pitch_norm - 0.5)) * (1 - energy_norm) * 100)  # Mínimo 5%
        surprise  = (pitch_std_norm*0.5 + energy_norm*0.3 + pitch_norm*0.2) * 100
        fear      = (zcr_norm*0.5 + pitch_std_norm*0.3 + (1-energy_norm)*0.2) * 100
        stress    = (zcr_norm*0.4 + pitch_std_norm*0.3 + energy_norm*0.3) * 100
        anxiety   = (pitch_std_norm*0.4 + zcr_norm*0.3 + (energy_norm*0.5)*0.3) * 100

        total = happiness + sadness + anger + neutral + surprise + fear + stress + anxiety
        factor = 100 / total if total > 0 else 1

        emotions = [
            {"name": "Felicidad", "value": round(happiness*factor, 1), "color": "#FFD700"},
            {"name": "Tristeza",  "value": round(sadness*factor, 1), "color": "#4169E1"},
            {"name": "Enojo",     "value": round(anger*factor, 1), "color": "#FF6347"},
            {"name": "Neutral",   "value": round(neutral*factor, 1), "color": "#808080"},
            {"name": "Sorpresa",  "value": round(surprise*factor, 1), "color": "#FF69B4"},
            {"name": "Miedo",     "value": round(fear*factor, 1), "color": "#9370DB"},
            {"name": "Estrés",    "value": round(stress*factor, 1), "color": "#FF4500"},
            {"name": "Ansiedad",  "value": round(anxiety*factor, 1), "color": "#9b5de5"},
        ]

        emotions.sort(key=lambda x: x['value'], reverse=True)
        print(f"[AudioService] Emociones heurísticas generadas: {[e['name'] + '=' + str(e['value']) for e in emotions[:3]]}")
        return emotions, 0.75
    
    def _generate_default_emotions(self):
        """Genera emociones por defecto cuando no hay suficientes features"""
        return [
            {"name": "Neutral",   "value": 35.0, "color": "#808080"},
            {"name": "Felicidad", "value": 20.0, "color": "#FFD700"},
            {"name": "Tristeza",  "value": 15.0, "color": "#4169E1"},
            {"name": "Estrés",    "value": 10.0, "color": "#FF4500"},
            {"name": "Ansiedad",  "value": 8.0, "color": "#9b5de5"},
            {"name": "Enojo",     "value": 5.0, "color": "#FF6347"},
            {"name": "Sorpresa",  "value": 4.0, "color": "#FF69B4"},
            {"name": "Miedo",     "value": 3.0, "color": "#9370DB"},
        ]

    # ============================================================
    # RESUMEN DE FEATURES
    # ============================================================
    def _get_feature_summary(self, features):
        if isinstance(features, np.ndarray):
            features = features.flatten().tolist()
            
        return {
            'pitch_mean': round(float(features[0]), 2) if len(features) > 0 else 0,
            'pitch_variation': round(float(features[1]), 2) if len(features) > 1 else 0,
            'energy': round(float(features[2]), 4) if len(features) > 2 else 0,
            'voice_quality': round(float(features[4]), 4) if len(features) > 4 else 0
        }

    # ============================================================
    # NUEVA FUNCIÓN PARA GUARDAR MUESTRA DESDE ROUTES
    # ============================================================
    def save_training_sample(self, audio_db_id, features, emotions, duration):
        """Recibe la muestra desde audio_routes y la guarda en JSON"""
        sample = {
            "id_audio": audio_db_id,
            "features": features,
            "emotions": emotions,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        }

        self._save_sample_to_file(sample)

    # ============================================================
    # GUARDADO REAL EN EL JSON
    # ============================================================
    def _save_sample_to_file(self, sample):
        try:
            if os.path.exists(self.training_data_path):
                with open(self.training_data_path, 'r') as f:
                    data = json.load(f)
            else:
                data = []

            data.append(sample)

            with open(self.training_data_path, 'w') as f:
                json.dump(data, f, indent=2)

            if len(data) % 100 == 0:
                print(f"Auto-reentrenamiento ({len(data)} muestras)")
                self.retrain_model()

        except Exception as e:
            print(f"Error guardando datos: {e}")

    # ============================================================
    # REENTRENAMIENTO DEL MODELO
    # ============================================================
    def retrain_model(self):
        try:
            if not os.path.exists(self.training_data_path):
                return {'success': False, 'error': 'No hay datos'}

            with open(self.training_data_path, 'r') as f:
                data = json.load(f)

            if len(data) < 50:
                return {'success': False, 'error': f'Insuficientes datos: {len(data)}/50'}

            X = np.array([s['features'] for s in data])
            y = np.array([max(range(len(s['emotions'])), key=lambda i: s['emotions'][i]['value']) 
                          for s in data])

            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_val_scaled = self.scaler.transform(X_val)

            self.model = GradientBoostingClassifier(
                n_estimators=150,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            self.model.fit(X_train_scaled, y_train)

            train_score = self.model.score(X_train_scaled, y_train)
            val_score = self.model.score(X_val_scaled, y_val)

            joblib.dump(self.model, self.model_path)

            return {
                'success': True,
                'samples_used': len(data),
                'train_accuracy': round(train_score, 4),
                'validation_accuracy': round(val_score, 4),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ============================================================
    # ESTADÍSTICAS
    # ============================================================
    def get_training_stats(self):
        try:
            if not os.path.exists(self.training_data_path):
                return {'total_samples': 0, 'model_trained': False}

            with open(self.training_data_path, 'r') as f:
                data = json.load(f)

            return {
                'total_samples': len(data),
                'model_trained': self.model is not None,
                'next_retrain_at': ((len(data)//100)+1)*100,
                'samples_until_retrain': ((len(data)//100)+1)*100 - len(data)
            }

        except:
            return {'error': 'No disponible'}
