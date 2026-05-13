package engine

import (
	"encoding/json"
	"log"
	"os"
	"sync"
	"time"
)

/**
 * AMRIKYY LAB :: SOVEREIGN JOURNAL (Durable Execution Bridge)
 * PURPOSE: Append-only log for recording state transitions.
 * Ensures the "Muscle" (Go) can resume tasks after a power failure or process crash.
 * This is our "Clean Room" alternative to DBOS in restricted environments.
 */

type JournalEntry struct {
	ID        string      `json:"id"`
	Type      string      `json:"type"`      // BEGIN, COMMIT, FAIL
	Namespace string      `json:"namespace"` // payment, simulation, agent_spawn
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

type SovereignJournal struct {
	mu       sync.Mutex
	filePath string
}

func NewSovereignJournal(path string) (*SovereignJournal, error) {
	// Ensure file exists
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}
	f.Close()

	return &SovereignJournal{filePath: path}, nil
}

func (j *SovereignJournal) log(entry JournalEntry) error {
	j.mu.Lock()
	defer j.mu.Unlock()

	entry.Timestamp = time.Now()
	bytes, err := json.Marshal(entry)
	if err != nil {
		return err
	}

	f, err := os.OpenFile(j.filePath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.Write(append(bytes, '\n'))
	return err
}

func (j *SovereignJournal) Begin(id, ns string, data interface{}) error {
	return j.log(JournalEntry{ID: id, Type: "BEGIN", Namespace: ns, Data: data})
}

func (j *SovereignJournal) Commit(id, ns string) error {
	return j.log(JournalEntry{ID: id, Type: "COMMIT", Namespace: ns})
}

func (j *SovereignJournal) Fail(id, ns, reason string) error {
	return j.log(JournalEntry{ID: id, Type: "FAIL", Namespace: ns, Data: map[string]string{"reason": reason}})
}

// GetActiveCount returns the number of intents currently in flight,
// defined as entries with a BEGIN log line that have no matching
// COMMIT or FAIL entry yet. Used by the HTTP bridge to render the
// 'active_intents' field on /api/status.
func (j *SovereignJournal) GetActiveCount() int {
	entries, err := j.Replay()
	if err != nil {
		return 0
	}
	// Tally per (id, namespace) tuple: +1 on BEGIN, -1 on COMMIT/FAIL.
	// Any tuple still at +1 after the scan is an in-flight intent.
	type key struct{ id, ns string }
	tally := make(map[key]int, len(entries))
	for _, e := range entries {
		k := key{e.ID, e.Namespace}
		switch e.Type {
		case "BEGIN":
			tally[k]++
		case "COMMIT", "FAIL":
			tally[k]--
		}
	}
	active := 0
	for _, v := range tally {
		if v > 0 {
			active++
		}
	}
	return active
}

func (j *SovereignJournal) Replay() ([]JournalEntry, error) {
	j.mu.Lock()
	defer j.mu.Unlock()

	f, err := os.Open(j.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []JournalEntry{}, nil
		}
		return nil, err
	}
	defer f.Close()

	var entries []JournalEntry
	decoder := json.NewDecoder(f)
	for decoder.More() {
		var entry JournalEntry
		if err := decoder.Decode(&entry); err != nil {
			log.Printf("⚠️ [Journal] Skipping corrupted entry: %v", err)
			continue
		}
		entries = append(entries, entry)
	}

	// Filter for unfinished intents
	// A simple implementation: return all "BEGIN" without a corresponding "COMMIT" or "FAIL"
	activeMap := make(map[string]JournalEntry)
	for _, e := range entries {
		switch e.Type {
		case "BEGIN":
			activeMap[e.ID] = e
		case "COMMIT", "FAIL":
			delete(activeMap, e.ID)
		}
	}

	var active []JournalEntry
	for _, e := range activeMap {
		active = append(active, e)
	}

	return active, nil
}
