package handler

import (
	"fmt"
	"net/http"
)

// Handler is the entry point for Vercel Go Serverless Functions.
// Following Vercel Best Practices for high-performance deployments.
func Handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "👑 PiWorker-OS Sovereign Engine (Go Runtime) is LIVE on Vercel.")
}
