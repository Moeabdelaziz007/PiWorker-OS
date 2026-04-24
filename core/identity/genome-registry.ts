/**
 * GenomeRegistry - The Sovereign Repository of Agentic Traits
 * Ported from DigitalTwin v1 'Skills' and upgraded to DNA-based schemas.
 */

export interface SkillGenome {
  id: string;
  name: string;
  baseChromosomes: string[];
  strategyWeights: Record<string, number>;
  mutationRate: number;
}

export const GENOME_REGISTRY: Record<string, SkillGenome> = {
  "alpha-reporter": {
    id: "alpha-reporter",
    name: "The Alpha Reporter",
    baseChromosomes: [
      "monetize_chronos_ledger",
      "high_fidelity_reporting",
      "market_sentiment_analysis"
    ],
    strategyWeights: {
      "accuracy": 0.9,
      "speed": 0.6,
      "monetization": 0.8
    },
    mutationRate: 0.05
  },
  "devil-agent": {
    id: "devil-agent",
    name: "The Devil's Advocate",
    baseChromosomes: [
      "pessimistic_risk_audit",
      "stress_test_infrastructure",
      "chaos_scenario_injection"
    ],
    strategyWeights: {
      "paranoia": 0.95,
      "thoroughness": 0.9,
      "aggression": 0.4
    },
    mutationRate: 0.08
  },
  "market-maker": {
    id: "market-maker",
    name: "Liquidity Architect",
    baseChromosomes: [
      "bid_ask_spread_optimization",
      "order_book_balancing",
      "arbitrage_detection"
    ],
    strategyWeights: {
      "risk_tolerance": 0.3,
      "profit_margin": 0.5,
      "liquidity_depth": 0.9
    },
    mutationRate: 0.03
  },
  // Additional skills from the 20+ legacy library would be mapped here...
};

/**
 * Retrieves the DNA genome for a specific skill.
 */
export function getGenome(skillId: string): SkillGenome | undefined {
  return GENOME_REGISTRY[skillId];
}

/**
 * Compiles a skill genome into a raw DNA chromosome array for an agent.
 */
export function compileGenomeToDNA(skillId: string): string[] {
  const genome = getGenome(skillId);
  if (!genome) return [];
  
  return [
    ...genome.baseChromosomes,
    ...Object.entries(genome.strategyWeights).map(([trait, weight]) => `trait:${trait}:${weight}`)
  ];
}
