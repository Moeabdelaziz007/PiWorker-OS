package engine

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/Moeabdelaziz007/PiWorker-OS/sovereign-engine/internal/bridge"
)

// Persona types from legacy v1
const (
	PersonaBull         = "Bull"
	PersonaBear         = "Bear"
	PersonaChaos        = "Chaos"
	PersonaConservative = "Conservative"
	PersonaAggressive   = "Aggressive"
)

type SimulationResult struct {
	Persona    string
	Score      float32
	Reasoning  string
	RevenueUSD float32
}

type QuantumMirror struct {
	mu           sync.Mutex
	geminiClient *bridge.GeminiClient
}

func NewQuantumMirror(gc *bridge.GeminiClient) *QuantumMirror {
	return &QuantumMirror{
		geminiClient: gc,
	}
}

// Simulate runs parallel simulations using a controlled Worker Pool.
func (qm *QuantumMirror) Simulate(ctx context.Context, goal string, instances int) ([]SimulationResult, error) {
	results := make([]SimulationResult, 0, instances)
	resultChan := make(chan SimulationResult, instances)
	errChan := make(chan error, instances)
	
	personas := []string{PersonaBull, PersonaBear, PersonaChaos, PersonaConservative, PersonaAggressive}

	// Dynamic Concurrency Control
	maxWorkers := 10 // Restricted for AI calls to prevent rate limiting
	if instances < maxWorkers {
		maxWorkers = instances
	}

	var wg sync.WaitGroup
	semaphore := make(chan struct{}, maxWorkers)

	for i := 0; i < instances; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			semaphore <- struct{}{}        // Acquire
			defer func() { <-semaphore }() // Release
			
			select {
			case <-ctx.Done():
				return
			default:
				persona := personas[idx%len(personas)]
				res, err := qm.executeSim(ctx, persona, goal)
				if err != nil {
					errChan <- err
					return
				}
				resultChan <- res
			}
		}(i)
	}

	// Wait in a separate goroutine to close channels
	go func() {
		wg.Wait()
		close(resultChan)
		close(errChan)
	}()

	// Collector loop
	for {
		select {
		case res, ok := <-resultChan:
			if !ok {
				return results, nil
			}
			results = append(results, res)
		case err := <-errChan:
			if err != nil {
				return results, err
			}
		case <-ctx.Done():
			return results, fmt.Errorf("simulation interrupted")
		}
	}
}

func (qm *QuantumMirror) executeSim(ctx context.Context, persona string, goal string) (SimulationResult, error) {
	// 1. Get AI Reasoning from Gemini
	reasoning, err := qm.geminiClient.AnalyzeSimulationGoal(ctx, goal, persona)
	if err != nil {
		return SimulationResult{}, err
	}

	// 2. Derive Score from Reasoning (Mocked logic for now, in production we use NLP to score)
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	baseScore := r.Float32()
	
	// Adjust revenue simulation based on persona
	revenue := baseScore * 100.0

	return SimulationResult{
		Persona:    persona,
		Score:      baseScore,
		Reasoning:  reasoning,
		RevenueUSD: revenue,
	}, nil
}

