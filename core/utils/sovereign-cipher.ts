import "server-only";
// SovereignCipher (AES-256-GCM)

/**
 * AMRIKYY LAB :: SOVEREIGN CIPHER (AES-256-GCM)
 * TS Implementation for Next.js Orchestrator.
 */

export class SovereignCipher {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // Standard for GCM
  private static readonly AUTH_TAG_LENGTH = 16;

  /**
   * Encrypts a payload for secure transmission to the Go Engine.
   * Protocol: [Nonce(12b)][Ciphertext][Tag(16b)] - Matches Go gcm.Seal
   */
  public static encrypt(plaintext: string, secret: string): string {
    if (typeof window !== 'undefined') throw new Error("SovereignCipher: Encrypt NOT supported in browser.");
    const crypto = require('node:crypto');
    const key = Buffer.alloc(32);
    key.write(secret);

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, encrypted, authTag]).toString('base64');
  }

  /**
   * Decrypts a payload received from the Go Engine.
   * Protocol: [Nonce(12b)][Ciphertext][Tag(16b)]
   */
  public static decrypt(encodedPayload: string, secret: string): string {
    if (typeof window !== 'undefined') throw new Error("SovereignCipher: Decrypt NOT supported in browser.");
    const crypto = require('node:crypto');
    const key = Buffer.alloc(32);
    key.write(secret);

    const data = Buffer.from(encodedPayload, 'base64');

    const iv = data.subarray(0, this.IV_LENGTH);
    const authTag = data.subarray(data.length - this.AUTH_TAG_LENGTH);
    const ciphertext = data.subarray(this.IV_LENGTH, data.length - this.AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
