"use server";
import "server-only";
import { Agent, AgentDNA } from "../types/agent";
import { PiAdapter } from "../finance/pi-adapter";
import { ROITracker } from "../evolution/roi-tracker";
import { sovereignClient } from "./sovereign-client";

/**
 * PiWorker-OS ProfitVortex
 * Financial Lifeblood & Budget Cannibalism Logic (Digital Darwinism)
 * Refactored: Delegated to Go Sovereign Muscle for Pattern 4 Hardening.
 */

export class ROICollapseException extends Error {
  constructor(public agentId: string, public currentRoi: number) {
    super(`[Profit Vortex] انهيار مالي حاد للوكيل ${agentId}: العائد ${currentRoi.toFixed(2)} أقل من حد البقاء.`);
    this.name = "ROICollapseException";
  }
}

export interface FinancialHealth {
  isSolvent: boolean;
  cannibalizedAmount: number;
  remainingBudget: number;
  actionTaken: "none" | "warn" | "cannibalize" | "terminate" | "awakening";
  updatedDNA?: AgentDNA;
  sovereignTreasury?: number;
}

export class ProfitVortex {
  /**
   * Genetic Pre-flight: Determines the 'Sovereign Path' based on Agent DNA.
   * Ensures the agent's unique behavioral DNA guides the economic outcome.
   */
  private preflightGeneticCheck(agent: Agent): { bias: number; multiplier: number } {
    const dna = agent.dna;
    // Digital Darwinism: A high 'cognition' and 'riskAppetite' leads to aggressive yield curves
    const bias = (dna.cognition + dna.riskAppetite) / 2;
    const multiplier = 1.0 + (dna.greed * 0.5); 
    
    console.log(`[Vortex:Genetics] Agent ${agent.id} | Bias: ${bias.toFixed(2)} | Multiplier: ${multiplier.toFixed(2)}`);
    return { bias, multiplier };
  }

  /**
   * تقييم العائد الفعلي وتنفيذ "أكل الميزانية" أو "المكافأة السيادية"
   * Logic: Digital Darwinism & Economic Cannibalism
   */
  public async evaluatePerformance(
    agent: Agent,
    actualRoi: number,
    currentBudget: number
  ): Promise<FinancialHealth> {
    const minRequirement = agent.governance.minRoiRequirement;
    
    // 1. Digital Darwinism: Evolution through performance (Local Brain Sync)
    const updatedDNA = ROITracker.trackAndEvolve(agent, actualRoi >= minRequirement, actualRoi);

    console.log(`[ProfitVortex] Agent ${agent.id} | Actual ROI: ${actualRoi} | Generation: ${updatedDNA.generation}`);

    // 2. Delegate Fiscal Enforcement to Sovereign Muscle (Pattern 4)
    const vortexRes = await sovereignClient.evaluateVortex({
      agent_id: agent.id,
      actual_roi: actualRoi,
      min_requirement: minRequirement,
      current_budget: currentBudget
    });

    // 3. Sync with Finance Adapters if action is required
    if (vortexRes.action === "awakening" && agent.walletAddress) {
      const rewardGrant = vortexRes.remaining_budget - currentBudget;
      await PiAdapter.getInstance().transferRewards(agent.walletAddress, rewardGrant);
    } else if (vortexRes.action === "none" && actualRoi > 1.0) {
      const profit = currentBudget * (actualRoi - 1.0);
      const rewardAmount = profit * 0.9; // 90% to agent (10% tax handled in Muscle)
      if (agent.walletAddress) {
        await PiAdapter.getInstance().transferRewards(agent.walletAddress, rewardAmount);
      }
    }

    return {
      isSolvent: vortexRes.is_solvent,
      cannibalizedAmount: vortexRes.cannibalized_amt,
      remainingBudget: vortexRes.remaining_budget,
      actionTaken: vortexRes.action as any,
      updatedDNA,
      sovereignTreasury: vortexRes.sovereign_treasury
    };
  }

  public async getTreasuryBalance(): Promise<number> {
    const res = await sovereignClient.getTreasury();
    return res.balance;
  }
}
