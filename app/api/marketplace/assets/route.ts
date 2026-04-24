import { NextResponse } from 'next/server';
import { AssetRegistry } from '@/core/finance/asset-registry';

export async function GET() {
  try {
    const assets = AssetRegistry.getAssets();
    return NextResponse.json(assets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
