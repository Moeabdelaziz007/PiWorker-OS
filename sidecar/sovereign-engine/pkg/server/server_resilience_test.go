package server

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	pb "github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/pb"
)

func TestCommitPayment_InvalidOrExpiredToken_IsRejectedWithVisibleSignal(t *testing.T) {
	t.Setenv("AGENT_SYSTEM_SECRET", "expected-secret")

	s := &SovereignServer{}
	resp, err := s.CommitPayment(context.Background(), &pb.PaymentRequest{
		RecipientId:    "wallet-123",
		AmountPi:       5,
		AgentAuthToken: "expired-or-invalid",
		Priority:       "normal",
	})
	if err != nil {
		t.Fatalf("commit payment returned unexpected error: %v", err)
	}

	if resp.Success {
		t.Fatalf("expected unauthorized payment to fail")
	}
	if resp.TxId != "REJECTED_UNAUTHORIZED" {
		t.Fatalf("expected explicit unauthorized tx marker, got: %q", resp.TxId)
	}
}

func TestCommitPayment_SlowUpstreamTimeout_GracefullyFallsBack(t *testing.T) {
	t.Setenv("AGENT_SYSTEM_SECRET", "expected-secret")
	t.Setenv("SOVEREIGN_WALLET_ADDRESS", "wallet-source")

	slowNode := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(11 * time.Second) // LedgerConnector timeout is 10s.
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"balances":[{"asset_type":"native","balance":"999.0"}]}`))
	}))
	defer slowNode.Close()
	t.Setenv("PI_NODE_URL", slowNode.URL)

	s := &SovereignServer{}
	resp, err := s.CommitPayment(context.Background(), &pb.PaymentRequest{
		RecipientId:    "wallet-123",
		AmountPi:       1,
		AgentAuthToken: "expected-secret",
		Priority:       "high",
	})
	if err != nil {
		t.Fatalf("commit payment returned unexpected error: %v", err)
	}

	if !resp.Success {
		t.Fatalf("expected graceful success fallback when balance check times out, got: %+v", resp)
	}
	if resp.TxId == "" {
		t.Fatalf("expected user-visible tx id on fallback path")
	}
}

func TestExecutePlugin_MalformedPayload_IsRejectedWithActionableError(t *testing.T) {
	t.Setenv("AGENT_SYSTEM_SECRET", "plugin-secret")

	s := &SovereignServer{}
	resp, err := s.ExecutePlugin(context.Background(), &pb.PluginRequest{
		PluginId:            "plugin-malformed",
		SourceCode:          "this is not valid js",
		AllowedCapabilities: []string{"fs"},
		Signature:           "bad-signature",
	})
	if err != nil {
		t.Fatalf("execute plugin returned unexpected error: %v", err)
	}

	if resp.Success {
		t.Fatalf("expected malformed payload/signature to be rejected")
	}
	if !strings.Contains(strings.ToLower(resp.ErrorMessage), "signature") {
		t.Fatalf("expected actionable security error message, got: %q", resp.ErrorMessage)
	}
}

func TestExecutePlugin_PartialDeployArtifactMissing_NoSilentFailure(t *testing.T) {
	t.Setenv("AGENT_SYSTEM_SECRET", "plugin-secret")

	h := hmac.New(sha256.New, []byte(os.Getenv("AGENT_SYSTEM_SECRET")))
	h.Write([]byte("")) // empty source simulates missing artifact body
	emptySig := hex.EncodeToString(h.Sum(nil))

	s := &SovereignServer{}
	resp, err := s.ExecutePlugin(context.Background(), &pb.PluginRequest{
		PluginId:            "plugin-partial-artifact",
		SourceCode:          "",
		AllowedCapabilities: []string{"net"},
		Signature:           emptySig,
	})
	if err != nil {
		t.Fatalf("execute plugin returned unexpected error: %v", err)
	}

	if resp.Success {
		t.Fatalf("expected missing artifact payload to fail; got success response")
	}
	if strings.TrimSpace(resp.ErrorMessage) == "" {
		t.Fatalf("expected explicit error message; got silent failure")
	}
}
