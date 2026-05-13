package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	bridgelog "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/log"
	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/server"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/finance"
	"google.golang.org/grpc/metadata"
)

const devAuthTokenFallback = "SOVEREIGN_DEV_TOKEN"

var (
	srv               *server.SovereignServer
	expectedAuthToken string
	logger            *slog.Logger
)

func init() {
	logger = bridgelog.New(bridgelog.ComponentAPIBridge, nil)

	var err error
	srv, err = server.NewSovereignServer(nil)
	if err != nil {
		// Fail fast: a nil srv would surface later as a NPE on the
		// first request, which is far harder to debug than a clean
		// startup error. Emit the structured record before os.Exit
		// so log routers see it.
		logger.Error("failed to init Sovereign Server", slog.String("error", err.Error()))
		os.Exit(1)
	}

	expectedAuthToken, err = resolveAuthToken()
	if err != nil {
		// init() must abort on misconfigured auth in production. Emit
		// the structured record before os.Exit so log routers see it.
		logger.Error("auth configuration error", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

func isDevEnvironment() bool {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
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

func resolveAuthToken() (string, error) {
	if token := strings.TrimSpace(os.Getenv("SOVEREIGN_AUTH_TOKEN")); token != "" {
		return token, nil
	}

	if isDevEnvironment() {
		logger.Warn("SOVEREIGN_AUTH_TOKEN not set; using development fallback token")
		return devAuthTokenFallback, nil
	}

	return "", errors.New("SOVEREIGN_AUTH_TOKEN is required outside development")
}

// emitBridgeLog preserves the legacy signature so the existing call
// sites in the HTTP handlers below do not need to change shape. It
// builds a context from the (reqID, corrID, auth) triple and delegates
// to the shared structured logger. The JSON shape on the wire stays
// identical to the old bridgeLog struct so downstream parsers keep
// working unchanged.
func emitBridgeLog(op, auth, reqID, corrID, message, errorCode string) {
	ctx := bridgelog.WithRequest(context.Background(), reqID, corrID, auth)
	bridgelog.Op(ctx, logger, op, errorCode, message)
}

func requestContext(r *http.Request) (context.Context, string, string, string) {
	requestID := r.Header.Get("X-Request-Id")
	if requestID == "" {
		requestID = fmt.Sprintf("http-%d", time.Now().UnixNano())
	}
	correlationID := r.Header.Get("X-Correlation-Id")
	if correlationID == "" {
		correlationID = requestID
	}
	auth := "ANONYMOUS"
	if r.Header.Get("X-Sovereign-Token") != "" {
		auth = "SOVEREIGN_TOKEN"
	}

	md := metadata.Pairs(
		"x-request-id", requestID,
		"x-correlation-id", correlationID,
		"x-sovereign-token", r.Header.Get("X-Sovereign-Token"),
	)

	ctx := metadata.NewIncomingContext(r.Context(), md)
	return ctx, requestID, correlationID, auth
}

func Handler(w http.ResponseWriter, r *http.Request) {
	ctx, requestID, correlationID, authContext := requestContext(r)
	w.Header().Set("X-Request-Id", requestID)
	w.Header().Set("X-Correlation-Id", correlationID)

	// 🛡️ [Steel Gate] Auth check
	token := strings.TrimSpace(r.Header.Get("X-Sovereign-Token"))
	if token == "" || token != expectedAuthToken {
		emitBridgeLog("router", authContext, requestID, correlationID, "unauthorized", "AUTH")
		http.Error(w, http.StatusText(http.StatusUnauthorized), http.StatusUnauthorized)
		return
	}

	emitBridgeLog("router", authContext, requestID, correlationID, fmt.Sprintf("received %s %s", r.Method, r.URL.Path), "")

	path := r.URL.Path

	// 🌐 [Connect-Lite Bridge] Handle gRPC-web/Connect-RPC requests from the Brain
	if strings.HasPrefix(path, "/sovereign.SovereignService/") {
		srv.ConnectLiteHandler().ServeHTTP(w, r)
		return
	}

	switch {
	case strings.HasSuffix(path, "/execute"):
		handleExecute(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/simulate"):
		handleSimulate(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/payment/approve"):
		handlePaymentApprove(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/payment/complete"):
		handlePaymentComplete(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/payment"):
		handlePayment(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/verify-tx"):
		handleVerifyTx(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/lock-escrow"):
		handleLockEscrow(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/intent"):
		handleIntent(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/status") || strings.HasSuffix(path, "/state"):
		handleStatus(w, r.WithContext(ctx), requestID, correlationID, authContext)
	case strings.HasSuffix(path, "/events"):
		handleEvents(w, r.WithContext(ctx), requestID, correlationID, authContext)
	default:
		emitBridgeLog("router", authContext, requestID, correlationID, "endpoint not found", "VALIDATION")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "Endpoint not found: %s", path)
	}
}

func handleEvents(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

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
			// Heartbeat for serverless keep-alive
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		}
	}
}

func handleStatus(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	emitBridgeLog("status", auth, reqID, corrID, "fetching system status", "")

	balance := 175.4291
	activeIntents := 0

	if srv != nil {
		// Try to get real balance
		nodeURL := os.Getenv("PI_NODE_URL")
		if nodeURL == "" {
			nodeURL = "https://api.testnet.minepi.com"
		}
		sourceWallet := os.Getenv("SOVEREIGN_WALLET_ADDRESS")
		if sourceWallet != "" {
			connector := finance.NewLedgerConnector(nodeURL)
			if b, err := connector.GetBalance(sourceWallet); err == nil {
				balance = b
			}
		}

		// Get real active intents from Journal
		if srv.Journal != nil {
			activeIntents = srv.Journal.GetActiveCount()
		}
	}

	res := map[string]interface{}{
		"status":         "ONLINE",
		"pi_balance":     balance,
		"active_intents": activeIntents,
		"mode":           "SOVEREIGN",
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func handlePayment(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req pb.PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		emitBridgeLog("payment", auth, reqID, corrID, err.Error(), "VALIDATION")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.CommitPayment(r.Context(), &req)
	if err != nil {
		emitBridgeLog("payment", auth, reqID, corrID, err.Error(), "DEPENDENCY")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func handlePaymentApprove(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req struct {
		PaymentID string `json:"paymentId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := srv.ApprovePiPayment(r.Context(), req.PaymentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"approved"}`)
}

func handlePaymentComplete(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req struct {
		PaymentID string `json:"paymentId"`
		TxID      string `json:"txid"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := srv.CompletePiPayment(r.Context(), req.PaymentID, req.TxID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"completed"}`)
}

func handleVerifyTx(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req pb.VerifyTxRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		emitBridgeLog("verify-tx", auth, reqID, corrID, err.Error(), "VALIDATION")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.VerifyTransaction(r.Context(), &req)
	if err != nil {
		emitBridgeLog("verify-tx", auth, reqID, corrID, err.Error(), "DEPENDENCY")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func handleLockEscrow(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req pb.EscrowRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		emitBridgeLog("lock-escrow", auth, reqID, corrID, err.Error(), "VALIDATION")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.LockEscrow(r.Context(), &req)
	if err != nil {
		emitBridgeLog("lock-escrow", auth, reqID, corrID, err.Error(), "DEPENDENCY")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func handleIntent(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req pb.EmbodiedIntent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		emitBridgeLog("intent", auth, reqID, corrID, err.Error(), "VALIDATION")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.SendEmbodiedIntent(r.Context(), &req)
	if err != nil {
		emitBridgeLog("intent", auth, reqID, corrID, err.Error(), "DEPENDENCY")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func handleExecute(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req pb.PluginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		emitBridgeLog("execute", auth, reqID, corrID, err.Error(), "VALIDATION")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.ExecutePlugin(r.Context(), &req)
	if err != nil {
		emitBridgeLog("execute", auth, reqID, corrID, err.Error(), "BUILD")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func handleSimulate(w http.ResponseWriter, r *http.Request, reqID, corrID, auth string) {
	var req pb.SimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		emitBridgeLog("simulate", auth, reqID, corrID, err.Error(), "VALIDATION")
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := srv.RequestSimulation(r.Context(), &req)
	if err != nil {
		emitBridgeLog("simulate", auth, reqID, corrID, err.Error(), "DEPENDENCY")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}
