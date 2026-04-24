/**
 * MAS-ZERO SCALING CONTROLLER
 * Mission: Autonomously scale the fleet based on Treasury health and Market Demand.
 */
import { spawnAgent } from "../agents/agent-spawner";
import { fleetManager } from "../agents/fleet-manager";
export async function runSovereignScalingCycle(treasuryBalance) {
    console.log(`[SCALING_CTRL] Cycle started. Treasury: ${treasuryBalance} Pi`);
    const metrics = fleetManager.getMetrics();
    const utilization = metrics.total > 0 ? (metrics.active / metrics.total) : 0;
    // Scaling Logic: If utilization > 70% and Treasury has > 50 Pi surplus, spawn new worker.
    if (utilization > 0.7 || metrics.total === 0) {
        if (treasuryBalance > 50) {
            console.log(`[SCALING_CTRL] High Demand or Initial State. Spawning additional worker...`);
            const newAgent = await spawnAgent("CODE_GEN", 10);
            fleetManager.register(newAgent);
        }
        else {
            console.warn(`[SCALING_CTRL] High Demand but Insufficient Treasury for expansion.`);
        }
    }
    else {
        console.log(`[SCALING_CTRL] Fleet capacity optimal. Utilization: ${(utilization * 100).toFixed(1)}%`);
    }
}
