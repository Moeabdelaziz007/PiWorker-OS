"use server";
import "server-only";
import crypto from "node:crypto";

/**
 * MAS-ZERO Sovereign Signature Provider
 * Handles agent identity, cryptographic signing, and task verification.
 */
export class SignatureProvider {
  /**
   * Generates a new identity pair for a sovereign agent.
   */
  static generateIdentity() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    // ZERO-TRUST FIX: Wallet Address MUST be derived from Public Key, NEVER Private Key.
    const keyData = typeof publicKey === "string" ? publicKey : String(publicKey);
    const walletAddress = `pi-${crypto.createHash("sha256").update(keyData).digest("hex").slice(0, 32)}`;

    return { publicKey, privateKey, walletAddress };
  }

  /**
   * Signs a payload (task result, directive, etc.) with an agent's private key.
   * PRO-FIX: Uses a deterministic key-sorted stringify to prevent signature mismatches.
   */
  static signPayload(payload: Record<string, unknown>, privateKey: string): string {
    const data = JSON.stringify(payload, Object.keys(payload).sort());
    const signature = crypto.sign(null, Buffer.from(data), privateKey);
    return signature.toString("hex");
  }

  /**
   * Verifies a signature against a payload and public key.
   */
  static verifySignature(payload: Record<string, unknown>, signature: string, publicKey: string): boolean {
    const data = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.verify(
      null,
      Buffer.from(data),
      publicKey,
      Buffer.from(signature, "hex")
    );
  }

  /**
   * Creates a 'Sovereign Stamp' for terminal display.
   */
  static createSovereignStamp(agentId: string, signature: string): string {
    return `[SIG::${agentId.slice(-6)}::${signature.slice(0, 12)}...]`;
  }
}
