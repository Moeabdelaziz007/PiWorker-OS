import { SovereignBridge } from '../core/engine/sovereign-bridge';

async function testPhysicalBridge() {
    console.log("🧪 [TEST] Initiating Physical Bridge Sync (π0.7)...");
    
    try {
        const intent = {
            intentId: "test_intent_001",
            agentId: "agt-ui-gen",
            subtaskLanguage: "Initialize visual grounding for 6-DOF movement.",
            executionMetadata: { precision: "high", speed: "0.5" },
            controlMode: "autonomous",
            visualSubgoals: []
        };

        const response = await SovereignBridge.sendEmbodiedIntent(intent);
        
        if (response.accepted) {
            console.log("✅ [SUCCESS] Physical Intent Accepted!");
            console.log("📍 Tracking ID:", response.trackingId);
        } else {
            console.error("❌ [FAILED] Intent Rejected:", response.statusMessage);
        }
    } catch (error) {
        console.error("❌ [CRITICAL_ERROR] Bridge connection failed:", error);
    }
}

testPhysicalBridge();
