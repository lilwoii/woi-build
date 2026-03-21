import React from "react";

export default function AIStatus({ signal }) {
  if (!signal) return null;

  const action = signal.action ? signal.action.toUpperCase() : "NEUTRAL";
  const actionKey = action.toLowerCase();
  const actionClass = actionKey === "buy" ? "ai-buy" : actionKey === "sell" ? "ai-sell" : "ai-neutral";

  const confRaw =
    typeof signal.confidence === "number"
      ? signal.confidence * 100
      : signal.confidence;
  const conf =
    typeof confRaw === "number" ? Math.max(0, Math.min(confRaw, 100)) : null;
    const confLevel = conf === null ? "conf-na" : conf >= 75 ? "conf-high" : conf >= 50 ? "conf-med" : "conf-low";

  const reason = signal.reasoning || "";

  return (
    <div className="card ai-card">
      <div className="card-title">AI Signal</div>
      <div className="ai-main-row">
        <span className={`ai-action ${actionClass}`}>{action}</span>
        {conf !== null && <span className={`ai-conf ${confLevel}`}>({conf.toFixed(1)}%)</span>}
      </div>
      {reason && <div className="ai-reason">{reason}</div>}

      {conf !== null && (
        <div style={{ marginTop: "10px" }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              marginBottom: "4px",
            }}
          >
            Confidence heatmap
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              borderRadius: "999px",
              background: "rgba(15,23,42,0.9)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${conf}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg,#ef4444,#eab308,#22c55e,#22c55e)",
                transition: "width 0.2s ease-out",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
