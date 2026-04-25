package finance

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/engine"
)

func TestStagingRollbackMaintainsDataAndQueueConsistency(t *testing.T) {
	tempDir := t.TempDir()

	queue, err := NewFiscalQueue(filepath.Join(tempDir, "fiscal"))
	if err != nil {
		t.Fatalf("failed to initialize fiscal queue: %v", err)
	}

	journal, err := engine.NewSovereignJournal(filepath.Join(tempDir, "sovereign.journal"))
	if err != nil {
		t.Fatalf("failed to initialize journal: %v", err)
	}

	tx := QueuedTx{
		ID:        "tx_staging_rollback_001",
		AgentID:   "AGENT_SOVEREIGN",
		Amount:    42.5,
		Target:    "recipient_test",
		Timestamp: time.Now().UTC().Truncate(time.Second),
		Status:    "PENDING",
	}

	if err := queue.Push(tx); err != nil {
		t.Fatalf("failed to enqueue tx: %v", err)
	}

	if err := journal.Begin(tx.ID, "payment", tx); err != nil {
		t.Fatalf("failed to create begin journal entry: %v", err)
	}

	activeBeforeRollback, err := journal.Replay()
	if err != nil {
		t.Fatalf("replay before rollback failed: %v", err)
	}
	if len(activeBeforeRollback) != 1 {
		t.Fatalf("expected one active journal entry before rollback, got %d", len(activeBeforeRollback))
	}

	// Simulate rollback execution in staging.
	if err := queue.UpdateStatus(tx.ID, "FAILED"); err != nil {
		t.Fatalf("failed to mark queued tx as failed during rollback: %v", err)
	}
	if err := journal.Fail(tx.ID, "payment", "staging rollback executed after deploy failure"); err != nil {
		t.Fatalf("failed to create fail journal entry during rollback: %v", err)
	}

	activeAfterRollback, err := journal.Replay()
	if err != nil {
		t.Fatalf("replay after rollback failed: %v", err)
	}
	if len(activeAfterRollback) != 0 {
		t.Fatalf("expected no active journal entries after rollback, got %d", len(activeAfterRollback))
	}

	pendingAfterRollback, err := queue.GetPending()
	if err != nil {
		t.Fatalf("failed to list pending queue entries: %v", err)
	}
	if len(pendingAfterRollback) != 0 {
		t.Fatalf("expected no pending queue entries after rollback, got %d", len(pendingAfterRollback))
	}

	allTxs, err := queue.loadAll()
	if err != nil {
		t.Fatalf("failed to read all queue entries: %v", err)
	}
	if len(allTxs) != 1 {
		t.Fatalf("expected exactly one queue record after rollback, got %d", len(allTxs))
	}

	restored := allTxs[0]
	if restored.ID != tx.ID {
		t.Fatalf("queue consistency violation: id changed from %q to %q", tx.ID, restored.ID)
	}
	if restored.Amount != tx.Amount {
		t.Fatalf("queue consistency violation: amount changed from %.4f to %.4f", tx.Amount, restored.Amount)
	}
	if restored.Target != tx.Target {
		t.Fatalf("queue consistency violation: target changed from %q to %q", tx.Target, restored.Target)
	}
	if restored.Status != "FAILED" {
		t.Fatalf("expected rolled back tx status FAILED, got %q", restored.Status)
	}
}
