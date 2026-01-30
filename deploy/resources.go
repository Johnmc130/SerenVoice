// Package main - Script de gestión de recursos en GCP
// Usa el SDK de Google Cloud para Go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"cloud.google.com/go/logging"
	monitoring "cloud.google.com/go/monitoring/apiv3/v2"
	"cloud.google.com/go/monitoring/apiv3/v2/monitoringpb"
	"google.golang.org/api/run/v1"
)

// ResourceManager gestiona recursos de GCP
type ResourceManager struct {
	projectID string
	region    string
	ctx       context.Context
	logger    *CloudLogger
}

// CloudLogger para logging centralizado
type CloudLogger struct {
	client *logging.Client
	logger *logging.Logger
}

// ServiceStatus representa el estado de un servicio
type ServiceStatus struct {
	Name      string    `json:"name"`
	URL       string    `json:"url"`
	Status    string    `json:"status"`
	Revision  string    `json:"revision"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MetricData representa datos de métricas
type MetricData struct {
	Name      string    `json:"name"`
	Value     float64   `json:"value"`
	Unit      string    `json:"unit"`
	Timestamp time.Time `json:"timestamp"`
}

// NewResourceManager crea un nuevo gestor de recursos
func NewResourceManager(projectID, region string) (*ResourceManager, error) {
	ctx := context.Background()

	// Inicializar logger
	loggingClient, err := logging.NewClient(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("error creating logging client: %v", err)
	}

	cloudLogger := &CloudLogger{
		client: loggingClient,
		logger: loggingClient.Logger("serenvoice-resources"),
	}

	return &ResourceManager{
		projectID: projectID,
		region:    region,
		ctx:       ctx,
		logger:    cloudLogger,
	}, nil
}

// Log escribe un mensaje al logger
func (cl *CloudLogger) Log(severity logging.Severity, message string, data interface{}) {
	entry := logging.Entry{
		Severity: severity,
		Payload: map[string]interface{}{
			"message": message,
			"data":    data,
		},
	}
	cl.logger.Log(entry)
	fmt.Printf("[%s] %s\n", severity, message)
}

// Close cierra el logger
func (cl *CloudLogger) Close() {
	if cl.client != nil {
		cl.client.Close()
	}
}

// ListCloudRunServices lista todos los servicios de Cloud Run
func (rm *ResourceManager) ListCloudRunServices() ([]ServiceStatus, error) {
	rm.logger.Log(logging.Info, "Listando servicios de Cloud Run...", nil)

	runService, err := run.NewService(rm.ctx)
	if err != nil {
		return nil, fmt.Errorf("error creating Cloud Run client: %v", err)
	}

	parent := fmt.Sprintf("namespaces/%s", rm.projectID)
	resp, err := runService.Namespaces.Services.List(parent).Do()
	if err != nil {
		rm.logger.Log(logging.Error, "Error listando servicios", err.Error())
		return nil, err
	}

	var services []ServiceStatus
	for _, svc := range resp.Items {
		status := ServiceStatus{
			Name:   svc.Metadata.Name,
			URL:    svc.Status.Url,
			Status: svc.Status.Conditions[0].Status,
		}
		if len(svc.Status.Traffic) > 0 {
			status.Revision = svc.Status.Traffic[0].RevisionName
		}
		services = append(services, status)
	}

	rm.logger.Log(logging.Info, fmt.Sprintf("Encontrados %d servicios", len(services)), services)
	return services, nil
}

// GetServiceMetrics obtiene métricas de un servicio
func (rm *ResourceManager) GetServiceMetrics(serviceName string) ([]MetricData, error) {
	rm.logger.Log(logging.Info, fmt.Sprintf("Obteniendo métricas de %s...", serviceName), nil)

	client, err := monitoring.NewMetricClient(rm.ctx)
	if err != nil {
		return nil, fmt.Errorf("error creating monitoring client: %v", err)
	}
	defer client.Close()

	// Definir el intervalo de tiempo (última hora)
	endTime := time.Now()
	startTime := endTime.Add(-1 * time.Hour)

	req := &monitoringpb.ListTimeSeriesRequest{
		Name:   fmt.Sprintf("projects/%s", rm.projectID),
		Filter: fmt.Sprintf(`resource.type="cloud_run_revision" AND resource.labels.service_name="%s"`, serviceName),
		Interval: &monitoringpb.TimeInterval{
			StartTime: timestampProto(startTime),
			EndTime:   timestampProto(endTime),
		},
	}

	var metrics []MetricData
	it := client.ListTimeSeries(rm.ctx, req)
	for {
		ts, err := it.Next()
		if err != nil {
			break
		}

		metric := MetricData{
			Name:      ts.Metric.Type,
			Timestamp: time.Now(),
		}

		if len(ts.Points) > 0 {
			point := ts.Points[0]
			if point.Value.GetDoubleValue() != 0 {
				metric.Value = point.Value.GetDoubleValue()
			} else if point.Value.GetInt64Value() != 0 {
				metric.Value = float64(point.Value.GetInt64Value())
			}
		}

		metrics = append(metrics, metric)
	}

	rm.logger.Log(logging.Info, fmt.Sprintf("Obtenidas %d métricas", len(metrics)), nil)
	return metrics, nil
}

// CreateLogAlert crea una alerta basada en logs
func (rm *ResourceManager) CreateLogAlert(alertName, condition string) error {
	rm.logger.Log(logging.Info, fmt.Sprintf("Creando alerta: %s", alertName), nil)

	// En una implementación real, usaríamos el SDK de Alerting
	// Aquí mostramos la estructura
	alert := map[string]interface{}{
		"name":      alertName,
		"condition": condition,
		"project":   rm.projectID,
		"created":   time.Now(),
	}

	rm.logger.Log(logging.Info, "Alerta configurada", alert)
	return nil
}

// ExportResources exporta la configuración de recursos a JSON
func (rm *ResourceManager) ExportResources(outputFile string) error {
	rm.logger.Log(logging.Info, "Exportando configuración de recursos...", nil)

	services, err := rm.ListCloudRunServices()
	if err != nil {
		services = []ServiceStatus{}
	}

	export := map[string]interface{}{
		"project_id":  rm.projectID,
		"region":      rm.region,
		"services":    services,
		"exported_at": time.Now(),
	}

	data, err := json.MarshalIndent(export, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(outputFile, data, 0644); err != nil {
		return err
	}

	rm.logger.Log(logging.Info, fmt.Sprintf("Recursos exportados a %s", outputFile), nil)
	return nil
}

// Close limpia los recursos
func (rm *ResourceManager) Close() {
	if rm.logger != nil {
		rm.logger.Close()
	}
}

// timestampProto convierte time.Time a timestamp proto
func timestampProto(t time.Time) *monitoringpb.TimeInterval_EndTime {
	// Simplificación - en producción usar timestamppb
	return nil
}

func main() {
	fmt.Println("🔧 SerenVoice - Gestor de Recursos GCP")
	fmt.Println("======================================")

	projectID := os.Getenv("GCP_PROJECT_ID")
	if projectID == "" {
		projectID = "boreal-dock-481001-k0"
	}

	region := os.Getenv("GCP_REGION")
	if region == "" {
		region = "us-central1"
	}

	rm, err := NewResourceManager(projectID, region)
	if err != nil {
		log.Fatalf("Error inicializando ResourceManager: %v", err)
	}
	defer rm.Close()

	// Listar servicios
	fmt.Println("\n📋 Servicios Cloud Run:")
	services, err := rm.ListCloudRunServices()
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		for _, svc := range services {
			fmt.Printf("   - %s: %s (%s)\n", svc.Name, svc.URL, svc.Status)
		}
	}

	// Exportar recursos
	fmt.Println("\n📤 Exportando recursos...")
	if err := rm.ExportResources("resources_export.json"); err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Println("   ✅ Exportado a resources_export.json")
	}

	fmt.Println("\n======================================")
	fmt.Println("✅ Gestión de recursos completada")
}
