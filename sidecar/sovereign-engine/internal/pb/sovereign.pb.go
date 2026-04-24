package pb

// Mock generated code to bypass network issues
import (
	"context"
	"google.golang.org/grpc"
)

type SimulationRequest struct { GoalId string; Instances int32 }
type SimulationResponse struct { GoalId string; PredictedRoi float32; RiskScore float32; StrategyRecommendation string }
type EmbodiedIntent struct { IntentId string; AgentId string; VisualSubgoals [][]byte }
type IntentResponse struct { Accepted bool; StatusMessage string; TrackingId string }
type EscrowRequest struct { TxId string; AmountPi float64 }
type EscrowResponse struct { Locked bool; EscrowAddress string }
type VerifyTxRequest struct { TxId string; ExpectedReceiver string; ExpectedAmount float64 }
type VerifyTxResponse struct { Verified bool; StatusMessage string; SenderAddress string }

type SovereignServiceClient interface {
	RequestSimulation(ctx context.Context, in *SimulationRequest, opts ...grpc.CallOption) (*SimulationResponse, error)
	SendEmbodiedIntent(ctx context.Context, in *EmbodiedIntent, opts ...grpc.CallOption) (*IntentResponse, error)
	VerifyTransaction(ctx context.Context, in *VerifyTxRequest, opts ...grpc.CallOption) (*VerifyTxResponse, error)
}

type SovereignServiceServer interface {
	RequestSimulation(context.Context, *SimulationRequest) (*SimulationResponse, error)
	SendEmbodiedIntent(context.Context, *EmbodiedIntent) (*IntentResponse, error)
	VerifyTransaction(context.Context, *VerifyTxRequest) (*VerifyTxResponse, error)
}

func RegisterSovereignServiceServer(s *grpc.Server, srv SovereignServiceServer) {}

type UnimplementedSovereignServiceServer struct{}
func (UnimplementedSovereignServiceServer) RequestSimulation(context.Context, *SimulationRequest) (*SimulationResponse, error) { return nil, nil }
func (UnimplementedSovereignServiceServer) SendEmbodiedIntent(context.Context, *EmbodiedIntent) (*IntentResponse, error) { return nil, nil }
func (UnimplementedSovereignServiceServer) VerifyTransaction(context.Context, *VerifyTxRequest) (*VerifyTxResponse, error) { return nil, nil }
