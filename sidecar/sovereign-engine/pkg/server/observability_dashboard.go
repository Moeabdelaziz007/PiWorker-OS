package server

import (
	"sort"
	"sync"
	"time"
)

type AlertRule struct {
	Name      string
	Threshold float64
	Cooldown  time.Duration
}

type AlertEvent struct {
	Name      string    `json:"name"`
	Value     float64   `json:"value"`
	Threshold float64   `json:"threshold"`
	FiredAt   time.Time `json:"fired_at"`
}

type DashboardSnapshot struct {
	WindowSize                  int          `json:"window_size"`
	ErrorRate                   float64      `json:"error_rate"`
	P95LatencyMs                int64        `json:"p95_latency_ms"`
	P99LatencyMs                int64        `json:"p99_latency_ms"`
	OrchestrateValidationFails  int          `json:"orchestrate_validation_fails"`
	RecentAlerts                []AlertEvent `json:"recent_alerts"`
}

type observabilityMonitor struct {
	mu sync.Mutex

	latenciesMs []int64
	totalOps    int
	errorOps    int

	orchestrateValidationFails int
	lastAlertAt                map[string]time.Time
	recentAlerts               []AlertEvent

	alertRules []AlertRule
}

func newObservabilityMonitor() *observabilityMonitor {
	return &observabilityMonitor{
		lastAlertAt: make(map[string]time.Time),
		alertRules: []AlertRule{
			{Name: "high_error_rate", Threshold: 0.08, Cooldown: 5 * time.Minute},
			{Name: "high_p95_latency_ms", Threshold: 900, Cooldown: 10 * time.Minute},
			{Name: "high_p99_latency_ms", Threshold: 1500, Cooldown: 10 * time.Minute},
			{Name: "orchestrate_validation_fails", Threshold: 5, Cooldown: 15 * time.Minute},
		},
	}
}

var globalObsMonitor = newObservabilityMonitor()

func recordObservation(operation string, latency time.Duration, failed bool, category ErrorCategory) {
	globalObsMonitor.mu.Lock()
	defer globalObsMonitor.mu.Unlock()

	globalObsMonitor.totalOps++
	if failed {
		globalObsMonitor.errorOps++
	}
	ms := latency.Milliseconds()
	if ms < 0 {
		ms = 0
	}
	globalObsMonitor.latenciesMs = append(globalObsMonitor.latenciesMs, ms)
	if len(globalObsMonitor.latenciesMs) > 500 {
		globalObsMonitor.latenciesMs = globalObsMonitor.latenciesMs[len(globalObsMonitor.latenciesMs)-500:]
	}

	if (operation == "orchestrate_validator" || operation == "execute_plugin") && category == ErrorValidation {
		globalObsMonitor.orchestrateValidationFails++
	}

	s := globalObsMonitor.snapshotLocked()
	globalObsMonitor.evaluateAlertsLocked(s)
}

func ObservabilitySnapshot() DashboardSnapshot {
	globalObsMonitor.mu.Lock()
	defer globalObsMonitor.mu.Unlock()
	return globalObsMonitor.snapshotLocked()
}

func (m *observabilityMonitor) snapshotLocked() DashboardSnapshot {
	errRate := 0.0
	if m.totalOps > 0 {
		errRate = float64(m.errorOps) / float64(m.totalOps)
	}
	p95 := percentileMs(m.latenciesMs, 95)
	p99 := percentileMs(m.latenciesMs, 99)
	alerts := make([]AlertEvent, len(m.recentAlerts))
	copy(alerts, m.recentAlerts)
	return DashboardSnapshot{WindowSize: len(m.latenciesMs), ErrorRate: errRate, P95LatencyMs: p95, P99LatencyMs: p99, OrchestrateValidationFails: m.orchestrateValidationFails, RecentAlerts: alerts}
}

func (m *observabilityMonitor) evaluateAlertsLocked(s DashboardSnapshot) {
	now := time.Now().UTC()
	candidates := map[string]float64{
		"high_error_rate":               s.ErrorRate,
		"high_p95_latency_ms":           float64(s.P95LatencyMs),
		"high_p99_latency_ms":           float64(s.P99LatencyMs),
		"orchestrate_validation_fails":  float64(s.OrchestrateValidationFails),
	}

	for _, rule := range m.alertRules {
		v := candidates[rule.Name]
		if v < rule.Threshold {
			continue
		}
		if last, ok := m.lastAlertAt[rule.Name]; ok && now.Sub(last) < rule.Cooldown {
			continue
		}
		e := AlertEvent{Name: rule.Name, Value: v, Threshold: rule.Threshold, FiredAt: now}
		m.recentAlerts = append(m.recentAlerts, e)
		if len(m.recentAlerts) > 50 {
			m.recentAlerts = m.recentAlerts[len(m.recentAlerts)-50:]
		}
		m.lastAlertAt[rule.Name] = now
	}
}

func percentileMs(values []int64, p int) int64 {
	if len(values) == 0 {
		return 0
	}
	sorted := make([]int64, len(values))
	copy(sorted, values)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i] < sorted[j] })
	idx := (len(sorted)*p + 99) / 100
	if idx <= 0 {
		idx = 1
	}
	if idx > len(sorted) {
		idx = len(sorted)
	}
	return sorted[idx-1]
}
