import crypto from "crypto";

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
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    // Mock Pi Wallet Address generation (using public key hash)
    const walletAddress = `pi-${crypto.createHash("sha256").update(publicKey).digest("hex").slice(0, 32)}`;

    return { publicKey, privateKey, walletAddress };
  }

  /**
   * Signs a payload (task result, directive, etc.) with an agent's private key.
   */
  static signPayload(payload: any, privateKey: string): string {
    const data = JSON.stringify(payload);
    const signature = crypto.sign(null, Buffer.from(data), privateKey);
    return signature.toString("hex");
  }

  /**
   * Verifies a signature against a payload and public key.
   */
  static verifySignature(payload: any, signature: string, publicKey: string): boolean {
    const data = JSON.stringify(payload);
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
