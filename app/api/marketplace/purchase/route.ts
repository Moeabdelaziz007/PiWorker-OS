
import { NextResponse } from 'next/server';
import { MarketplaceController } from '@/core/finance/marketplace-controller';
import { AssetRegistry } from '@/core/finance/asset-registry';
import { SovereignBridge } from '@/core/engine/sovereign-bridge';

export async function POST(request: Request) {
    try {
        const { assetId, buyerWallet, txId } = await request.json();

        if (!assetId || !buyerWallet || !txId) {
            return NextResponse.json({ error: 'Missing assetId, buyerWallet, or txId' }, { status: 400 });
        }

        // 1. Fetch asset to determine expected amount
        const assets = AssetRegistry.getAssets();
        const asset = assets.find(a => a.id === assetId);

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found in Registry' }, { status: 404 });
        }

        // 2. Verify the Pi Network transaction natively via Go Sidecar
        console.log(`[API_PURCHASE] Verifying payment ${txId} for asset ${assetId}...`);
        const verification = await SovereignBridge.verifyTransaction({
            txId,
            expectedReceiver: process.env.PI_TREASURY_WALLET || "G_YOUR_TREASURY_PUBLIC_KEY", // Replace with your actual Treasury Pi Wallet address
            expectedAmount: asset.price_pi
        });

        if (!verification.verified) {
            console.error(`[API_PURCHASE] Ledger verification failed: ${verification.statusMessage}`);
            return NextResponse.json({ error: `Payment verification failed: ${verification.statusMessage}` }, { status: 400 });
        }

        // 3. Execute the Sovereign Purchase Logic
        const result = await MarketplaceController.purchaseAsset(assetId, buyerWallet);

        return NextResponse.json({
            success: true,
            message: `Asset ${result.name} purchased successfully by ${buyerWallet}.`,
            asset: result
        });
    } catch (error: any) {
        console.error('[API_PURCHASE] Error:', error);
        return NextResponse.json({ error: error.message || 'Purchase failed' }, { status: 500 });
    }
}
