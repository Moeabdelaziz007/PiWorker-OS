import { Agent, AgentRole } from "../types/agent";
// Memory: routed to IQRA MemoryClient (L2) — see iqra/src/lib/iqra/03-memory/memory_client.ts
import { GemmaAdapter } from "../brain/gemma-adapter";
import { Skill } from "../types/skill";
import crypto from "node:crypto";

interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
}

/**
 * SovereignWorkerPool - The Heartbeat of PiWorker-OS
 * Coordinates the Golden Trio (CEO, Executor, Critic) for autonomous execution.
 */
export class SovereignWorkerPool {
  private static instance: SovereignWorkerPool;
  private jobQueue: Job[] = [];
  private brain: GemmaAdapter;

  private constructor(brain: GemmaAdapter) {
    this.brain = brain;
    console.log("[WORKER_POOL] Sovereign heartbeat initialized.");
  }

  public static getInstance(brain?: GemmaAdapter): SovereignWorkerPool {
    if (!SovereignWorkerPool.instance) {
      if (!brain) throw new Error("WorkerPool requires brain for first initialization.");
      SovereignWorkerPool.instance = new SovereignWorkerPool(brain);
    }
    return SovereignWorkerPool.instance;
  }

  /**
   * Enqueues a new autonomous task.
   */
  public async enqueue(type: string, payload: Record<string, unknown>, priority: number = 1) {
    const jobId = `job-${crypto.randomBytes(4).toString("hex")}`;
    this.jobQueue.push({ id: jobId, type, payload, priority });
    this.jobQueue.sort((a, b) => b.priority - a.priority);

    console.log(`[WORKER_POOL] Job ${jobId} enqueued: ${type} (Priority: ${priority})`);
    
    // Auto-trigger processing loop if it's the only job
    if (this.jobQueue.length === 1) {
      this.processNextJob();
    }

    return jobId;
  }

  /**
   * Main execution loop for agentic tasks.
   */
  private async processNextJob() {
    if (this.jobQueue.length === 0) return;

    const job = this.jobQueue.shift()!;
    console.log(`[WORKER_POOL] Processing job ${job.id}: ${job.type}`);

    try {
      // In v2, every job is treated as a Sovereign Goal
      // We will simulate it first using Quantum Mirror (called via Orchestrator)
      // Memory: posted to IQRA MemoryClient (L2) — see iqra/src/lib/iqra/03-memory/memory_client.ts

      // Logic for job execution would go here, interfacing with MASOrchestrator
      // For now, we simulate success
      await new Promise(r => setTimeout(r, 1000));
      
      console.log(`[WORKER_POOL] Job ${job.id} completed successfully.`);

    } catch (error) {
      console.error(`[WORKER_POOL] Job ${job.id} failed:`, error);
    }

    // Continue loop
    this.processNextJob();
  }

  public getQueueLength(): number {
    return this.jobQueue.length;
  }
}
