/**
 * Telemetry Logger
 * A sovereign data-logging engine for PiWorker-OS.
 * Stores all system events in a structured JSONL format (Data Moat).
 * [BROWSER SAFE] Automatically detects environment and performs no-op in browser.
 */
import { TreasuryStorageFactory } from "../finance/treasury-storage";

export class TelemetryLogger {
  private static journal = TreasuryStorageFactory.getJournal();

  /**
   * Logs a sovereign event to the durable, distributed journal.
   */
  static async log(level: "INFO" | "WARN" | "ERROR" | "CRITICAL", topic: string, data: any) {
    if (typeof window !== "undefined") {
      return;
    }

    const entry = {
      level,
      topic,
      ...data
    };

    try {
      await this.journal.append(`telemetry:${topic.toLowerCase()}`, entry);
    } catch (error) {
      console.error(`[TELEMETRY_FATAL] Failed to write to durable journal: ${error}`);
    }
  }


  /**
   * Specifically logs an orchestration event.
   */
  static async logOrchestration(intent: string, plan: any, success: boolean, error?: string) {
    await this.log(success ? "INFO" : "ERROR", "GOAL_ORCHESTRATION", {
      intent,
      planCount: plan?.length || 0,
      success,
      error
    });
  }


  /**
   * Specifically logs a fiscal event.
   */
  static async logFiscal(type: "ESCROW_LOCK" | "ESCROW_RELEASE" | "TAX_INFLOW", details: any) {
    await this.log("INFO", "FISCAL_EVENT", {
      type,
      ...details
    });
  }


  /**
   * Logs physical kinematic data for robotic execution.
   */
  static async logKinematics(robotId: string, action: string, joints: number[], confidence: number) {
    let integrityHash = "UNAVAILABLE_ON_CLIENT";
    if (typeof window === "undefined") {
        try {
            const crypto = await import("node:crypto");
            integrityHash = crypto.createHash("sha256").update(JSON.stringify(joints)).digest("hex");
        } catch (e) {
            // Fallback
        }
    }

    await this.log("INFO", "ROBOT_KINEMATICS", {
      robotId,
      action,
      joints,
      confidence,
      integrityHash
    });
  }

}
