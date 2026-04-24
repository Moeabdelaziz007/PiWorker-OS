/**
 * MAS-ZERO AGENT SPAWNER
 * Implementation: Programmatic Initialization of Micro-SaaS Agents
 * Mission: Expand the Amrikyy Lab workforce autonomously.
 */

import crypto from "node:crypto";
import { SovereignLedger } from "../identity/sovereign-ledger";

export type AgentSpecialization = "CODE_GEN" | "AUDITOR" | "RESEARCHER" | "CONTENT_ARCH" | "BountyHunter" | "MarketingSpecialist" | "CodeAuditor";

export interface AgentIdentity {
  browser: string;
  os: string;
  deviceId: string;
  userAgent: string;
}

export interface AgentInstance {
  agentId: string;
  specialization: AgentSpecialization;
  status: "INITIALIZING" | "READY" | "BUSY" | "OFFLINE";
  spawnTime: string;
  piBudget: number;
  identity: AgentIdentity;
}

import { AixPackage } from "../engine/aix-foundry";

/**
 * Spawns an agent from a standardized .aix package.
 */
export async function spawnFromAix(aixData: AixPackage): Promise<AgentInstance> {
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
): Promise<AgentInstance> {
  const agentId = `did:piworker:fleet-${crypto.randomBytes(3).toString("hex")}`;
  
  const browsers = ["Chrome", "Firefox", "Edge", "Safari"];
  const oss = ["MacOS", "Windows", "Linux", "iOS"];
  const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];
  const randomOS = oss[Math.floor(Math.random() * oss.length)];
  
  const identity: AgentIdentity = {
    browser: randomBrowser,
    os: randomOS,
    deviceId: crypto.randomBytes(8).toString("hex"),
    userAgent: `Mozilla/5.0 (${randomOS}) AppleWebKit/537.36 (KHTML, like Gecko) ${randomBrowser}/120.0.0.0`
  };

  console.log(`[SPAWNER] Initializing new ${specialization} Agent: ${agentId}`);

    const { SovereignShield } = await import("../security/sovereign-shield");

    const agent: any = {
      agentId: `agn-${crypto.randomBytes(4).toString("hex")}`,
      specialization,
      status: "READY",
      totalProfit: 0,
      piBudget: initialBudget || 100,
      identity: identity,
      security: {
        riskTolerance: 0.8,
        threatLevel: SovereignShield.getThreatLevel(),
        lastRotation: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    };

  const instance: AgentInstance = {
    agentId,
    specialization,
    status: "INITIALIZING",
    spawnTime: new Date().toISOString(),
    piBudget: initialBudget,
    identity
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
  instance.status = "READY";
  console.log(`[SPAWNER] Agent ${agentId} is now ONLINE and ready for task ingestion.`);
  
  return instance;
}
