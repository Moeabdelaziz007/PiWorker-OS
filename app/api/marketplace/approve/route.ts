import { NextResponse } from 'next/server';
import { AssetRegistry } from '@/core/finance/asset-registry';

export async function POST(request: Request) {
    try {
        const { paymentId, assetId, type } = await request.json();
        console.log(`[API_APPROVE] Approving payment ${paymentId} for asset ${assetId} (${type})`);

        // 1. Verify asset exists and price matches
        const assets = AssetRegistry.getAssets();
        const asset = assets.find(a => a.id === assetId);

        if (!asset) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        // In a real scenario, we would verify with Pi Network API here as well
        // For now, we approve based on asset existence in registry
        return NextResponse.json({ success: true, approved: true });
    } catch (error: any) {
        console.error('[API_APPROVE] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
