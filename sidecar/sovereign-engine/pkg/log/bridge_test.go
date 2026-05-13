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
	// Pin LOG_LEVEL so the test does not silently filter INFO records
	// when the surrounding process sets LOG_LEVEL=warn or error.
	t.Setenv("LOG_LEVEL", "debug")
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
	// Wire-compat: the legacy bridgeLog struct used `timestamp` and
	// `message` (not slog's defaults `time` and `msg`). Assert the
	// renames stick.
	assertEqual("message", "approve received")
	assertEqual("level", "INFO")
	if _, ok := record["timestamp"]; !ok {
		t.Errorf("expected 'timestamp' key, got keys: %v", keysOf(record))
	}
	if _, ok := record["time"]; ok {
		t.Errorf("'time' key leaked through; expected rename to 'timestamp'. keys: %v", keysOf(record))
	}
	if _, ok := record["msg"]; ok {
		t.Errorf("'msg' key leaked through; expected rename to 'message'. keys: %v", keysOf(record))
	}
	// Wire-compat: error_code had `omitempty` on the old struct, so
	// success records must NOT emit the key at all.
	if _, ok := record[FieldErrorCode]; ok {
		t.Errorf("expected error_code to be omitted on success, got %v", record[FieldErrorCode])
	}
}

func TestOpKeepsErrorCodeOnFailure(t *testing.T) {
	// The complement of the omitempty rule: when error_code IS set,
	// it must appear on the wire so failure paths still surface.
	// Pin LOG_LEVEL so ERROR records emit regardless of host env.
	t.Setenv("LOG_LEVEL", "debug")
	var buf bytes.Buffer
	logger := New(ComponentAPIBridge, &buf)

	Op(context.Background(), logger, "payment", "DEPENDENCY", "downstream timeout")

	record := decodeLine(t, bytes.TrimSpace(buf.Bytes()))
	if got := record[FieldErrorCode]; got != "DEPENDENCY" {
		t.Errorf("error_code on failure: got %v, want %q", got, "DEPENDENCY")
	}
}

func keysOf(m map[string]any) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

func TestOpLevelFollowsErrorCode(t *testing.T) {
	// Pin LOG_LEVEL=debug so every level (INFO/WARN/ERROR) under test
	// is emitted regardless of what LOG_LEVEL is set to in the host
	// environment when the test process starts.
	t.Setenv("LOG_LEVEL", "debug")
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

func TestParseLevelNormalizesInput(t *testing.T) {
	// Operators routinely set LOG_LEVEL with stray whitespace or
	// mixed case; we must accept those rather than silently falling
	// back to INFO and hiding DEBUG records.
	cases := []struct {
		envValue   string
		debugVisible bool
	}{
		{"debug", true},
		{"DEBUG", true},
		{"  debug  ", true},
		{"Debug", true},
		{" Warning ", false}, // maps to WARN, debug still filtered
		{"WARN", false},
		{"ERROR", false},
		{"garbage", false}, // unknown -> INFO, debug filtered
	}
	for _, tc := range cases {
		t.Run("env="+tc.envValue, func(t *testing.T) {
			t.Setenv("LOG_LEVEL", tc.envValue)
			var buf bytes.Buffer
			logger := New(ComponentAPIBridge, &buf)
			logger.Debug("debug record")
			gotVisible := strings.Contains(buf.String(), "debug record")
			if gotVisible != tc.debugVisible {
				t.Errorf("LOG_LEVEL=%q: debug visible=%v, want %v (buf=%q)",
					tc.envValue, gotVisible, tc.debugVisible, buf.String())
			}
		})
	}
}
