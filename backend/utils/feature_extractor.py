import librosa
import numpy as np
from scipy.stats import skew, kurtosis


class FeatureExtractor:
    """
    Extrae un conjunto amplio y consistente de características acústicas
    para análisis emocional / ML.
    """

    def extract(self, audio_data):
        try:
            y = audio_data["y"]
            sr = audio_data["sr"]

            features = []

            # ==========================================================
            # 1. PITCH (OPTIMIZADO: usar pyin en lugar de piptrack)
            # ==========================================================
            try:
                # pyin es más rápido que piptrack y da buenos resultados
                f0, voiced_flag, voiced_probs = librosa.pyin(
                    y, 
                    fmin=librosa.note_to_hz('C2'),
                    fmax=librosa.note_to_hz('C7'),
                    sr=sr
                )
                # Filtrar valores NaN (silencios)
                f0_valid = f0[~np.isnan(f0)]
                if len(f0_valid) > 0:
                    pitch_mean = float(np.mean(f0_valid))
                    pitch_std = float(np.std(f0_valid))
                else:
                    pitch_mean = 150.0
                    pitch_std = 20.0
                features += [pitch_mean, pitch_std]
            except Exception as e:
                print(f"[FeatureExtractor] Error calculando pitch: {e}")
                features += [150.0, 20.0]  # Valores fallback

            # ==========================================================
            # 2. ENERGÍA (RMS) - RÁPIDO
            # ==========================================================
            try:
                rms = librosa.feature.rms(y=y)[0]
                features += [np.mean(rms), np.std(rms)]
            except:
                features += [0.05, 0.01]

            # ==========================================================
            # 3. ZERO CROSSING RATE - RÁPIDO
            # ==========================================================
            try:
                zcr = librosa.feature.zero_crossing_rate(y=y)[0]
                features += [np.mean(zcr), np.std(zcr)]
            except:
                features += [0.05, 0.01]

            # ==========================================================
            # 4. ESPECTRO (Centroid, Rolloff) - RÁPIDO
            # ==========================================================
            try:
                cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
                features += [np.mean(cent), np.std(cent)]

                roll = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
                features.append(np.mean(roll))

            except:
                features += [2000.0, 1000.0, 3000.0]

            # ==========================================================
            # 5. TEMPO (OPTIMIZADO: Skip beat_track, usar valor default)
            # ==========================================================
            # NOTA: beat_track es MUY lento, omitido para performance
            features.append(120.0)  # Tempo promedio

            # ==========================================================
            # 6. ESPECTRAL CONTRAST
            # ==========================================================
            try:
                contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
                features += [np.mean(contrast), np.std(contrast)]
            except:
                features += [0.5, 0.2]

            # ==========================================================
            # 7. CHROMA
            # ==========================================================
            try:
                chroma = librosa.feature.chroma_stft(y=y, sr=sr)
                features += [np.mean(chroma), np.std(chroma)]
            except:
                features += [0.5, 0.1]

            # ==========================================================
            # 8. MFCCs (13 MFCCs → mean + std = 26 features)
            # ==========================================================
            try:
                mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
                for mfcc in mfccs:
                    features += [np.mean(mfcc), np.std(mfcc)]
            except:
                features += [0.0] * 26

            # ==========================================================
            # 9. MOMENTOS ESTADÍSTICOS
            # ==========================================================
            try:
                features += [float(skew(y)), float(kurtosis(y))]
            except:
                features += [0.0, 0.0]

            return np.array(features, dtype=np.float32)

        except Exception as e:
            print(f"[FeatureExtractor] ERROR global extrayendo características: {e}")
            return np.zeros(43, dtype=np.float32)  # tamaño mínimo
