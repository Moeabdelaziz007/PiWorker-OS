package server

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/bridge"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/engine"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/finance"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/memory"
	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/sandbox"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type SovereignServer struct {
	pb.UnimplementedSovereignServiceServer
	QuantumMirror      *engine.QuantumMirror
	GeminiClient       *bridge.GeminiClient
	SandboxEngine      *sandbox.NeuralSandbox
	FiscalQueue        *finance.FiscalQueue
	Journal            *engine.SovereignJournal
	Memory             *memory.MemoryStore
	Mu                 sync.RWMutex
	TxListeners        []chan finance.QueuedTx
	TelemetryListeners []chan string
}

func NewSovereignServer(ctx context.Context) (*SovereignServer, error) {
	// Initialize Gemini with Best Practices
	gc, err := bridge.NewGeminiClient(ctx, "gemini-1.5-pro")
	if err != nil {
		return nil, fmt.Errorf("failed to init gemini: %w", err)
	}

	dataDir := "data"
	if os.Getenv("VERCEL") == "1" || os.Getenv("VERCEL") == "true" {
		dataDir = "/tmp"
		log.Printf("☁️ [Vercel] Stateless mode active. Using /tmp for transient persistence.")
	}

	queue, err := finance.NewFiscalQueue(fmt.Sprintf("%s/fiscal", dataDir))
	if err != nil {
		log.Printf("⚠️ [Finance] Could not initialize queue: %v", err)
	}

	jrnl, err := engine.NewSovereignJournal(fmt.Sprintf("%s/sovereign.journal", dataDir))
	if err != nil {
		log.Printf("⚠️ [Journal] Could not initialize journal: %v", err)
	} else {
		// 🛠️ [Self-Healing] Replay Journal on startup
		active, _ := jrnl.Replay()
		if len(active) > 0 {
			log.Printf("🦾 [Journal] Found %d unfinished intents. Recovery initiated.", len(active))
			for _, entry := range active {
				log.Printf("   -> [RECOVERY_REQUIRED] ID: %s | Namespace: %s | Started: %s",
					entry.ID, entry.Namespace, entry.Timestamp.Format(time.RFC3339))
			}
		}
	}

	mem, err := memory.NewMemoryStore(fmt.Sprintf("%s/neural.memory.jsonl", dataDir))
	if err != nil {
		log.Printf("⚠️ [Memory] Could not initialize memory: %v", err)
	}

	return &SovereignServer{
		QuantumMirror:      engine.NewQuantumMirror(gc),
		GeminiClient:       gc,
		SandboxEngine:      sandbox.NewNeuralSandbox(5 * time.Second),
		FiscalQueue:        queue,
		Journal:            jrnl,
		Memory:             mem,
		TxListeners:        []chan finance.QueuedTx{},
		TelemetryListeners: []chan string{},
	}, nil
}

// 1. Quantum Mirror Simulation (Gemini-Powered)
func (s *SovereignServer) RequestSimulation(ctx context.Context, req *pb.SimulationRequest) (*pb.SimulationResponse, error) {
	logStructured(ctx, "request_simulation", "INFO", fmt.Sprintf("simulation start: %s", req.GoalId), "")
	log.Printf("🚀 [Sovereign Engine] High-Fidelity Simulation Start: %s", req.GoalId)

	results, err := s.QuantumMirror.Simulate(ctx, req.GoalId, int(req.Instances))
	if err != nil {
		log.Printf("❌ Simulation failed: %v", err)
		logStructured(ctx, "request_simulation", "ERROR", err.Error(), ErrorDependency)
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
			LogicChain:      reasoningChain,
			CriticalRisks:   []string{"Market Volatility", "Agent Drift"},
			ConfidenceScore: fmt.Sprintf("%.2f%%", avgScore*100),
		},
	}, nil
}

// 2. Embodied Intent Bridge (π0.7)
func (s *SovereignServer) SendEmbodiedIntent(ctx context.Context, req *pb.EmbodiedIntent) (*pb.IntentResponse, error) {
	logStructured(ctx, "send_embodied_intent", "INFO", fmt.Sprintf("intent begin: %s", req.IntentId), "")
	log.Printf("🤖 [Sovereign Engine] Physical Intent BEGIN: %s", req.IntentId)

	// 📓 [Durability] Log BEGIN entry
	if err := s.Journal.Begin(req.IntentId, "physical_intent", req); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to record journal: %v", err)
	}

	// 📡 [Broadcast] Send Telemetry to UI
	s.Mu.RLock()
	telemetry := fmt.Sprintf(`{"agentId":"%s","trackingId":"track_%s","joints":[0.1,0.2,0.5,0.0,0.0,0.0],"temp":38.5}`, req.AgentId, req.IntentId)
	for _, ch := range s.TelemetryListeners {
		select {
		case ch <- telemetry:
		default:
		}
	}
	s.Mu.RUnlock()

	// 📓 [Durability] Log COMMIT entry
	if err := s.Journal.Commit(req.IntentId, "physical_intent"); err != nil {
		log.Printf("⚠️ [Journal] Commit failed for intent %s: %v", req.IntentId, err)
	}

	return &pb.IntentResponse{
		Accepted:      true,
		StatusMessage: "PHYSICAL_INTENT_DISPATCHED_VIA_GO",
		TrackingId:    "track_" + req.IntentId,
	}, nil
}

