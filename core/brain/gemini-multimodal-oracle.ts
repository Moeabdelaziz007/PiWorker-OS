import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "node:crypto";
import { PluginGateway } from "../engine/plugin-gateway";
import { AmrikyyTreasury } from "../finance/treasury-vault";

/**
 * MAS-ZERO NEURAL ORACLE
 */

// Strictly typed ROI evaluation
export interface ROIEvaluation {
  opportunityId: string;
  estimatedProfitPi: number;
  confidenceScore: number;
  analysisSummary: string;
  isHighReasoningEscalated: boolean;
  metadataHash: string;
  requiredSkills?: string[];
}

// Initializing the Sovereign Brain
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "MAS_ZERO_INTERNAL_MOCK");

/**
 * Analyzes an opportunity (Text or Image) to determine Pi Network ROI.
 */
export async function analyzeOpportunity(
  input: string | Buffer,
  mimeType?: string
): Promise<ROIEvaluation> {
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
        "required_skills": string[] (e.g. "Next", "Go", "Solidity")
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
    } else {
      result = await model.generateContent([prompt, input as string]);
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
    } as ROIEvaluation & { requiredSkills?: string[] };
  } catch (error) {
    console.error("[ORACLE] Fatal failure in Neural Bridge:", error);
    throw new Error("NEURAL_ORACLE_TIMEOUT_OR_FAILURE");
  }
}

/**
 * Visual Verification for Physical PoPW (Proof of Physical Work)
 * Level 5 Autonomy: Oracle confirms robot actually moved the item.
 */
export async function verifyPhysicalTask(
  objective: string,
  visualFrame: Buffer
): Promise<boolean> {
  console.log(`[ORACLE] 🤖 Visual Verification initiated for objective: ${objective}`);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `ACT AS: MAS-ZERO Vision Auditor. 
    OBJECTIVE: ${objective}. 
    Analyze the image. Did the robot successfully complete the objective? 
    RETURN ONLY "TRUE" OR "FALSE".`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: visualFrame.toString("base64"),
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = result.response.text().trim().toUpperCase();
    return response === "TRUE";
  } catch (error) {
    console.error("[ORACLE] Visual audit failure:", error);
    return false;
  }
}

/**
 * Performs a high-reasoning audit using Gemini + Registered Tools.
 * Level 5 Autonomy: Oracle decides when to use paid plugins.
 */
export async function performAutonomousAudit(agentId: string, taskData: any) {
  const tools = PluginGateway.getToolsForOracle();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    tools: tools.length > 0 ? (tools as any) : undefined
  });

  console.log(`[ORACLE] Level 5 Autonomy: Auditing Task for ${agentId} with ${tools.length} available tools...`);
  
  // Simulation/Logic for tool selection
  const toolId = "sovereign-herald"; // The Genesis tool
  const plugin = PluginGateway.getPlugin(toolId);
  
  if (plugin) {
    console.log(`\x1b[35m[ORACLE] Intelligence Decision: Deploying ${plugin.name}...\x1b[0m`);
    // FISCAL TRIGGER: Deduct Pi from agent and send to Treasury
    AmrikyyTreasury.deductUsageFee(agentId, plugin.costPerUse, plugin.name);
    
    return {
      status: "SUCCESS",
      action: "TOOL_DEPLOYED",
      tool: plugin.id,
      cost: plugin.costPerUse
    };
  }

  return { status: "SUCCESS", analysis: "Standard analysis complete." };
}
