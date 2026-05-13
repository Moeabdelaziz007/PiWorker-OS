package finance

import (
	"testing"
)

/**
 * AMRIKYY LAB :: MEV INTEGRATION TEST
 * PURPOSE: Proves that the MEV Harvester can correctly identify and 
 * trigger arbitrage logic based on real-world price data.
 */

func TestMEVHarvester_AnalyzePath(t *testing.T) {
	lc := NewLedgerConnector("http://mock")
	mev := NewMEVHarvester(lc)

	// Case 1: 5% Spread (Should trigger)
	p1 := PricePoint{Pair: "Pi/USDC", Price: 1.00, Source: "Horizon"}
	p2 := PricePoint{Pair: "Pi/USDC", Price: 1.05, Source: "Dex"}

	profit, trigger := mev.AnalyzePath(p1, p2)
	if !trigger {
		t.Error("Expected 5% spread to trigger MEV logic")
	}
	if profit < 4.5 { // Simple spread check
		t.Errorf("Expected profit around 5%%, got %.2f%%", profit)
	}

	// Case 2: 0.1% Spread (Should NOT trigger)
	p3 := PricePoint{Pair: "Pi/USDC", Price: 1.000, Source: "Horizon"}
	p4 := PricePoint{Pair: "Pi/USDC", Price: 1.001, Source: "Dex"}

	_, trigger2 := mev.AnalyzePath(p3, p4)
	if trigger2 {
		t.Error("Expected 0.1% spread to be ignored")
	}
}

func TestMEVHarvester_ExecuteArbitrage(t *testing.T) {
	// InvokeSoroban does a real HTTP POST; without an injected client this
	// test would dial DNS for "http://mock" and fail in any sandbox/CI env.
	// We swap in the same MockHTTPClient used by the ledger tests and have
	// it return a JSON-RPC success envelope so ExecuteArbitrage can extract
	// a transaction hash deterministically.
	mock := &MockHTTPClient{
		StatusCode: 200,
		ResponseJSON: `{
			"result": {
				"hash": "MOCK_TX_HASH_0xABC",
				"status": "SUCCESS"
			}
		}`,
	}

	lc := NewLedgerConnector("http://mock")
	lc.Client = mock
	mev := NewMEVHarvester(lc)

	p1 := PricePoint{Pair: "Pi/USDC", Price: 1.00}
	p2 := PricePoint{Pair: "Pi/USDC", Price: 1.05}

	txHash, err := mev.ExecuteArbitrage(p1, p2, 100.0)
	if err != nil {
		t.Fatalf("Arbitrage execution failed: %v", err)
	}

	if txHash == "" {
		t.Error("Expected transaction hash from successful arbitrage")
	}
}
