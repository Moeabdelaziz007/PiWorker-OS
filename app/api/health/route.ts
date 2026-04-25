import { NextResponse } from 'next/server';
import { SovereignBridge } from '@/core/engine/sovereign-bridge';
import {
  logStructured,
  mapUnknownError,
  resolveCorrelationContext,
  withCorrelationHeaders,
} from '@/core/utils/observability';

export async function GET(request: Request) {
  const context = resolveCorrelationContext(request.headers);
  const healthReport: any = {
    timestamp: new Date().toISOString(),
    status: 'OPERATIONAL',
    layers: {
      orchestrator: { status: 'ONLINE', version: '2.0.0' },
      sovereign_engine: { status: 'UNKNOWN', latency: null },
      pi_network: { status: 'CONNECTED', network: 'testnet' },
    },
  };

  try {
    const start = Date.now();
    await SovereignBridge.requestSimulation(
      {
        goalId: 'HEALTH_CHECK',
        parallelInstances: 1,
        modelVersion: 'gemini-1.5-pro',
      },
      context
    );

    healthReport.layers.sovereign_engine.status = 'ONLINE';
    healthReport.layers.sovereign_engine.latency = `${Date.now() - start}ms`;

    logStructured({
      component: 'NEXT_API',
      operation: 'health_check',
      auth_context: context.authContext,
      request_id: context.requestId,
      correlation_id: context.correlationId,
      message: 'Health check succeeded',
    });
  } catch (error: unknown) {
    const structured = mapUnknownError(error);
    healthReport.status = 'DEGRADED';
    healthReport.layers.sovereign_engine.status = 'OFFLINE';
    healthReport.layers.sovereign_engine.error = structured.message;

    logStructured({
      level: 'ERROR',
      component: 'NEXT_API',
      operation: 'health_check',
      auth_context: context.authContext,
      request_id: context.requestId,
      correlation_id: context.correlationId,
      error_code: structured.category,
      message: structured.message,
    });
  }

  return NextResponse.json(healthReport, withCorrelationHeaders(undefined, context));
}
