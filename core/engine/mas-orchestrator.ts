import { EventEmitter } from "events";
import { Agent, AgentRole } from "../types/agent";
import { Skill } from "../types/skill";
import { QuantumMirror, SimulationResult } from "./quantum-mirror";
import { ProfitVortex, FinancialHealth } from "./profit-vortex";

/**
 * PiWorker-OS MASOrchestrator
 * The Infinite Loop of the Golden Trio (CEO, Executor, Critic)
 */

export enum OrchestrationEvent {
  TASK_INITIATED = "task:initiated",
  SIMULATION_PASSED = "simulation:passed",
  EXECUTION_COMPLETED = "execution:completed",
  AUDIT_FAILED = "audit:failed",
  AGENT_MUTATED = "agent:mutated",
  SYSTEM_BETRAYAL = "system:betrayal",
}

export class MASOrchestrator extends EventEmitter {
  private mirror: QuantumMirror;
  private vortex: ProfitVortex;

  constructor() {
    super();
    this.mirror = new QuantumMirror();
    this.vortex = new ProfitVortex();
  }

  /**
   * تشغيل دورة المهمة الكاملة للثلاثي الذهبي
   */
  public async orchestrateTask<T>(
    ceo: Agent,
    executor: Agent,
    critic: Agent,
    skill: Skill,
    taskData: T
  ): Promise<void> {
    try {
      this.emit(OrchestrationEvent.TASK_INITIATED, { ceo, executor, taskData });

      // 1. مرحلة المحاكاة (Quantum Mirror)
      const simResult = await this.mirror.dryRunTask(executor, skill, taskData);
      this.emit(OrchestrationEvent.SIMULATION_PASSED, simResult);

      // 2. مرحلة التنفيذ (تخيلية هنا، سيتم ربطها بالمحرك الفعلي لاحقاً)
      const actualRoi = await this.simulateExecution(executor, simResult);
      
      // 3. مرحلة المراجعة المالية (Profit Vortex)
      const health = await this.vortex.evaluatePerformance(executor, actualRoi, 1000); // ميزانية افتراضية 1000
      
      if (health.actionTaken === "cannibalize") {
        this.handleAgentFailure(executor, actualRoi);
      }

      this.emit(OrchestrationEvent.EXECUTION_COMPLETED, { executor, actualRoi, health });

    } catch (error) {
      if (error instanceof Error && error.name === "BetrayalDetectedError") {
        this.emit(OrchestrationEvent.SYSTEM_BETRAYAL, error.message);
        console.error("🛑 تفعيل بروتوكول الخيانة! إيقاف جميع العمليات لهذا الوكيل.");
      } else {
        throw error;
      }
    }
  }

  private async simulateExecution(agent: Agent, sim: SimulationResult): Promise<number> {
    // محاكاة التنفيذ الحقيقي مع بعض الانحراف عن التوقعات
    const deviation = (Math.random() - 0.5) * 0.2; // انحراف +/- 10%
    return sim.predictedRoi + deviation;
  }

  private handleAgentFailure(agent: Agent, roi: number): void {
    console.warn(`[Orchestrator] معالجة فشل الوكيل ${agent.name}. بدء الطفرة الجينية.`);
    
    // تعديل الـ DNA لتقليل نقاط اللياقة
    agent.dna.fitnessScore = Math.max(0, agent.dna.fitnessScore - 10);
    
    this.emit(OrchestrationEvent.AGENT_MUTATED, { 
      agentId: agent.id, 
      newFitness: agent.dna.fitnessScore,
      reason: `فشل مالي: ROI ${roi.toFixed(2)}`
    });
  }
}
