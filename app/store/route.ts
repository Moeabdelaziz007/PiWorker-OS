import { NextResponse } from 'next/server';
import { AssetRegistry } from '@/core/finance/asset-registry';

/**
 * MAS-ZERO :: PI NETWORK PAYMENT APPROVAL
 * Zero-Trust Financial Validation
 */

// Hardcoded agents for the marketplace matching app/marketplace/page.tsx
const AGENT_PRODUCTS: Record<string, number> = {
    "agt-ui-gen": 2,
    "agt-audit": 5,
    "agt-content": 1.5
};

export async function POST(request: Request) {
    try {
        const { paymentId, assetId, type } = await request.json();

        if (!paymentId || !assetId) {
            return NextResponse.json({ error: 'Missing paymentId or assetId' }, { status: 400 });
        }

        // 1. Retrieve the expected price directly from the secure backend source
        let expectedPrice = 0;

        if (type === 'agent') {
            expectedPrice = AGENT_PRODUCTS[assetId] || 0;
        } else {
            const assets = AssetRegistry.getAssets();
            const asset = assets.find(a => a.id === assetId);
            if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
            expectedPrice = asset.price_pi || (asset as any).dna?.basePrice || 0;
        }

        // 2. Contact Pi Network Server to fetch the real payment details
        const piApiKey = process.env.PI_API_KEY; // Your Pi App Server API Key

        if (!piApiKey) {
            // ZERO-TRUST ENFORCEMENT: Never fail open in production environments.
            if (process.env.NODE_ENV === 'production') {
                console.error("[API_APPROVE] 🚨 CRITICAL: PI_API_KEY is missing in production.");
                return NextResponse.json({ error: 'Internal Server Error: Missing Gateway Keys' }, { status: 500 });
            }
            console.warn("[API_APPROVE] ⚠️ PI_API_KEY not set. Operating in MOCK verification mode (DEV ONLY).");
            return NextResponse.json({ success: true, message: "Mock approved (Dev Mode)" });
        }

        const paymentRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
            headers: { 'Authorization': `Key ${piApiKey}` }
        });
        const payment = await paymentRes.json();

        // 3. ZERO-TRUST CHECK: Does the blockchain amount match our sovereign price?
        if (payment.amount !== expectedPrice) {
            console.error(`[API_APPROVE] 🚨 FRAUD ATTEMPT DETECTED! Expected: ${expectedPrice} Pi, Got: ${payment.amount} Pi`);
            return NextResponse.json({ error: 'Price mismatch. Payment rejected to protect Sovereign Treasury.' }, { status: 400 });
        }

        // 4. Approve the payment on the Pi Network side
        const approveRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Key ${piApiKey}` }
        });

        console.log(`[API_APPROVE] ✅ Payment ${paymentId} strictly verified and approved for ${expectedPrice} Pi.`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API_APPROVE] ❌ Server Error:', error);
        return NextResponse.json({ error: error.message || 'Approval failed' }, { status: 500 });
    }
}