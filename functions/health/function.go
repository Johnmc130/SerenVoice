// Package function - Cloud Function serverless en Go para SerenVoice
// Esta función procesa webhooks y eventos del sistema
package function

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"cloud.google.com/go/logging"
)

// HealthEvent representa un evento de salud del sistema
type HealthEvent struct {
	Service   string    `json:"service"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

// AlertPayload representa una alerta del sistema
type AlertPayload struct {
	Type      string                 `json:"type"`
	Severity  string                 `json:"severity"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data"`
	Timestamp time.Time              `json:"timestamp"`
}

// Response estructura de respuesta estándar
type Response struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// cloudLogger es el logger global
var cloudLogger *logging.Logger

// init inicializa el logger de Cloud Logging
func init() {
	projectID := os.Getenv("GCP_PROJECT_ID")
	if projectID == "" {
		projectID = "boreal-dock-481001-k0"
	}

	ctx := context.Background()
	client, err := logging.NewClient(ctx, projectID)
	if err != nil {
		log.Printf("Warning: No se pudo inicializar Cloud Logging: %v", err)
		return
	}

	cloudLogger = client.Logger("serenvoice-functions")
}

// logToCloud envía un log a Cloud Logging
func logToCloud(severity logging.Severity, message string, payload interface{}) {
	if cloudLogger != nil {
		cloudLogger.Log(logging.Entry{
			Severity: severity,
			Payload: map[string]interface{}{
				"message": message,
				"data":    payload,
			},
		})
	}
	log.Printf("[%s] %s", severity, message)
}

// HealthCheck - Cloud Function para verificar salud del sistema
// Endpoint: /health-check
func HealthCheck(w http.ResponseWriter, r *http.Request) {
	logToCloud(logging.Info, "Health check invocado", nil)

	// Verificar servicios
	services := []HealthEvent{
		{
			Service:   "cloud-function",
			Status:    "healthy",
			Timestamp: time.Now(),
			Message:   "Cloud Function operativa",
		},
		{
			Service:   "logging",
			Status:    "healthy",
			Timestamp: time.Now(),
			Message:   "Cloud Logging conectado",
		},
	}

	response := Response{
		Success:   true,
		Message:   "Sistema operativo",
		Data:      services,
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response)
}

// ProcessAlert - Cloud Function para procesar alertas del sistema
// Endpoint: /process-alert
func ProcessAlert(w http.ResponseWriter, r *http.Request) {
	// Solo aceptar POST
	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var alert AlertPayload
	if err := json.NewDecoder(r.Body).Decode(&alert); err != nil {
		logToCloud(logging.Error, "Error decodificando alerta", err.Error())
		http.Error(w, "Payload inválido", http.StatusBadRequest)
		return
	}

	alert.Timestamp = time.Now()

	// Procesar según tipo de alerta
	switch alert.Type {
	case "emotion_critical":
		logToCloud(logging.Alert, "Alerta crítica de emoción detectada", alert)
		// Aquí se podría enviar notificación
	case "system_error":
		logToCloud(logging.Error, "Error del sistema reportado", alert)
	case "user_activity":
		logToCloud(logging.Info, "Actividad de usuario registrada", alert)
	default:
		logToCloud(logging.Info, "Alerta genérica recibida", alert)
	}

	response := Response{
		Success:   true,
		Message:   fmt.Sprintf("Alerta '%s' procesada correctamente", alert.Type),
		Data:      alert,
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response)
}

// MonitorDeployment - Cloud Function para monitorear despliegues
// Endpoint: /monitor-deployment
func MonitorDeployment(w http.ResponseWriter, r *http.Request) {
	logToCloud(logging.Info, "Monitor de despliegue invocado", nil)

	// Obtener información del despliegue
	deployInfo := map[string]interface{}{
		"project_id":   os.Getenv("GCP_PROJECT_ID"),
		"region":       os.Getenv("FUNCTION_REGION"),
		"function":     os.Getenv("FUNCTION_NAME"),
		"memory":       os.Getenv("FUNCTION_MEMORY_MB"),
		"timestamp":    time.Now(),
		"environment":  "production",
		"go_version":   "1.21",
	}

	response := Response{
		Success:   true,
		Message:   "Información de despliegue",
		Data:      deployInfo,
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response)
}

// NotifyEmotionAnalysis - Cloud Function para notificar análisis de emociones
// Esta función se puede invocar desde el backend cuando se detecta una emoción crítica
func NotifyEmotionAnalysis(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		UserID    int     `json:"user_id"`
		Emotion   string  `json:"emotion"`
		Intensity float64 `json:"intensity"`
		AudioID   int     `json:"audio_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		logToCloud(logging.Error, "Error decodificando análisis", err.Error())
		http.Error(w, "Payload inválido", http.StatusBadRequest)
		return
	}

	// Log del análisis
	logToCloud(logging.Info, "Análisis de emoción recibido", payload)

	// Si la intensidad es alta, crear alerta
	if payload.Intensity > 0.8 {
		logToCloud(logging.Warning, "Emoción de alta intensidad detectada", payload)
	}

	response := Response{
		Success:   true,
		Message:   "Análisis procesado",
		Data:      payload,
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(response)
}
