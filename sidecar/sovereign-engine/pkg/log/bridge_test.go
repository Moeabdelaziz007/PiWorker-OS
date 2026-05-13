package log

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"
)

// decodeLine parses a JSONL record into a generic map so we can assert on
// individual fields without locking in slog's exact key order.
func decodeLine(t *testing.T, line []byte) map[string]any {
	t.Helper()
	var record map[string]any
	if err := json.Unmarshal(line, &record); err != nil {
		t.Fatalf("log line is not valid JSON: %v\nline: %s", err, line)
	}
	return record
}

func TestOpEmitsCanonicalFields(t *testing.T) {
	var buf bytes.Buffer
	logger := New(ComponentAPIBridge, &buf)

	ctx := WithRequest(context.Background(), "req-123", "corr-456", "SOVEREIGN_TOKEN")
	Op(ctx, logger, "payment", "", "approve received")

	record := decodeLine(t, bytes.TrimSpace(buf.Bytes()))

	assertEqual := func(field string, want any) {
		t.Helper()
		if got := record[field]; got != want {
			t.Errorf("field %q: got %v, want %v", field, got, want)
		}
	}
	assertEqual(FieldComponent, ComponentAPIBridge)
	assertEqual(FieldOperation, "payment")
	assertEqual(FieldAuthContext, "SOVEREIGN_TOKEN")
	assertEqual(FieldRequestID, "req-123")
	assertEqual(FieldCorrelationID, "corr-456")
	assertEqual(FieldErrorCode, "")
	assertEqual("msg", "approve received")
	assertEqual("level", "INFO")
}

func TestOpLevelFollowsErrorCode(t *testing.T) {
	cases := []struct {
		errorCode string
		wantLevel string
	}{
		{"", "INFO"},
		{"VALIDATION", "WARN"},
		{"AUTH", "ERROR"},
		{"DEPENDENCY", "ERROR"},
		{"BUILD", "ERROR"},
	}
	for _, tc := range cases {
		t.Run("code="+tc.errorCode, func(t *testing.T) {
			var buf bytes.Buffer
			logger := New(ComponentAPIBridge, &buf)
			Op(context.Background(), logger, "op", tc.errorCode, "msg")
			record := decodeLine(t, bytes.TrimSpace(buf.Bytes()))
			if got, _ := record["level"].(string); got != tc.wantLevel {
				t.Errorf("level: got %q, want %q", got, tc.wantLevel)
			}
		})
	}
}

func TestFromContextZeroValues(t *testing.T) {
	// An unset context must not panic and must return empty strings so
	// that emergency logs from before middleware ran are still safe.
	reqID, corrID, auth := FromContext(context.Background())
	if reqID != "" || corrID != "" || auth != "" {
		t.Errorf("expected empty zero values, got (%q, %q, %q)", reqID, corrID, auth)
	}
	// Nil context should also not panic.
	reqID, corrID, auth = FromContext(nil)
	if reqID != "" || corrID != "" || auth != "" {
		t.Errorf("expected empty zero values for nil ctx, got (%q, %q, %q)", reqID, corrID, auth)
	}
}

func TestParseLevelDefaultsToInfo(t *testing.T) {
	// Just exercise the env-driven helper through New(); we cannot peek
	// at the unexported level so we assert by emitting a debug-level
	// record and checking it is filtered out when LOG_LEVEL is empty.
	t.Setenv("LOG_LEVEL", "")
	var buf bytes.Buffer
	logger := New(ComponentAPIBridge, &buf)
	logger.Debug("debug record")
	if buf.Len() != 0 {
		t.Errorf("debug record should be filtered when LOG_LEVEL is empty: %s", buf.String())
	}

	// And reverse: at DEBUG it should pass through.
	t.Setenv("LOG_LEVEL", "debug")
	buf.Reset()
	logger = New(ComponentAPIBridge, &buf)
	logger.Debug("debug record")
	if !strings.Contains(buf.String(), "debug record") {
		t.Errorf("debug record should pass when LOG_LEVEL=debug: %s", buf.String())
	}
}
