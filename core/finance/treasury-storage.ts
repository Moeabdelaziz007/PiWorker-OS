import fs from 'node:fs';
import path from 'node:path';

/**
 * AMRIKYY LAB :: TREASURY STORAGE (Persistence Layer)
 * PURPOSE: Ensures the National Reserves and Escrows survive server restarts.
 * This is the "Verifiable Wealth" bridge.
 */

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'treasury.json');

export interface TreasuryState {
  reserves: Record<string, number>;
  escrows: Record<string, { amount: number; agentId: string; status: "LOCKED" | "RELEASED" }>;
  lastUpdate: string;
}

export class TreasuryStorage {
  private static ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  static load(): TreasuryState {
    this.ensureDir();
    if (!fs.existsSync(STORAGE_FILE)) {
      return {
        reserves: { "Pi": 175.0, "SOL": 0.0, "ETH": 0.0 },
        escrows: {},
        lastUpdate: new Date().toISOString()
      };
    }

    try {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`[TREASURY_STORAGE] ❌ Failed to load treasury state:`, error);
      return {
        reserves: { "Pi": 175.0, "SOL": 0.0, "ETH": 0.0 },
        escrows: {},
        lastUpdate: new Date().toISOString()
      };
    }
  }

  static save(state: TreasuryState) {
    this.ensureDir();
    try {
      state.lastUpdate = new Date().toISOString();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[TREASURY_STORAGE] ❌ Failed to save treasury state:`, error);
    }
  }
}
