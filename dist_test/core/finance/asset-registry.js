import * as fs from 'fs';
import * as path from 'path';
export class AssetRegistry {
    static REGISTRY_FILE = path.join(process.cwd(), 'core/identity/assets.json');
    static getAssets() {
        if (!fs.existsSync(this.REGISTRY_FILE)) {
            return [];
        }
        const data = fs.readFileSync(this.REGISTRY_FILE, 'utf-8');
        return JSON.parse(data);
    }
    static registerAsset(asset) {
        const assets = this.getAssets();
        assets.push(asset);
        fs.writeFileSync(this.REGISTRY_FILE, JSON.stringify(assets, null, 2));
        // Log to telemetry
        this.logToTelemetry(asset);
    }
    static updateAsset(updatedAsset) {
        let assets = this.getAssets();
        const index = assets.findIndex(a => a.id === updatedAsset.id);
        if (index !== -1) {
            assets[index] = updatedAsset;
            fs.writeFileSync(this.REGISTRY_FILE, JSON.stringify(assets, null, 2));
        }
    }
    static logToTelemetry(asset) {
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
