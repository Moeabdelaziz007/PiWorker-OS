import { z } from "zod";
import { EconomicRiskLevel } from "../governance-engine";

/**
 * PiWorker-OS Agent Schema
 * Foundational Clean Room Implementation
 */

export const AgentRoleEnum = z.enum(["ceo", "executor", "critic", "auditor", "specialist"], {
  required_error: "يجب تحديد دور الوكيل",
  invalid_type_error: "دور الوكيل غير صالح",
});

export type AgentRole = z.infer<typeof AgentRoleEnum>;

export type AgentSpecialization = "CODE_GEN" | "AUDITOR" | "RESEARCHER" | "CONTENT_ARCH" | "BountyHunter" | "MarketingSpecialist" | "CodeAuditor";

export const AgentMutationSchema = z.object({
  id: z.string().uuid("معرف الطفرة يجب أن يكون UUID صالحاً"),
  timestamp: z.string().datetime("طابع الطفرة الزمني غير صالح"),
  traitModified: z.string({ required_error: "يجب تحديد السمة المعدلة" }),
  impactDelta: z.number().min(-1).max(1, "تأثير الطفرة يجب أن يكون بين -1 و 1"),
}).strict();

export const AgentDNASchema = z.object({
  chromosomes: z.array(z.string(), {
    required_error: "DNA الوكيل يتطلب تعليمات برمجية (chromosomes) صريحة",
  }).min(1, "يجب أن يحتوي الـ DNA على كروموسوم واحد على الأقل"),
  
  // Biological-Economic Traits (Digital Darwinism)
  greed: z.number().min(0).max(1).default(0.5),      // Efficiency in resource allocation
  cunning: z.number().min(0).max(1).default(0.5),    // Creative problem solving
  cognition: z.number().min(0).max(1).default(0.5),  // Success rate / Reasoning depth
  riskAppetite: z.number().min(0).max(1).default(0.5), // High-reward/high-risk propensity

  skillChromosomes: z.array(z.string()).default([]), // For Skills to DNA evolution
  
  mutations: z.array(AgentMutationSchema).default([]),
  
  generation: z.number({
    required_error: "يجب تحديد رقم الجيل",
  }).int().min(0, "رقم الجيل لا يمكن أن يكون سالباً"),
  
  fitnessScore: z.number().min(0).max(100).default(0),
}).strict();

export const AgentEconomicContextSchema = z.object({
  availableBudget: z.number().min(0, "الميزانية المتاحة لا يمكن أن تكون سالبة"),
  currentBurnRate: z.number().min(0, "معدل الحرق الحالي لا يمكن أن يكون سالباً"),
  predictedRoi: z.number(),
  marketVolatility: z.number().min(0).max(1, "تقلبات السوق يجب أن تكون بين 0 و 1"),
}).strict();

export const AgentSchema = z.object({
  id: z.string({
    required_error: "معرف الوكيل مطلوب",
  }).regex(/^pw-agt-[a-f0-9]{12}$/, "تنسيق معرف الوكيل غير صالح (pw-agt-xxxxxxxxxxxx)"),
  
  name: z.string({
    required_error: "اسم الوكيل مطلوب",
  }).min(2, "اسم الوكيل يجب أن يكون حرفين على الأقل"),
  
  role: AgentRoleEnum,
  
  publicKey: z.string({
    required_error: "المفتاح العام (Public Key) مطلوب للتحقق من الهوية",
  }).min(32, "المفتاح العام غير صالح أو قصير جداً"),

  walletAddress: z.string().startsWith("pi-", "عنوان محفظة Pi غير صالح").optional(),
  
  lastSignature: z.string().optional(),
  
  dna: AgentDNASchema,
  
  capabilities: z.array(z.string()).min(1, "يجب أن يمتلك الوكيل قدرة (capability) واحدة على الأقل"),
  
  governance: z.object({
    betrayalThreshold: z.number().min(0).max(1).default(0.8),
    minRoiRequirement: z.number().min(0).default(1.5),
    riskTolerance: z.nativeEnum(EconomicRiskLevel).default(EconomicRiskLevel.MEDIUM),
  }).strict(),
  
  specialization: z.string().optional(),
  
  metrics: z.object({
    totalProfit: z.number().default(0),
    tasksCompleted: z.number().default(0),
    reputation: z.number().min(0).max(1).default(1),
    spawnTime: z.string().datetime().default(() => new Date().toISOString()),
  }).optional(),

  identity: z.object({
    browser: z.string(),
    os: z.string(),
    deviceId: z.string(),
    userAgent: z.string(),
  }).optional(),

  status: z.enum(["active", "idle", "busy", "offline", "hibernating", "terminated", "error"]).default("idle"),
}).strict();

export type Agent = z.infer<typeof AgentSchema>;
export type AgentDNA = z.infer<typeof AgentDNASchema>;
export type AgentEconomicContext = z.infer<typeof AgentEconomicContextSchema>;