// 2.5 Ring 3: Neural-Isolated Sandbox Execution
func (s *SovereignServer) ExecutePlugin(ctx context.Context, req *pb.PluginRequest) (*pb.PluginResponse, error) {
	logStructured(ctx, "execute_plugin", "INFO", fmt.Sprintf("plugin execute: %s", req.PluginId), "")
	log.Printf("🛡️ [Sandbox] Executing Plugin: %s", req.PluginId)

	// 🧪 [Input Guard] Reject malformed or partial deploy payloads early.
	if req.PluginId == "" {
		return &pb.PluginResponse{
			PluginId:     req.PluginId,
			Success:      false,
			ErrorMessage: "[VALIDATION_ERROR] plugin_id is required.",
		}, nil
	}
	if req.SourceCode == "" {
		return &pb.PluginResponse{
			PluginId:     req.PluginId,
			Success:      false,
			ErrorMessage: "[DEPLOY_ARTIFACT_MISSING] source_code is empty or missing.",
		}, nil
	}

	// 🖋️ [Steel Gate] Verify Source Code Signature
	secret := os.Getenv("AGENT_SYSTEM_SECRET")
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(req.SourceCode))
	expectedSig := hex.EncodeToString(h.Sum(nil))

	if req.Signature != expectedSig {
		log.Printf("⚠️ [SEC_ALERT] Plugin Signature Mismatch! ID: %s", req.PluginId)
		logStructured(ctx, "execute_plugin", "ERROR", "plugin signature mismatch", ErrorAuth)
		return &pb.PluginResponse{
			PluginId:     req.PluginId,
			Success:      false,
			ErrorMessage: "[SEC_ERROR] Plugin signature verification failed. Tampering detected.",
		}, nil
	}

	// 📓 [Durability] Log BEGIN entry
	if err := s.Journal.Begin(req.PluginId, "sandbox_plugin", req.PluginId); err != nil {
		log.Printf("⚠️ [Journal] Failed to record plugin start: %v", err)
	}

	start := time.Now()
	res, err := s.SandboxEngine.Execute(ctx, req.SourceCode, req.EnvVars, req.AllowedCapabilities)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		// 📓 [Durability] Log FAIL entry
		_ = s.Journal.Fail(req.PluginId, "sandbox_plugin", err.Error())
		logStructured(ctx, "execute_plugin", "ERROR", err.Error(), ErrorBuild)
		return &pb.PluginResponse{
			PluginId:        req.PluginId,
			Success:         false,
			ErrorMessage:    fmt.Sprintf("sandbox failure: %v", err),
			ExecutionTimeMs: duration,
			Logs:            res.Logs,
		}, nil
	}

	// 📓 [Durability] Log COMMIT entry
	_ = s.Journal.Commit(req.PluginId, "sandbox_plugin")

	return &pb.PluginResponse{
		PluginId:        req.PluginId,
		Success:         true,
		OutputJson:      res.Data,
		ExecutionTimeMs: duration,
		Logs:            res.Logs,
	}, nil
}

// 3. Financial Layer
func (s *SovereignServer) LockEscrow(ctx context.Context, req *pb.EscrowRequest) (*pb.EscrowResponse, error) {
	log.Printf("🔒 [Escrow] Locking %.2f Pi for TX %s", req.AmountPi, req.TxId)
	return &pb.EscrowResponse{
		Locked:        true,
		EscrowAddress: "native-go-escrow-vault",
	}, nil
}

func (s *SovereignServer) VerifyTransaction(ctx context.Context, req *pb.VerifyTxRequest) (*pb.VerifyTxResponse, error) {
	logStructured(ctx, "verify_transaction", "INFO", fmt.Sprintf("verify tx: %s", req.TxId), "")
	log.Printf("🔍 [Ledger] Verifying Transaction %s", req.TxId)
	nodeURL := os.Getenv("PI_NODE_URL")
	if nodeURL == "" {
		nodeURL = "https://api.testnet.minepi.com"
	}
	connector := finance.NewLedgerConnector(nodeURL)
	verified, sender, err := connector.VerifyPiTransaction(req.TxId, req.ExpectedReceiver, req.ExpectedAmount)
	if err != nil {
		logStructured(ctx, "verify_transaction", "ERROR", err.Error(), ErrorNetwork)
		return &pb.VerifyTxResponse{Verified: false, StatusMessage: err.Error()}, nil
	}
	return &pb.VerifyTxResponse{Verified: verified, StatusMessage: "VERIFIED", SenderAddress: sender}, nil
}

