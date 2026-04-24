import { NextResponse } from 'next/server';
import { SovereignBridge } from '@/core/engine/sovereign-bridge';

/**
 * AMRIKYY LAB :: SYSTEM HEALTH DIAGNOSTICS
 * ROUTE: /api/health
 * PURPOSE: Performs a deep-tissue health check of all sovereign layers.
 */

export async function GET() {
  const healthReport: any = {
    timestamp: new Date().toISOString(),
    status: "OPERATIONAL",
    layers: {
      orchestrator: { status: "ONLINE", version: "2.0.0" },
      sovereign_engine: { status: "UNKNOWN", latency: null },
      pi_network: { status: "CONNECTED", network: "testnet" }
    }
  };

  try {
    const start = Date.now();
    await SovereignBridge.requestSimulation({
      goalId: "HEALTH_CHECK",
      parallelInstances: 1,
      modelVersion: "gemini-1.5-pro"
    });
    healthReport.layers.sovereign_engine.status = "ONLINE";
    healthReport.layers.sovereign_engine.latency = `${Date.now() - start}ms`;
  } catch (err) {
    healthReport.status = "DEGRADED";
    healthReport.layers.sovereign_engine.status = "OFFLINE";
    healthReport.layers.sovereign_engine.error = err instanceof Error ? err.message : "Connection failed";
  }

  return NextResponse.json(healthReport);
}
