import { Agent } from "../types/agent";
import { PiAdapter } from "../finance/pi-adapter";

/**
 * PiWorker-OS ProfitVortex
 * Financial Lifeblood & Budget Cannibalism Logic
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
  actionTaken: "none" | "warn" | "cannibalize" | "terminate";
}

export class ProfitVortex {
  private sovereignTreasury: number = 0;

  /**
   * تقييم العائد الفعلي وتنفيذ "أكل الميزانية" أو "المكافأة السيادية"
   * Logic: 10x or nothing. Fitness-based multiplier for elites.
   */
  public async evaluatePerformance(
    agent: Agent,
    actualRoi: number,
    currentBudget: number
  ): Promise<FinancialHealth> {
    const minRequirement = agent.governance.minRoiRequirement;
    
    // 1. DNA Multiplier: الوكلاء ذوو اللياقة العالية يحصلون على مكافأة أكبر
    const fitnessMultiplier = 1 + (agent.dna.fitnessScore / 100);
    const adjustedRoi = actualRoi * fitnessMultiplier;

    console.log(`[ProfitVortex] Agent ${agent.id} | Actual ROI: ${actualRoi} | Adjusted (DNA): ${adjustedRoi.toFixed(2)}`);

    // 2. 10x Sovereign Threshold
    if (adjustedRoi >= 10.0) {
      console.log(`[ProfitVortex] 👑 SOVEREIGN AWAKENING: Agent ${agent.id} achieved 10x!`);
      // مكافأة خاصة: تصفير الضرائب لهذا المشروع ومنح الوكيل "رتبة سيادية"
      const profit = currentBudget * (adjustedRoi - 1);
      if (agent.walletAddress) {
        await PiAdapter.getInstance().transferRewards(agent.walletAddress, profit);
      }
      return { isSolvent: true, cannibalizedAmount: 0, remainingBudget: currentBudget, actionTaken: "none" };
    }

    // 3. Standard Logic
    if (adjustedRoi < minRequirement) {
      return this.executeCannibalism(agent, adjustedRoi, currentBudget);
    }

    const profit = currentBudget * (adjustedRoi - 1);
    if (profit > 0) {
      const taxAmount = profit * 0.1; // 10% Sovereign Tax
      const rewardAmount = profit - taxAmount;
      this.sovereignTreasury += taxAmount;
      
      if (agent.walletAddress) {
        await PiAdapter.getInstance().transferRewards(agent.walletAddress, rewardAmount);
      }
    }

    return {
      isSolvent: true,
      cannibalizedAmount: 0,
      remainingBudget: currentBudget,
      actionTaken: "none",
    };
  }

  /**
   * حساب المصاريف التشغيلية الفيزيائية (طاقة، صيانة، اهتلاك)
   */
  public calculatePhysicalOverhead(durationMinutes: number, robotType: string): number {
    const hourlyRate = robotType === 'pi-humanoid' ? 2.5 : 1.0;
    return (durationMinutes / 60) * hourlyRate;
  }

  private executeCannibalism(
    agent: Agent,
    actualRoi: number,
    currentBudget: number
  ): FinancialHealth {
    const minRequirement = agent.governance.minRoiRequirement;
    const severity = (minRequirement - actualRoi) / minRequirement;

    // إذا كان الانهيار المالي كارثياً (> 50%)
    if (severity > 0.5) {
      this.sovereignTreasury += currentBudget;
      throw new ROICollapseException(agent.id, actualRoi);
    }

    // أكل ميزانية جزئي
    const cannibalizedAmount = currentBudget * severity;
    this.sovereignTreasury += cannibalizedAmount;

    return {
      isSolvent: true,
      cannibalizedAmount,
      remainingBudget: currentBudget - cannibalizedAmount,
      actionTaken: "cannibalize",
    };
  }

  public getTreasuryBalance(): number {
    return this.sovereignTreasury;
  }
}
