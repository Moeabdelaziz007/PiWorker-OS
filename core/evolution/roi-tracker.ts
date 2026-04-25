import "server-only";
import { Agent, AgentDNA } from "../types/agent";

/**
 * Updates Agent DNA based on task outcome (Digital Darwinism).
 * Implements the "Human-Algorithm" philosophy.
 */
export class ROITracker {
  /**
   * Tracks performance and evolves DNA based on ROI outcomes.
   */
  static trackAndEvolve(
    agent: Agent,
    success: boolean,
    actualRoi: number
  ): AgentDNA {
    const dna = { ...agent.dna };
    console.log(`[DARWINISM] Performance analysis for Agent ${agent.id}...`);

    if (success && actualRoi >= 1.5) {
      // EVOLUTION: The Winner's Gene
      dna.greed = Math.min(1, dna.greed + 0.05);      // Gains "Efficiency" through reward
      dna.cognition = Math.min(1, dna.cognition + 0.02);  // Reinforces reasoning patterns
      dna.cunning = Math.min(1, dna.cunning + 0.03);    // Creative success increases cunning
      
      console.log(`[DARWINISM] SUCCESS: Agent ${agent.id} reinforced efficiency genes.`);
    } else {
      // MUTATION: The Failure Catalyst (Digital Darwinism)
      const severity = actualRoi < 0.5 ? 0.2 : 0.1;
      
      dna.cognition = Math.max(0, dna.cognition - severity);  // Penalty to reasoning depth
      dna.riskAppetite = Math.max(0, dna.riskAppetite - (severity * 2)); // Becomes risk-averse to survive
      dna.cunning = Math.min(1, dna.cunning + severity);    // "Survival Instinct": Failure triggers cunning
      
      console.warn(`[DARWINISM] FAILURE: Agent ${agent.id} triggered adaptive mutation. severity: ${severity}`);
    }

    dna.fitnessScore = Math.min(100, Math.max(0, actualRoi * 10));
    dna.generation += 1;

    return dna;
  }
}
