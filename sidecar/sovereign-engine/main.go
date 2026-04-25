package main

import (
	"context"
	"log"
	"net"
	"os"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/server"
	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/reflection"
	"google.golang.org/grpc/status"
)

func authUnaryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "[SEC_ERROR] Metadata is missing")
	}

	tokens := md["x-sovereign-token"]
	if len(tokens) == 0 || tokens[0] != os.Getenv("SOVEREIGN_AUTH_TOKEN") {
		log.Printf("⚠️ [SEC_ALERT] Unauthorized access attempt to %s", info.FullMethod)
		return nil, status.Errorf(codes.Unauthenticated, "[SEC_ERROR] Invalid or missing auth token")
	}

	return handler(ctx, req)
}

func main() {
	ctx := context.Background()
	log.Println("🦾 Sovereign Engine Muscle starting...")

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
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
