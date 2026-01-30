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
            # 1. PITCH (Media + Desviación)
            # ==========================================================
            try:
                pitches, magnitudes = librosa.piptrack(
                    y=y, sr=sr, fmin=75, fmax=400
                )
                pitch_vals = []

                for t in range(pitches.shape[1]):
                    idx = magnitudes[:, t].argmax()
                    p = pitches[idx, t]
                    if p > 0:
                        pitch_vals.append(p)

                if pitch_vals:
                    features += [np.mean(pitch_vals), np.std(pitch_vals)]
                else:
                    features += [150.0, 20.0]

            except:
                features += [150.0, 20.0]

            # ==========================================================
            # 2. ENERGÍA (RMS)
            # ==========================================================
            try:
                rms = librosa.feature.rms(y=y)[0]
                features += [np.mean(rms), np.std(rms)]
            except:
                features += [0.05, 0.01]

            # ==========================================================
            # 3. ZERO CROSSING RATE
            # ==========================================================
            try:
                zcr = librosa.feature.zero_crossing_rate(y=y)[0]
                features += [np.mean(zcr), np.std(zcr)]
            except:
                features += [0.05, 0.01]

            # ==========================================================
            # 4. ESPECTRO (Centroid, Rolloff)
            # ==========================================================
            try:
                cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
                features += [np.mean(cent), np.std(cent)]

                roll = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
                features.append(np.mean(roll))

            except:
                features += [2000.0, 1000.0, 3000.0]

            # ==========================================================
            # 5. TEMPO
            # ==========================================================
            try:
                tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                features.append(float(tempo))
            except:
                features.append(120.0)

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
