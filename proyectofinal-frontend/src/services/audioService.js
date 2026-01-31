import apiClient from './apiClient';
import api from '../config/api';

class AudioService {
  // Analiza el audio y envía el id del usuario
  async analyzeAudio(audioBlob, duration, userId) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', duration);
      formData.append('user_id', userId); // <-- enviar id del usuario

      const response = await apiClient.post(api.endpoints.audio.analyze, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 120 segundos para análisis de audio (procesamiento ML)
      });

      return response.data;
    } catch (error) {
      console.error('Error en análisis de audio:', error);
      throw error;
    }
  }

  // Verificar estado del servicio
  async checkHealth() {
    try {
      const res = await apiClient.get(api.endpoints.audio.health);
      return res.data;
    } catch (error) {
      console.error('Error verificando servicio:', error);
      return { status: 'error' };
    }
  }

  // Obtener estadísticas de entrenamiento
  async getTrainingStats() {
    try {
      const res = await apiClient.get(api.endpoints.audio.trainingStats);
      return res.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { error: error.message };
    }
  }

  // Reentrenar modelo manualmente
  async retrainModel() {
    try {
      const res = await apiClient.post(api.endpoints.audio.retrain);
      return res.data;
    } catch (error) {
      console.error('Error reentrenando modelo:', error);
      return { error: error.message };
    }
  }
}

export default new AudioService();
