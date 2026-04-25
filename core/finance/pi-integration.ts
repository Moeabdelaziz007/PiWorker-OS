/**
 * PiWorker-OS: Sovereign Pi Network Integration Layer
 * Version: 2.1.0 (Open Mainnet Ready)
 * Pattern 8: Sovereign-to-Chain Bridge
 */

import "server-only";
import { IDurableJournal, TreasuryStorageFactory } from './treasury-storage';

export interface PiPayment {
  identifier: string;
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  txid?: string;
}

export class PiIntegrationService {
  private static instance: PiIntegrationService;
  private apiKey: string;
  private apiUrl: string = "https://api.minepi.com/v2";
  private journal: IDurableJournal;

  private constructor() {
    this.apiKey = process.env.PI_API_KEY || '';
    this.journal = TreasuryStorageFactory.getJournal();
  }

  public static getInstance(): PiIntegrationService {
    if (!PiIntegrationService.instance) {
      PiIntegrationService.instance = new PiIntegrationService();
    }
    return PiIntegrationService.instance;
  }

  /**
   * Approves a payment on the Pi Platform.
   * This is Phase II of the server-side handshake.
   */
  async approvePayment(paymentId: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error("[PI] Missing API Key. Approval failed.");
      return false;
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await this.journal.append('pi_payments', { paymentId, action: 'approved', ts: new Date() });
        return true;
      }

      const error = await response.json();
      console.error("[PI] Approval Error:", error);
      return false;
    } catch (e) {
      console.error("[PI] Network error during approval:", e);
      return false;
    }
  }

  /**
   * Completes a payment on the Pi Platform after blockchain confirmation.
   * Phase III of the server-side handshake.
   */
  async completePayment(paymentId: string, txid: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

      if (response.ok) {
        await this.journal.append('pi_payments', { paymentId, txid, action: 'completed', ts: new Date() });
        
        // Update the internal ledger via the Sovereign Engine bridge
        // We simulate a local credit update here
        console.log(`[PI] Payment ${paymentId} completed. TXID: ${txid}`);
        return true;
      }

      return false;
    } catch (e) {
      console.error("[PI] Network error during completion:", e);
      return false;
    }
  }

  /**
   * Mock for fetching the user's KYC status and balance
   * In a real app, this would query the Pi blockchain or user profile API
   */
  async getSovereignBalance(): Promise<{ balance: number; kyc: boolean }> {
    // For this vision, we use the user's reported balance
    return {
      balance: 177.0,
      kyc: true
    };
  }
}
