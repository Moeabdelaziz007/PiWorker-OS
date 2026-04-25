import "server-only";
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
 * Upstash Redis Adapter (MANDATORY for Vercel Production)
 */
export class VercelKVAdapter implements ITreasuryStorage {
  async load(): Promise<TreasuryState> {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      const state = await redis.get<TreasuryState>('sovereign_treasury');
      return state || {
        reserves: { "Pi": 175.0, "SOL": 0.0, "ETH": 0.0 },
        escrows: {},
        lastUpdate: new Date().toISOString()
      };
    } catch (e) {
      console.warn("[TREASURY] Redis/Upstash error, falling back to empty state.", e);
      return { reserves: { "Pi": 175.0 }, escrows: {}, lastUpdate: new Date().toISOString() };
    }
  }

  async save(state: TreasuryState): Promise<void> {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      state.lastUpdate = new Date().toISOString();
      await redis.set('sovereign_treasury', state);
    } catch (e) {
      console.error("[TREASURY] Failed to save to Upstash Redis.", e);
    }
  }
}

/**
 * IDurableJournal - Generic interface for append-only distributed logging
 */
export interface IDurableJournal {
  append(topic: string, entry: any): Promise<void>;
  query(topic: string, limit?: number): Promise<any[]>;
}

export class DistributedJournalAdapter implements IDurableJournal {
  async append(topic: string, entry: any): Promise<void> {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      const key = `journal:${topic}`;
      const timestampedEntry = { ...entry, _ts: new Date().toISOString() };
      
      await redis.lpush(key, timestampedEntry);
      await redis.ltrim(key, 0, 999);
    } catch (e) {
      console.error(`[JOURNAL] Failed to append to ${topic}:`, e);
    }
  }

  async query(topic: string, limit: number = 100): Promise<any[]> {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      const key = `journal:${topic}`;
      return await redis.lrange(key, 0, limit - 1);
    } catch (e) {
      console.error(`[JOURNAL] Failed to query ${topic}:`, e);
      return [];
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

  static getJournal(): IDurableJournal {
    // In dev we could have a FileJournalAdapter, but for now we'll use DistributedJournalAdapter
    // which falls back gracefully if KV is missing, or we can implement a local fallback.
    return new DistributedJournalAdapter();
  }
}
