import fs from 'node:fs';
import path from 'node:path';

/**
 * AMRIKYY LAB :: SOVEREIGN TREASURY ADAPTERS
 * PURPOSE: Absolute persistence across Serverless invocations.
 */

export interface TreasuryState {
  reserves: Record<string, number>;
  escrows: Record<string, { amount: number; agentId: string; status: "LOCKED" | "RELEASED" }>;
  lastUpdate: string;
}

/**
 * [Expert Strategy] Abstract the storage so we can swap FileSystem (Dev) 
 * with Vercel KV (Prod) without changing business logic.
 */
export interface ITreasuryStorage {
  load(): Promise<TreasuryState>;
  save(state: TreasuryState): Promise<void>;
}

/**
 * Local FileSystem Adapter (Perfect for Local Dev / Persistent Servers)
 */
export class FileSystemAdapter implements ITreasuryStorage {
  private dataDir = path.resolve(process.cwd(), 'data');
  private storageFile = path.join(this.dataDir, 'treasury.json');

  private ensureDir() {
    if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
  }

  async load(): Promise<TreasuryState> {
    this.ensureDir();
    if (!fs.existsSync(this.storageFile)) {
      return {
        reserves: { "Pi": 175.0, "SOL": 0.0, "ETH": 0.0 },
        escrows: {},
        lastUpdate: new Date().toISOString()
      };
    }
    return JSON.parse(fs.readFileSync(this.storageFile, 'utf-8'));
  }

  async save(state: TreasuryState): Promise<void> {
    this.ensureDir();
    state.lastUpdate = new Date().toISOString();
    fs.writeFileSync(this.storageFile, JSON.stringify(state, null, 2), 'utf-8');
  }
}

/**
 * Vercel KV Adapter (MANDATORY for Vercel Production)
 * To use: Install @vercel/kv and set KV_URL environment variables.
 */
export class VercelKVAdapter implements ITreasuryStorage {
  // We use dynamic import to avoid failing if @vercel/kv is not installed in dev
  async load(): Promise<TreasuryState> {
    try {
      // @ts-ignore
      const { kv } = await import('@vercel/kv');
      const state = await kv.get<TreasuryState>('sovereign_treasury');
      return state || {
        reserves: { "Pi": 175.0, "SOL": 0.0, "ETH": 0.0 },
        escrows: {},
        lastUpdate: new Date().toISOString()
      };
    } catch (e) {
      console.warn("[TREASURY] Vercel KV not found, falling back to empty state.");
      return { reserves: { "Pi": 175.0 }, escrows: {}, lastUpdate: new Date().toISOString() };
    }
  }

  async save(state: TreasuryState): Promise<void> {
    try {
      // @ts-ignore
      const { kv } = await import('@vercel/kv');
      state.lastUpdate = new Date().toISOString();
      await kv.set('sovereign_treasury', state);
    } catch (e) {
      console.error("[TREASURY] Failed to save to Vercel KV.");
    }
  }
}

/**
 * Factory to determine which storage to use based on environment.
 */
export class TreasuryStorageFactory {
  static getStorage(): ITreasuryStorage {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log("🚀 [TREASURY] Production Mode: Using Vercel KV Adapter.");
      return new VercelKVAdapter();
    }
    return new FileSystemAdapter();
  }
}
