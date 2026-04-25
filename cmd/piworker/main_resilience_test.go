package main

import (
	"bytes"
	"io"
	"os"
	"strings"
	"testing"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/config"
)

func captureStdout(t *testing.T, fn func()) string {
	t.Helper()
	orig := os.Stdout
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatalf("pipe setup failed: %v", err)
	}
	os.Stdout = w

	fn()

	_ = w.Close()
	os.Stdout = orig

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, r); err != nil {
		t.Fatalf("stdout capture failed: %v", err)
	}
	return buf.String()
}

func TestCheckStatus_GrpcSidecarUnavailable_ReportsOffline(t *testing.T) {
	cfg := &config.Config{GatewayPort: "1"} // guaranteed unavailable in test env

	output := captureStdout(t, func() {
		checkStatus(cfg, false, false)
	})

	if !strings.Contains(output, "[Muscle] OFFLINE") {
		t.Fatalf("expected OFFLINE sidecar status in output, got: %s", output)
	}

	if !strings.Contains(output, "[Brain]") {
		t.Fatalf("expected brain status to still be reported, got: %s", output)
	}
}
