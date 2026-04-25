import { NextResponse } from 'next/server';
import { SovereignBridge } from '@/core/engine/sovereign-bridge';
import { AmrikyyTreasury } from '@/core/finance/treasury-vault';
import { fleetManager } from '@/core/agents/fleet-manager';
import {
  logStructured,
  mapUnknownError,
  resolveCorrelationContext,
  withCorrelationHeaders,
} from '@/core/utils/observability';

export async function GET(request: Request) {
  const context = resolveCorrelationContext(request.headers);

  try {
    const treasuryStats = await AmrikyyTreasury.getStats();
    const fleetMetrics = await fleetManager.getMetrics();
    const allAgents = await fleetManager.getAllAgents();

    let engineStatus = 'ONLINE';
    let engineHealth: any = null;

    try {
      engineHealth = await SovereignBridge.getSystemStatus(context);
    } catch {
      engineStatus = 'DEGRADED';
    }

    const sovereignState = {
      treasury: {
        reserves: treasuryStats.reserves.Pi || 0,
        otherReserves: treasuryStats.reserves,
        status: treasuryStats.status,
        lastAudit: treasuryStats.lastAudit,
      },
      fleet: {
        count: fleetMetrics.total,
        active: fleetMetrics.active,
        ready: fleetMetrics.ready,
        agents: allAgents.map((a) => ({
          agentId: a.id,
          name: a.name,
          status: a.status.toUpperCase(),
          performance: a.dna.fitnessScore / 100,
          role: a.role,
        })),
      },
      engine: {
        status: engineStatus,
        pi_balance: engineHealth?.pi_balance || 0,
        active_intents: engineHealth?.active_intents || 0,
      },
      isSimulated: false,
      timestamp: new Date().toISOString(),
    };

    logStructured({
      component: 'NEXT_API',
      operation: 'sovereign_state',
      auth_context: context.authContext,
      request_id: context.requestId,
      correlation_id: context.correlationId,
      message: 'State aggregation successful',
    });

    return NextResponse.json(sovereignState, withCorrelationHeaders(undefined, context));
  } catch (error: unknown) {
    const structured = mapUnknownError(error);

    logStructured({
      level: 'ERROR',
      component: 'NEXT_API',
      operation: 'sovereign_state',
      auth_context: context.authContext,
      request_id: context.requestId,
      correlation_id: context.correlationId,
      error_code: structured.category,
      message: structured.message,
    });

    return NextResponse.json(structured.toResponseBody(context), withCorrelationHeaders({ status: structured.status }, context));
  }
}
