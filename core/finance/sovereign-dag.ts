import "server-only";
import { createHash } from "node:crypto";
import { TreasuryStorageFactory } from "./treasury-storage";

export interface DAGNode {
  id: string;
  parents: string[];
  agentId: string;
  intent: string;
  payload: any;
  hash: string;
  timestamp: string;
}

/**
 * PiWorker-OS Sovereign DAG Ledger
 * Pattern 8.2: Causal Ledger Topology
 */
export class SovereignDAG {
  private static instance: SovereignDAG;
  private graph: Map<string, DAGNode> = new Map();
  private tips: string[] = [];

  private constructor() {}

  public static getInstance(): SovereignDAG {
    if (!this.instance) {
      this.instance = new SovereignDAG();
    }
    return this.instance;
  }

  public async recordEvent(agentId: string, intent: string, payload: any): Promise<DAGNode> {
    const timestamp = new Date().toISOString();
    const parents = [...this.tips];
    
    const content = JSON.stringify({ agentId, intent, payload, parents, timestamp });
    const hash = createHash("sha256").update(content).digest("hex");
    const id = `dag-ev-${hash.substring(0, 12)}`;

    const node: DAGNode = { id, parents, agentId, intent, payload, hash, timestamp };
    
    // Real Persistence: Commit to the Distributed Journal
    const journal = TreasuryStorageFactory.getJournal();
    await journal.append("DAG_LEDGER", {
      type: "TOPOLOGICAL_COMMIT",
      node: node
    });

    this.graph.set(id, node);
    this.tips = [id];
    return node;
  }

  public getGraphState() {
    return {
      nodeCount: this.graph.size,
      tips: this.tips
    };
  }
}

export const sovereignDAG = SovereignDAG.getInstance();
