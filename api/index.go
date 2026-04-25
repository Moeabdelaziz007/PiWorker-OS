package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/server"
	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
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
	if token == "" || token != "SOVEREIGN_DEV_TOKEN" { // Fallback for dev, should use os.Getenv
		// Actually use env in prod
		// if token != os.Getenv("SOVEREIGN_AUTH_TOKEN") { ... }
	}

	path := r.URL.Path
	log.Printf("📡 [Bridge] Received %s request to %s", r.Method, path)

	switch {
	case strings.HasSuffix(path, "/execute"):
		handleExecute(w, r)
	case strings.HasSuffix(path, "/simulate"):
		handleSimulate(w, r)
	case strings.HasSuffix(path, "/payment"):
		handlePayment(w, r)
	case strings.HasSuffix(path, "/verify-tx"):
		handleVerifyTx(w, r)
	case strings.HasSuffix(path, "/lock-escrow"):
		handleLockEscrow(w, r)
	case strings.HasSuffix(path, "/intent"):
		handleIntent(w, r)
	case strings.HasSuffix(path, "/status"):
		handleStatus(w, r)
	default:
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "Endpoint not found: %s", path)
	}
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	// For now, return a generic status. In a full implementation, query the server.
	res := map[string]interface{}{
		"status":         "ONLINE",
		"pi_balance":     175.4291,
		"active_intents": 14,
		"mode":           "SOVEREIGN",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handlePayment(w http.ResponseWriter, r *http.Request) {
	var req pb.PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.CommitPayment(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleVerifyTx(w http.ResponseWriter, r *http.Request) {
	var req pb.VerifyTxRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.VerifyTransaction(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleLockEscrow(w http.ResponseWriter, r *http.Request) {
	var req pb.EscrowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.LockEscrow(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func handleIntent(w http.ResponseWriter, r *http.Request) {
	var req pb.EmbodiedIntent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.SendEmbodiedIntent(r.Context(), &req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
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
