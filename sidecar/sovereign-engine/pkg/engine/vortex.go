package engine

import (
	"fmt"
	"math"
	"sync"
)

// SovereignTreasury tracks reclaimed assets from failed agents.
type SovereignTreasury struct {
	TotalPi float64    `json:"total_pi"`
	mu      sync.Mutex
}

var GlobalTreasury = &SovereignTreasury{TotalPi: 0}

// VortexAction defines the fiscal outcome of a performance evaluation.
type VortexAction string

const (
	ActionNone        VortexAction = "none"
	ActionWarn        VortexAction = "warn"
	ActionCannibalize VortexAction = "cannibalize"
	ActionTerminate   VortexAction = "terminate"
	ActionAwakening   VortexAction = "awakening"
)

// PerformanceResult encapsulates the fiscal and evolutionary outcome.
type PerformanceResult struct {
	IsSolvent         bool         `json:"is_solvent"`
	CannibalizedAmt   float64      `json:"cannibalized_amount"`
	RemainingBudget   float64      `json:"remaining_budget"`
	Action            VortexAction `json:"action"`
	SovereignTreasury float64      `json:"sovereign_treasury"`
}

// ProfitVortex handles Digital Darwinism & Economic Cannibalism logic.
type ProfitVortex struct{}

func (pv *ProfitVortex) EvaluatePerformance(agentID string, actualROI float64, minRequirement float64, currentBudget float64) PerformanceResult {
	GlobalTreasury.mu.Lock()
	defer GlobalTreasury.mu.Unlock()

	// 1. 10x Sovereign Awakening (Pattern 4 Reward)
	if actualROI >= 10.0 {
		rewardGrant := currentBudget * 2.0
		return PerformanceResult{
			IsSolvent:         true,
			CannibalizedAmt:   0,
			RemainingBudget:   currentBudget + rewardGrant,
			Action:            ActionAwakening,
			SovereignTreasury: GlobalTreasury.TotalPi,
		}
	}

	// 2. Economic Cannibalism Check (Pattern 4 Punishment)
	if actualROI < minRequirement {
		severity := (minRequirement - actualROI) / minRequirement

		// Catastrophic Failure (> 50% deficit) -> Total Budget Confiscation
		if severity > 0.5 {
			GlobalTreasury.TotalPi += currentBudget
			return PerformanceResult{
				IsSolvent:         false,
				CannibalizedAmt:   currentBudget,
				RemainingBudget:   0,
				Action:            ActionTerminate,
				SovereignTreasury: GlobalTreasury.TotalPi,
			}
		}

		// Partial Cannibalism
		cannibalized := currentBudget * severity
		GlobalTreasury.TotalPi += cannibalized
		return PerformanceResult{
			IsSolvent:         true,
			CannibalizedAmt:   cannibalized,
			RemainingBudget:   currentBudget - cannibalized,
			Action:            ActionCannibalize,
			SovereignTreasury: GlobalTreasury.TotalPi,
		}
	}

	// 3. Standard Profit Distribution (10% Sovereign Tax)
	profit := currentBudget * (actualROI - 1.0)
	if profit > 0 {
		tax := profit * 0.1
		GlobalTreasury.TotalPi += tax
	}

	return PerformanceResult{
		IsSolvent:         true,
		CannibalizedAmt:   0,
		RemainingBudget:   currentBudget,
		Action:            ActionNone,
		SovereignTreasury: GlobalTreasury.TotalPi,
	}
}

func (t *SovereignTreasury) GetBalance() float64 {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.TotalPi
}

func (t *SovereignTreasury) SetBalance(amt float64) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.TotalPi = amt
}
