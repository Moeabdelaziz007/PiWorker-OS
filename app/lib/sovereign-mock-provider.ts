/**
 * AMRIKYY LAB :: SOVEREIGN MOCK PROVIDER
 * STATUS: TACTICAL FALLBACK ACTIVE
 * PURPOSE: Supply high-fidelity mock data when Sovereign Go Engine is disconnected.
 */

export interface SovereignState {
  treasury: {
    reserves: number;
    status: string;
  };
  fleet: {
    count: number;
    active: number;
    ready: number;
    agents: Array<{
      agentId: string;
      status: string;
      performance: number;
    }>;
  };
  logs: string[];
}

export const fetchSovereignStateWithFallback = async (): Promise<{ data: SovereignState; isSimulated: boolean }> => {
  try {
    const res = await fetch('/api/sovereign/state', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (res.ok) {
      const liveData = await res.json();
      return { data: liveData, isSimulated: false };
    }
  } catch (err) {
    console.warn("[BRIDGE] Live Sovereign Engine unreachable. Engaging Tactical Fallback.");
  }

  const mockData: SovereignState = {
    treasury: {
      reserves: 125840.42,
      status: 'SHIELDED',
    },
    fleet: {
      count: 32,
      active: 28,
      ready: 4,
      agents: [
        { agentId: 'AGENT-ZERO', status: 'EXECUTING', performance: 0.99 },
        { agentId: 'AGENT-PRIME', status: 'OBSERVING', performance: 0.94 },
        { agentId: 'AGENT-GOPHER', status: 'SYNCING', performance: 0.91 },
      ],
    },
    logs: [
      '[SYSTEM] Neural bridge established.',
      '[π0.7] Physical layer heartbeat detected.',
      '[GO] Sovereign engine compiled successfully.',
    ],
  };

  return {
    data: mockData,
    isSimulated: true,
  };
};
