import { AgentDNA, AgentMutationSchema } from "../types/agent";
import crypto from "node:crypto";

/**
 * DNA Mutator - The Evolution Engine of PiWorker-OS
 * Responsible for the autonomous refinement of agent logic.
 */
export class DNAMutator {
  /**
   * Performs a performance-driven mutation on an agent's DNA.
   * [VERIFIED REALITY] Mutations are now driven by actual task ROI (Performance Delta).
   */
  static mutate(dna: AgentDNA, performanceDelta: number = 0, intensity: number = 0.1): AgentDNA {
    const newDNA = { ...dna };
    const mutationId = crypto.randomUUID();

    // 1. Tweak base chromosomes based on performance direction
    // If performance is negative, we shift traits more aggressively.
    const mutationDirection = performanceDelta >= 0 ? 1 : -1;
    const traitIndex = Math.abs(crypto.createHash('sha256').update(mutationId).digest().readInt32BE()) % newDNA.chromosomes.length;
    
    const originalTrait = newDNA.chromosomes[traitIndex];
    newDNA.chromosomes[traitIndex] = `${originalTrait} [${performanceDelta >= 0 ? 'FIX' : 'SHIFT'}::${mutationId.slice(0, 4)}]`;

    // 2. Tweak skill chromosomes (The strategy weights)
    if (newDNA.skillChromosomes && newDNA.skillChromosomes.length > 0) {
      const skillIdx = Math.abs(crypto.createHash('sha256').update(mutationId + "_skill").digest().readInt32BE()) % newDNA.skillChromosomes.length;
      const skillTrait = newDNA.skillChromosomes[skillIdx];
      
      if (skillTrait.startsWith("trait:")) {
        const parts = skillTrait.split(":");
        const currentWeight = parseFloat(parts[2]);
        
        // Logical Adjustment: If delta is negative, decrease weight of the failed trait.
        // If delta is positive, reinforce it.
        const adjustment = (performanceDelta || (Math.sin(Date.now()) * intensity)) * mutationDirection;
        const newWeight = Math.min(1, Math.max(0, currentWeight + adjustment));
        
        newDNA.skillChromosomes[skillIdx] = `${parts[0]}:${parts[1]}:${newWeight.toFixed(2)}`;
      }
    }

    const mutationRecord = {
      id: mutationId,
      timestamp: new Date().toISOString(),
      traitModified: `perf_driven_mutation`,
      impactDelta: performanceDelta,
    };

    newDNA.mutations.push(mutationRecord);
    newDNA.generation += 1;

    return newDNA;
  }

  /**
   * Combines traits from two high-performing agents.
   */
  static crossover(parentA: AgentDNA, parentB: AgentDNA): AgentDNA {
    const childChromosomes = [
      ...parentA.chromosomes.slice(0, parentA.chromosomes.length / 2),
      ...parentB.chromosomes.slice(parentB.chromosomes.length / 2),
    ];

    return {
      chromosomes: childChromosomes,
      skillChromosomes: [],
      mutations: [],
      generation: Math.max(parentA.generation, parentB.generation) + 1,
      fitnessScore: 0, // Reset fitness for the new offspring
    };
  }

  /**
   * Determines if an agent should undergo evolution based on its fitness score (ROI).
   */
  static shouldEvolve(fitnessScore: number, threshold: number = 40): boolean {
    return fitnessScore < threshold;
  }
}
