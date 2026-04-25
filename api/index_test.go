package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandlerRejectsMissingToken(t *testing.T) {
	expectedAuthToken = "expected-token"

	req := httptest.NewRequest(http.MethodGet, "/api/unknown", nil)
	rr := httptest.NewRecorder()

	Handler(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
	if body := rr.Body.String(); body != "Unauthenticated\n" {
		t.Fatalf("expected unauthenticated body, got %q", body)
	}
}

func TestHandlerRejectsInvalidToken(t *testing.T) {
	expectedAuthToken = "expected-token"

	req := httptest.NewRequest(http.MethodGet, "/api/unknown", nil)
	req.Header.Set("X-Sovereign-Token", "invalid-token")
	rr := httptest.NewRecorder()

	Handler(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, rr.Code)
	}
	if body := rr.Body.String(); body != "Unauthenticated\n" {
		t.Fatalf("expected unauthenticated body, got %q", body)
	}
}

func TestHandlerAllowsValidToken(t *testing.T) {
	expectedAuthToken = "expected-token"

	req := httptest.NewRequest(http.MethodGet, "/api/unknown", nil)
	req.Header.Set("X-Sovereign-Token", expectedAuthToken)
	rr := httptest.NewRecorder()

	Handler(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected status %d, got %d", http.StatusNotFound, rr.Code)
	}
}

func TestResolveAuthTokenRequiresSecretOutsideDev(t *testing.T) {
	t.Setenv("SOVEREIGN_AUTH_TOKEN", "")
	t.Setenv("APP_ENV", "production")
	t.Setenv("NODE_ENV", "production")

	_, err := resolveAuthToken()
	if err == nil {
		t.Fatalf("expected missing token error")
	}
}
