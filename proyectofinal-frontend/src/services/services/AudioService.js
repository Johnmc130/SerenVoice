const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class AudioService {
  async analyzeAudio(audioUri, duration = 0, userId = null, token = null) {
    try {
      const formData = new FormData();

      let audioFile;

      // ===============================
      // WEB (blob)
      // ===============================
      if (audioUri.startsWith("blob:")) {
        const res = await fetch(audioUri);
        const blob = await res.blob();

        audioFile = new File([blob], "audio.webm", {
          type: "audio/webm",
        });
      } 
      // ===============================
      // MOBILE
      // ===============================
      else {
        audioFile = {
          uri: audioUri,
          type: "audio/webm",
          name: "audio.webm",
        };
      }

      // 🔥 CLAVE: sin filename manual
      formData.append("audio", audioFile);
      formData.append("duration", duration.toString());

      if (userId) {
        formData.append("user_id", userId.toString());
      }

      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/audio/analyze`, {
        method: "POST",
        headers, // ❗ NO Content-Type
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      return await response.json();

    } catch (error) {
      console.error("❌ Error en análisis de audio:", error);
      throw error;
    }
  }
}

export default new AudioService();
