import React, { useEffect, useState } from "react";
import { woiApi } from "../services/woiApi";
import WOIChatConsole from "../components/woi/WOIChatConsole";
import WOIResonancePanel from "../components/woi/WOIResonancePanel";
import WOIPolymarketControls from "../components/woi/WOIPolymarketControls";

export default function WOILab() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      setError(null);
      const s = await woiApi.status();
      setStatus(s);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>WOI Lab</div>
        <button
          onClick={refresh}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(240,255,250,0.92)",
            cursor: "pointer"
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, border: "1px solid rgba(255,120,120,0.25)", background: "rgba(255,120,120,0.08)", color: "rgba(255,230,230,0.95)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flex: 1, minWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
          <WOIChatConsole />
          <WOIPolymarketControls status={status} onRefresh={refresh} />
        </div>

        <WOIResonancePanel status={status} />
      </div>
    </div>
  );
}
