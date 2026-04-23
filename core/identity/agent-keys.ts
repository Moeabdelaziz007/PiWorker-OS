import crypto from "node:crypto";
import { promisify } from "node:util";

const generateKeyPair = promisify(crypto.generateKeyPair);

/**
 * AgentKeys Identity Kernel
 * Responsible for generating and managing cryptographic identities for agents.
 */
export class AgentKeys {
  /**
   * Generates a high-security Ed25519 key pair for a new agent.
   * Ed25519 is preferred for its performance and security in distributed systems.
   */
  static async generateSovereignIdentity() {
    const { publicKey, privateKey } = await generateKeyPair("ed25519", {
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    return {
      publicKey,
      privateKey,
      // Create a DID-like identifier
      did: `did:pw:${crypto.createHash("sha256").update(publicKey).digest("hex").slice(0, 32)}`
    };
  }

  /**
   * Encrypts a private key for storage.
   * In a production environment, this would use a master key from a Vault.
   */
  static encryptPrivateKey(privateKey: string, secret: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", crypto.scryptSync(secret, "salt", 32), iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }
}
