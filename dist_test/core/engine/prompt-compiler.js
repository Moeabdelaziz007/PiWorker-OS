import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
/**
 * PiWorker-OS Prompt-to-Plan Compiler
 * Translates Natural Language Goals into Structured VLA & Agent Tasks.
 */
export const PlanStepSchema = z.object({
    id: z.number(),
    component: z.enum(["robot", "agent", "finance"]),
    action: z.string(),
    parameters: z.record(z.any()),
    dependsOn: z.array(z.number()).optional(),
});
export class PromptCompiler {
    genAI;
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    }
    async compile(goal) {
        console.log(`[Compiler] 🧠 Compiling goal into Sovereign Plan: "${goal}"`);
        const model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `
      ACT AS: PiWorker-OS Strategy Architect.
      GOAL: ${goal}
      
      TASK: Break this goal into a sequence of steps for:
      - 'robot': Physical actions for π0.7 (VLA).
      - 'agent': Digital tasks (Research, Coding, etc.).
      - 'finance': Escrow creation or payment release.
      
      RETURN JSON: {
        "steps": [
          { "id": 1, "component": "...", "action": "...", "parameters": {}, "dependsOn": [] }
        ]
      }
    `;
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const parsed = JSON.parse(response.text());
            return z.array(PlanStepSchema).parse(parsed.steps);
        }
        catch (error) {
            console.error("[Compiler] Compilation Failed:", error);
            // Fallback to a simple step if Gemini fails
            return [{
                    id: 1,
                    component: "agent",
                    action: "emergency_manual_intervention",
                    parameters: { reason: "Neural Compiler Failure" }
                }];
        }
    }
}
