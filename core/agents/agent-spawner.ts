/**
 * MAS-ZERO AGENT SPAWNER
 * Implementation: Programmatic Initialization of Micro-SaaS Agents
 * Mission: Expand the Amrikyy Lab workforce autonomously.
 */

import crypto from "node:crypto";
import { SovereignLedger } from "../identity/sovereign-ledger";
import { Agent, AgentSpecialization } from "../types/agent";
import { EconomicRiskLevel } from "../governance-engine";
import { AixPackage } from "../engine/aix-foundry";

/**
 * Spawns an agent from a standardized .aix package.
 */
export async function spawnFromAix(aixData: AixPackage): Promise<Agent> {
  console.log(`[SPAWNER] Materializing Agent from AIX: ${aixData.header.name} (v${aixData.header.version})`);

  return spawnAgent(
    aixData.dna.specialization as AgentSpecialization,
    aixData.dna.basePrice * 0.5 // Initial budget derived from asset value
  );
}

/**
 * Spawns a new agent instance and registers it in the Sovereign Ledger.
 */
export async function spawnAgent(
  specialization: AgentSpecialization,
  initialBudget: number
): Promise<Agent> {
  const agentId = `pw-agt-${crypto.randomBytes(6).toString("hex")}`;

  const browsers = ["Chrome", "Firefox", "Edge", "Safari"];
  const oss = ["MacOS", "Windows", "Linux", "iOS"];
  const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];
  const randomOS = oss[Math.floor(Math.random() * oss.length)];

  const identity = {
    browser: randomBrowser,
    os: randomOS,
    deviceId: crypto.randomBytes(8).toString("hex"),
    userAgent: `Mozilla/5.0 (${randomOS}) AppleWebKit/537.36 (KHTML, like Gecko) ${randomBrowser}/120.0.0.0`
  };

  console.log(`[SPAWNER] Initializing new ${specialization} Agent: ${agentId}`);

  const instance: Agent = {
    id: agentId,
    name: `${specialization}-Agent`,
    role: "specialist",
    publicKey: `pub-${crypto.randomBytes(16).toString("hex")}`,
    walletAddress: `pi-${crypto.randomBytes(20).toString("hex")}`,
    status: "active",
    specialization,
    capabilities: [specialization],
    identity,
    dna: {
      chromosomes: ["spawned_execution"],
      skillChromosomes: [],
      fitnessScore: 100,
      generation: 0,
      mutations: []
    },
    governance: {
      betrayalThreshold: 0.8,
      minRoiRequirement: 1.5,
      riskTolerance: EconomicRiskLevel.MEDIUM
    },
    metrics: {
      totalProfit: 0,
      tasksCompleted: 0,
      reputation: 1,
      spawnTime: new Date().toISOString()
    }
  };

  // Register the spawn event in the Ledger for accountability
  await SovereignLedger.etch({
    agentId: "MAS_ZERO_CORE",
    action: "ORACLE_CONSULT", // Using existing action type for registration
    inputHash: crypto.createHash("sha256").update(agentId).digest("hex"),
    outputHash: crypto.createHash("sha256").update(JSON.stringify(instance)).digest("hex"),
    signature: "CORE_AUTH_GENESIS"
  });

  // Finalize initialization
  instance.status = "active";
  console.log(`[SPAWNER] Agent ${agentId} is now ONLINE and ready for task ingestion.`);

  return instance;
}
