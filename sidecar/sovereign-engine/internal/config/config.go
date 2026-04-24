package config

import (
	"os"
	"github.com/joho/godotenv"
)

/**
 * AMRIKYY LAB :: SOVEREIGN CONFIG LOADER
 * PURPOSE: Centralized configuration for the PiWorker-OS ecosystem.
 */

type Config struct {
	AuthToken      string
	SovereignPort  string
	GatewayPort    string
	MockHorizonPort string
	PiNodeURL      string
}

func Load() *Config {
	_ = godotenv.Load() // Ignore error if .env doesn't exist

	return &Config{
		AuthToken:      getEnv("SOVEREIGN_AUTH_TOKEN", "SOVEREIGN_DEV_TOKEN"),
		SovereignPort:  getEnv("PORT", "50051"),
		GatewayPort:    getEnv("SOVEREIGN_HTTP_PORT", "50052"),
		MockHorizonPort: getEnv("MOCK_HORIZON_PORT", "8000"),
		PiNodeURL:      getEnv("PI_NODE_URL", "http://localhost:8000"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
