import { useEffect, useMemo, useState } from "react";

export default function LiveNewsPanel({ news, onSelectItem }) {
  const [activeSource, setActiveSource] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  const sources = useMemo(() => {
    const unique = Array.from(new Set(news.map((n) => (n.source || "unknown").toLowerCase())));
    return ["ALL", ...unique];
  }, [news]);

  const filtered = useMemo(() => {
    return activeSource === "ALL"
      ? news
      : news.filter((n) => (n.source || "").toLowerCase() === activeSource.toLowerCase());
  }, [news, activeSource]);

  const selected = filtered.find((n) => n.id === selectedId) || filtered[0];

  useEffect(() => {
    if (selected) onSelectItem?.(selected);
  }, [selected, onSelectItem]);

  return (
    <div className="panel news-tv-panel">
      <div className="news-tv-header">
        <h3>LIVE NEWS</h3>
        <div className="news-source-tabs">
          {sources.map((source) => (
            <button
              key={source}
              className={source === activeSource ? "active" : ""}
              onClick={() => setActiveSource(source)}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div className="news-tv-main">
        <div className="news-tv-player">
          <div className="news-live-slot">
            <div className="news-live-overlay">
              <div className="news-live-top">
                <div className="live-pill">
                  <span className="live-dot" />
                  LIVE
                </div>
                <div className="news-tv-controls">
                  <button>Mute</button>
                  <button>Swap</button>
                  <button>Expand</button>
                </div>
              </div>

              <div className="news-live-title">
                <h4>{selected?.title || "No active headline"}</h4>
                <p>{selected?.metadata?.summary || "Live intelligence slot awaiting source payload."}</p>
              </div>
            </div>
          </div>

          <div className="news-tv-ticker">
            {filtered.map((n) => n.metadata?.headline || n.title).join("   •   ")}
          </div>
        </div>

        <div className="news-tv-list">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`news-card ${selected?.id === item.id ? "selected" : ""}`}
              onClick={() => {
                setSelectedId(item.id);
                onSelectItem?.(item);
              }}
            >
              <strong>{item.metadata?.channel || item.source}</strong>
              <p>{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}