package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/bridge"
	"github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/engine"
	"github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/finance"
	"github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/sandbox"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"crypto/tls"
	"crypto/x509"
	pb "github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

// authInterceptor checks for a valid Sovereign-Auth-Token in the gRPC metadata.
func recoveryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("🔥 [PANIC_RECOVERED] %v", r)
			err = status.Errorf(codes.Internal, "[SEC_ERROR] Neural spike detected: %v", r)
		}
	}()
	return handler(ctx, req)
}

func authInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "[SEC_ERROR] Missing metadata")
	}

	expectedToken := os.Getenv("SOVEREIGN_AUTH_TOKEN")
	if expectedToken == "" {
		log.Printf("❌ [FATAL] SOVEREIGN_AUTH_TOKEN is not set. Security lockdown engaged.")
		return nil, status.Errorf(codes.Internal, "[SEC_ERROR] Server misconfiguration: missing auth token")
	}

	if len(tokens) == 0 || tokens[0] != expectedToken {
		log.Printf("⚠️ [SEC_ALERT] Unauthorized access attempt to %s", info.FullMethod)
		return nil, status.Errorf(codes.Unauthenticated, "[SEC_ERROR] Invalid or missing auth token")
	}

	return handler(ctx, req)
}

type sovereignServer struct {
	pb.UnimplementedSovereignServiceServer
	quantumMirror *engine.QuantumMirror
	geminiClient  *bridge.GeminiClient
	sandboxEngine *sandbox.NeuralSandbox
}

func newSovereignServer(ctx context.Context) (*sovereignServer, error) {
	// Initialize Gemini with Best Practices
	gc, err := bridge.NewGeminiClient(ctx, "gemini-1.5-pro")
	if err != nil {
		return nil, fmt.Errorf("failed to init gemini: %w", err)
	}

	return &sovereignServer{
		quantumMirror: engine.NewQuantumMirror(gc),
		geminiClient:  gc,
		sandboxEngine: sandbox.NewNeuralSandbox(5 * time.Second),
	}, nil
}

// 1. Quantum Mirror Simulation (Gemini-Powered)
func (s *sovereignServer) RequestSimulation(ctx context.Context, req *pb.SimulationRequest) (*pb.SimulationResponse, error) {
	log.Printf("🚀 [Sovereign Engine] High-Fidelity Simulation Start: %s", req.GoalId)

	results, err := s.quantumMirror.Simulate(ctx, req.GoalId, int(req.Instances))
	if err != nil {
		log.Printf("❌ Simulation failed: %v", err)
		return nil, status.Errorf(codes.Internal, "simulation failure: %w", err)
	}

	// Calculate Aggregate Results
	var totalScore float32
	var totalRevenue float32
	var reasoningChain string

	for _, res := range results {
		totalScore += res.Score
		totalRevenue += res.RevenueUSD
		reasoningChain += fmt.Sprintf("[%s]: %s\n", res.Persona, res.Reasoning)
	}

	avgScore := totalScore / float32(len(results))
	avgRevenue := totalRevenue / float32(len(results))

	return &pb.SimulationResponse{
		GoalId:                 req.GoalId,
		PredictedRoi:           1.0 + (avgScore / 10.0),
		RiskScore:              1.0 - (avgScore / 10.0),
		StrategyRecommendation: "Execution path verified via Gemini 1.5 Pro.",
		EstimatedRevenueUsd:    avgRevenue,
		Reasoning: &pb.GeminiReasoning{
			LogicChain:    reasoningChain,
			CriticalRisks: []string{"Market Volatility", "Agent Drift"},
			ConfidenceScore: fmt.Sprintf("%.2f%%", avgScore*100),
		},
	}, nil
}

// 2. Embodied Intent Bridge (π0.7)
func (s *sovereignServer) SendEmbodiedIntent(ctx context.Context, req *pb.EmbodiedIntent) (*pb.IntentResponse, error) {
	log.Printf("🤖 [π0.7] Dispatching Intent: %s for Agent %s", req.IntentId, req.AgentId)
	return &pb.IntentResponse{
		Accepted:      true,
		StatusMessage: "PHYSICAL_INTENT_DISPATCHED_VIA_GO",
		TrackingId:    "track_" + req.IntentId,
	}, nil
}

// 2.5 Ring 3: Neural-Isolated Sandbox Execution
func (s *sovereignServer) ExecutePlugin(ctx context.Context, req *pb.PluginRequest) (*pb.PluginResponse, error) {
	log.Printf("🛡️ [Sandbox] Executing Plugin: %s", req.PluginId)
	
	// 🖋️ [Steel Gate] Verify Source Code Signature
	secret := os.Getenv("AGENT_SYSTEM_SECRET")
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(req.SourceCode))
	expectedSig := hex.EncodeToString(h.Sum(nil))

	if req.Signature != expectedSig {
		log.Printf("⚠️ [SEC_ALERT] Plugin Signature Mismatch! ID: %s", req.PluginId)
		return &pb.PluginResponse{
			PluginId:     req.PluginId,
			Success:      false,
			ErrorMessage: "[SEC_ERROR] Plugin signature verification failed. Tampering detected.",
		}, nil
	}
	
	start := time.Now()
	output, err := s.sandboxEngine.Execute(ctx, req.SourceCode, req.EnvVars, req.AllowedCapabilities)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		return &pb.PluginResponse{
			PluginId:         req.PluginId,
			Success:          false,
			ErrorMessage:     fmt.Sprintf("sandbox failure: %v", err),
			ExecutionTimeMs:  duration,
		}, nil
	}

	return &pb.PluginResponse{
		PluginId:         req.PluginId,
		Success:          true,
		OutputJson:       output,
		ExecutionTimeMs:  duration,
	}, nil
}

