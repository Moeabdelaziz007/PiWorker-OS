
import { AssetRegistry, AIXAsset } from "./asset-registry";
import { AmrikyyTreasury } from "./treasury-vault";
import { TelemetryLogger } from "../utils/telemetry-logger";

/**
 * MAS-ZERO :: MARKETPLACE CONTROLLER
 * Mission: Securely manage high-value .aix asset transfers.
 * Implements atomic purchase logic with sovereign tax collection.
 */
export class MarketplaceController {
    /**
     * Executes an atomic purchase of an .aix asset.
     */
    static async purchaseAsset(assetId: string, buyerWallet: string): Promise<AIXAsset> {
        const assets = AssetRegistry.getAssets();
        const asset = assets.find(a => a.id === assetId);

        if (!asset) {
            throw new Error(`[MARKET] Asset ${assetId} not found.`);
        }

        if (asset.status !== 'active') {
            throw new Error(`[MARKET] Asset ${assetId} is not available for purchase (Status: ${asset.status}).`);
        }

        console.log(`[MARKET] Initializing purchase for ${asset.name} (${assetId}) by ${buyerWallet}`);

        // 1. Create Escrow in Treasury
        const orderId = `ord-${Date.now()}`;
        await AmrikyyTreasury.createEscrow(orderId, buyerWallet, asset.price_pi);

        try {
            // 2. Collect Sovereign Tax & Process Inflow
            const result = await AmrikyyTreasury.processInflow(buyerWallet, asset.price_pi);
            
            // 3. Release Escrow
            await AmrikyyTreasury.releaseEscrow(orderId);

            // 4. Transfer Ownership
            const updatedAsset: AIXAsset = {
                ...asset,
                owner_wallet: buyerWallet,
                status: 'active'
            };

            AssetRegistry.updateAsset(updatedAsset);

            // 5. Log Transaction
            TelemetryLogger.log("INFO", "ASSET_PURCHASED", {
                assetId,
                buyer: buyerWallet,
                price: asset.price_pi,
                tax: result.taxAmount,
                txId: result.txId
            });

            console.log(`[MARKET] ✅ Purchase Complete: ${asset.name} now belongs to ${buyerWallet}.`);
            return updatedAsset;

        } catch (error) {
            console.error(`[MARKET] ❌ Purchase Failed for ${assetId}:`, error);
            // In a real scenario, we'd refund the escrow here.
            throw error;
        }
    }
}
