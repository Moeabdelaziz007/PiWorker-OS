package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
)

// ConnectLiteHandler provides a Connect-RPC compatible JSON bridge for the SovereignService.
// This allows the Brain (Node.js/Next.js) to communicate with the Muscle (Go) using standard fetch
// and JSON, avoiding the complexities of the brittle @grpc/grpc-js library in serverless environments.
func (s *SovereignServer) ConnectLiteHandler() http.Handler {
	mux := http.NewServeMux()

	// Pattern: POST /sovereign.SovereignService/{Method}
	prefix := "/sovereign.SovereignService/"

	mux.HandleFunc(prefix+"RequestSimulation", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req pb.SimulationRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.RequestSimulation(ctx, &req)
	}))

	mux.HandleFunc(prefix+"LockEscrow", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req pb.EscrowRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.LockEscrow(ctx, &req)
	}))

	mux.HandleFunc(prefix+"VerifyTransaction", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req pb.VerifyTxRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.VerifyTransaction(ctx, &req)
	}))

	mux.HandleFunc(prefix+"CommitPayment", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req pb.PaymentRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.CommitPayment(ctx, &req)
	}))

	mux.HandleFunc(prefix+"SendEmbodiedIntent", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req pb.EmbodiedIntent
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.SendEmbodiedIntent(ctx, &req)
	}))

	mux.HandleFunc(prefix+"ExecutePlugin", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req pb.PluginRequest
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.ExecutePlugin(ctx, &req)
	}))

	mux.HandleFunc(prefix+"StoreMemory", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req map[string]interface{}
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.StoreMemory(ctx, req)
	}))

	mux.HandleFunc(prefix+"QueryMemory", s.wrapHandler(func(ctx context.Context, body []byte) (any, error) {
		var req map[string]interface{}
		if err := json.Unmarshal(body, &req); err != nil {
			return nil, err
		}
		return s.QueryMemory(ctx, req)
	}))

	return mux
}

type handlerFunc func(ctx context.Context, body []byte) (any, error)

func (s *SovereignServer) wrapHandler(f handlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Verify Sovereign Token (Mandatory Security)
		token := r.Header.Get("x-sovereign-token")
		expectedToken := os.Getenv("SOVEREIGN_AUTH_TOKEN")
		if expectedToken == "" {
			expectedToken = "SOVEREIGN_DEV_TOKEN"
		}
		if token == "" || token != expectedToken {
			http.Error(w, "Unauthenticated", http.StatusUnauthenticated)
			return
		}

		// Standard Connect-RPC Headers
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, x-sovereign-token")

		// Read and verify body
		var rawBody []byte
		if r.Body != nil {
			var err error
			rawBody, err = io.ReadAll(r.Body)
			r.Body.Close()
			if err != nil {
				http.Error(w, "Failed to read request body", http.StatusBadRequest)
				return
			}
		}

		res, err := f(r.Context(), rawBody)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(res)
	}
}
