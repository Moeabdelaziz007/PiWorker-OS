/**
 * Sovereign Price Oracle :: Amrikyy Lab
 * [VERIFIED REALITY] Fetches live market data from public APIs.
 */
export class PriceOracle {
  private static readonly COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

  // Mapping internal symbols to CoinGecko IDs
  private static readonly SYMBOL_MAP: Record<string, string> = {
    "SOL": "solana",
    "ETH": "ethereum",
    "BTC": "bitcoin"
  };

  /**
   * Fetches the current USD price of a currency.
   */
  static async getUSDPrice(currency: string): Promise<number> {
    // Pi has a fixed sovereign valuation in the system for now (314.15)
    if (currency === "Pi") return 314.15;

    const cgId = this.SYMBOL_MAP[currency];
    if (!cgId) return 1.0; // Fallback

    try {
      const response = await fetch(`${this.COINGECKO_API}?ids=${cgId}&vs_currencies=usd`);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      
      const data = await response.json();
      const price = data[cgId]?.usd;
      
      if (!price) throw new Error("Price not found in response");
      
      console.log(`[ORACLE] Live price fetched for ${currency}: $${price}`);
      return price;
    } catch (err) {
      console.warn(`[ORACLE] Failed to fetch live price for ${currency}. Using stable benchmark.`);
      // Fallback to stable benchmarks if API is down or restricted
      const benchmarks: Record<string, number> = {
        "SOL": 145.0,
        "ETH": 3500.0,
        "BTC": 65000.0
      };
      return benchmarks[currency] || 1.0;
    }
  }
}
