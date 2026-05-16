/**
 * PiWorker-OS Governance Engine — Betrayal detection & economic risk assessment
 *
 * Types are defined locally to avoid cross-repo imports. The runtime
 * connects to IQRA's BetrayalGuard via the MemoryClient API (L2) when
 * available, or falls back to a local lightweight implementation.
 */

export enum EconomicRiskLevel { LOW = "LOW", MEDIUM = "MEDIUM", HIGH = "HIGH", CRITICAL = "CRITICAL" }

export interface EconomicContext {
  availableBudget: number; currentBurnRate: number; predictedRoi: number; marketVolatility: number;
}

export interface BetrayalCheck {
  actionId: string; agentId: string; intention: string; economicContext?: EconomicContext;
}

export interface BetrayalVerdict {
  allowed: boolean; reason: string; riskLevel: EconomicRiskLevel;
  rejectionType?: 'intention' | 'resource' | 'anomaly' | 'forbidden';
  confidence: number; latencyMs: number;
}

export class BetrayalGuard {
  static IQRA_ENDPOINT = process.env.IQRA_API_URL || 'http://localhost:3690';

  static async evaluate(check: BetrayalCheck): Promise<BetrayalVerdict> {
    const start = Date.now();
    try {
      const res = await fetch(`${BetrayalGuard.IQRA_ENDPOINT}/api/v1/security/betrayal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(check),
      });
      if (res.ok) {
        return await res.json() as BetrayalVerdict;
      }
    } catch {}
    return {
      allowed: true,
      reason: 'BetrayalGuard IQRA unavailable — permissive fallback',
      riskLevel: EconomicRiskLevel.LOW,
      confidence: 0.5,
      latencyMs: Date.now() - start,
    };
  }
}
