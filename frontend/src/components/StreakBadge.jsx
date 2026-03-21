
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

export default function StreakBadge({ kind = "stocks" }) {
  const [val, setVal] = useState(0);

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/streak`);
      const data = await res.json();
      const next = kind === "pm" ? data?.pm : data?.stocks;
      setVal(Number(next || 0));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        border: "1px solid #111827",
        background: "#020617",
        fontSize: 12,
        color: "#e5e7eb",
      }}
      title="Win streak (demo). Backend will update this as real trades settle."
    >
      <span>🔥</span>
      <span>{val}</span>
    </div>
  );
}
