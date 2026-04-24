import { z } from 'zod';
/**
 * A2A (Agent-to-Agent) Protocol Schemas
 * Logic: Standardized interoperability contracts for an autonomous economy.
 * Extraction: Clean Room from LF AI & Data (Google contribution).
 */
export const AgentCardSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    version: z.string(),
    capabilities: z.array(z.object({
        trait: z.string(),
        description: z.string(),
        parameters: z.record(z.any()),
    })),
    endpoint: z.string().url(),
    auth: z.object({
        type: z.enum(['none', 'bearer', 'sig-v4']),
        token: z.string().optional(),
    }),
    sovereigntyLevel: z.number().min(0).max(5).default(5),
});
export const TaskNegotiationSchema = z.object({
    requestId: z.string().uuid(),
    offeredBy: z.string().uuid(),
    taskDescription: z.string(),
    budget: z.number(),
    constraints: z.array(z.string()),
    deadline: z.string().datetime(),
});
