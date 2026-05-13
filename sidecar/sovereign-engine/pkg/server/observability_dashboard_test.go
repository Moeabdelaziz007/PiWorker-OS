package server

import (
	"testing"
	"time"
)

func TestObservabilityDashboardAndAlertCooldown(t *testing.T) {
	globalObsMonitor = newObservabilityMonitor()
	globalObsMonitor.alertRules = []AlertRule{{Name: "high_error_rate", Threshold: 0.5, Cooldown: time.Hour}}

	recordObservation("execute_plugin", 1200*time.Millisecond, true, ErrorValidation)
	recordObservation("execute_plugin", 1300*time.Millisecond, true, ErrorValidation)
	recordObservation("request_simulation", 50*time.Millisecond, false, "")

	s := ObservabilitySnapshot()
	if s.ErrorRate <= 0.5 {
		t.Fatalf("expected error rate > 0.5 got %f", s.ErrorRate)
	}
	if s.P95LatencyMs == 0 || s.P99LatencyMs == 0 {
		t.Fatalf("expected p95/p99 to be populated")
	}
	if s.OrchestrateValidationFails != 2 {
		t.Fatalf("expected validation fail count=2 got %d", s.OrchestrateValidationFails)
	}
	if len(s.RecentAlerts) != 1 {
		t.Fatalf("expected one alert fire got %d", len(s.RecentAlerts))
	}

	// game-day small replay: same condition within cooldown should not fire second alert
	recordObservation("execute_plugin", 1400*time.Millisecond, true, ErrorValidation)
	s2 := ObservabilitySnapshot()
	if len(s2.RecentAlerts) != 1 {
		t.Fatalf("expected cooldown to suppress duplicate alert; got %d", len(s2.RecentAlerts))
	}
}
