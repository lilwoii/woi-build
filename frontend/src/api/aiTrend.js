// frontend/src/api/aiTrend.js
import { API_BASE_URL } from "../config";

/**
 * Fetch OHLC bars from backend proxy.
 * @param {string} symbol
 * @param {string} timeframe - e.g. "1Min"
 * @param {boolean} useCrypto
 * @param {number} limit
 */
export async function fetchBars(symbol, timeframe = "1Min", useCrypto = false, limit = 300) {
  const params = new URLSearchParams({
    symbol,
    tf: timeframe,
    limit: String(limit),
    crypto: useCrypto ? "1" : "0",
  });

  const res = await fetch(`${API_BASE_URL}/proxy/bars?` + params.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch bars: ${res.status}`);
  }
  return res.json();
}

/**
 * Call the hybrid AI trend endpoint.
 * @param {string} symbol
 * @param {Array} bars - bars from /proxy/bars
 * @param {number} trendId
 * @param {boolean} sendToDiscord
 * @param {string|null} screenshotUrl
 */
export async function analyzeTrend(symbol, bars, trendId = 1, sendToDiscord = true, screenshotUrl = null) {
  // Convert /proxy/bars shape into backend TrendCandle format
  const candles = bars.map((b) => ({
    timestamp: String(b.t),
    open: Number(b.o),
    high: Number(b.h),
    low: Number(b.l),
    close: Number(b.c),
    volume: Number(b.v ?? 0),
  }));

  const res = await fetch(`${API_BASE_URL}/ai/trend/${symbol.toUpperCase()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candles,
      trend_id: trendId,
      send_to_discord: sendToDiscord,
      screenshot_url: screenshotUrl,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Trend analysis failed: ${res.status} ${txt}`);
  }

  return res.json(); // TrendAnalysisResult
}
