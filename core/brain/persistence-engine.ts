/**
 * MAS-ZERO :: SOVEREIGN PERSISTENCE ENGINE
 * Mission: Ensure agent and memory state survives system restarts.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { SovereignInsight } from "./neural-memory";

const MEMORY_DB_PATH = path.join(process.cwd(), "core/identity/neural-memory.jsonl");
const VECTOR_DB_PATH = path.join(process.cwd(), "core/identity/vector-memory.jsonl");

import { VectorEntry } from "./vector-store";

export class PersistenceEngine {
  /**
   * Persists a sovereign insight to disk.
   */
  static async saveInsight(insight: SovereignInsight) {
    const entry = JSON.stringify(insight) + "\n";
    await fs.mkdir(path.dirname(MEMORY_DB_PATH), { recursive: true });
    await fs.appendFile(MEMORY_DB_PATH, entry);
    console.log(`[PERSISTENCE] Insight ${insight.id} secured to disk.`);
  }

  /**
   * Loads all insights from disk.
   */
  static async loadInsights(): Promise<SovereignInsight[]> {
    try {
      const data = await fs.readFile(MEMORY_DB_PATH, "utf-8");
      return data.trim().split("\n").map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  /**
   * Persists a vector entry to disk.
   */
  static async saveVectorEntry(entry: VectorEntry) {
    const line = JSON.stringify(entry) + "\n";
    await fs.mkdir(path.dirname(VECTOR_DB_PATH), { recursive: true });
    await fs.appendFile(VECTOR_DB_PATH, line);
  }

  /**
   * Loads all vector entries from disk.
   */
  static async loadVectorEntries(): Promise<VectorEntry[]> {
    try {
      const data = await fs.readFile(VECTOR_DB_PATH, "utf-8");
      return data.trim().split("\n").map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  /**
   * Persists the entire fleet state.
   */
  static async saveFleetState(agents: any[]) {
    const filePath = path.join(process.cwd(), "core/identity/fleet-state.json");
    await fs.writeFile(filePath, JSON.stringify(agents, null, 2));
    console.log(`[PERSISTENCE] Fleet state (${agents.length} agents) stabilized.`);
  }
}
