package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/config"
	"github.com/Moeabdelaziz007/PiWorker-OS/sidecar/sovereign-engine/pkg/crypto"
)

/**
 * AMRIKYY LAB :: SOVEREIGN CLI (piworker-pro)
 * Mission: Zero-Defect Orchestration for the Sovereign Agent Economy.
 */

func main() {
	cfg := config.Load()

	// Global Flags
	jsonOutput := flag.Bool("json", false, "Output results in JSON format")
	verbose := flag.Bool("v", false, "Enable verbose logging")
	flag.Parse()

	if flag.NArg() < 1 {
		printUsage()
		return
	}

	command := flag.Arg(0)

	switch command {
	case "status":
		statusCmd := flag.NewFlagSet("status", flag.ExitOnError)
		daemon := statusCmd.Bool("daemon", false, "Run as a persistent health monitor")
		statusCmd.Parse(flag.Args()[1:])
		
		if *daemon {
			runStatusDaemon(cfg, *jsonOutput)
		} else {
			checkStatus(cfg, *jsonOutput, *verbose)
		}

	case "pay":
		payCmd := flag.NewFlagSet("pay", flag.ExitOnError)
		amount := payCmd.Float64("amount", 10.0, "Amount of Pi to transfer")
		recipient := payCmd.String("to", "GC...REC", "Recipient wallet address")
		payCmd.Parse(flag.Args()[1:])
		
		simulatePayment(cfg, *amount, *recipient, *jsonOutput)

	case "shield":
		shieldCmd := flag.NewFlagSet("shield", flag.ExitOnError)
		msg := shieldCmd.String("msg", "AGENT_PLAN_001", "Message to encrypt")
		shieldCmd.Parse(flag.Args()[1:])
		
		testEncryption(cfg, *msg, *jsonOutput)

	default:
		fmt.Printf("❌ Unknown command: %s\n", command)
		printUsage()
	}
}

func printUsage() {
	fmt.Println("👑 [PiWorker-CLI] Sovereign Orchestration Tool v2.0")
	fmt.Println("Usage: piworker [global flags] <command> [command flags]")
	fmt.Println("\nGlobal Flags:")
	fmt.Println("  --json    Output results in JSON for piping")
	fmt.Println("  -v        Verbose logging")
	fmt.Println("\nCommands:")
	fmt.Println("  status    Check health of Muscle (Go) and Brain (Next.js)")
	fmt.Println("            Flags: --daemon")
	fmt.Println("  pay       Simulate a Pi payment")
	fmt.Println("            Flags: --amount, --to")
	fmt.Println("  shield    Test Sovereign AES-256-GCM encryption")
	fmt.Println("            Flags: --msg")
}

func checkStatus(cfg *config.Config, isJSON bool, verbose bool) {
	status := map[string]string{
		"muscle": "OFFLINE",
		"brain":  "OFFLINE",
	}

	// Muscle Check
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://localhost:%s/api/status", cfg.GatewayPort))
	if err == nil {
		status["muscle"] = "ONLINE"
		resp.Body.Close()
	} else if verbose {
		log.Printf("[DEBUG] Muscle check failed: %v", err)
	}

	// Brain Check
	resp, err = client.Get("http://localhost:3000/api/health")
	if err == nil {
		status["brain"] = "ONLINE"
		resp.Body.Close()
	}

	if isJSON {
		json.NewEncoder(os.Stdout).Encode(status)
	} else {
		fmt.Printf("🦾 [Muscle] %s (Port: %s)\n", status["muscle"], cfg.GatewayPort)
		fmt.Printf("🧠 [Brain]  %s (Port: 3000)\n", status["brain"])
	}
}

func runStatusDaemon(cfg *config.Config, isJSON bool) {
	fmt.Println("👁️ [CLI] Status Daemon started. Ctrl+C to stop.")
	ticker := time.NewTicker(5 * time.Second)
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			checkStatus(cfg, isJSON, false)
		case <-sigs:
			fmt.Println("\n👋 [CLI] Daemon terminated.")
			return
		}
	}
}

func simulatePayment(cfg *config.Config, amount float64, recipient string, isJSON bool) {
	result := map[string]interface{}{
		"success":   true,
		"amount":    amount,
		"recipient": recipient,
		"tx_id":     fmt.Sprintf("cli_tx_%d", time.Now().Unix()),
	}

	if isJSON {
		json.NewEncoder(os.Stdout).Encode(result)
	} else {
		fmt.Printf("💸 [CLI] Authorized %.4f Pi to %s\n", amount, recipient)
		fmt.Printf("✅ [CLI] Intent Broadcasted. TX: %s\n", result["tx_id"])
	}
}

func testEncryption(cfg *config.Config, plaintext string, isJSON bool) {
	secret := cfg.AuthToken // Use the Sovereign Auth Token as the key
	if len(secret) < 32 {
		// Pad or hash the secret to ensure it's 32 bytes for AES-256
		hash := sha256.Sum256([]byte(secret))
		secret = hex.EncodeToString(hash[:])[:32]
	}

	encrypted, err := crypto.Encrypt([]byte(plaintext), secret)
	if err != nil {
		log.Fatalf("Encryption failed: %v", err)
	}

	decrypted, err := crypto.Decrypt(encrypted, secret)
	if err != nil {
		log.Fatalf("Decryption failed: %v", err)
	}

	result := map[string]string{
		"plaintext": plaintext,
		"encrypted": encrypted,
		"decrypted": string(decrypted),
		"integrity": "FAILED",
	}

	if string(decrypted) == plaintext {
		result["integrity"] = "VERIFIED"
	}

	if isJSON {
		json.NewEncoder(os.Stdout).Encode(result)
	} else {
		fmt.Printf("🛡️ [Shield] Testing: %s\n", plaintext)
		fmt.Printf("🔒 Encrypted: %s\n", encrypted)
		fmt.Printf("🔓 Decrypted: %s\n", string(decrypted))
		fmt.Printf("✨ Integrity: %s\n", result["integrity"])
	}
}
