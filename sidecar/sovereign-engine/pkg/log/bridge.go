// Package log centralizes structured logging for the Sovereign Engine and
// HTTP bridge using the standard library's `log/slog` (Go 1.21+).
//
// Before this package, observability lines were emitted by hand-rolling a
// JSON struct (api.bridgeLog) and calling log.Println on the marshalled
// string. That worked but had four problems:
//
//   - Every call site had to remember the field order.
//   - The correlation_id / request_id were passed as positional args
//     rather than living on the context, so middleware could not inject
//     them automatically.
//   - There was no level filtering: every event hit stderr.
//   - The hand-rolled marshal allocates a fresh slice per line; slog's
//     JSONHandler reuses buffers per goroutine.
//
// The package wraps a slog.Logger with a small fluent API that emits
// records in the same JSON shape the TypeScript side (core/utils/
// observability.ts) already consumes, so existing dashboards keep
// working unchanged.
package log

import (
	"context"
	"io"
	"log/slog"
	"os"
)

// Field names match the bridgeLog struct that existed in api/index.go
// so log consumers (Vercel logs, Grafana, etc.) do not need updating.
const (
	FieldComponent     = "component"
	FieldOperation     = "operation"
	FieldAuthContext   = "auth_context"
	FieldRequestID     = "request_id"
	FieldCorrelationID = "correlation_id"
	FieldErrorCode     = "error_code"
)

// Component is the static "component" tag stamped on every record. The
// API bridge uses ComponentAPIBridge; the gRPC server uses
// ComponentSovereignEngine; new call sites should add a constant here
// rather than passing a string literal.
const (
	ComponentAPIBridge       = "API_BRIDGE"
	ComponentSovereignEngine = "SOVEREIGN_ENGINE"
	ComponentCLI             = "CLI"
)

// ctxKey is a private context-key type so other packages cannot collide
// with our keys by accident.
type ctxKey int

const (
	ctxKeyRequestID ctxKey = iota
	ctxKeyCorrelationID
	ctxKeyAuthContext
)

// New returns a slog.Logger configured for production JSON output. It
// writes to the given io.Writer (typically os.Stderr) and stamps the
// component field on every record so downstream log routers can split
// by source. Level is read from LOG_LEVEL (debug|info|warn|error),
// defaulting to info.
func New(component string, w io.Writer) *slog.Logger {
	if w == nil {
		w = os.Stderr
	}
	level := parseLevel(os.Getenv("LOG_LEVEL"))
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: level,
	})
	return slog.New(handler).With(FieldComponent, component)
}

func parseLevel(s string) slog.Level {
	switch s {
	case "debug", "DEBUG":
		return slog.LevelDebug
	case "warn", "WARN", "warning":
		return slog.LevelWarn
	case "error", "ERROR":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// WithRequest returns a copy of ctx carrying the request and correlation
// IDs plus the auth context derived from an incoming HTTP request. Use
// it once at the bridge boundary; downstream code reads the values back
// via FromContext.
func WithRequest(ctx context.Context, requestID, correlationID, authContext string) context.Context {
	ctx = context.WithValue(ctx, ctxKeyRequestID, requestID)
	ctx = context.WithValue(ctx, ctxKeyCorrelationID, correlationID)
	ctx = context.WithValue(ctx, ctxKeyAuthContext, authContext)
	return ctx
}

// FromContext extracts the request, correlation, and auth identifiers
// previously stored by WithRequest. Missing values return empty strings
// rather than panicking, so callers can safely log on any ctx.
func FromContext(ctx context.Context) (requestID, correlationID, authContext string) {
	if ctx == nil {
		return "", "", ""
	}
	if v, ok := ctx.Value(ctxKeyRequestID).(string); ok {
		requestID = v
	}
	if v, ok := ctx.Value(ctxKeyCorrelationID).(string); ok {
		correlationID = v
	}
	if v, ok := ctx.Value(ctxKeyAuthContext).(string); ok {
		authContext = v
	}
	return
}

// Op emits an INFO record describing an operation. ErrorCode is left
// empty for success paths; pass a non-empty value (AUTH, VALIDATION,
// DEPENDENCY, BUILD, NETWORK) to flag a failure path. The shape of the
// resulting JSON matches the legacy bridgeLog struct one-for-one.
func Op(ctx context.Context, logger *slog.Logger, operation, errorCode, message string) {
	requestID, correlationID, authContext := FromContext(ctx)
	logger.LogAttrs(ctx, levelFor(errorCode), message,
		slog.String(FieldOperation, operation),
		slog.String(FieldAuthContext, authContext),
		slog.String(FieldRequestID, requestID),
		slog.String(FieldCorrelationID, correlationID),
		slog.String(FieldErrorCode, errorCode),
	)
}

// levelFor maps an error_code string to a slog level so failure paths
// surface at WARN/ERROR while success paths stay at INFO. Empty
// error_code means success.
func levelFor(errorCode string) slog.Level {
	switch errorCode {
	case "":
		return slog.LevelInfo
	case "VALIDATION":
		return slog.LevelWarn
	default:
		return slog.LevelError
	}
}
