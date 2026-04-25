package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

/**
 * AMRIKYY LAB :: THE SOVEREIGN MAESTRO (dev.go)
 * PURPOSE: A high-fidelity, zero-trust process manager for local development.
 * It orchestrates Next.js, the Go Engine, and PocketBase as a "Parallel Environment".
 */

const (
	ColorReset  = "\033[0m"
	ColorRed    = "\033[31m"
	ColorGreen  = "\033[32m"
	ColorYellow = "\033[33m"
	ColorBlue   = "\033[34m"
	ColorCyan   = "\033[36m"
)

type Service struct {
	Name    string
	Command string
	Args    []string
	Dir     string
	Color   string
}

func main() {
	fmt.Printf("%s🚀 [Maestro] Igniting Parallel Sovereign Environment...%s\n", ColorCyan, ColorReset)

	// Validate Critical Env Vars
	requiredEnv := []string{"SOVEREIGN_AUTH_TOKEN", "AGENT_SYSTEM_SECRET"}
	for _, env := range requiredEnv {
		if os.Getenv(env) == "" {
			fmt.Printf("%s⚠️  [Maestro] Warning: %s is not set. Some features may be locked.%s\n", ColorYellow, env, ColorReset)
		}
	}

	services := []Service{
		{
			Name:    "BRAIN (Next.js)",
			Command: "npm",
			Args:    []string{"run", "dev"},
			Dir:     ".",
			Color:   ColorBlue,
		},
		{
			Name:    "MUSCLE (Go Engine)",
			Command: "go",
			Args:    []string{"run", "sidecar/sovereign-engine/main.go"},
			Dir:     ".",
			Color:   ColorGreen,
		},
		{
			Name:    "DATA (PocketBase)",
			Command: "pocketbase",
			Args:    []string{"serve"},
			Dir:     ".",
			Color:   ColorCyan,
		},
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle OS Signals (Ctrl+C)
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		fmt.Printf("\n%s🛑 [Maestro] Shutdown signal received. Terminating all services...%s\n", ColorRed, ColorReset)
		cancel()
	}()

	var wg sync.WaitGroup

	for _, s := range services {
		wg.Add(1)
		go func(svc Service) {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				default:
					runService(ctx, svc)
					if ctx.Err() != nil {
						return
					}
					fmt.Printf("%s⚠️  [Maestro] %s service exited. Restarting in 3s...%s\n", ColorYellow, svc.Name, ColorReset)
					time.Sleep(3 * time.Second)
				}
			}
		}(s)
	}

	// Wait for all services or shutdown
	wg.Wait()
	fmt.Printf("%s✨ [Maestro] All services terminated. Sovereign state offline.%s\n", ColorCyan, ColorReset)
}

func runService(ctx context.Context, svc Service) {
	fmt.Printf("%s⚡ [Maestro] Starting %s...%s\n", svc.Color, svc.Name, ColorReset)
	cmd := exec.CommandContext(ctx, svc.Command, svc.Args...)
	cmd.Dir = svc.Dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Set process group ID to ensure child processes are killed on exit (Unix only)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		log.Printf("%s❌ [Maestro] Failed to start %s: %v%s", ColorRed, svc.Name, err, ColorReset)
		return
	}

	// Wait for process to finish
	err := cmd.Wait()
	if err != nil && ctx.Err() == nil {
		log.Printf("%s⚠️  [Maestro] %s exited with error: %v%s", ColorYellow, svc.Name, err, ColorReset)
	}
}
