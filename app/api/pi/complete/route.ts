/**
 * PiWorker-OS: Pi Payment Completion Route
 * Endpoint: POST /api/pi/complete
 */

import { NextResponse } from 'next/server';
import { PiIntegrationService } from '@/core/finance/pi-integration';

export async function POST(request: Request) {
  try {
    const { paymentId, txid } = await request.json();

    if (!paymentId || !txid) {
      return NextResponse.json({ error: 'Missing paymentId or txid' }, { status: 400 });
    }

    const piService = PiIntegrationService.getInstance();
    const success = await piService.completePayment(paymentId, txid);

    if (success) {
      // Logic for triggering Robotic Tasks or Profit Vortex updates can be added here
      return NextResponse.json({ completed: true });
    } else {
      return NextResponse.json({ error: 'Platform completion failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
