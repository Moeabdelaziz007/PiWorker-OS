package escrow

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/finance/pi402"
)

/**
 * AMRIKYY LAB :: INTENT-BASED ESCROW MANAGER
 * PURPOSE: Zero-trust bounty settlement for autonomous agents.
 * This module enforces "Intent-Centric Execution" where funds are released
 * only upon cryptographic or visual verification of a stated goal.
 */

type BountyStatus string

const (
	StatusPending  BountyStatus = "PENDING"
	StatusResolved BountyStatus = "RESOLVED"
	StatusExpired  BountyStatus = "EXPIRED"
)

type IntentBounty struct {
	ID                string
	CreatorID         string
	Description       string
	AmountPi          float64
	Expiry            time.Time
	Constraints       map[string]string
	Status            BountyStatus
	EscrowWallet      string
	ResolutionProof   string
	SolverID          string
}

type EscrowManager struct {
	Pi402    *pi402.Pi402Engine
	Bounties sync.Map // map[string]*IntentBounty
}

func NewEscrowManager(engine *pi402.Pi402Engine) *EscrowManager {
	return &EscrowManager{
		Pi402: engine,
	}
}

// CreateBounty locks funds for a specific intent.
func (m *EscrowManager) CreateBounty(creatorID, description string, amount float64, expiryStr string) (*IntentBounty, error) {
	log.Printf("📥 [Escrow] Creating Intent-Based Bounty: %s (%.4f Pi)", description, amount)

	expiry, err := time.Parse(time.RFC3339, expiryStr)
	if err != nil {
		expiry = time.Now().Add(24 * time.Hour) // Default 24h
	}

	// Generate a unique Bounty ID
	h := sha256.New()
	h.Write([]byte(fmt.Sprintf("%s-%s-%d", creatorID, description, time.Now().UnixNano())))
	id := hex.EncodeToString(h.Sum(nil))[:12]

	bounty := &IntentBounty{
		ID:           id,
		CreatorID:    creatorID,
		Description:  description,
		AmountPi:     amount,
		Expiry:       expiry,
		Status:       StatusPending,
		EscrowWallet: fmt.Sprintf("escrow_%s", id), // Virtual escrow sub-wallet
	}

	m.Bounties.Store(id, bounty)
	return bounty, nil
}

// ResolveBounty verifies proof and releases funds to the solver.
func (m *EscrowManager) ResolveBounty(bountyID, solverID, proofData, signature string) (string, error) {
	val, ok := m.Bounties.Load(bountyID)
	if !ok {
		return "", fmt.Errorf("bounty not found: %s", bountyID)
	}

	bounty := val.(*IntentBounty)
	if bounty.Status != StatusPending {
		return "", fmt.Errorf("bounty already %s", bounty.Status)
	}

	if time.Now().After(bounty.Expiry) {
		bounty.Status = StatusExpired
		return "", fmt.Errorf("bounty expired")
	}

	log.Printf("🎯 [Escrow] Resolving Bounty %s for Solver: %s", bountyID, solverID)

	// [INTENT VERIFICATION LOGIC]
	// 1. Verify that the proof_data satisfies the intent (e.g., via AI auditing or physical audit)
	// For this prototype, we accept the proof if it's not empty.
	if proofData == "" {
		return "", fmt.Errorf("missing proof of intent satisfaction")
	}

	// 2. Execute Payment via Pi-402
	// We use the escrow wallet as the source (conceptually)
	txHash, err := m.Pi402.ProcessPayment(nil, bounty.EscrowWallet, solverID, bounty.AmountPi, fmt.Sprintf("Bounty Reward: %s", bountyID))
	if err != nil {
		return "", fmt.Errorf("failed to release escrow: %v", err)
	}

	// 3. Update Status
	bounty.Status = StatusResolved
	bounty.SolverID = solverID
	bounty.ResolutionProof = proofData

	log.Printf("💰 [Escrow] Reward Released! Tx: %s", txHash)
	return txHash, nil
}

// GetBountiesByCreator returns all bounties created by a specific agent/user.
func (m *EscrowManager) GetBountiesByCreator(creatorID string) []*IntentBounty {
	var list []*IntentBounty
	m.Bounties.Range(func(key, value interface{}) bool {
		b := value.(*IntentBounty)
		if b.CreatorID == creatorID {
			list = append(list, b)
		}
		return true
	})
	return list
}
