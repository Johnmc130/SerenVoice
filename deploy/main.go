// deploy/main.go - Script de despliegue en GCP Compute Engine
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	compute "cloud.google.com/go/compute/apiv1"
	"cloud.google.com/go/compute/apiv1/computepb"
	"google.golang.org/protobuf/proto"
)

// Configuración del proyecto
type Config struct {
	ProjectID    string
	Zone         string
	Region       string
	VMName       string
	MachineType  string
	DiskSizeGB   int64
	ImageFamily  string
	ImageProject string
	NetworkTags  []string
}

func getConfig() Config {
	projectID := os.Getenv("GCP_PROJECT_ID")
	if projectID == "" {
		projectID = "boreal-dock-481001-k0" // SerenVoice project
	}

	return Config{
		ProjectID:    projectID,
		Zone:         "us-central1-a",
		Region:       "us-central1",
		VMName:       "serenvoice-server",
		MachineType:  "e2-medium", // 2 vCPU, 4GB RAM
		DiskSizeGB:   30,
		ImageFamily:  "ubuntu-2204-lts",
		ImageProject: "ubuntu-os-cloud",
		NetworkTags:  []string{"http-server", "https-server", "serenvoice"},
	}
}

// Script de inicio que se ejecuta al crear la VM
func getStartupScript() string {
	return `#!/bin/bash
set -e

# Logging
exec > >(tee /var/log/startup-script.log) 2>&1
echo "=== Inicio de configuración: $(date) ==="

# Actualizar sistema
apt-get update && apt-get upgrade -y

# Instalar dependencias
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    nano

# Instalar Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Habilitar Docker
systemctl enable docker
systemctl start docker

# Instalar Google Cloud Logging agent
curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh
bash add-logging-agent-repo.sh --also-install

# Instalar Google Cloud Monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-monitoring-agent-repo.sh
bash add-monitoring-agent-repo.sh --also-install

# Crear directorio para la aplicación
mkdir -p /opt/serenvoice
cd /opt/serenvoice

# Clonar repositorio (se actualizará via CI/CD)
if [ ! -d ".git" ]; then
    git clone https://github.com/JohnMejiaDuran/SerenVoice-Analisi-de-Voz.git .
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || echo "# Environment variables" > .env
fi

# Levantar servicios con Docker Compose
docker compose up -d --build

echo "=== Configuración completada: $(date) ==="
`
}

func main() {
	ctx := context.Background()
	config := getConfig()

	fmt.Println("🚀 Desplegando SerenVoice en GCP Compute Engine")
	fmt.Printf("   Proyecto: %s\n", config.ProjectID)
	fmt.Printf("   Zona: %s\n", config.Zone)
	fmt.Printf("   VM: %s\n", config.VMName)

	// Crear reglas de firewall
	if err := createFirewallRules(ctx, config); err != nil {
		log.Printf("⚠️  Firewall (puede ya existir): %v\n", err)
	}

	// Crear la VM
	if err := createVM(ctx, config); err != nil {
		log.Fatalf("❌ Error creando VM: %v\n", err)
	}

	// Obtener IP externa
	ip, err := getExternalIP(ctx, config)
	if err != nil {
		log.Printf("⚠️  No se pudo obtener IP: %v\n", err)
	}

	fmt.Println("\n✅ Despliegue completado!")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	if ip != "" {
		fmt.Printf("🌐 Frontend: http://%s:5173\n", ip)
		fmt.Printf("🔧 Backend:  http://%s:5000\n", ip)
		fmt.Printf("📊 phpMyAdmin: http://%s:8080\n", ip)
	}
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("\n📝 Para conectarte por SSH:")
	fmt.Printf("   gcloud compute ssh %s --zone %s\n", config.VMName, config.Zone)
}

