# Correlated Tracing Dashboards & Queries

This rollout standardizes logs with:

- `timestamp`
- `component`
- `operation`
- `auth_context`
- `request_id`
- `correlation_id`
- `error_code`

## Dashboard 1: Top Failure Signatures

### Loki / LogQL
```logql
sum by (component, operation, error_code) (
  count_over_time({app="piworker"} | json | error_code!="" [15m])
)
```

### Elastic / Kibana KQL
```kql
error_code : *
```
Then visualize `Top values` for:
1. `error_code`
2. `component`
3. `operation`

## Dashboard 2: Mean Time To Detect (MTTD)

Definition used here:
- **start_time** = first occurrence of an error signature `(component, operation, error_code)`.
- **detect_time** = first WARN/ERROR log from alerting pipeline with same `correlation_id`.
- **MTTD** = average(`detect_time - start_time`).

### SQL (BigQuery-style) for daily MTTD
```sql
WITH errors AS (
  SELECT
    correlation_id,
    component,
    operation,
    error_code,
    MIN(TIMESTAMP(timestamp)) AS start_ts
  FROM logs
  WHERE error_code IS NOT NULL
  GROUP BY 1,2,3,4
),
detections AS (
  SELECT
    correlation_id,
    MIN(TIMESTAMP(timestamp)) AS detect_ts
  FROM logs
  WHERE component = 'ALERTING' AND operation = 'incident_detected'
  GROUP BY 1
)
SELECT
  DATE(e.start_ts) AS day,
  AVG(TIMESTAMP_DIFF(d.detect_ts, e.start_ts, SECOND)) AS mttd_seconds
FROM errors e
JOIN detections d USING (correlation_id)
GROUP BY 1
ORDER BY 1 DESC;
```

## Dashboard 3: Trace Funnel (Next.js -> API Bridge -> Go Sidecar)

Track handoff reliability using `correlation_id`:

1. `component="NEXT_API"`
2. `component="API_BRIDGE"`
3. `component="GO_SIDECAR"`

### LogQL handoff-loss query
```logql
sum(count_over_time({app="piworker"} | json | component="NEXT_API" [5m]))
-
sum(count_over_time({app="piworker"} | json | component="GO_SIDECAR" [5m]))
```
