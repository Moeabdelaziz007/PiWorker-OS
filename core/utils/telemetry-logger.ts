import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Telemetry Logger
 * A sovereign data-logging engine for PiWorker-OS.
 * Stores all system events in a structured JSONL format (Data Moat).
 */
export class TelemetryLogger {
  private static LOG_PATH = path.join(process.cwd(), "telemetry.jsonl");

  /**
   * Logs a sovereign event to the telemetry moat.
   */
  static log(level: "INFO" | "WARN" | "ERROR" | "CRITICAL", topic: string, data: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      topic,
      ...data
    };

    const line = JSON.stringify(entry) + "\n";

    try {
      fs.appendFileSync(this.LOG_PATH, line);
      // Optional: console output for visibility during dev
      // console.log(`[TELEMETRY] ${level}: ${topic}`);
    } catch (error) {
      console.error(`[TELEMETRY_FATAL] Failed to write to moat: ${error}`);
    }
  }

  /**
   * Specifically logs an orchestration event.
   */
  static logOrchestration(intent: string, plan: any, success: boolean, error?: string) {
    this.log(success ? "INFO" : "ERROR", "GOAL_ORCHESTRATION", {
      intent,
      planCount: plan?.length || 0,
      success,
      error
    });
  }

  /**
   * Specifically logs a fiscal event.
   */
  static logFiscal(type: "ESCROW_LOCK" | "ESCROW_RELEASE" | "TAX_INFLOW", details: any) {
    this.log("INFO", "FISCAL_EVENT", {
      type,
      ...details
    });
  }

  /**
   * Logs physical kinematic data for robotic execution.
   */
  static logKinematics(robotId: string, action: string, joints: number[], confidence: number) {
    this.log("INFO", "ROBOT_KINEMATICS", {
      robotId,
      action,
      joints,
      confidence,
      integrityHash: crypto.createHash("sha256").update(JSON.stringify(joints)).digest("hex")
    });
  }
}
