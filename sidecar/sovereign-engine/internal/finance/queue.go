package finance

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

/**
 * AMRIKYY LAB :: SOVEREIGN FISCAL QUEUE
 * PURPOSE: Local JSON-based persistence for pending transactions.
 * Ensures financial durability during network interruptions or sidecar restarts.
 */

type QueuedTx struct {
	ID        string    `json:"id"`
	AgentID   string    `json:"agent_id"`
	Amount    float64   `json:"amount"`
	Target    string    `json:"target"`
	Timestamp time.Time `json:"timestamp"`
	Status    string    `json:"status"` // PENDING, CONFIRMED, FAILED
}

type FiscalQueue struct {
	mu       sync.Mutex
	dataDir  string
	filePath string
}

func NewFiscalQueue(dataDir string) (*FiscalQueue, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}
	
	return &FiscalQueue{
		dataDir:  dataDir,
		filePath: filepath.Join(dataDir, "pending_tx.json"),
	}, nil
}

// Push adds a new transaction to the queue.
func (q *FiscalQueue) Push(tx QueuedTx) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	existing, _ := q.loadAll()
	existing = append(existing, tx)
	
	return q.saveAll(existing)
}

// UpdateStatus changes the status of a specific transaction.
func (q *FiscalQueue) UpdateStatus(id string, status string) error {
	q.mu.Lock()
	defer q.mu.Unlock()

	txs, err := q.loadAll()
	if err != nil {
		return err
	}

	for i := range txs {
		if txs[i].ID == id {
			txs[i].Status = status
			break
		}
	}

	return q.saveAll(txs)
}

func (q *FiscalQueue) loadAll() ([]QueuedTx, error) {
	data, err := os.ReadFile(q.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []QueuedTx{}, nil
		}
		return nil, err
	}

	var txs []QueuedTx
	err = json.Unmarshal(data, &txs)
	return txs, err
}

func (q *FiscalQueue) saveAll(txs []QueuedTx) error {
	data, err := json.MarshalIndent(txs, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(q.filePath, data, 0644)
}

// GetPending returns all transactions that haven't been confirmed yet.
func (q *FiscalQueue) GetPending() ([]QueuedTx, error) {
	all, err := q.loadAll()
	if err != nil {
		return nil, err
	}
	
	var pending []QueuedTx
	for _, tx := range all {
		if tx.Status == "PENDING" {
			pending = append(pending, tx)
		}
	}
	return pending, nil
}
