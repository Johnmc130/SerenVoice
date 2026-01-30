import os
import subprocess
import tempfile
import numpy as np
from scipy.io import wavfile

class AudioProcessor:
    def __init__(self):
        pass

    def _convert_webm_to_wav(self, filepath):
        try:
            print("[AudioProcessor] Convirtiendo WEBM a WAV...")

            temp_wav = filepath.replace(".webm", ".wav")

            command = [
                "ffmpeg", "-y",
                "-i", filepath,
                "-ar", "16000",
                "-ac", "1",
                temp_wav
            ]

            subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            print("[AudioProcessor] Conversion completada correctamente.")

            return temp_wav

        except Exception as e:
            raise Exception(f"No se pudo convertir WEBM: {str(e)}")

    def _load_wav(self, filepath):
        try:
            print("[AudioProcessor] Cargando WAV...")

            sr, data = wavfile.read(filepath)

            if data.dtype == np.int16:
                data = data.astype(np.float32) / 32768.0

            print("[AudioProcessor] WAV cargado correctamente.")
            return sr, data

        except Exception as e:
            raise Exception(f"Error al cargar WAV: {str(e)}")

    def process(self, filepath):
        print("[AudioProcessor] Iniciando procesamiento de audio...")

        if filepath.endswith(".webm"):
            filepath = self._convert_webm_to_wav(filepath)

        sr, data = self._load_wav(filepath)

        return {
            "sr": sr,
            "data": data
        }
