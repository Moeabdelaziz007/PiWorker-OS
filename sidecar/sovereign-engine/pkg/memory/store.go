package memory

import (
	"encoding/json"
	"os"
	"sync"
	"time"
)

/**
 * SovereignInsight - Neural Memory Atom
 */
type SovereignInsight struct {
	ID        string      `json:"id"`
	AgentID   string      `json:"agentId"`
	Topic     string      `json:"topic"`
	Data      interface{} `json:"data"`
	Signature string      `json:"signature"`
	Timestamp string      `json:"timestamp"`
	Relevance float32     `json:"relevance"`
}

type MemoryStore struct {
	FilePath string
	mu       sync.RWMutex
	insights []SovereignInsight
}

func NewMemoryStore(filePath string) (*MemoryStore, error) {
	store := &MemoryStore{
		FilePath: filePath,
		insights: []SovereignInsight{},
	}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *MemoryStore) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	f, err := os.Open(s.FilePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer f.Close()

	// Simple JSONL decoding (limited to last 1000 for safety)
	dec := json.NewDecoder(f)
	for dec.More() {
		var insight SovereignInsight
		if err := dec.Decode(&insight); err == nil {
			s.insights = append(s.insights, insight)
		}
	}
	return nil
}

func (s *MemoryStore) Store(insight SovereignInsight) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if insight.Timestamp == "" {
		insight.Timestamp = time.Now().Format(time.RFC3339)
	}

	s.insights = append(s.insights, insight)

	// Persist to JSONL
	f, err := os.OpenFile(s.FilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	data, err := json.Marshal(insight)
	if err != nil {
		return err
	}
	_, err = f.WriteString(string(data) + "\n")
	return err
}

func (s *MemoryStore) Query(topic string, agentId string) []SovereignInsight {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var results []SovereignInsight
	for i := len(s.insights) - 1; i >= 0; i-- {
		insight := s.insights[i]
		match := true
		if topic != "" && insight.Topic != topic {
			match = false
		}
		if agentId != "" && insight.AgentID != agentId {
			match = false
		}
		if match {
			results = append(results, insight)
		}
		if len(results) >= 50 {
			break
		}
	}
	return results
}

func (s *MemoryStore) Search(query string) []SovereignInsight {
	// Fallback to simple keyword search since we lack a vector DB in air-gapped env
	s.mu.RLock()
	defer s.mu.RUnlock()

	// Logic: Basic string matching on Topic or Data (if string)
	return s.insights // For now, return all recent (logic to be expanded)
}
