#!/usr/bin/env bash
set -euo pipefail

export PIWORKER_ENV="staging"

echo "[staging-rollback] Running rollback durability test in ${PIWORKER_ENV}..."
go test ./sidecar/sovereign-engine/pkg/finance -run TestStagingRollbackMaintainsDataAndQueueConsistency -count=1
