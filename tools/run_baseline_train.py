#!/usr/bin/env python3
"""Train a baseline model on RAVDESS dataset and save to backend/models/emotion_model.pkl

Usage:
  python tools/run_baseline_train.py
"""
import os
import sys
import traceback
import json
from datetime import datetime

def main():
    cwd = os.getcwd()
    if cwd not in sys.path:
        sys.path.insert(0, cwd)
    backend_path = os.path.join(cwd, 'backend')
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    try:
        import numpy as np
        from sklearn.preprocessing import StandardScaler
        from sklearn.ensemble import GradientBoostingClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder
        import joblib
        from utils.feature_extractor import FeatureExtractor
        import librosa
    except Exception as e:
        print('ERROR importing training deps:', e)
        traceback.print_exc()
        return 2

    root = os.path.join('backend', 'data', 'public_datasets', 'RAVDESS')
    if not os.path.exists(root):
        print('RAVDESS path not found:', root)
        return 3

    # Map RAVDESS emotion codes to project labels (Spanish, lowercase)
    code_map = {
        '01': 'neutral',
        '03': 'feliz',
        '04': 'triste',
        '05': 'enojado',
        '06': 'asustado',
        '08': 'sorprendido'
    }

    fe = FeatureExtractor()
    X = []
    y = []
    files_used = 0

    print('Scanning RAVDESS files under', root)
    for dirpath, dirnames, filenames in os.walk(root):
        for f in filenames:
            if not f.lower().endswith('.wav'):
                continue
            parts = f.replace('.wav','').split('-')
            if len(parts) < 3:
                continue
            code = parts[2]
            label = code_map.get(code)
            if not label:
                continue
            filepath = os.path.join(dirpath, f)
            try:
                y_audio, sr = librosa.load(filepath, sr=16000, mono=True)
                audio_data = {'y': y_audio, 'sr': sr, 'duration': len(y_audio)/sr}
                feats = fe.extract(audio_data)
                if isinstance(feats, np.ndarray):
                    feats = feats.flatten()
                X.append(feats)
                y.append(label)
                files_used += 1
            except Exception as e:
                print('Warning: failed processing', filepath, e)

    if files_used == 0:
        print('No RAVDESS files found for mapped emotions.')
        return 4

    X = np.array(X)
    y = np.array(y)

    print(f'Collected {len(X)} samples, feature dim={X.shape[1]}')

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_val, y_train, y_val = train_test_split(X, y_enc, test_size=0.2, random_state=42, stratify=y_enc)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)

    model = GradientBoostingClassifier(n_estimators=150, learning_rate=0.1, max_depth=5, random_state=42)
    print('Training model...')
    model.fit(X_train_s, y_train)

    train_score = model.score(X_train_s, y_train)
    val_score = model.score(X_val_s, y_val)

    models_dir = os.path.join('backend', 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'emotion_model.pkl')
    joblib.dump({'model': model, 'scaler': scaler, 'label_encoder': le}, model_path)

    result = {
        'success': True,
        'samples': int(len(X)),
        'classes': list(le.classes_),
        'train_accuracy': float(round(train_score, 4)),
        'validation_accuracy': float(round(val_score, 4)),
        'model_path': model_path,
        'timestamp': datetime.now().isoformat()
    }

    print('Training complete:')
    print(json.dumps(result, indent=2))
    return 0

if __name__ == '__main__':
    sys.exit(main())
