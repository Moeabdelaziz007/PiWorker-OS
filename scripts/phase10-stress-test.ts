import { SovereignBridge } from '../core/engine/sovereign-bridge';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * AMRIKYY LAB :: PHASE 10 STRESS TEST
 * PURPOSE: Validates the Durable Journal and hardened Sandbox under concurrent load.
 */

async function runStressTest() {
  console.log("🔥 [Phase 10] Starting Stress Test: Durable Sovereignty & Ring 3 Hardening...");

  // 1. Monitor SSE Stream for real-time broadcasts
  SovereignBridge.listenToEvents((data) => {
    console.log(`📡 [SSE Update] Received:`, data);
  });

  // 2. Stress Test: Parallel Sandbox Executions (Ring 3)
  console.log("\n🛡️ [Test] Triggering 5 Parallel Sandbox Executions...");
  const sandboxTasks = Array.from({ length: 5 }).map((_, i) => {
    return SovereignBridge.executePlugin({
      pluginId: `stress_plugin_${i}`,
      sourceCode: `
        // Test loop to verify timeout protection
        let start = Date.now();
        console.log("Plugin ${i} starting...");
        ${i === 2 ? 'while(true) {}' : 'for(let j=0; j<1000; j++) { Math.sqrt(j); }'} 
        JSON.stringify({ result: "done", id: ${i} });
      `,
      envVars: { "AGENT_ID": `agent_${i}` },
      allowedCapabilities: []
    }).catch(err => ({ error: err.message, id: i }));
  });

  // 3. Stress Test: Parallel Payments (Durable Journal + Fiscal Queue)
  console.log("\n💰 [Test] Triggering 3 Parallel Payments...");
  const paymentTasks = Array.from({ length: 3 }).map((_, i) => {
    return SovereignBridge.commitPayment({
      recipientId: `recipient_${i}`,
      amountPi: 0.5 + i,
      agentAuthToken: process.env.SOVEREIGN_AUTH_TOKEN || "SOVEREIGN_DEV_TOKEN",
      priority: "instant"
    }).catch(err => ({ error: err.message, id: i }));
  });

  // Wait for all tasks to complete
  const [sandboxResults, paymentResults] = await Promise.all([
    Promise.all(sandboxTasks),
    Promise.all(paymentTasks)
  ]);

  console.log("\n📊 --- RESULTS ---");
  console.log("Sandbox Results:", JSON.stringify(sandboxResults, null, 2));
  console.log("Payment Results:", JSON.stringify(paymentResults, null, 2));
  
  console.log("\n✅ [Phase 10] Stress Test Complete. Check Go Engine logs for Journal/SSE status.");
}

runStressTest().catch(console.error);
