package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/server"
)

var srv *server.SovereignServer

func init() {
	var err error
	srv, err = server.NewSovereignServer(nil) // Context will be passed per request
	if err != nil {
		log.Printf("❌ [Bridge] Failed to init Sovereign Server: %v", err)
	}
}

// Handler is the entry point for Vercel Go Serverless Functions.
func Handler(w http.ResponseWriter, r *http.Request) {
	// 🛡️ [Steel Gate] Application-layer security
	token := r.Header.Get("X-Sovereign-Token")
	expectedToken := os.Getenv("SOVEREIGN_AUTH_TOKEN")
	if expectedToken == "" {
		isDevMode := strings.EqualFold(os.Getenv("APP_ENV"), "development") || strings.EqualFold(os.Getenv("VERCEL_ENV"), "development")
		if isDevMode {
			expectedToken = "SOVEREIGN_DEV_TOKEN"
			log.Printf("⚠️ [Bridge] SOVEREIGN_AUTH_TOKEN is not set; using development fallback token")
		}
	}

	if token == "" || expectedToken == "" || token != expectedToken {
		log.Printf(
			"🚫 [Bridge] Unauthorized request denied method=%s path=%s remote=%s token_present=%t auth_configured=%t",
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			token != "",
			expectedToken != "",
		)
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	path := r.URL.Path
	log.Printf("📡 [Bridge] Received %s request to %s", r.Method, path)

	switch {
	case strings.HasSuffix(path, "/execute"):
		handleExecute(w, r)
	case strings.HasSuffix(path, "/simulate"):
		handleSimulate(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "Endpoint not found")
	}
}

func handleExecute(w http.ResponseWriter, r *http.Request) {
	var req pb.PluginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := srv.ExecutePlugin(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleSimulate(w http.ResponseWriter, r *http.Request) {
	var req pb.SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := srv.RequestSimulation(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
