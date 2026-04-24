import { NextResponse } from 'next/server';
import { AssetRegistry } from '@/core/finance/asset-registry';

export async function GET() {
  try {
    const assets = AssetRegistry.getAssets();
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Logic for purchasing or minting via API
    return NextResponse.json({ message: 'Action recorded in ledger' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
