import { NextRequest } from 'next/server';

/**
 * Sovereign Telemetry Proxy
 * Purpose: Bridges the browser to the Go 'Muscle' layer via SSE.
 */
export async function GET(req: NextRequest) {
  const response = await fetch(`${process.env.SOVEREIGN_ENGINE_URL || 'http://localhost:50052'}/api/telemetry`, {
    headers: {
      'X-Sovereign-Token': process.env.SOVEREIGN_AUTH_TOKEN || ''
    }
  });

  if (!response.ok) {
    return new Response('Engine Offline', { status: 503 });
  }

  // Pass-through the SSE stream
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
