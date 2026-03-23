import { useMemo, useState } from "react";
import useGlobalOpsGlobe from "../../hooks/useGlobalOpsGlobe";

export default function PolymarketPanel({ onSelectItem }) {
  const { entities } = useGlobalOpsGlobe();
  const [region, setRegion] = useState("ALL");

  const markets = entities.polymarket || [];

  const regions = useMemo(() => {
    const unique = Array.from(new Set(markets.map((m) => m.region || "Unknown")));
    return ["ALL", ...unique];
  }, [markets]);

  const filtered = useMemo(() => {
    return region === "ALL" ? markets : markets.filter((m) => m.region === region);
  }, [markets, region]);

  return (
    <div className="panel polymarket-panel">
      <div className="webcams-header">
        <h3>POLYMARKET</h3>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="polymarket-list">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="polymarket-card"
            onClick={() => onSelectItem?.(item)}
          >
            <strong>{item.title}</strong>
            <p>{item.metadata?.question}</p>
            <div className="polymarket-stats">
              <span>Yes: {item.metadata?.yes_price}</span>
              <span>No: {item.metadata?.no_price}</span>
              <span>Vol: {item.metadata?.volume}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}