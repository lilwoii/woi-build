import { useMemo } from "react";

export default function GlobalOpsTickerBar({ news = [], summary = null }) {
  const tickerText = useMemo(() => {
    const newsItems = news.map((n) => n.metadata?.headline || n.title);
    const briefItems = summary?.world_brief || [];
    const allItems = [...briefItems, ...newsItems].filter(Boolean);

    return allItems.length
      ? allItems.join("   •   ")
      : "WOI Global Ops live ticker awaiting incoming intelligence.";
  }, [news, summary]);

  return (
    <div className="global-ops-ticker-bar">
      <div className="ticker-label">
        <span className="live-dot" />
        Live Feed
      </div>
      <div className="ticker-marquee">
        <div className="ticker-track">{tickerText}</div>
      </div>
    </div>
  );
}