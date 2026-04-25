package diplomacy

import (
	"fmt"
)

/**
 * BridgeInterface - The Diplomatic Attaché of PiWorker-OS.
 * Treats external blockchains as 'Foreign States'.
 */

type ForeignState string

const (
	Solana ForeignState = "Solana"
	Base   ForeignState = "Base"
	PiNet  ForeignState = "PiNetwork"
)

type BridgeRequest struct {
	Target  ForeignState
	Asset   string
	Amount  float64
	VisaID  string // Sovereign approval ID
}

type BridgeInterface struct {
	ActiveStates []ForeignState
}

// NewDiplomaticAttaché initializes the bridge interface.
func NewDiplomaticAttaché() *BridgeInterface {
	return &BridgeInterface{
		ActiveStates: []ForeignState{Solana, Base, PiNet},
	}
}

// RequestExitVisa processes a transfer request to a foreign state.
func (bi *BridgeInterface) RequestExitVisa(req BridgeRequest) (string, error) {
	fmt.Printf("[DIPLOMACY] Requesting Exit Visa for %f %s to %s\n", req.Amount, req.Asset, req.Target)
	
	// Check if Target is a recognized foreign state
	recognized := false
	for _, state := range bi.ActiveStates {
		if state == req.Target {
			recognized = true
			break
		}
	}

	if !recognized {
		return "", fmt.Errorf("[DIPLOMACY] State %s is not recognized by PiWorker-OS", req.Target)
	}

	// In production, this triggers the specific chain bridge logic.
	txID := fmt.Sprintf("pi-visa-%s-%s", req.Target, req.VisaID)
	fmt.Printf("[DIPLOMACY] Visa Granted. TXID: %s\n", txID)
	
	return txID, nil
}
