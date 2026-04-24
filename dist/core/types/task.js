import { z } from "zod";
/**
 * Sovereign Task & Output Schema
 * Every action in PiWorker-OS must be signed and hashed.
 */
export const TaskSignatureSchema = z.object({
    agentId: z.string(),
    taskHash: z.string(), // SHA-256 of the work output
    timestamp: z.number(),
    signature: z.string(), // Hex encoded Ed25519 signature
}).strict();
export const SovereignTaskResultSchema = z.object({
    taskId: z.string().uuid(),
    status: z.enum(["success", "failed", "betrayal_detected"]),
    output: z.any(), // The actual work (code, data, etc.)
    auditLog: z.array(z.string()),
    // The Sovereign Stamp
    stamp: TaskSignatureSchema,
}).strict();
