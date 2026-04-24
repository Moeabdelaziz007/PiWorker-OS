import { AgentDNA, AgentMutationSchema } from "../types/agent";
import crypto from "node:crypto";

/**
 * DNA Mutator - The Evolution Engine of PiWorker-OS
 * Responsible for the autonomous refinement of agent logic.
 */
export class DNAMutator {
  /**
   * Performs a random mutation on an agent's DNA.
   */
  static mutate(dna: AgentDNA, intensity: number = 0.1): AgentDNA {
    const newDNA = { ...dna };
    const mutationId = crypto.randomUUID();
    
    // 1. Tweak base chromosomes (The instructions)
    const traitIndex = Math.floor(Math.random() * newDNA.chromosomes.length);
    const originalTrait = newDNA.chromosomes[traitIndex];
    newDNA.chromosomes[traitIndex] = `${originalTrait} [MUTATED::${mutationId.slice(0, 4)}]`;

    // 2. Tweak skill chromosomes (The strategy weights)
    if (newDNA.skillChromosomes && newDNA.skillChromosomes.length > 0) {
        const skillIdx = Math.floor(Math.random() * newDNA.skillChromosomes.length);
        const skillTrait = newDNA.skillChromosomes[skillIdx];
        if (skillTrait.startsWith("trait:")) {
            const parts = skillTrait.split(":");
            const currentWeight = parseFloat(parts[2]);
            const newWeight = Math.min(1, Math.max(0, currentWeight + (Math.random() * 2 - 1) * intensity));
            newDNA.skillChromosomes[skillIdx] = `${parts[0]}:${parts[1]}:${newWeight.toFixed(2)}`;
        }
    }

    const mutationRecord = {
      id: mutationId,
      timestamp: new Date().toISOString(),
      traitModified: `hybrid_mutation`,
      impactDelta: (Math.random() * 2 - 1) * intensity,
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
