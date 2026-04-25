"use server";
import "server-only";
import crypto from "node:crypto";

/**
 * Sovereign Signer (Refined) - Task Signature Protocol
 * Implements Invocation-Bound Capability Tokens (IBCT) logic from AIP.
 */
export interface SovereignEnvelope {
  agent_did: string;
  task_hash: string;
  timestamp: number;
  capability_overlay: Record<string, unknown>;
  trust_score: number;
  attestation_hash: string;
  delegation_chain: string[];
  signature: string;
  v: string;
}

export interface ActionParams {
  agentDID: string;
  privateKey: string;
  payload: Record<string, unknown>;
  capabilityOverlay?: Record<string, unknown>;
  trustScore: number;
  attestationHash: string;
}

/**
 * Sovereign Signer (Refined) - Task Signature Protocol
 * Implements Invocation-Bound Capability Tokens (IBCT) logic from AIP.
 */
export class SovereignSigner {
  /**
   * Generates a Sovereign Task Signature Envelope.
   * Wraps identity, capability attenuation, and trust metrics.
   */
  static signAction(params: ActionParams): SovereignEnvelope {
    const { agentDID, privateKey, payload, capabilityOverlay, trustScore, attestationHash } = params;
    const timestamp = Date.now();
    
    // 1. Prepare Claim Bundle
    const claimBundle = {
      agent_did: agentDID,
      task_hash: crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
      timestamp,
      capability_overlay: capabilityOverlay || { scope: "standard" },
      trust_score: trustScore,
      attestation_hash: attestationHash,
      delegation_chain: [] as string[]
    };

    // 2. Generate Threshold-Ready Signature (SHA256 with provided key)
    const bundleString = JSON.stringify(claimBundle);
    const signature = crypto.sign("sha256", Buffer.from(bundleString), privateKey).toString("hex");

    // 3. Return the Sovereign Envelope (IBCT Pattern)
    return {
      ...claimBundle,
      signature,
      v: "1.0"
    };
  }

  /**
   * Verifies a Sovereign Task Signature.
   */
  static verifyAction(envelope: SovereignEnvelope, publicKey: string): boolean {
    const { signature, ...claimBundle } = envelope;
    const bundleString = JSON.stringify(claimBundle);
    
    try {
      return crypto.verify(
        "sha256",
        Buffer.from(bundleString),
        publicKey,
        Buffer.from(signature, "hex")
      );
    } catch (e: any) {
      console.error(`[Signer] ❌ Signature Verification CRITICAL ERROR: ${e.message}`);
      return false;
    }
  }
}
