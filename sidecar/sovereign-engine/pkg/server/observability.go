package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc/metadata"
)

type ErrorCategory string

const (
	ErrorAuth       ErrorCategory = "AUTH"
	ErrorNetwork    ErrorCategory = "NETWORK"
	ErrorBuild      ErrorCategory = "BUILD"
	ErrorValidation ErrorCategory = "VALIDATION"
	ErrorDependency ErrorCategory = "DEPENDENCY"
)

type logEvent struct {
	Timestamp     string `json:"timestamp"`
	Component     string `json:"component"`
	Operation     string `json:"operation"`
	AuthContext   string `json:"auth_context"`
	RequestID     string `json:"request_id"`
	CorrelationID string `json:"correlation_id"`
	ErrorCode     string `json:"error_code,omitempty"`
	Message       string `json:"message,omitempty"`
	Level         string `json:"level,omitempty"`
}

func extractTraceContext(ctx context.Context) (requestID string, correlationID string, authContext string) {
	requestID = fmt.Sprintf("go-request-%d", time.Now().UTC().UnixNano())
	correlationID = requestID
	authContext = "ANONYMOUS"

	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if v := md.Get("x-request-id"); len(v) > 0 && v[0] != "" {
			requestID = v[0]
		}
		if v := md.Get("x-correlation-id"); len(v) > 0 && v[0] != "" {
			correlationID = v[0]
		} else {
			correlationID = requestID
		}
		if v := md.Get("x-sovereign-token"); len(v) > 0 && v[0] != "" {
			authContext = "SOVEREIGN_TOKEN"
		}
	}

	return requestID, correlationID, authContext
}

func logStructured(ctx context.Context, operation string, level string, message string, errorCode ErrorCategory) {
	requestID, correlationID, authContext := extractTraceContext(ctx)
	event := logEvent{
		Timestamp:     time.Now().UTC().Format(time.RFC3339Nano),
		Component:     "GO_SIDECAR",
		Operation:     operation,
		AuthContext:   authContext,
		RequestID:     requestID,
		CorrelationID: correlationID,
		Level:         level,
		Message:       message,
	}
	if errorCode != "" {
		event.ErrorCode = string(errorCode)
	}

	line, err := json.Marshal(event)
	if err != nil {
		log.Printf("{\"timestamp\":\"%s\",\"component\":\"GO_SIDECAR\",\"operation\":\"%s\",\"level\":\"ERROR\",\"message\":\"log serialization failure\",\"error_code\":\"DEPENDENCY\"}", time.Now().UTC().Format(time.RFC3339Nano), operation)
		return
	}

	log.Println(string(line))
}
