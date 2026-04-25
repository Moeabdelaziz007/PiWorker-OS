/**
 * PiWorker-OS: Pi Payment Approval Route
 * Endpoint: POST /api/pi/approve
 */

import { NextResponse } from 'next/server';
import { PiIntegrationService } from '@/core/finance/pi-integration';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    const piService = PiIntegrationService.getInstance();
    const success = await piService.approvePayment(paymentId);

    if (success) {
      return NextResponse.json({ approved: true });
    } else {
      return NextResponse.json({ error: 'Platform approval failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
