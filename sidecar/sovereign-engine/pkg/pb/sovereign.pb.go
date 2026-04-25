package pb

import (
	"context"
	"google.golang.org/grpc"
)

// --- Simulation Logic ---

type SimulationRequest struct {
	GoalId       string
	Instances    int32
	Complexity   float32
	Personas     []string
	ModelVersion string
}

type SimulationResponse struct {
	GoalId                 string
	PredictedRoi           float32
	RiskScore              float32
	StrategyRecommendation string
	Reasoning              *GeminiReasoning
	EstimatedRevenueUsd    float32
}

type GeminiReasoning struct {
	LogicChain      string
	CriticalRisks   []string
	Opportunities   []string
	ConfidenceScore string
}

// --- Physical Layer ---

type EmbodiedIntent struct {
	IntentId          string
	AgentId           string
	SubtaskLanguage   string
	ExecutionMetadata map[string]string
	ControlMode       string
	VisualSubgoals    [][]byte
}

type IntentResponse struct {
	Accepted      bool
	StatusMessage string
	TrackingId    string
}

// --- Financial Layer ---

type EscrowRequest struct {
	TxId         string
	AmountPi     float64
	TargetWallet string
}

type EscrowResponse struct {
	Locked        bool
	EscrowAddress string
}

type VerifyTxRequest struct {
	TxId             string
	ExpectedReceiver string
	ExpectedAmount   float64
}

type VerifyTxResponse struct {
	Verified      bool
	StatusMessage string
	SenderAddress string
}

type PaymentRequest struct {
	RecipientId    string
	AmountPi       float64
	AgentAuthToken string
	Priority       string
}

type PaymentResponse struct {
	Success      bool
	TxId         string
	ExplorerUrl  string
	ErrorMessage string
}

// --- Sandbox Layer ---

type PluginRequest struct {
	PluginId            string
	SourceCode          string
	EnvVars             map[string]string
	AllowedCapabilities []string
	Signature           string
}

type PluginResponse struct {
	PluginId         string
	Success          bool
	OutputJson       string
	ErrorMessage     string
	ExecutionTimeMs  int64
	Logs             []string
}

// --- Service Definition ---

type SovereignServiceClient interface {
	RequestSimulation(ctx context.Context, in *SimulationRequest, opts ...grpc.CallOption) (*SimulationResponse, error)
	LockEscrow(ctx context.Context, in *EscrowRequest, opts ...grpc.CallOption) (*EscrowResponse, error)
	VerifyTransaction(ctx context.Context, in *VerifyTxRequest, opts ...grpc.CallOption) (*VerifyTxResponse, error)
	CommitPayment(ctx context.Context, in *PaymentRequest, opts ...grpc.CallOption) (*PaymentResponse, error)
	SendEmbodiedIntent(ctx context.Context, in *EmbodiedIntent, opts ...grpc.CallOption) (*IntentResponse, error)
	ExecutePlugin(ctx context.Context, in *PluginRequest, opts ...grpc.CallOption) (*PluginResponse, error)
}

type SovereignServiceServer interface {
	RequestSimulation(context.Context, *SimulationRequest) (*SimulationResponse, error)
	LockEscrow(context.Context, *EscrowRequest) (*EscrowResponse, error)
	VerifyTransaction(context.Context, *VerifyTxRequest) (*VerifyTxResponse, error)
	CommitPayment(context.Context, *PaymentRequest) (*PaymentResponse, error)
	SendEmbodiedIntent(context.Context, *EmbodiedIntent) (*IntentResponse, error)
	ExecutePlugin(context.Context, *PluginRequest) (*PluginResponse, error)
	mustEmbedUnimplementedSovereignServiceServer()
}

type UnimplementedSovereignServiceServer struct{}

func (UnimplementedSovereignServiceServer) RequestSimulation(context.Context, *SimulationRequest) (*SimulationResponse, error) {
	return nil, nil
}
func (UnimplementedSovereignServiceServer) LockEscrow(context.Context, *EscrowRequest) (*EscrowResponse, error) {
	return nil, nil
}
func (UnimplementedSovereignServiceServer) VerifyTransaction(context.Context, *VerifyTxRequest) (*VerifyTxResponse, error) {
	return nil, nil
}
func (UnimplementedSovereignServiceServer) CommitPayment(context.Context, *PaymentRequest) (*PaymentResponse, error) {
	return nil, nil
}
func (UnimplementedSovereignServiceServer) SendEmbodiedIntent(context.Context, *EmbodiedIntent) (*IntentResponse, error) {
	return nil, nil
}
func (UnimplementedSovereignServiceServer) ExecutePlugin(context.Context, *PluginRequest) (*PluginResponse, error) {
	return nil, nil
}
func (UnimplementedSovereignServiceServer) mustEmbedUnimplementedSovereignServiceServer() {}

func RegisterSovereignServiceServer(s *grpc.Server, srv SovereignServiceServer) {
	s.RegisterService(&_SovereignService_serviceDesc, srv)
}

var _SovereignService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "sovereign.SovereignService",
	HandlerType: (*SovereignServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "RequestSimulation",
			Handler:    _SovereignService_RequestSimulation_Handler,
		},
		{
			MethodName: "LockEscrow",
			Handler:    _SovereignService_LockEscrow_Handler,
		},
		{
			MethodName: "VerifyTransaction",
			Handler:    _SovereignService_VerifyTransaction_Handler,
		},
		{
			MethodName: "CommitPayment",
			Handler:    _SovereignService_CommitPayment_Handler,
		},
		{
			MethodName: "SendEmbodiedIntent",
			Handler:    _SovereignService_SendEmbodiedIntent_Handler,
		},
		{
			MethodName: "ExecutePlugin",
			Handler:    _SovereignService_ExecutePlugin_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "sovereign.proto",
}

func _SovereignService_RequestSimulation_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SimulationRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SovereignServiceServer).RequestSimulation(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/sovereign.SovereignService/RequestSimulation",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SovereignServiceServer).RequestSimulation(ctx, req.(*SimulationRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SovereignService_LockEscrow_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(EscrowRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SovereignServiceServer).LockEscrow(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/sovereign.SovereignService/LockEscrow",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SovereignServiceServer).LockEscrow(ctx, req.(*EscrowRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SovereignService_VerifyTransaction_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(VerifyTxRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SovereignServiceServer).VerifyTransaction(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/sovereign.SovereignService/VerifyTransaction",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SovereignServiceServer).VerifyTransaction(ctx, req.(*VerifyTxRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SovereignService_CommitPayment_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PaymentRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SovereignServiceServer).CommitPayment(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/sovereign.SovereignService/CommitPayment",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SovereignServiceServer).CommitPayment(ctx, req.(*PaymentRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _SovereignService_SendEmbodiedIntent_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(EmbodiedIntent)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SovereignServiceServer).SendEmbodiedIntent(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/sovereign.SovereignService/SendEmbodiedIntent",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SovereignServiceServer).SendEmbodiedIntent(ctx, req.(*EmbodiedIntent))
	}
	return interceptor(ctx, in, info, handler)
}

func _SovereignService_ExecutePlugin_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PluginRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(SovereignServiceServer).ExecutePlugin(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/sovereign.SovereignService/ExecutePlugin",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(SovereignServiceServer).ExecutePlugin(ctx, req.(*PluginRequest))
	}
	return interceptor(ctx, in, info, handler)
}
