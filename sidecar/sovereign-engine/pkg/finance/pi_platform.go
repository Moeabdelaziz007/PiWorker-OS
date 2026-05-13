package finance

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

/**
 * AMRIKYY LAB :: PI PLATFORM CLIENT (V2)
 * PURPOSE: Secure server-side interaction with the Pi Network Platform API.
 * Following official Pi Developer patterns for Approve/Complete flows.
 */

type PiPayment struct {
	Identifier string  `json:"identifier"`
	Amount     float64 `json:"amount"`
	Memo       string  `json:"memo"`
	Metadata   string  `json:"metadata"`
	From       string  `json:"from_address"`
	To         string  `json:"to_address"`
	Status     struct {
		DeveloperApproved bool `json:"developer_approved"`
		TransactionVerified bool `json:"transaction_verified"`
		DeveloperCompleted bool `json:"developer_completed"`
		Cancelled          bool `json:"cancelled"`
		UserCancelled      bool `json:"user_cancelled"`
	} `json:"status"`
}

type PiPlatformClient struct {
	BaseURL string
	APIKey  string
	Client  HTTPDoer
}

func NewPiPlatformClient() *PiPlatformClient {
	return &PiPlatformClient{
		BaseURL: "https://api.minepi.com/v2",
		APIKey:  os.Getenv("PI_API_KEY"),
		Client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// GetPayment retrieves the full state of a payment from Pi servers.
// Honors ctx cancellation and deadlines on the outbound HTTP call.
func (pc *PiPlatformClient) GetPayment(ctx context.Context, paymentID string) (*PiPayment, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("%s/payments/%s", pc.BaseURL, paymentID), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Key "+pc.APIKey)

	resp, err := pc.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pi api error: status %d", resp.StatusCode)
	}

	var payment PiPayment
	if err := json.NewDecoder(resp.Body).Decode(&payment); err != nil {
		return nil, err
	}
	return &payment, nil
}

// ApprovePayment notifies Pi servers that the app acknowledges the payment.
// Honors ctx cancellation and deadlines on the outbound HTTP call.
func (pc *PiPlatformClient) ApprovePayment(ctx context.Context, paymentID string) error {
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/payments/%s/approve", pc.BaseURL, paymentID), nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Key "+pc.APIKey)

	resp, err := pc.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("approval failed: status %d", resp.StatusCode)
	}
	return nil
}

// CompletePayment finalizes the payment in the Pi ecosystem after blockchain submission.
// Honors ctx cancellation and deadlines on the outbound HTTP call.
func (pc *PiPlatformClient) CompletePayment(ctx context.Context, paymentID string, txid string) error {
	payload, _ := json.Marshal(map[string]string{"txid": txid})
	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/payments/%s/complete", pc.BaseURL, paymentID), bytes.NewBuffer(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Key "+pc.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := pc.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("completion failed: status %d", resp.StatusCode)
	}
	return nil
}
