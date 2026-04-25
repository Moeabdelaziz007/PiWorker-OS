import * as fs from 'fs';
import * as path from 'path';
import { AxiomDID } from '../identity/axiomid-resolver';

/**
 * Sovereign Asset Registry
 * Tracks ownership and metadata for .aix agent assets.
 */

export interface AIXAsset {
  id: string;
  name: string;
  did: AxiomDID;
  owner_wallet: string;
  price_pi: number;
  status: 'active' | 'escrow' | 'retired';
  manifest_path: string;
}

export class AssetRegistry {
  private static readonly REGISTRY_FILE = path.join(process.cwd(), 'core/identity/assets.json');

  static getAssets(): AIXAsset[] {
    if (!fs.existsSync(this.REGISTRY_FILE)) {
      return [];
    }
    const data = fs.readFileSync(this.REGISTRY_FILE, 'utf-8');
    return JSON.parse(data);
  }

  static registerAsset(asset: AIXAsset): void {
    const assets = this.getAssets();
    assets.push(asset);
    fs.writeFileSync(this.REGISTRY_FILE, JSON.stringify(assets, null, 2));
    
    // Log to telemetry
    this.logToTelemetry(asset);
  }

  static updateAsset(updatedAsset: AIXAsset): void {
    let assets = this.getAssets();
    const index = assets.findIndex(a => a.id === updatedAsset.id);
    if (index !== -1) {
        assets[index] = updatedAsset;
        fs.writeFileSync(this.REGISTRY_FILE, JSON.stringify(assets, null, 2));
    }
  }

  private static logToTelemetry(asset: AIXAsset): void {
    const telemetryPath = path.join(process.cwd(), 'telemetry.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      event: 'ASSET_MINTED',
      asset_id: asset.id,
      did: asset.did.did,
      owner: asset.owner_wallet
    };
    fs.appendFileSync(telemetryPath, JSON.stringify(entry) + '\n');
  }
}
