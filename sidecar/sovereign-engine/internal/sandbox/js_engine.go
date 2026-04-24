package sandbox

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/robertkrimen/otto"
)

// NeuralSandbox provides isolated JS execution using the Otto engine.
type NeuralSandbox struct {
	timeout time.Duration
}

func NewNeuralSandbox(timeout time.Duration) *NeuralSandbox {
	if timeout == 0 {
		timeout = 5 * time.Second
	}
	return &NeuralSandbox{timeout: timeout}
}

// Execute runs the provided JS source code in a restricted Otto isolate.
func (ns *NeuralSandbox) Execute(ctx context.Context, source string, env map[string]string, capabilities []string) (string, error) {
	vm := otto.New()
	
	// 🛡️ [SECURITY] Pre-emptively initialize Interrupt channel (Ring 3 Hardening)
	vm.Interrupt = make(chan func(), 1)

	// Helper to check for capability
	hasCap := func(c string) bool {
		for _, cap := range capabilities {
			if cap == c {
				return true
			}
		}
		return false
	}

	// Inject Environment Variables
	for k, v := range env {
		vm.Set(k, v)
	}

	// 🔒 [SECURITY] Disable dangerous globals (Ring 5 Lockdown)
	if !hasCap("NETWORK_ACCESS") {
		vm.Set("net", nil)
		vm.Set("http", nil)
		vm.Set("fetch", nil)
	}
	
	vm.Set("os", nil)
	vm.Set("fs", nil)
	vm.Set("process", nil)
	vm.Set("require", nil)

	// Result channel
	type result struct {
		val string
		err error
	}
	resChan := make(chan result, 1)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				resChan <- result{err: fmt.Errorf("neural isolation failure: %v", r)}
			}
		}()

		// Run the script
		value, err := vm.Run(source)
		if err != nil {
			resChan <- result{err: err}
			return
		}

		// Convert result to JSON string
		export, _ := value.Export()
		jsonRes, _ := json.Marshal(export)
		resChan <- result{val: string(jsonRes)}
	}()

	// Wait for completion or timeout
	select {
	case res := <-resChan:
		return res.val, res.err
	case <-time.After(ns.timeout):
		// 🛠️ Hard Lockdown: Interrupt the VM
		vm.Interrupt <- func() {
			panic("SOVEREIGN_SANDBOX_TIMEOUT_BREACH")
		}
		return "", fmt.Errorf("neural isolation timeout breach: %v exceeded", ns.timeout)
	case <-ctx.Done():
		return "", ctx.Err()
	}
}
