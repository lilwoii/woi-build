import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config";

/**
 * Shows Discord profile (if license bound) + license metadata in a small dropdown.
 * Backend returns this from /license/me (single-user desktop instance).
 */
export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const fetchMe = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/license/me`);
      const j = await r.json();
      setMe(j);
    } catch (e) {
      setMe({ ok: false, reason: "backend_offline" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discord = me?.discord;
  const license = me?.license;

  const avatar =
    discord?.avatar_url && discord.avatar_url.length > 0
      ? discord.avatar_url
      : null;

  const maskedKey = (k) => {
    if (!k) return "—";
    if (k.length <= 8) return k;
    return `${k.slice(0, 6)}…${k.slice(-4)}`;
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Account / License"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(15,23,42,0.35)",
          color: "#e5e7eb",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            overflow: "hidden",
            background:
              "radial-gradient(circle at 30% 30%, rgba(56,189,248,.8), rgba(34,197,94,.45) 45%, rgba(15,23,42,.9) 70%)",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(56,189,248,.25)",
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 12 }}>👤</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.05 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>
            {discord?.username || "Not linked"}
          </span>
          <span style={{ fontSize: 11, opacity: 0.72 }}>
            {license?.type ? `${license.type} • ${maskedKey(license.key)}` : "License not verified"}
          </span>
        </div>
        <span style={{ fontSize: 12, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.18)",
            background: "rgba(2,6,23,0.92)",
            boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
            padding: 12,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                overflow: "hidden",
                background: "rgba(15,23,42,0.65)",
                border: "1px solid rgba(56,189,248,.22)",
              }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>
                {discord?.username || "Discord not linked yet"}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {discord?.id ? `Discord ID: ${discord.id}` : "Link via the Discord bot: !bind <license>"}
              </div>
            </div>
            <button
              onClick={fetchMe}
              disabled={loading}
              style={{
                borderRadius: 10,
                border: "1px solid rgba(56,189,248,.25)",
                background: "rgba(56,189,248,.12)",
                color: "#e5e7eb",
                padding: "8px 10px",
                cursor: "pointer",
              }}
              title="Refresh"
            >
              {loading ? "…" : "↻"}
            </button>
          </div>

          <div style={{ height: 10 }} />

          <div
            style={{
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(15,23,42,0.45)",
              padding: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
              License
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Key: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{maskedKey(license?.key)}</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Type: {license?.type || "—"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Expires: {license?.expires_at ? license.expires_at.replace("T", " ").replace("Z", "") : "—"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
