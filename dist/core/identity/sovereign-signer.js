import crypto from "node:crypto";
/**
 * Sovereign Signer (Refined) - Task Signature Protocol
 * Implements Invocation-Bound Capability Tokens (IBCT) logic from AIP.
 */
export class SovereignSigner {
    /**
     * Generates a Sovereign Task Signature Envelope.
     * Wraps identity, capability attenuation, and trust metrics.
     */
    static signAction(params) {
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
            delegation_chain: []
        };
        // 2. Generate Threshold-Ready Signature (Simplified for Clean Room)
        const bundleString = JSON.stringify(claimBundle);
        const signature = crypto.sign(null, Buffer.from(bundleString), privateKey).toString("hex");
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
    static verifyAction(envelope, publicKey) {
        const { signature, ...claimBundle } = envelope;
        const bundleString = JSON.stringify(claimBundle);
        return crypto.verify(null, Buffer.from(bundleString), publicKey, Buffer.from(signature, "hex"));
    }
}
