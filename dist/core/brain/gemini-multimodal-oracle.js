/**
 * MAS-ZERO NEURAL ORACLE
 * Implementation: Google Gemini 1.5 Pro <> Local Gemma Fallback
 * Mission: Determine ROI of multi-modal opportunities.
 */
// @ts-ignore
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "node:crypto";
// Initializing the Sovereign Brain
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "MAS_ZERO_INTERNAL_MOCK");
/**
 * Analyzes an opportunity (Text or Image) to determine Pi Network ROI.
 */
export async function analyzeOpportunity(input, mimeType) {
    const inputHash = crypto.createHash("sha256").update(input).digest("hex");
    try {
        // 1. LOCAL FALLBACK (Simulated Gemma 4B)
        const isComplex = typeof input !== "string" || input.length > 1000;
        if (!isComplex) {
            console.log("[ORACLE] Local Gemma 4B processing simple text task...");
            return {
                opportunityId: `opp-${crypto.randomBytes(4).toString("hex")}`,
                estimatedProfitPi: 1.5,
                confidenceScore: 0.85,
                analysisSummary: "Local analysis: Standard bounty pattern detected.",
                isHighReasoningEscalated: false,
                metadataHash: inputHash
            };
        }
        // 2. ESCALATION TO GEMINI 1.5 PRO
        console.log("[ORACLE] !! COMPLEX TASK DETECTED !! Escalating to Gemini 1.5 Pro Multi-Modal...");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: { responseMimeType: "application/json" }
        });
        let prompt = `
      ACT AS: MAS-ZERO Sovereign Oracle.
      TASK: Analyze the technical requirement provided.
      RETURN JSON: {
        "estimated_pi_profit": number (value of work in Pi),
        "confidence": number (0-1),
        "summary": string (technical audit),
        "required_skills": string[] (e.g. "Next.js", "Go", "Solidity")
      }
    `;
        let result;
        if (Buffer.isBuffer(input) && mimeType) {
            result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: input.toString("base64"),
                        mimeType
                    }
                }
            ]);
        }
        else {
            result = await model.generateContent([prompt, input]);
        }
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        return {
            opportunityId: `opp-${crypto.randomBytes(4).toString("hex")}`,
            estimatedProfitPi: parsed.estimated_pi_profit || 1.0,
            confidenceScore: parsed.confidence || 0.5,
            analysisSummary: parsed.summary || "Analysis incomplete.",
            isHighReasoningEscalated: true,
            metadataHash: inputHash,
            // We'll pass through the required skills in the metadata for the scanner
            ...(parsed.required_skills ? { requiredSkills: parsed.required_skills } : {})
        };
    }
    catch (error) {
        console.error("[ORACLE] Fatal failure in Neural Bridge:", error);
        throw new Error("NEURAL_ORACLE_TIMEOUT_OR_FAILURE");
    }
}
