import { EventEmitter } from "events";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Agent, AgentRole } from "../types/agent";
import { Skill } from "../types/skill";
import { QuantumMirror, SimulationResult } from "./quantum-mirror";
import { ProfitVortex, FinancialHealth } from "./profit-vortex";
import { GemmaAdapter } from "../brain/gemma-adapter";
import { PromptCompiler, PlanStep } from "./prompt-compiler";
import { AmrikyyTreasury } from "../finance/treasury-vault";
import { TelemetryLogger } from "../utils/telemetry-logger";
import { fleetManager } from "../agents/fleet-manager";
import { AxiomIDResolver } from "../identity/axiomid-resolver";
import { AssetRegistry, AIXAsset } from "../finance/asset-registry";
import { OpenPiAdapter } from "../../sidecar/physical-bridge/openpi-adapter";
import { EconomicRiskLevel } from "../governance-engine";
import { NeuralMemoryMesh } from "../brain/neural-memory";
import { SovereignBridge } from "./sovereign-bridge";

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
  private compiler: PromptCompiler;

  constructor() {
    super();
    this.mirror = new QuantumMirror();
    this.vortex = new ProfitVortex();
    this.brain = new GemmaAdapter();
    this.compiler = new PromptCompiler();
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

      // 1. مرحلة المحاكاة (Go Sovereign Engine Sidecar)
      // Delegating to Go to prevent Node.js event loop collapse during 30-persona simulation
      const simResult = await SovereignBridge.requestSimulation({
        goalId: `task_${Date.now()}`,
        prompt: `Simulate execution for skill ${skill.name} with data: ${JSON.stringify(taskData)}`,
        parallelInstances: 30
      });

      this.emit(OrchestrationEvent.SIMULATION_PASSED, simResult);

      // 1.5 تفعيل البروتوكول الفيزيائي إذا لزم الأمر
      if (skill.metadata.tags?.includes("physical")) {
        console.log(`[Orchestrator] ⚠️ تفعيل البروتوكول الفيزيائي لـ ${executor.name}...`);
        this.emit(OrchestrationEvent.PHYSICAL_ACTION_INITIATED, { executor, skill });
      }

      // 2. مرحلة التنفيذ (تخيلية هنا)
      const actualRoi = await this.simulateExecution(executor, simResult);

      // 3. مرحلة المراجعة المالية (Profit Vortex)
      const health = await this.vortex.evaluatePerformance(executor, actualRoi, 1000);

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


      // 5. Telemetry Moat
      TelemetryLogger.log("INFO", "TASK_EXECUTION", {
        agentId: executor.id,
        skill: skill.name,
        input: taskData,
        strategy,
        prediction: simResult.revenue_usd,
        actual: actualRoi,
        status: health.actionTaken === "none" ? "SUCCESS" : "FAILURE",
        timestamp: new Date().toISOString()
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
   * ترجمة هدف سيادي عالي المستوى إلى سلسلة من الخطوات التنفيذية
   */
  public async orchestrateGoal(goal: string, agents?: { ceo: Agent, executor: Agent, critic: Agent }): Promise<PlanStep[]> {
    console.log(`[Orchestrator] 🚀 Starting Sovereign Goal: ${goal}`);

    // Fallback: If no agents provided, try to get from fleet or create synthetic ones
    const resolvedAgents = (agents && agents.ceo) ? agents : await this.getOrBootstrapAgents();
    console.log(`[Orchestrator] Using Agents: CEO=${resolvedAgents.ceo.name}, Executor=${resolvedAgents.executor.name}`);

    try {
      // PHASE 6: NEURAL MEMORY RETRIEVAL
      // Fetch relevant past experiences to inform the plan
      const pastExperiences = await NeuralMemoryMesh.query(); // Simplified query for hardening
      if (pastExperiences.length > 0) {
        console.log(`[Orchestrator] 🧠 Recalled ${pastExperiences.length} relevant memories to optimize plan.`);
      }

      // 1. مرحلة التخطيط (Compilation)
      const contextEnhancedGoal = pastExperiences.length > 0
        ? `Goal: ${goal}. Context from past experiences: ${JSON.stringify(pastExperiences.map(e => e.data))}`
        : goal;

      const plan = await this.compiler.compile(contextEnhancedGoal);
      console.log(`[Orchestrator] 📜 Plan Generated with ${plan.length} steps.`);

      // 2. حلقة التنفيذ السيادي
      for (const step of plan) {
        console.log(`[Step ${step.id}] [${step.component.toUpperCase()}] ${step.action}`);

        switch (step.component) {
          case "agent":
            await this.executeAgentStep(step, resolvedAgents);
            break;
          case "robot":
            await this.dispatchEmbodiedIntent(step, resolvedAgents.executor);
            break;
          case "finance":
            await this.executeFinanceStep(step);
            break;
        }

        // تسجيل التقدم في الـ Telemetry
        TelemetryLogger.log("INFO", "GOAL_STEP_COMPLETED", {
          goal,
          stepId: step.id,
          component: step.component,
          action: step.action,
          status: "COMPLETED",
          timestamp: new Date().toISOString()
        });
      }

      console.log(`[Orchestrator] ✅ Sovereign Goal Completed: ${goal}`);
      return plan;
    } catch (error) {
      console.error(`[Orchestrator] ❌ Goal Failed:`, error);
      throw error;
    }
  }

  private async getOrBootstrapAgents(): Promise<{ ceo: Agent, executor: Agent, critic: Agent }> {
    const all = await fleetManager.getAllAgents();

    const ceo = all.find(a => a.role === "ceo") || this.createSyntheticAgent("CEO-Prime", "ceo", "StrategicPlanning");
    const executor = all.find(a => a.role === "executor") || this.createSyntheticAgent("Executor-One", "executor", "BountyHunter");
    const critic = all.find(a => a.role === "critic") || this.createSyntheticAgent("Critic-Alpha", "critic", "CodeAuditor");

    return { ceo, executor, critic };
  }

  private createSyntheticAgent(name: string, role: AgentRole, specialization: string): Agent {
    return {
      id: `pw-agt-${crypto.randomBytes(6).toString("hex")}`,
      name,
      role,
      specialization,
      status: "active",
      publicKey: `pub-${crypto.randomBytes(16).toString("hex")}`,
      walletAddress: `pi-${crypto.randomBytes(20).toString("hex")}`,
      dna: {
        chromosomes: ["synthetic", "bootstrap"],
        skillChromosomes: [],
        fitnessScore: 100,
        generation: 0,
        mutations: []
      },
      capabilities: ["synthetic_execution"],
      governance: {
        betrayalThreshold: 0.8,
        minRoiRequirement: 1.5,
        riskTolerance: EconomicRiskLevel.MEDIUM
      }
    };
  }

  private async executeAgentStep(step: PlanStep, agents: { ceo: Agent, executor: Agent, critic: Agent }) {
    const mockSkill: Skill = {
      id: `pw-skl-f00df00df00d`,
      name: step.action,
      version: "1.0.0",
      type: "gateway",
      status: "experimental",
      description: `Generated from goal plan: ${step.action}`,
      capabilities: ["dynamic_task"],
      limits: { memoryLimitMb: 512, timeoutMs: 30000, cpuShares: 128 },
      metadata: {
        author: "MAS-ZERO",
        tags: ["agentic", "dynamic"],
        isProfitGenerator: true
      }
    };
    await this.orchestrateTask(agents.ceo, agents.executor, agents.critic, mockSkill, step.parameters);
  }

  /**
   * إرسال نية مجسدة (Embodied Intent) إلى الطبقة الفيزيائية عبر محرك Go
   */
  private async dispatchEmbodiedIntent(step: PlanStep, executor: Agent) {
    console.log(`[π0.7] 🤖 Assembling Embodied Intent for: ${step.action}`);

    // محاكاة تجميع تدفق مرئي (Visual Subgoals)
    const visualData = [
      Buffer.from("feature_vector_01"),
      Buffer.from("depth_map_01"),
      Buffer.from("object_mask_01")
    ];

    try {
      const response = await SovereignBridge.sendEmbodiedIntent({
        intentId: `intent_${crypto.randomBytes(4).toString("hex")}`,
        agentId: executor.id,
        subtaskLanguage: step.action,
        executionMetadata: {
          speed: "0.8",
          precision: "high",
          safety_protocol: "active"
        },
        controlMode: "autonomous",
        visualSubgoals: visualData
      });

      if (!response.accepted) {
        throw new Error(`[π0.7] Intent Rejected: ${response.statusMessage}`);
      }

      console.log(`[π0.7] ✅ Intent Accepted by Go Engine. Tracking: ${response.trackingId}`);

      // Emit event for UI synchronization
      this.emit(OrchestrationEvent.PHYSICAL_ACTION_INITIATED, {
        executor,
        action: step.action,
        trackingId: response.trackingId
      });

    } catch (error) {
      console.error(`[π0.7] ❌ Failed to dispatch embodied intent:`, error);
      throw error;
    }
  }

  private async executeRobotStep(step: PlanStep, executor: Agent) {
    // Legacy local adapter - kept for backward compatibility if bridge fails
    console.log(`[Robot] 🤖 Dispatched Legacy VLA Action: ${step.action}`);
    const adapter = OpenPiAdapter.getInstance();
    await adapter.dispatchTask(step.action, step.action);
  }

  private async executeFinanceStep(step: PlanStep) {
    console.log(`[Finance] 💰 Processing: ${step.action}`);

    // Extract budget or amount from parameters if available
    const amount = step.parameters?.budget || step.parameters?.amount || 50;
    const orderId = `goal-${crypto.randomBytes(4).toString("hex")}`;

    try {
      AmrikyyTreasury.createEscrow(orderId, "MAS-ZERO", amount);
      TelemetryLogger.logFiscal("ESCROW_LOCK", { orderId, agentId: "MAS-ZERO", amount });
    } catch (error) {
      console.error(`[Finance] ❌ Fiscal error: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }


  /**
   * توليد الختم السيادي للمخرج التقني
   */
  private signExecutionResult(agent: Agent, output: Record<string, unknown>) {
    const taskHash = crypto.createHash("sha256").update(JSON.stringify(output)).digest("hex");
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
    const deviation = (Math.random() - 0.5) * 0.2;
    // Base ROI simulation
    return 1.5 + deviation;
  }

  private handleAgentFailure(agent: Agent, roi: number): void {
    console.warn(`[Orchestrator] معالجة فشل الوكيل ${agent.name}. بدء الطفرة الجينية.`);
    agent.dna.fitnessScore = Math.max(0, agent.dna.fitnessScore - 10);
    this.emit(OrchestrationEvent.AGENT_MUTATED, {
      agentId: agent.id,
      newFitness: agent.dna.fitnessScore,
      reason: `فشل مالي: ROI ${roi.toFixed(2)}`
    });
  }

  /**
   * صك الوكيل كأصل سيادي (.aix) متوافق مع بروتوكول AxiomID
   */
  public async mintAIX(agent: Agent, skill: Skill): Promise<AIXAsset> {
    console.log(`[Foundry] ⚒️ Minting AIX Asset for agent: ${agent.name}...`);

    // 1. توليد الهوية السيادية عبر AxiomID
    const axiomIdentity = AxiomIDResolver.generateDID(agent.id);

    // 2. إنشاء الأصل في السجل
    const asset: AIXAsset = {
      id: crypto.randomBytes(8).toString('hex'),
      name: `${agent.name} - ${skill.name}`,
      did: axiomIdentity,
      owner_wallet: agent.walletAddress || 'pi-000',
      price_pi: 500, // السعر الافتراضي للصك
      status: 'active',
      manifest_path: `/assets/aix/${agent.id}.aix.json`
    };

    AssetRegistry.registerAsset(asset);

    console.log(`[Foundry] ✅ Asset Minted: ${asset.did.did}`);
    return asset;
  }
}
