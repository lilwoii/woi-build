import React, { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

const PARTY = {
  D: { label: "Dem", icon: "🔵" },
  R: { label: "Rep", icon: "🔴" },
  I: { label: "Ind", icon: "🟣" },
};

const DEFAULT_PEOPLE = [
  { id: "pelosi", name: "Nancy Pelosi", party: "D" },
  { id: "crenshaw", name: "Dan Crenshaw", party: "R" },
  { id: "gillibrand", name: "Kirsten Gillibrand", party: "D" },
  { id: "tuberville", name: "Tommy Tuberville", party: "R" },
  { id: "warren", name: "Elizabeth Warren", party: "D" },
];

function badge(party) {
  const p = PARTY[party] || { icon: "⚪️", label: "—" };
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, opacity: 0.9 }}>
      <span>{p.icon}</span>
      <span style={{ opacity: 0.7 }}>{p.label}</span>
    </span>
  );
}

export default function CongressTracker() {
  const [people, setPeople] = useState(() => {
    const saved = localStorage.getItem("woi_congress_people");
    return saved ? JSON.parse(saved) : DEFAULT_PEOPLE;
  });
  const [followed, setFollowed] = useState(() => {
    const saved = localStorage.getItem("woi_congress_followed");
    return saved ? JSON.parse(saved) : [];
  });

  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("AAPL");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => localStorage.setItem("woi_congress_people", JSON.stringify(people)), [people]);
  useEffect(() => localStorage.setItem("woi_congress_followed", JSON.stringify(followed)), [followed]);

  const toggleFollow = (id) => setFollowed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addPerson = () => {
    const name = prompt("Enter politician name");
    if (!name) return;
    const party = (prompt("Party: D / R / I", "D") || "D").toUpperCase();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setPeople((prev) => [...prev, { id, name, party: PARTY[party] ? party : "I" }]);
  };

  const loadTrades = async () => {
    setLoading(true);
    setErr("");
    try {
      const s = (symbol || "").trim().toUpperCase();
      const res = await fetch(`${API_BASE_URL}/openbb/government_trades?symbol=${encodeURIComponent(s)}&limit=300`);
      const j = await res.json();
      if (!j?.ok) {
        setRows([]);
        setErr(j?.reason || j?.error || "OpenBB unavailable. Install + configure OpenBB on this machine.");
      } else {
        setRows(Array.isArray(j.rows) ? j.rows : []);
      }
    } catch (e) {
      setRows([]);
      setErr("Failed to load OpenBB government trades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q));
  }, [people, search]);

  const repKey = (r) => (r.representative || r.name || r.reporter || r.member || "").toString().trim();

  const tradeRows = useMemo(() => {
    // Map rows to a normalized format (best-effort)
    return rows.map((r) => ({
      date: r.date || r.transaction_date || r.datetime || r.report_date || "",
      representative: repKey(r),
      ticker: r.symbol || r.ticker || r.asset || symbol,
      type: r.transaction_type || r.type || r.transaction || "",
      amount: r.amount || r.range || r.value || "",
      description: r.description || r.asset_description || r.name || "",
      raw: r,
    }));
  }, [rows, symbol]);

  const columns = ["date", "representative", "ticker", "type", "amount"];

  const followedNames = useMemo(() => new Set(followed.map((id) => people.find((p) => p.id === id)?.name).filter(Boolean)), [
    followed,
    people,
  ]);

  const visibleTrades = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = tradeRows;
    if (q) {
      out = out.filter(
        (t) =>
          (t.representative || "").toLowerCase().includes(q) ||
          (t.ticker || "").toLowerCase().includes(q) ||
          (t.type || "").toLowerCase().includes(q)
      );
    }
    // If any followed, prioritize followed
    if (followedNames.size) {
      const followedTrades = out.filter((t) => followedNames.has(t.representative));
      return [...followedTrades, ...out.filter((t) => !followedNames.has(t.representative))].slice(0, 120);
    }
    return out.slice(0, 120);
  }, [tradeRows, search, followedNames]);

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>🏛️ Congressional Tracker</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>OpenBB-powered government trades + follow list</div>
        <div style={{ flex: 1 }} />
        <button className="pill" onClick={addPerson}>
          + Add
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people / tickers…"
              style={{
                flex: 1,
                background: "#030712",
                border: "1px solid #111827",
                color: "white",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            />
          </div>

          <div style={{ display: "grid", gap: 8, maxHeight: 520, overflow: "auto" }}>
            {filteredPeople.map((p) => {
              const isFollowed = followed.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="rowCard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #111827",
                    background: "rgba(2,6,23,0.35)",
                  }}
                >
                  <div style={{ display: "grid", gap: 3 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                      {p.name} {badge(p.party)}
                    </div>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>
                      {isFollowed ? "Followed ✅ (prioritized in trades list)" : "Not followed"}
                    </div>
                  </div>
                  <button className="pill" onClick={() => toggleFollow(p.id)}>
                    {isFollowed ? "Unfollow" : "Follow"}
                  </button>
                </div>
              );
            })}
            {!filteredPeople.length ? <div style={{ opacity: 0.65 }}>No matches.</div> : null}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ opacity: 0.75, fontSize: 12 }}>Trades for symbol</div>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadTrades()}
              style={{
                width: 120,
                background: "#030712",
                border: "1px solid #111827",
                color: "white",
                borderRadius: 10,
                padding: "10px 12px",
              }}
              placeholder="AAPL"
            />
            <button className="pill" onClick={loadTrades} disabled={loading}>
              {loading ? "Loading…" : "Load"}
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ opacity: 0.65, fontSize: 12 }}>{rows.length ? `${rows.length} rows` : "—"}</div>
          </div>

          {err ? <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 10 }}>{err}</div> : null}

          <div style={{ overflow: "auto", borderRadius: 12, border: "1px solid #111827" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#020617" }}>
                  {columns.map((c) => (
                    <th key={c} style={{ padding: "10px 10px", borderBottom: "1px solid #111827", opacity: 0.75 }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTrades.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(17,24,39,0.6)" }}>
                    <td style={{ padding: "9px 10px", opacity: 0.9, whiteSpace: "nowrap" }}>{String(t.date)}</td>
                    <td style={{ padding: "9px 10px", opacity: 0.95 }}>
                      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <span style={{ opacity: 0.9 }}>{t.representative || "—"}</span>
                        {followedNames.has(t.representative) ? <span title="Followed">⭐</span> : null}
                      </span>
                    </td>
                    <td style={{ padding: "9px 10px", opacity: 0.9 }}>{String(t.ticker)}</td>
                    <td style={{ padding: "9px 10px", opacity: 0.9 }}>{String(t.type)}</td>
                    <td style={{ padding: "9px 10px", opacity: 0.9 }}>{String(t.amount)}</td>
                  </tr>
                ))}
                {!visibleTrades.length ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: 14, opacity: 0.6 }}>
                      No trades loaded yet. Make sure OpenBB is installed + providers configured.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12, lineHeight: 1.45 }}>
            Tip: follow a few politicians to pin their trades to the top. Next step can be “AI Coach: follow X + alert
            when they buy/sell”.
          </div>
        </div>
      </div>
    </div>
  );
}
