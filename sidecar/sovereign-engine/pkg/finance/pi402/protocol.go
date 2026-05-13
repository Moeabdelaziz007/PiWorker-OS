package pi402

import (
	"context"
	"crypto/ed25519"
	"fmt"
	"log"
	"sync"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/finance"
)

/**
 * AMRIKYY LAB :: PI-402 PAYMENT PROTOCOL
 * PURPOSE: Sovereign micro-transaction engine for autonomous agents.
 */

type Pi402Engine struct {
	Ledger      *finance.LedgerConnector
	ActiveWallets sync.Map // map[string]*AgentSubWallet
}

func NewPi402Engine(ledger *finance.LedgerConnector) *Pi402Engine {
	return &Pi402Engine{
		Ledger: ledger,
	}
}

// ProcessPayment executes a micro-transaction on-chain via Soroban.
func (e *Pi402Engine) ProcessPayment(ctx context.Context, agentID string, target string, amount float64, memo string) (string, error) {
	log.Printf("💰 [Pi-402] Processing micro-payment: %s -> %s (%.4f Pi)", agentID, target, amount)

	// 1. Invoke Soroban Smart Contract for Instant Settlement
	// Using the standard 'transfer_agentic' function established in Phase 35
	txHash, err := e.Ledger.InvokeSoroban(
		"CC402_PI_AGENT_HUB", // Sovereign Agent Hub Contract
		"transfer_agentic",
		[]interface{}{agentID, target, amount, memo},
	)

	if err != nil {
		return "", fmt.Errorf("SOROBAN_SETTLEMENT_FAILED: %v", err)
	}

	log.Printf("✅ [Pi-402] Settlement confirmed: %s", txHash)
	return txHash, nil
}

// AuthorizeWallet initializes an agent's sub-wallet from a master seed.
func (e *Pi402Engine) AuthorizeWallet(masterSeed []byte, agentID string) (*AgentSubWallet, error) {
	sw, err := DeriveAgentKey(masterSeed, agentID)
	if err != nil {
		return nil, err
	}

	e.ActiveWallets.Store(agentID, sw)
	return sw, nil
}

// VerifyAgentSignature ensures the transaction was signed by the agent's
// unique ed25519 key. Returns false on any of: unknown agent, missing
// public key, malformed map entry, or invalid signature. Callers MUST
// gate payout/authorization on a true return.
func (e *Pi402Engine) VerifyAgentSignature(agentID string, message []byte, signature []byte) bool {
	val, ok := e.ActiveWallets.Load(agentID)
	if !ok {
		return false
	}
	wallet, ok := val.(*AgentSubWallet)
	if !ok || wallet == nil {
		// Defensive: the map should never contain anything else, but
		// a wrong type or nil entry must never silently authorize a
		// signature.
		return false
	}
	// ed25519.Verify panics (not just returns false) when the public key
	// length is anything other than ed25519.PublicKeySize (32 bytes), so
	// reject every wrong-length key before dispatching the verification.
	if len(wallet.PublicKey) != ed25519.PublicKeySize {
		return false
	}
	return ed25519.Verify(wallet.PublicKey, message, signature)
}
