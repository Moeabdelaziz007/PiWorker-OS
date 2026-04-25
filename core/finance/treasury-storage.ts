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
      console.warn(`[JOURNAL] Cloud Redis unreachable, entry not synced: ${topic}`);
    }
  }

  async query(topic: string, limit: number = 100): Promise<any[]> {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = Redis.fromEnv();
      const key = `journal:${topic}`;
      return await redis.lrange(key, 0, limit - 1);
    } catch (e) {
      return [];
    }
  }
}

/**
 * FileSystem Journal Adapter (Real persistence for local dev)
 */
export class FileSystemJournalAdapter implements IDurableJournal {
  private journalDir = path.resolve(process.cwd(), 'data', 'journals');

  private ensureDir(topic: string) {
    const dir = path.join(this.journalDir, topic);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async append(topic: string, entry: any): Promise<void> {
    const dir = this.ensureDir(topic);
    const filename = `${new Date().getTime()}-${Math.random().toString(36).substring(7)}.json`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify({ ...entry, _ts: new Date().toISOString() }, null, 2));
  }

  async query(topic: string, limit: number = 100): Promise<any[]> {
    const dir = path.join(this.journalDir, topic);
    if (!fs.existsSync(dir)) return [];
    
    const files = fs.readdirSync(dir)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit);

    return files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
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
    if (process.env.VERCEL || process.env.NODE_ENV === 'production' || process.env.UPSTASH_REDIS_REST_URL) {
      return new DistributedJournalAdapter();
    }
    console.log("💾 [JOURNAL] Local Mode: Using FileSystem Journal Adapter.");
    return new FileSystemJournalAdapter();
  }
}
