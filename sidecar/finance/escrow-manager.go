package finance

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// EscrowStatus represents the state of a financial transaction
type EscrowStatus string

const (
	StatusPending   EscrowStatus = "PENDING"
	StatusLocked    EscrowStatus = "LOCKED"
	StatusReleased  EscrowStatus = "RELEASED"
	StatusRefunded  EscrowStatus = "REFUNDED"
)

// Transaction represents a sovereign financial operation
type Transaction struct {
	ID        string
	AgentID   string
	AmountPi  float64
	Status    EscrowStatus
	CreatedAt time.Time
}

// EscrowManager handles high-speed financial security
type EscrowManager struct {
	mu           sync.RWMutex
	transactions map[string]*Transaction
}

func NewEscrowManager() *EscrowManager {
	return &EscrowManager{
		transactions: make(map[string]*Transaction),
	}
}

// LockFunds secures Pi coins in a virtual escrow for an agent task
func (em *EscrowManager) LockFunds(ctx context.Context, txID string, agentID string, amount float64) error {
	em.mu.Lock()
	defer em.mu.Unlock()

	if _, exists := em.transactions[txID]; exists {
		return fmt.Errorf("transaction %s already exists", txID)
	}

	em.transactions[txID] = &Transaction{
		ID:        txID,
		AgentID:   agentID,
		AmountPi:  amount,
		Status:    StatusLocked,
		CreatedAt: time.Now(),
	}

	fmt.Printf("🔒 [Escrow] Funds Locked: %.4f Pi for Agent %s (TX: %s)\n", amount, agentID, txID)
	return nil
}

// ReleaseFunds completes the payment once the 'Critic' agent approves the work
func (em *EscrowManager) ReleaseFunds(txID string) (float64, error) {
	em.mu.Lock()
	defer em.mu.Unlock()

	tx, exists := em.transactions[txID]
	if !exists {
		return 0, fmt.Errorf("transaction %s not found", txID)
	}

	if tx.Status != StatusLocked {
		return 0, fmt.Errorf("transaction %s is not in LOCKED state", txID)
	}

	tx.Status = StatusReleased
	fmt.Printf("💸 [Escrow] Funds Released: %.4f Pi (TX: %s)\n", tx.AmountPi, txID)
	return tx.AmountPi, nil
}

// AuditTrail returns the history of transactions for a specific agent
func (em *EscrowManager) AuditTrail(agentID string) []*Transaction {
	em.mu.RLock()
	defer em.mu.RUnlock()

	var history []*Transaction
	for _, tx := range em.transactions {
		if tx.AgentID == agentID {
			history = append(history, tx)
		}
	}
	return history
}
