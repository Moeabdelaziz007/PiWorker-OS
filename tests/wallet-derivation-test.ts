import { SignatureProvider } from "../core/security/signature-provider.ts";
import crypto from "node:crypto";
import assert from "node:assert";

async function testDerivation() {
  console.log("Testing SignatureProvider.generateIdentity()...");
  const identity = SignatureProvider.generateIdentity();

  console.log("Wallet Address:", identity.walletAddress);
  console.log("Public Key (preview):", identity.publicKey.slice(0, 50) + "...");

  // Manual derivation from public key
  const expectedAddress = `pi-${crypto.createHash("sha256").update(identity.publicKey).digest("hex").slice(0, 32)}`;

  assert.strictEqual(identity.walletAddress, expectedAddress, "Wallet address should be derived from public key");

  // Verify it's not derived from private key
  const wrongAddress = `pi-${crypto.createHash("sha256").update(identity.privateKey).digest("hex").slice(0, 32)}`;
  assert.notStrictEqual(identity.walletAddress, wrongAddress, "Wallet address should NOT be derived from private key");

  console.log("Basic derivation tests passed!");
}

testDerivation().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
