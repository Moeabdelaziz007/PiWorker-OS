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
   * تقييم العائد الفعلي وتنفيذ "أكل الميزانية" إذا لزم الأمر
   */
  public async evaluatePerformance(
    agent: Agent,
    actualRoi: number,
    currentBudget: number
  ): Promise<FinancialHealth> {
    const minRequirement = agent.governance.minRoiRequirement;
    
    // إذا كان العائد أقل من المطلوب، نبدأ في استرداد رأس المال
    if (actualRoi < minRequirement) {
      return this.executeCannibalism(agent, actualRoi, currentBudget);
    }

    // إذا كان العائد ممتازاً، يتم تحديث الخزينة بنسبة الأرباح وتوزيع المكافأة
    const profit = currentBudget * (actualRoi - 1);
    if (profit > 0) {
      const taxAmount = profit * 0.1; // ضريبة سيادية 10%
      const rewardAmount = profit - taxAmount;
      
      this.sovereignTreasury += taxAmount;
      
      // توزيع مكافأة الـ Pi آلياً
      if (agent.walletAddress) {
        PiAdapter.getInstance().transferRewards(agent.walletAddress, rewardAmount);
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
