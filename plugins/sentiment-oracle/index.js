/**
 * 🔮 Sentiment Oracle Plugin
 * Role: Real-time analysis of social sentiment for the Pi Network.
 * Logic: Aggregates community signals to predict market volatility.
 */

(function() {
  console.log("🔮 [Sentiment-Oracle] Listening to the digital heartbeat...");

  // 1. Fetch social signals
  const signals = fetch("https://api.piworker.ai/v1/oracle/sentiment");

  if (signals.startsWith("ERROR")) {
    console.log("⚠️ [Sentiment-Oracle] Oracle signal lost. Using local baseline.");
    return { success: true, sentiment: "NEUTRAL", confidence: 0.5 };
  }

  try {
    const data = JSON.parse(signals);
    console.log(`📡 [Sentiment-Oracle] Sentiment Index: ${data.index} (${data.mood})`);

    return {
      success: true,
      sentiment: data.mood,
      confidence: data.confidence,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { success: false, error: "SIGNAL_DECODE_FAILED" };
  }
})();
