import { useState, useEffect } from "react";
// DECOUPLED: Removing direct SovereignBridge import to prevent server-side leak in client bundle.

/**
 * AMRIKYY LAB :: SOVEREIGN STREAM HOOK
 * Mission: Provide real-time access to the Go Muscle event stream.
 */
export function useSovereignStream() {
  const [events, setEvents] = useState<any[]>([]);
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    console.log("🔌 [Hook] Establishing Sovereign Stream connection via SSE...");
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const url = `${baseUrl}/api/sovereign/events`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);
        setEvents((prev) => [...prev.slice(-49), data]);
      } catch (e) {
        console.error('❌ [Hook] Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = () => console.warn('⚠️ [Hook] SSE Connection lost. Retrying...');

    return () => {
      console.log("🔌 [Hook] Closing Sovereign Stream.");
      eventSource.close();
    };
  }, []);

  return { events, lastEvent };
}
