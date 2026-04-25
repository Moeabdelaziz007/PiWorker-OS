/**
 * 🎺 Sovereign Herald Plugin
 * Role: Emergency broadcasting and system-wide announcements.
 * Logic: Alerts all agents in the swarm about critical network events.
 */

(function() {
  console.log("🎺 [Sovereign-Herald] Monitoring system-wide broadcasts...");

  // 1. Listen for Master Governance Alerts
  const alert = fetch("https://api.piworker.ai/v1/alerts/emergency");

  if (alert.startsWith("ERROR") || alert === "null" || alert === "") {
    return { success: true, status: "SILENCE_IS_GOLDEN", last_check: new Date().toISOString() };
  }

  try {
    const alertData = JSON.parse(alert);
    console.log(`🚨 [Sovereign-Herald] CRITICAL_ALERT_DETECTED: ${alertData.message}`);

    return {
      success: true,
      alert_id: alertData.id,
      priority: alertData.priority,
      message: alertData.message,
      action_required: "ENTER_SAFE_MODE"
    };
  } catch (e) {
    return { success: false, error: "ALERT_SIGNAL_CORRUPT" };
  }
})();
