import crypto from "node:crypto";
import { TaskSignature } from "../types/task";

/**
 * Sovereign Signer Protocol
 * Handles the digital signing of every agent action and task output.
 */
export class SovereignSigner {
  /**
   * Signs a data payload with the agent's private key.
   * Produces a verifiable cryptographic stamp.
   */
  static signAction(agentId: string, privateKey: string, data: any): TaskSignature {
    const timestamp = Date.now();
    const payload = JSON.stringify({ agentId, data, timestamp });
    
    // Generate work hash (the "fingerprint" of the work)
    const taskHash = crypto.createHash("sha256").update(payload).digest("hex");
    
    // Sign the hash
    const signature = crypto.sign(null, Buffer.from(taskHash), privateKey).toString("hex");

    return {
      agentId,
      taskHash,
      timestamp,
      signature
    };
  }

  /**
   * Verifies if a signature is valid for a given payload and public key.
   */
  static verifyAction(signature: string, taskHash: string, publicKey: string): boolean {
    return crypto.verify(
      null,
      Buffer.from(taskHash),
      publicKey,
      Buffer.from(signature, "hex")
    );
  }

  /**
   * Generates a metadata object for the .signature.json file.
   */
  static generateSignatureMetadata(stamp: TaskSignature) {
    return {
      version: "1.0.0",
      protocol: "MAS-ZERO-SOVEREIGN",
      ...stamp,
      verified: true
    };
  }
}
