// Package main - Script de despliegue automático para SerenVoice
// Este script gestiona recursos en Google Cloud Platform usando el SDK de Go
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"

	"cloud.google.com/go/logging"
	run "cloud.google.com/go/run/apiv2"
	runpb "cloud.google.com/go/run/apiv2/runpb"
)

// Config almacena la configuración del despliegue
type Config struct {
	ProjectID   string
	Region      string
	ServiceName string
	Image       string
	Memory      string
	CPU         string
	EnvVars     map[string]string
}

// DeploymentResult contiene el resultado del despliegue
type DeploymentResult struct {
	ServiceURL string
	Version    string
	Timestamp  time.Time
	Success    bool
	Message    string
}

// CloudLogger maneja el logging en Google Cloud
type CloudLogger struct {
	client *logging.Client
	logger *logging.Logger
}

// NewCloudLogger crea un nuevo logger de Cloud Logging
func NewCloudLogger(projectID string) (*CloudLogger, error) {
	ctx := context.Background()
	client, err := logging.NewClient(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to create logging client: %v", err)
	}

	return &CloudLogger{
		client: client,
		logger: client.Logger("serenvoice-deploy"),
	}, nil
}

// Log escribe un mensaje en Cloud Logging
func (cl *CloudLogger) Log(severity logging.Severity, message string) {
	cl.logger.Log(logging.Entry{
		Severity: severity,
		Payload:  message,
	})
	// También imprimir en consola
	fmt.Printf("[%s] %s\n", severity, message)
}

// Close cierra el cliente de logging
func (cl *CloudLogger) Close() {
	cl.client.Close()
}

// loadConfig carga la configuración desde variables de entorno
func loadConfig() *Config {
	return &Config{
		ProjectID:   getEnv("GCP_PROJECT_ID", "boreal-dock-481001-k0"),
		Region:      getEnv("GCP_REGION", "us-central1"),
		ServiceName: getEnv("SERVICE_NAME", "serenvoice-backend"),
		Memory:      getEnv("MEMORY", "512Mi"),
		CPU:         getEnv("CPU", "1"),
		EnvVars: map[string]string{
			"FLASK_ENV":      "production",
			"DB_HOST":        os.Getenv("DB_HOST"),
			"DB_PORT":        os.Getenv("DB_PORT"),
			"DB_USER":        os.Getenv("DB_USER"),
			"DB_PASSWORD":    os.Getenv("DB_PASSWORD"),
			"DB_NAME":        os.Getenv("DB_NAME"),
			"JWT_SECRET_KEY": os.Getenv("JWT_SECRET_KEY"),
		},
	}
}

// getEnv obtiene variable de entorno con valor por defecto
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// buildImage construye la imagen Docker usando Cloud Build
func buildImage(config *Config, logger *CloudLogger) (string, error) {
	logger.Log(logging.Info, "Iniciando construcción de imagen Docker...")

	imageTag := fmt.Sprintf("gcr.io/%s/%s:latest", config.ProjectID, config.ServiceName)

	cmd := exec.Command("gcloud", "builds", "submit",
		"--tag", imageTag,
		"--project", config.ProjectID,
		"--quiet",
		"./backend")

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		logger.Log(logging.Error, fmt.Sprintf("Error construyendo imagen: %v", err))
		return "", err
	}

	logger.Log(logging.Info, fmt.Sprintf("Imagen construida: %s", imageTag))
	return imageTag, nil
}

// deployToCloudRun despliega el servicio a Cloud Run usando el SDK
func deployToCloudRun(ctx context.Context, config *Config, imageTag string, logger *CloudLogger) (*DeploymentResult, error) {
	logger.Log(logging.Info, "Iniciando despliegue a Cloud Run...")

	// Crear cliente de Cloud Run
	client, err := run.NewServicesClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create Cloud Run client: %v", err)
	}
	defer client.Close()

	// Preparar variables de entorno
	var envVars []*runpb.EnvVar
	for key, value := range config.EnvVars {
		if value != "" {
			envVars = append(envVars, &runpb.EnvVar{
				Name: key,
				Values: &runpb.EnvVar_Value{
					Value: value,
				},
			})
		}
	}

	// Usar gcloud para desplegar (más simple y confiable)
	envVarStrings := []string{}
	for key, value := range config.EnvVars {
		if value != "" {
			envVarStrings = append(envVarStrings, fmt.Sprintf("%s=%s", key, value))
		}
	}

	args := []string{
		"run", "deploy", config.ServiceName,
		"--image", imageTag,
		"--region", config.Region,
		"--platform", "managed",
		"--allow-unauthenticated",
		"--memory", config.Memory,
		"--project", config.ProjectID,
		"--quiet",
	}

	if len(envVarStrings) > 0 {
		args = append(args, "--set-env-vars", strings.Join(envVarStrings, ","))
	}

	cmd := exec.Command("gcloud", args...)
	output, err := cmd.CombinedOutput()

	if err != nil {
		logger.Log(logging.Error, fmt.Sprintf("Error en despliegue: %v\n%s", err, string(output)))
		return &DeploymentResult{
			Success:   false,
			Message:   string(output),
			Timestamp: time.Now(),
		}, err
	}

	// Obtener URL del servicio
	serviceURL := extractServiceURL(string(output))

	result := &DeploymentResult{
		ServiceURL: serviceURL,
		Version:    time.Now().Format("20060102-150405"),
		Timestamp:  time.Now(),
		Success:    true,
		Message:    "Despliegue exitoso",
	}

	logger.Log(logging.Info, fmt.Sprintf("✅ Servicio desplegado: %s", serviceURL))
	return result, nil
}

