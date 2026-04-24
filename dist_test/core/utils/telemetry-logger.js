import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
/**
 * Telemetry Logger
 * A sovereign data-logging engine for PiWorker-OS.
 * Stores all system events in a structured JSONL format (Data Moat).
 */
export class TelemetryLogger {
    static LOG_PATH = path.join(process.cwd(), "telemetry.jsonl");
    /**
     * Logs a sovereign event to the telemetry moat.
     */
    static log(level, topic, data) {
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
        }
        catch (error) {
            console.error(`[TELEMETRY_FATAL] Failed to write to moat: ${error}`);
        }
    }
    /**
     * Specifically logs an orchestration event.
     */
    static logOrchestration(intent, plan, success, error) {
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
    static logFiscal(type, details) {
        this.log("INFO", "FISCAL_EVENT", {
            type,
            ...details
        });
    }
    /**
     * Logs physical kinematic data for robotic execution.
     */
    static logKinematics(robotId, action, joints, confidence) {
        this.log("INFO", "ROBOT_KINEMATICS", {
            robotId,
            action,
            joints,
            confidence,
            integrityHash: crypto.createHash("sha256").update(JSON.stringify(joints)).digest("hex")
        });
    }
}
