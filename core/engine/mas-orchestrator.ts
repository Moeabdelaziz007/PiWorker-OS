import { EventEmitter } from "events";
import { Agent, AgentRole } from "../types/agent";
import { Skill } from "../types/skill";
import { QuantumMirror, SimulationResult } from "./quantum-mirror";
import { ProfitVortex, FinancialHealth } from "./profit-vortex";
import { GemmaAdapter } from "../brain/gemma-adapter";

/**
 * PiWorker-OS MASOrchestrator
 * The Infinite Loop of the Golden Trio (CEO, Executor, Critic)
 */

export enum OrchestrationEvent {
  TASK_INITIATED = "task:initiated",
  SIMULATION_PASSED = "simulation:passed",
  EXECUTION_COMPLETED = "execution:completed",
  PHYSICAL_ACTION_INITIATED = "physical:initiated",
  AUDIT_FAILED = "audit:failed",
  AGENT_MUTATED = "agent:mutated",
  SYSTEM_BETRAYAL = "system:betrayal",
}

export class MASOrchestrator extends EventEmitter {
  private mirror: QuantumMirror;
  private vortex: ProfitVortex;
  private brain: GemmaAdapter;

  constructor() {
    super();
    this.mirror = new QuantumMirror();
    this.vortex = new ProfitVortex();
    this.brain = new GemmaAdapter();
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

      // 0. مرحلة التفكير الاستراتيجي (Sovereign Brain)
      console.log(`[Orchestrator] ${ceo.name} is reasoning about the task...`);
      const strategy = await this.brain.generate(
        `Develop a sovereign strategy for task: ${JSON.stringify(taskData)} using skill: ${skill.name}`,
        ceo.role === 'ceo' // Use Gemma 27B if CEO
      );
      console.log(`[Strategy] ${strategy}`);

      // 1. مرحلة المحاكاة (Quantum Mirror)
      const simResult = await this.mirror.dryRunTask(executor, skill, taskData);
      this.emit(OrchestrationEvent.SIMULATION_PASSED, simResult);

      // 1.5 تفعيل البروتوكول الفيزيائي إذا لزم الأمر
      if (skill.metadata.tags?.includes("physical")) {
        console.log(`[Orchestrator] ⚠️ تفعيل البروتوكول الفيزيائي لـ ${executor.name}...`);
        this.emit(OrchestrationEvent.PHYSICAL_ACTION_INITIATED, { executor, skill });
        // هنا يمكن إضافة تأكيد من الـ Critic
      }

      // 2. مرحلة التنفيذ (تخيلية هنا، سيتم ربطها بالمحرك الفعلي لاحقاً)
      const actualRoi = await this.simulateExecution(executor, simResult);
      
      // 3. مرحلة المراجعة المالية (Profit Vortex)
      const health = await this.vortex.evaluatePerformance(executor, actualRoi, 1000); // ميزانية افتراضية 1000
      
      // 4. البصمة السيادية (Sovereign Signature)
      const signedResult = this.signExecutionResult(executor, {
        actualRoi,
        health,
        skill: skill.name,
        timestamp: Date.now()
      });

      if (health.actionTaken === "cannibalize") {
        this.handleAgentFailure(executor, actualRoi);
      }

      this.emit(OrchestrationEvent.EXECUTION_COMPLETED, { 
        executor, 
        actualRoi, 
        health,
        sovereignStamp: signedResult.stamp 
      });

    } catch (error) {
      if (error instanceof Error && error.name === "BetrayalDetectedError") {
        this.emit(OrchestrationEvent.SYSTEM_BETRAYAL, error.message);
        console.error("🛑 تفعيل بروتوكول الخيانة! إيقاف جميع العمليات لهذا الوكيل.");
      } else {
        throw error;
      }
    }
  }

  /**
   * توليد الختم السيادي للمخرج التقني
   */
  private signExecutionResult(agent: Agent, output: any) {
    const crypto = require("crypto");
    const { SignatureProvider } = require("../security/signature-provider");
    
    const taskHash = crypto.createHash("sha256").update(JSON.stringify(output)).digest("hex");
    
    // In a real system, the privateKey would be securely stored in the Sandbox or Sidecar.
    // For this simulation, we use a derived key for the demo.
    const mockPrivateKey = crypto.createHash("sha256").update(agent.id).digest("hex");
    const signature = crypto.createHmac("sha256", mockPrivateKey).update(taskHash).digest("hex");

    return {
      output,
      stamp: {
        agentId: agent.id,
        taskHash,
        timestamp: Date.now(),
        signature: signature
      }
    };
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