func createFirewallRules(ctx context.Context, config Config) error {
	client, err := compute.NewFirewallsRESTClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	firewallRule := &computepb.Firewall{
		Name:        proto.String("serenvoice-allow-web"),
		Description: proto.String("Allow HTTP/HTTPS and app ports for SerenVoice"),
		Network:     proto.String(fmt.Sprintf("projects/%s/global/networks/default", config.ProjectID)),
		Allowed: []*computepb.Allowed{
			{
				IPProtocol: proto.String("tcp"),
				Ports:      []string{"80", "443", "5000", "5173", "8080", "3306"},
			},
		},
		SourceRanges: []string{"0.0.0.0/0"},
		TargetTags:   []string{"serenvoice"},
	}

	req := &computepb.InsertFirewallRequest{
		Project:          config.ProjectID,
		FirewallResource: firewallRule,
	}

	op, err := client.Insert(ctx, req)
	if err != nil {
		return err
	}

	// Esperar a que se complete
	for {
		if op.Done() {
			break
		}
		time.Sleep(2 * time.Second)
	}

	fmt.Println("✅ Reglas de firewall creadas")
	return nil
}

func createVM(ctx context.Context, config Config) error {
	client, err := compute.NewInstancesRESTClient(ctx)
	if err != nil {
		return err
	}
	defer client.Close()

	// Verificar si la VM ya existe
	getReq := &computepb.GetInstanceRequest{
		Project:  config.ProjectID,
		Zone:     config.Zone,
		Instance: config.VMName,
	}

	_, err = client.Get(ctx, getReq)
	if err == nil {
		fmt.Println("⚠️  La VM ya existe, omitiendo creación")
		return nil
	}

	machineType := fmt.Sprintf("zones/%s/machineTypes/%s", config.Zone, config.MachineType)
	sourceImage := fmt.Sprintf("projects/%s/global/images/family/%s", config.ImageProject, config.ImageFamily)

	instance := &computepb.Instance{
		Name:        proto.String(config.VMName),
		MachineType: proto.String(machineType),
		Disks: []*computepb.AttachedDisk{
			{
				Boot:       proto.Bool(true),
				AutoDelete: proto.Bool(true),
				InitializeParams: &computepb.AttachedDiskInitializeParams{
					DiskSizeGb:  proto.Int64(config.DiskSizeGB),
					SourceImage: proto.String(sourceImage),
				},
			},
		},
		NetworkInterfaces: []*computepb.NetworkInterface{
			{
				Name: proto.String("global/networks/default"),
				AccessConfigs: []*computepb.AccessConfig{
					{
						Name:        proto.String("External NAT"),
						NetworkTier: proto.String("STANDARD"),
					},
				},
			},
		},
		Tags: &computepb.Tags{
			Items: config.NetworkTags,
		},
		Metadata: &computepb.Metadata{
			Items: []*computepb.Items{
				{
					Key:   proto.String("startup-script"),
					Value: proto.String(getStartupScript()),
				},
			},
		},
		ServiceAccounts: []*computepb.ServiceAccount{
			{
				Email: proto.String("default"),
				Scopes: []string{
					"https://www.googleapis.com/auth/cloud-platform",
					"https://www.googleapis.com/auth/logging.write",
					"https://www.googleapis.com/auth/monitoring.write",
				},
			},
		},
		Labels: map[string]string{
			"app":         "serenvoice",
			"environment": "production",
		},
	}

	req := &computepb.InsertInstanceRequest{
		Project:          config.ProjectID,
		Zone:             config.Zone,
		InstanceResource: instance,
	}

	fmt.Println("⏳ Creando VM...")
	op, err := client.Insert(ctx, req)
	if err != nil {
		return err
	}

	// Esperar a que se complete
	for {
		if op.Done() {
			break
		}
		fmt.Print(".")
		time.Sleep(3 * time.Second)
	}
	fmt.Println()

	fmt.Println("✅ VM creada exitosamente")
	return nil
}

func getExternalIP(ctx context.Context, config Config) (string, error) {
	client, err := compute.NewInstancesRESTClient(ctx)
	if err != nil {
		return "", err
	}
	defer client.Close()

	// Esperar a que la VM esté lista
	time.Sleep(10 * time.Second)

	req := &computepb.GetInstanceRequest{
		Project:  config.ProjectID,
		Zone:     config.Zone,
		Instance: config.VMName,
	}

	instance, err := client.Get(ctx, req)
	if err != nil {
		return "", err
	}

	for _, ni := range instance.NetworkInterfaces {
		for _, ac := range ni.AccessConfigs {
			if ac.NatIP != nil {
				return *ac.NatIP, nil
			}
		}
	}

	return "", fmt.Errorf("no se encontró IP externa")
}
