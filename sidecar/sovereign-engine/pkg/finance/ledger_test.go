package finance

import (
	"bytes"
	"io"
	"net/http"
	"testing"
)

/**
 * AMRIKYY LAB :: FISCAL INTEGRATION TEST (NETWORK-FREE)
 * PURPOSE: Verifies the LedgerConnector can successfully proof-check balances 
 * and transactions without relying on the OS network stack.
 */

type MockHTTPClient struct {
	ResponseJSON string
	StatusCode   int
}

func (m *MockHTTPClient) Get(url string) (*http.Response, error) {
	return &http.Response{
		StatusCode: m.StatusCode,
		Body:       io.NopCloser(bytes.NewBufferString(m.ResponseJSON)),
	}, nil
}

// Do satisfies the HTTPDoer interface so the mock can stand in for
// *http.Client wherever Client.Do is used (e.g., InvokeSoroban). Returns
// the same canned response as Get.
func (m *MockHTTPClient) Do(req *http.Request) (*http.Response, error) {
	return &http.Response{
		StatusCode: m.StatusCode,
		Body:       io.NopCloser(bytes.NewBufferString(m.ResponseJSON)),
	}, nil
}

func TestLedgerConnector_GetBalance(t *testing.T) {
	mock := &MockHTTPClient{
		StatusCode: 200,
		ResponseJSON: `{
			"balances": [
				{"asset_type": "native", "balance": "150.50"}
			]
		}`,
	}

	lc := &LedgerConnector{
		NetworkURL: "http://mock-horizon",
		Client:     mock,
	}

	balance, err := lc.GetBalance("GDRA...TEST")
	if err != nil {
		t.Fatalf("GetBalance failed: %v", err)
	}

	if balance != 150.50 {
		t.Errorf("Expected balance 150.50, got %.2f", balance)
	}
}

func TestLedgerConnector_VerifyPiTransaction(t *testing.T) {
	// The mock now mirrors the PiPayment shape returned by the Pi Platform
	// API (api.minepi.com/v2). Both the Horizon-style Client.Get path and
	// the Pi Platform Client.Do path are routed through the same mock so a
	// single canned body answers every request the connector makes.
	mock := &MockHTTPClient{
		StatusCode: 200,
		ResponseJSON: `{
			"identifier": "TX_123",
			"amount": 10.00,
			"from_address": "SENDER_ABC",
			"to_address": "RECEIVER_XYZ",
			"status": {
				"developer_approved": true,
				"transaction_verified": true,
				"developer_completed": false,
				"cancelled": false,
				"user_cancelled": false
			}
		}`,
	}

	lc := &LedgerConnector{
		NetworkURL: "http://mock-horizon",
		Client:     mock,
		PlatformClient: &PiPlatformClient{
			BaseURL: "http://mock-pi-platform",
			APIKey:  "test-key",
			Client:  mock,
		},
	}

	success, sender, err := lc.VerifyPiTransaction("TX_123", "RECEIVER_XYZ", 10.00)
	if err != nil {
		t.Fatalf("Verify failed: %v", err)
	}

	if !success {
		t.Error("Expected transaction verification to succeed")
	}

	if sender != "SENDER_ABC" {
		t.Errorf("Expected sender SENDER_ABC, got %s", sender)
	}
}
