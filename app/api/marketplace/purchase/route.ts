import { NextResponse } from 'next/server';
import { MarketplaceController } from '@/core/finance/marketplace-controller';
import { AssetRegistry } from '@/core/finance/asset-registry';
import { SovereignBridge } from '@/core/engine/sovereign-bridge';
import {
  logStructured,
  mapUnknownError,
  resolveCorrelationContext,
  StructuredError,
  withCorrelationHeaders,
} from '@/core/utils/observability';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const context = resolveCorrelationContext(request.headers, authHeader);

  try {
    const { assetId, buyerWallet, txId } = await request.json();

    if (!assetId || !buyerWallet || !txId) {
      throw new StructuredError('VALIDATION', 'Missing assetId, buyerWallet, or txId', 400);
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new StructuredError('AUTH', 'Unauthorized: Missing or invalid token', 401);
    }

    const accessToken = authHeader.split(' ')[1];

    try {
      const meRes = await fetch('https://api.minepi.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!meRes.ok) throw new StructuredError('AUTH', 'Pi Network rejected the access token', 401);
      const meData = await meRes.json();

      if (meData.uid !== buyerWallet) {
        throw new StructuredError('AUTH', 'Forbidden: Wallet identity mismatch', 403, {
          token_uid: meData.uid,
          requested_wallet: buyerWallet,
        });
      }
    } catch (error) {
      if (error instanceof StructuredError) throw error;
      throw new StructuredError('DEPENDENCY', 'Unauthorized: Invalid token', 401);
    }

    const asset = AssetRegistry.getAssets().find((a) => a.id === assetId);
    if (!asset) {
      throw new StructuredError('VALIDATION', 'Asset not found in Registry', 404);
    }

    const verification = await SovereignBridge.verifyTransaction(
      {
        txId,
        expectedReceiver: process.env.PI_TREASURY_WALLET || 'G_YOUR_TREASURY_PUBLIC_KEY',
        expectedAmount: asset.price_pi,
      },
      context
    );

    if (!verification.verified) {
      throw new StructuredError('NETWORK', `Payment verification failed: ${verification.statusMessage}`, 400);
    }

    const result = await MarketplaceController.purchaseAsset(assetId, buyerWallet);

    logStructured({
      component: 'NEXT_API',
      operation: 'marketplace_purchase',
      auth_context: context.authContext,
      request_id: context.requestId,
      correlation_id: context.correlationId,
      message: `Purchase completed for asset ${assetId}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Asset ${result.name} purchased successfully by ${buyerWallet}.`,
        asset: result,
      },
      withCorrelationHeaders(undefined, context)
    );
  } catch (error: unknown) {
    const structured = mapUnknownError(error);

    logStructured({
      level: 'ERROR',
      component: 'NEXT_API',
      operation: 'marketplace_purchase',
      auth_context: context.authContext,
      request_id: context.requestId,
      correlation_id: context.correlationId,
      error_code: structured.category,
      message: structured.message,
    });

    return NextResponse.json(structured.toResponseBody(context), withCorrelationHeaders({ status: structured.status }, context));
  }
}