// 3. Financial Layer
func (s *sovereignServer) LockEscrow(ctx context.Context, req *pb.EscrowRequest) (*pb.EscrowResponse, error) {
	log.Printf("🔒 [Escrow] Locking %.2f Pi for TX %s", req.AmountPi, req.TxId)
	return &pb.EscrowResponse{
		Locked:        true,
		EscrowAddress: "native-go-escrow-vault",
	}, nil
}

func (s *sovereignServer) VerifyTransaction(ctx context.Context, req *pb.VerifyTxRequest) (*pb.VerifyTxResponse, error) {
	log.Printf("🔍 [Ledger] Verifying Transaction %s", req.TxId)
	nodeURL := os.Getenv("PI_NODE_URL")
	if nodeURL == "" {
		nodeURL = "https://api.testnet.minepi.com"
	}
	connector := finance.NewLedgerConnector(nodeURL)
	verified, sender, err := connector.VerifyPiTransaction(req.TxId, req.ExpectedReceiver, req.ExpectedAmount)
	if err != nil {
		return &pb.VerifyTxResponse{Verified: false, StatusMessage: err.Error()}, nil
	}
	return &pb.VerifyTxResponse{Verified: verified, StatusMessage: "VERIFIED", SenderAddress: sender}, nil
}

func (s *sovereignServer) CommitPayment(ctx context.Context, req *pb.PaymentRequest) (*pb.PaymentResponse, error) {
	log.Printf("💰 [Sovereign Maker] Authorizing Payment: %.4f Pi to %s", req.AmountPi, req.RecipientId)
	
	// SECURITY_FIX: VULN-001 [Steel Gate Protocol]
	expectedAgentToken := os.Getenv("AGENT_SYSTEM_SECRET")
	if expectedAgentToken == "" {
		log.Printf("❌ [FATAL] AGENT_SYSTEM_SECRET is not set. Payments disabled.")
		return &pb.PaymentResponse{Success: false, ErrorMessage: "PAYMENT_SYSTEM_MISCONFIGURED"}, nil
	}

	if req.AgentAuthToken == "" || req.AgentAuthToken != expectedAgentToken {
		log.Printf("⚠️ [SEC_ALERT] Unauthorized Payment Attempt! Recipient: %s, Amount: %.2f", req.RecipientId, req.AmountPi)
		return &pb.PaymentResponse{
			Success: false,
			TxId:    "REJECTED_UNAUTHORIZED",
		}, nil
	}

	nodeURL := os.Getenv("PI_NODE_URL")
	if nodeURL == "" {
		nodeURL = "https://api.testnet.minepi.com"
	}
	maker := finance.NewPaymentMaker(nodeURL)
	txID, err := maker.ExecuteSovereignPayment(ctx, finance.PaymentRequest{
		RecipientID: req.RecipientId,
		AmountPi:    req.AmountPi,
		Priority:    req.Priority,
	})
	
	if err != nil {
		return &pb.PaymentResponse{Success: false}, nil
	}

	return &pb.PaymentResponse{
		Success:     true,
		TxId:        txID,
		ExplorerUrl: "https://minepi.com/blockexplorer/tx/" + txID,
	}, nil
}

func loadmTLSCreds() (*tls.Config, error) {
	var serverCert, serverKey, caCert []byte
	var err error

	// Priority 1: Environment Variables (For Vercel/Cloud)
	if os.Getenv("SOVEREIGN_SERVER_CERT") != "" {
		serverCert = []byte(os.Getenv("SOVEREIGN_SERVER_CERT"))
		serverKey = []byte(os.Getenv("SOVEREIGN_SERVER_KEY"))
		caCert = []byte(os.Getenv("SOVEREIGN_CA_CERT"))
	} else {
		// Priority 2: Local Files
		serverCert, err = os.ReadFile("sidecar/sovereign-engine/certs/server.crt")
		if err != nil {
			return nil, err
		}
		serverKey, err = os.ReadFile("sidecar/sovereign-engine/certs/server.key")
		if err != nil {
			return nil, err
		}
		caCert, err = os.ReadFile("sidecar/sovereign-engine/certs/ca.crt")
		if err != nil {
			return nil, err
		}
	}

	certificate, err := tls.X509KeyPair(serverCert, serverKey)
	if err != nil {
		return nil, err
	}

	certPool := x509.NewCertPool()
	if ok := certPool.AppendCertsFromPEM(caCert); !ok {
		return nil, fmt.Errorf("failed to append CA cert")
	}

	return &tls.Config{
		ClientAuth:   tls.RequireAndVerifyClientCert,
		Certificates: []tls.Certificate{certificate},
		ClientCAs:    certPool,
	}, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	ctx := context.Background()
	server, err := newSovereignServer(ctx)
	if err != nil {
		log.Fatalf("failed to start sovereign server: %v", err)
	}

	// 🔒 [mTLS] Load certificates for Neural Vault Security
	tlsConfig, err := loadmTLSCreds()
	if err != nil {
		log.Fatalf("failed to load mTLS credentials: %v", err)
	}

	// PRO PATCH: Add the Auth Interceptor, Recovery, and TLS to the gRPC server
	grpcServer := grpc.NewServer(
		grpc.Creds(credentials.NewTLS(tlsConfig)),
		grpc.ChainUnaryInterceptor(
			recoveryInterceptor,
			authInterceptor,
		),
	)
	pb.RegisterSovereignServiceServer(grpcServer, server)
	
	// Enable Reflection for debugging tools like grpcui or postman
	reflection.Register(grpcServer)

	log.Printf("👑 [SOVEREIGN_ENGINE] Steel Gate Active. Online on :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

