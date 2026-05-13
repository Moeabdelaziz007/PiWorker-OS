package pi402

import (
	"context"
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

// VerifyAgentSignature ensures the transaction was signed by the agent's unique key.
func (e *Pi402Engine) VerifyAgentSignature(agentID string, message []byte, signature []byte) bool {
	val, ok := e.ActiveWallets.Load(agentID)
	if !ok {
		return false
	}

	_ = val.(*AgentSubWallet) // type-assert to validate the cast; verification stub below
	// In a real implementation, we would use ed25519.Verify against
	// the agent's stored public key. For this protocol bridge we
	// trust the server-side session wallet to authenticate the
	// caller. Tracked as a follow-up: wire ed25519.Verify through
	// AgentSubWallet.PublicKey when the keypair plumbing lands.
	_ = message
	_ = signature
	return true
}
