import { z } from "zod";
/**
 * PiWorker-OS Skill Schema
 * Foundational Clean Room Implementation
 */
export const SkillTypeEnum = z.enum(["gateway", "core", "external"], {
    required_error: "يجب تحديد نوع المهارة (gateway, core, external)",
    invalid_type_error: "نوع المهارة غير صالح",
});
export const SkillStatusEnum = z.enum(["active", "deprecated", "experimental", "locked"], {
    required_error: "يجب تحديد حالة المهارة",
    invalid_type_error: "حالة المهارة غير صالحة",
});
export const SkillResourceLimitsSchema = z.object({
    memoryLimitMb: z.number({
        required_error: "يجب تحديد حد الذاكرة بالميجابايت",
    }).min(128, "الحد الأدنى للذاكرة هو 128 ميجابايت").max(8192, "الحد الأقصى للذاكرة هو 8192 ميجابايت"),
    timeoutMs: z.number({
        required_error: "يجب تحديد مهلة التنفيذ بالملي ثانية",
    }).min(100, "الحد الأدنى للمهلة هو 100 ملي ثانية").max(600000, "الحد الأقصى للمهلة هو 600000 ملي ثانية (10 دقائق)"),
    cpuShares: z.number().min(1).max(1024).default(128),
});
export const SkillSchema = z.object({
    id: z.string({
        required_error: "معرف المهارة مطلوب",
    }).regex(/^pw-skl-[a-f0-9]{12}$/, "تنسيق معرف المهارة غير صالح (pw-skl-xxxxxxxxxxxx)"),
    name: z.string({
        required_error: "اسم المهارة مطلوب",
    }).min(3, "اسم المهارة يجب أن يكون 3 أحرف على الأقل").max(64, "اسم المهارة لا يمكن أن يتجاوز 64 حرفاً"),
    version: z.string({
        required_error: "إصدار المهارة مطلوب",
    }).regex(/^\d+\.\d+\.\d+$/, "يجب أن يتبع الإصدار تنسيق SemVer (x.x.x)"),
    type: SkillTypeEnum,
    status: SkillStatusEnum.default("experimental"),
    description: z.string({
        required_error: "وصف المهارة مطلوب",
    }).min(10, "الوصف يجب أن يكون مفصلاً (10 أحرف على الأقل)"),
    capabilities: z.array(z.string()).min(1, "يجب أن تعلن المهارة عن قدرة (capability) واحدة على الأقل"),
    limits: SkillResourceLimitsSchema,
    metadata: z.object({
        author: z.string().min(2, "اسم المؤلف مطلوب"),
        tags: z.array(z.string()).default([]),
        isProfitGenerator: z.boolean().default(false),
    }).strict(),
}).strict();
