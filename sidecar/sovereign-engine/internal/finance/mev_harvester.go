package finance

import (
	"fmt"
	"log"
	"math"
	"sync"
)

/**
 * AMRIKYY LAB :: MEV HARVESTER (Sovereign Arbitrage Engine)
 * PURPOSE: Monitors the Pi/Stellar SDEX for price discrepancies and executes 
 * atomic path payments to capture risk-free profit (ROI).
 * This transforms "cinematic terminology" into verifiable financial behavior.
 */

type PricePoint struct {
	Pair   string
	Price  float64
	Source string
}

type MEVHarvester struct {
	mu           sync.RWMutex
	ledger       *LedgerConnector
	active       bool
	minProfitPct float64
}

func NewMEVHarvester(lc *LedgerConnector) *MEVHarvester {
	return &MEVHarvester{
		ledger:       lc,
		minProfitPct: 1.0, // 1% Minimum Profit to trigger
	}
}

// AnalyzePath checks for arbitrage opportunities between two asset pairs.
func (m *MEVHarvester) AnalyzePath(p1, p2 PricePoint) (float64, bool) {
	if p1.Pair != p2.Pair {
		return 0, false
	}

	diff := math.Abs(p1.Price - p2.Price)
	avg := (p1.Price + p2.Price) / 2
	profitPct := (diff / avg) * 100

	if profitPct >= m.minProfitPct {
		log.Printf("🚀 [MEV] Opportunity detected: %s (%.2f%% spread)", p1.Pair, profitPct)
		return profitPct, true
	}

	return profitPct, false
}

// ExecuteArbitrage triggers a native Path Payment on the Pi Network.
func (m *MEVHarvester) ExecuteArbitrage(p1, p2 PricePoint, amount float64) (string, error) {
	log.Printf("⚖️ [MEV] Executing Atomic Arbitrage for %.2f on %s", amount, p1.Pair)
	
	// In production, this would use InvokeSoroban or a specific PathPaymentOp
	txHash, err := m.ledger.InvokeSoroban("ARBITRAGE_CONTRACT_0x", "execute", []interface{}{p1.Source, p2.Source, amount})
	if err != nil {
		return "", fmt.Errorf("MEV_EXECUTION_FAILED: %v", err)
	}

	return txHash, nil
}
