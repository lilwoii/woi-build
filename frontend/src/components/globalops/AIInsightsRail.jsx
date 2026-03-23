export default function AIInsightsRail({ summary, onInsightClick }) {
  if (!summary) return null;

  return (
    <div className="panel ai-insights-rail">
      <h3>AI INSIGHTS</h3>

      <div className="insight-card" onClick={() => onInsightClick?.("world")}>
        <h4>World Brief</h4>
        {(summary.world_brief || []).map((item, i) => (
          <p key={i}>{item}</p>
        ))}
      </div>

      {(summary.strategic_posture || []).map((s, i) => (
        <div
          key={i}
          className="insight-card"
          onClick={() => {
            const label = (s.label || "").toLowerCase();
            if (label.includes("iran") || label.includes("middle east")) onInsightClick?.("middle_east");
            else if (label.includes("europe")) onInsightClick?.("europe");
            else if (label.includes("asia")) onInsightClick?.("asia");
            else if (label.includes("us")) onInsightClick?.("us");
            else onInsightClick?.("world");
          }}
        >
          <h4>{s.label}</h4>
          <p>Severity: {s.severity}</p>
          <p>Air: {s.air} | Sea: {s.sea} | Trend: {s.trend}</p>
        </div>
      ))}
    </div>
  );
}