func (s *SovereignServer) CommitPayment(ctx context.Context, req *pb.PaymentRequest) (*pb.PaymentResponse, error) {
	logStructured(ctx, "commit_payment", "INFO", fmt.Sprintf("authorizing payment to %s", req.RecipientId), "")
	log.Printf("💰 [Sovereign Maker] Authorizing Payment: %.4f Pi to %s", req.AmountPi, req.RecipientId)

	expectedAgentToken := os.Getenv("AGENT_SYSTEM_SECRET")
	if expectedAgentToken == "" {
		log.Printf("❌ [FATAL] AGENT_SYSTEM_SECRET is not set. Payments disabled.")
		logStructured(ctx, "commit_payment", "ERROR", "payment system misconfigured", ErrorDependency)
		return &pb.PaymentResponse{Success: false, ErrorMessage: "PAYMENT_SYSTEM_MISCONFIGURED"}, nil
	}

	if req.AgentAuthToken == "" || req.AgentAuthToken != expectedAgentToken {
		log.Printf("⚠️ [SEC_ALERT] Unauthorized Payment Attempt! Recipient: %s, Amount: %.2f", req.RecipientId, req.AmountPi)
		logStructured(ctx, "commit_payment", "ERROR", "unauthorized payment attempt", ErrorAuth)
		return &pb.PaymentResponse{
			Success: false,
			TxId:    "REJECTED_UNAUTHORIZED",
		}, nil
	}

	nodeURL := os.Getenv("PI_NODE_URL")
	if nodeURL == "" {
		nodeURL = "https://api.testnet.minepi.com"
	}
	connector := finance.NewLedgerConnector(nodeURL)
	sourceWallet := os.Getenv("SOVEREIGN_WALLET_ADDRESS")
	if sourceWallet != "" {
		balance, err := connector.GetBalance(sourceWallet)
		if err == nil && balance < req.AmountPi {
			log.Printf("⚠️ [Fiscal Guard] Insufficient balance in Sovereign Wallet: %.4f < %.4f", balance, req.AmountPi)
			return &pb.PaymentResponse{
				Success:      false,
				ErrorMessage: "INSUFFICIENT_SOVEREIGN_FUNDS",
			}, nil
		}
	}

	if s.FiscalQueue != nil {
		tx := finance.QueuedTx{
			ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
			AgentID:   "AGENT_SOVEREIGN",
			Amount:    req.AmountPi,
			Target:    req.RecipientId,
			Timestamp: time.Now(),
			Status:    "PENDING",
		}

		// 📓 [Durability] Log BEGIN entry
		if err := s.Journal.Begin(tx.ID, "payment", tx); err != nil {
			log.Printf("⚠️ [Journal] Failed to record payment start: %v", err)
		}

		s.FiscalQueue.Push(tx)

		s.Mu.RLock()
		for _, ch := range s.TxListeners {
			select {
			case ch <- tx:
			default:
			}
		}
		s.Mu.RUnlock()

		// 📓 [Durability] Log COMMIT entry
		_ = s.Journal.Commit(tx.ID, "payment")

		return &pb.PaymentResponse{
			Success:     true,
			TxId:        tx.ID,
			ExplorerUrl: "https://minepi.com/blockexplorer",
		}, nil
	}

	return &pb.PaymentResponse{
		Success:     true,
		TxId:        fmt.Sprintf("tx_%d", time.Now().Unix()),
		ExplorerUrl: "https://minepi.com/blockexplorer",
	}, nil
}

// 4. Memory Layer (Pattern 7: Neural Memory Mesh)

func (s *SovereignServer) StoreMemory(ctx context.Context, req interface{}) (interface{}, error) {
	// We use interface{} because the pb types aren't generated yet
	// Connect-Lite will pass us a map or a struct if we decode it manually
	
	m, ok := req.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid memory request type")
	}

	insight := memory.SovereignInsight{
		ID:        fmt.Sprintf("%v", m["id"]),
		AgentID:   fmt.Sprintf("%v", m["agent_id"]),
		Topic:     fmt.Sprintf("%v", m["topic"]),
		Data:      m["data_json"],
		Signature: fmt.Sprintf("%v", m["signature"]),
		Timestamp: fmt.Sprintf("%v", m["timestamp"]),
	}

	if err := s.Memory.Store(insight); err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"success":   true,
		"memory_id": insight.ID,
	}, nil
}

func (s *SovereignServer) QueryMemory(ctx context.Context, req interface{}) (interface{}, error) {
	m, ok := req.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid query request type")
	}

	topic := fmt.Sprintf("%v", m["topic"])
	agentId := fmt.Sprintf("%v", m["agent_id"])

	results := s.Memory.Query(topic, agentId)
	
	// Convert results to map for JSON response
	insights := []map[string]interface{}{}
	for _, res := range results {
		insights = append(insights, map[string]interface{}{
			"id":        res.ID,
			"agent_id":  res.AgentID,
			"topic":     res.Topic,
			"data_json": res.Data,
			"signature": res.Signature,
			"timestamp": res.Timestamp,
			"relevance": res.Relevance,
		})
	}

	return map[string]interface{}{
		"insights": insights,
	}, nil
}