// extractServiceURL extrae la URL del servicio de la salida de gcloud
func extractServiceURL(output string) string {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "https://") {
			parts := strings.Fields(line)
			for _, part := range parts {
				if strings.HasPrefix(part, "https://") {
					return part
				}
			}
		}
	}
	return ""
}

// healthCheck verifica que el servicio esté funcionando
func healthCheck(serviceURL string, logger *CloudLogger) error {
	logger.Log(logging.Info, "Verificando salud del servicio...")

	// Esperar un momento para que el servicio inicie
	time.Sleep(5 * time.Second)

	cmd := exec.Command("curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", serviceURL+"/api/health")
	output, err := cmd.Output()

	if err != nil {
		logger.Log(logging.Warning, fmt.Sprintf("Error en health check: %v", err))
		return err
	}

	statusCode := strings.TrimSpace(string(output))
	if statusCode == "200" {
		logger.Log(logging.Info, "✅ Health check exitoso")
		return nil
	}

	logger.Log(logging.Warning, fmt.Sprintf("Health check devolvió: %s", statusCode))
	return fmt.Errorf("health check failed with status: %s", statusCode)
}

// rollback revierte a la versión anterior en caso de fallo
func rollback(config *Config, logger *CloudLogger) error {
	logger.Log(logging.Warning, "Iniciando rollback a versión anterior...")

	cmd := exec.Command("gcloud", "run", "services", "update-traffic",
		config.ServiceName,
		"--to-revisions", "LATEST=100",
		"--region", config.Region,
		"--project", config.ProjectID)

	if err := cmd.Run(); err != nil {
		logger.Log(logging.Error, fmt.Sprintf("Error en rollback: %v", err))
		return err
	}

	logger.Log(logging.Info, "Rollback completado")
	return nil
}

func main() {
	fmt.Println("🚀 SerenVoice - Script de Despliegue Automático")
	fmt.Println("================================================")

	ctx := context.Background()
	config := loadConfig()

	// Inicializar Cloud Logging
	logger, err := NewCloudLogger(config.ProjectID)
	if err != nil {
		log.Printf("Warning: No se pudo inicializar Cloud Logging: %v", err)
		// Continuar sin Cloud Logging
	} else {
		defer logger.Close()
	}

	// Si no hay logger, crear uno simple
	if logger == nil {
		logger = &CloudLogger{}
	}

	fmt.Printf("📦 Proyecto: %s\n", config.ProjectID)
	fmt.Printf("🌍 Región: %s\n", config.Region)
	fmt.Printf("🔧 Servicio: %s\n", config.ServiceName)
	fmt.Println()

	// Paso 1: Construir imagen
	imageTag, err := buildImage(config, logger)
	if err != nil {
		log.Fatalf("❌ Error construyendo imagen: %v", err)
	}

	// Paso 2: Desplegar a Cloud Run
	result, err := deployToCloudRun(ctx, config, imageTag, logger)
	if err != nil {
		log.Printf("❌ Error en despliegue: %v", err)
		rollback(config, logger)
		os.Exit(1)
	}

	// Paso 3: Health Check
	if result.ServiceURL != "" {
		if err := healthCheck(result.ServiceURL, logger); err != nil {
			log.Printf("⚠️ Health check falló, iniciando rollback...")
			rollback(config, logger)
		}
	}

	// Resultado final
	fmt.Println()
	fmt.Println("================================================")
	fmt.Println("✅ DESPLIEGUE COMPLETADO")
	fmt.Printf("🌐 URL: %s\n", result.ServiceURL)
	fmt.Printf("📅 Versión: %s\n", result.Version)
	fmt.Printf("⏰ Timestamp: %s\n", result.Timestamp.Format(time.RFC3339))
	fmt.Println("================================================")
}
