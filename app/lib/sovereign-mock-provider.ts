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

export const fetchSovereignStateWithFallback = async (): Promise<{ data: SovereignState | null; isSimulated: boolean; error?: string }> => {
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
    
    return { 
      data: null, 
      isSimulated: false, 
      error: `Engine Status: ${res.status}` 
    };
  } catch (err: any) {
    console.error("[BRIDGE] Critical failure: Sovereign Engine unreachable.");
    return { 
      data: null, 
      isSimulated: false, 
      error: "SOVEREIGN_ENGINE_OFFLINE" 
    };
  }
};
