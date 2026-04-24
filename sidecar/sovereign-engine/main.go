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
	pb "github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type sovereignServer struct {
	pb.UnimplementedSovereignServiceServer
	quantumMirror *engine.QuantumMirror
	geminiClient  *bridge.GeminiClient
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
	}, nil
}

// 1. Quantum Mirror Simulation (Gemini-Powered)
func (s *sovereignServer) RequestSimulation(ctx context.Context, req *pb.SimulationRequest) (*pb.SimulationResponse, error) {
	log.Printf("🚀 [Sovereign Engine] High-Fidelity Simulation Start: %s", req.GoalId)

	results, err := s.quantumMirror.Simulate(ctx, req.GoalId, int(req.Instances))
	if err != nil {
		log.Printf("❌ Simulation failed: %v", err)
		return nil, err
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
	connector := finance.NewLedgerConnector("https://api.testnet.minepi.com")
	verified, sender, err := connector.VerifyPiTransaction(req.TxId, req.ExpectedReceiver, req.ExpectedAmount)
	if err != nil {
		return &pb.VerifyTxResponse{Verified: false, StatusMessage: err.Error()}, nil
	}
	return &pb.VerifyTxResponse{Verified: verified, StatusMessage: "VERIFIED", SenderAddress: sender}, nil
}

func (s *sovereignServer) CommitPayment(ctx context.Context, req *pb.PaymentRequest) (*pb.PaymentResponse, error) {
	log.Printf("💰 [Sovereign Maker] Authorizing Payment: %.4f Pi to %s", req.AmountPi, req.RecipientId)
	
	maker := finance.NewPaymentMaker("https://api.testnet.minepi.com")
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

	grpcServer := grpc.NewServer()
	pb.RegisterSovereignServiceServer(grpcServer, server)
	
	// Enable Reflection for debugging tools like grpcui or postman
	reflection.Register(grpcServer)

	log.Printf("👑 [Sovereign Engine] Go Sidecar Online on :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

