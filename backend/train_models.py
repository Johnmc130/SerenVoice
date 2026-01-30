"""
Script para probar que el modelo funcione correctamente
"""
import os
import sys
import numpy as np
import joblib
import librosa

# Ajustar paths
ROOT = os.path.dirname(__file__) or "."
sys.path.append(ROOT)

from utils.feature_extractor import FeatureExtractor
from utils.audio_processor import AudioProcessor

print("="*60)
print("TEST DE PREDICCIONES DEL MODELO")
print("="*60)

# 1. Cargar modelo
model_path = os.path.join(ROOT, 'models', 'emotion_model.pkl')
print(f"\n1️⃣ Cargando modelo desde: {model_path}")

if not os.path.exists(model_path):
    print(f"❌ Modelo no existe en: {model_path}")
    sys.exit(1)

model_data = joblib.load(model_path)
model = model_data['model']
scaler = model_data['scaler']
label_encoder = model_data['label_encoder']

print(f"✅ Modelo cargado")
print(f"   - Clases: {list(label_encoder.classes_)}")
print(f"   - Número de clases: {len(label_encoder.classes_)}")

# 2. Buscar archivos de audio de prueba
print(f"\n2️⃣ Buscando archivos de audio de prueba...")
test_files = []
for emotion in ['feliz', 'triste', 'enojado']:
    for root, dirs, files in os.walk(os.path.join(ROOT, "data", "public_datasets", "RAVDESS")):
        for f in files:
            if f.endswith('.wav'):
                # Decodificar emoción del nombre
                parts = f.replace('.wav', '').split('-')
                if len(parts) >= 3:
                    emotion_code = int(parts[2])
                    if (emotion == 'feliz' and emotion_code == 3) or \
                       (emotion == 'triste' and emotion_code == 4) or \
                       (emotion == 'enojado' and emotion_code == 5):
                        test_files.append((os.path.join(root, f), emotion))
                        break
        if len([e for _, e in test_files if e == emotion]) > 0:
            break

print(f"✅ Encontrados {len(test_files)} archivos de prueba")

# 3. Procesar y predecir
fe = FeatureExtractor()
ap = AudioProcessor()

print(f"\n3️⃣ Procesando archivos y haciendo predicciones...")
print("-"*60)

for i, (filepath, expected_emotion) in enumerate(test_files, 1):
    print(f"\n[{i}] Archivo: {os.path.basename(filepath)}")
    print(f"    Emoción esperada: {expected_emotion}")
    
    try:
        # Cargar audio
        y, sr = librosa.load(filepath, sr=16000, mono=True)
        audio_data = {'y': y, 'sr': sr, 'duration': len(y)/sr}
        
        # Extraer features
        features = fe.extract(audio_data)
        if isinstance(features, np.ndarray):
            features = features.flatten()
        
        print(f"    Features shape: {features.shape}")
        print(f"    Primeros 5 features: {features[:5]}")
        
        # Escalar
        features_scaled = scaler.transform([features])
        
        # Predecir
        predictions = model.predict_proba(features_scaled)[0]
        predicted_class = model.predict(features_scaled)[0]
        predicted_emotion = label_encoder.inverse_transform([predicted_class])[0]
        
        print(f"    ✅ Predicción: {predicted_emotion} ({predictions[predicted_class]*100:.1f}%)")
        print(f"    Distribución completa:")
        for j, emotion in enumerate(label_encoder.classes_):
            print(f"       - {emotion}: {predictions[j]*100:.1f}%")
        
        if predicted_emotion == expected_emotion:
            print(f"    ✓ CORRECTO")
        else:
            print(f"    ✗ INCORRECTO (esperaba {expected_emotion})")
            
    except Exception as e:
        print(f"    ❌ Error: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "="*60)
print("TEST COMPLETADO")
print("="*60)