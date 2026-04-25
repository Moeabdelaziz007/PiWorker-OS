package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"

	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/server"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

const devSovereignTokenFallback = "SOVEREIGN_DEV_TOKEN"

var sovereignAuthToken string

func resolveContractPath() (string, error) {
	candidates := []string{
		"sidecar/sovereign-engine/proto/sovereign.proto",
		"proto/sovereign.proto",
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			abs, absErr := filepath.Abs(candidate)
			if absErr != nil {
				return candidate, nil
			}
			return abs, nil
		}
	}

	return "", errors.New("gRPC contract file sovereign.proto not found")
}

func startHttpServer(srv *server.SovereignServer, grpcAddr string, contractPath string) {
	mux := http.NewServeMux()

	// 🏥 Health Endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		report := map[string]any{
			"status":    "UP",
			"service":   "sovereign-engine",
			"timestamp": time.Now().UTC().Format(time.RFC3339Nano),
			"grpc": map[string]string{
				"address": grpcAddr,
				"status":  "READY",
			},
			"contracts": map[string]string{
				"grpc": "AVAILABLE",
				"path": contractPath,
			},
		}
		_ = json.NewEncoder(w).Encode(report)
	})

	// 📡 SSE Real-Time Telemetry Endpoint
	mux.HandleFunc("/events", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		telemetryChan := make(chan string, 10)
		srv.Mu.Lock()
		srv.TelemetryListeners = append(srv.TelemetryListeners, telemetryChan)
		srv.Mu.Unlock()

		defer func() {
			srv.Mu.Lock()
			for i, ch := range srv.TelemetryListeners {
				if ch == telemetryChan {
					srv.TelemetryListeners = append(srv.TelemetryListeners[:i], srv.TelemetryListeners[i+1:]...)
					break
				}
			}
			srv.Mu.Unlock()
			close(telemetryChan)
		}()

		ctx := r.Context()
		for {
			select {
			case <-ctx.Done():
				return
			case msg := <-telemetryChan:
				fmt.Fprintf(w, "data: %s\n\n", msg)
				flusher.Flush()
			case <-time.After(15 * time.Second):
				// Keep-alive heartbeat
				fmt.Fprintf(w, ": keep-alive\n\n")
				flusher.Flush()
			}
		}
	})

	// 🔗 [Connect-Lite] High-Compatibility JSON Bridge
	mux.Handle("/sovereign.SovereignService/", srv.ConnectLiteHandler())

	go func() {
		log.Printf("🌐 Sovereign HTTP API listening at http://127.0.0.1:8080")
		if err := http.ListenAndServe(":8080", mux); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("failed to start http server: %v", err)
		}
	}()
}

func isDevEnvironment() bool {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	if env == "" {
		env = strings.ToLower(strings.TrimSpace(os.Getenv("GO_ENV")))
	}
	if env == "" {
		env = strings.ToLower(strings.TrimSpace(os.Getenv("NODE_ENV")))
	}

	switch env {
	case "", "dev", "development", "local", "test":
		return true
	default:
		return false
	}
}

func resolveSovereignAuthToken() (string, error) {
	if token := strings.TrimSpace(os.Getenv("SOVEREIGN_AUTH_TOKEN")); token != "" {
		return token, nil
	}
	if isDevEnvironment() {
		log.Printf("⚠️ [SEC_WARN] SOVEREIGN_AUTH_TOKEN is unset; using dev fallback token")
		return devSovereignTokenFallback, nil
	}
	return "", errors.New("SOVEREIGN_AUTH_TOKEN is required outside development")
}

func authUnaryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	if strings.TrimSpace(sovereignAuthToken) == "" {
		return nil, status.Errorf(codes.Internal, "[SEC_ERROR] Server auth token is not configured")
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "Unauthenticated")
	}

	tokens := md["x-sovereign-token"]
	token := ""
	if len(tokens) > 0 {
		token = strings.TrimSpace(tokens[0])
	}
	if token == "" || token != sovereignAuthToken {
		log.Printf("⚠️ [SEC_ALERT] Unauthorized access attempt to %s", info.FullMethod)
		return nil, status.Errorf(codes.Unauthenticated, "Unauthenticated")
	}

	return handler(ctx, req)
}

func main() {
	ctx := context.Background()
	log.Println("🦾 Sovereign Engine Muscle starting...")

	token, err := resolveSovereignAuthToken()
	if err != nil {
		log.Fatalf("❌ [SEC_ERROR] %v", err)
	}
	sovereignAuthToken = token

	contractPath, err := resolveContractPath()
	if err != nil {
		log.Fatalf("❌ [CONTRACT_UNAVAILABLE] %v", err)
	}

	srv, err := server.NewSovereignServer(ctx)
	if err != nil {
		log.Fatalf("failed to init server: %v", err)
	}

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer(
		grpc.UnaryInterceptor(authUnaryInterceptor),
	)
	pb.RegisterSovereignServiceServer(s, srv)
	reflection.Register(s)

	log.Printf("📡 gRPC Server listening at %v", lis.Addr())
	startHttpServer(srv, lis.Addr().String(), contractPath)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
