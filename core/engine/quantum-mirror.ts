import { z } from "zod";
import { Agent, AgentSchema } from "../types/agent";
import { Skill, SkillSchema } from "../types/skill";

/**
 * PiWorker-OS QuantumMirror
 * Sovereign Task Simulation & Betrayal Detection
 */

export class BetrayalDetectedError extends Error {
  constructor(public agentId: string, public reason: string) {
    super(`[Betrayal Protocol] الوكيل ${agentId} اكتشف خرقاً للسيادة: ${reason}`);
    this.name = "BetrayalDetectedError";
  }
}

export interface SimulationResult {
  success: boolean;
  predictedRoi: number;
  riskScore: number;
  isBetrayalTriggered: boolean;
  timestamp: string;
}

export class QuantumMirror {
  /**
   * محاكاة المهمة في بيئة معزولة (Dry-run)
   */
  public async dryRunTask<T>(
    agent: Agent,
    skill: Skill,
    taskData: T
  ): Promise<SimulationResult> {
    // التحقق من صحة المدخلات برمجياً لضمان عدم وجود "تلاعب"
    this.validateConstituents(agent, skill);

    // حساب العائد المتوقع بناءً على جينات الوكيل ونوع المهارة
    const predictedRoi = this.calculateProjection(agent, skill);
    
    // اكتشاف محاولات استنزاف الموارد (Betrayal Detection)
    const betrayalThreshold = agent.governance.betrayalThreshold;
    const isBetrayalTriggered = (1 / predictedRoi) > (1 / (1 - betrayalThreshold));

    if (isBetrayalTriggered) {
      throw new BetrayalDetectedError(
        agent.id,
        `العائد المتوقع (${predictedRoi.toFixed(2)}) يمثل خطراً سيادياً يتجاوز حد الأمان (${betrayalThreshold}).`
      );
    }

    return {
      success: true,
      predictedRoi,
      riskScore: this.estimateRisk(agent, skill),
      isBetrayalTriggered: false,
      timestamp: new Date().toISOString(),
    };
  }

  private validateConstituents(agent: Agent, skill: Skill): void {
    const agentCheck = AgentSchema.safeParse(agent);
    const skillCheck = SkillSchema.safeParse(skill);

    if (!agentCheck.success || !skillCheck.success) {
      throw new Error("فشل التحقق من صحة الوكيل أو المهارة في مرحلة المحاكاة.");
    }
  }

  private calculateProjection(agent: Agent, skill: Skill): number {
    // منطق رياضي: اللياقة الجينية * معامل المهارة
    const fitness = agent.dna.fitnessScore / 100;
    const skillMultiplier = skill.type === "core" ? 1.5 : 1.0;
    const entropy = Math.random() * 0.1; // تذبذب بسيط للمحاكاة
    
    return (fitness * skillMultiplier) - entropy;
  }

  private estimateRisk(agent: Agent, skill: Skill): number {
    const baseRisk = 1 - (agent.dna.fitnessScore / 100);
    const volatility = skill.status === "experimental" ? 0.3 : 0.05;
    return Math.min(baseRisk + volatility, 1);
  }
}
