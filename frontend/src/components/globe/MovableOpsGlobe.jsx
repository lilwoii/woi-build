import React, { useMemo, useRef, useState } from "react";

function projectPoint(lat, lon, rotationX, rotationY, width, height) {
  const x = ((lon + 180 + rotationX) % 360) / 360;
  const y = (90 - (lat + rotationY)) / 180;
  return {
    x: x * width,
    y: y * height,
  };
}

export default function MovableOpsGlobe({ points = [] }) {
  const wrapRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [last, setLast] = useState({ x: 0, y: 0 });

  const width = 920;
  const height = 420;

  const plotted = useMemo(() => {
    return points.map((p) => {
      const pos = projectPoint(Number(p.lat || 0), Number(p.lon || 0), rotation.x, rotation.y, width, height);
      return { ...p, ...pos };
    });
  }, [points, rotation]);

  const onMouseDown = (e) => {
    setDragging(true);
    setLast({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    setRotation((prev) => ({
      x: prev.x - dx * 0.25,
      y: Math.max(-45, Math.min(45, prev.y + dy * 0.15)),
    }));
    setLast({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => setDragging(false);

  return (
    <div
      ref={wrapRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseUp}
      onMouseUp={onMouseUp}
      style={{
        position: "relative",
        width: "100%",
        minHeight: height,
        background:
          "radial-gradient(circle at 50% 50%, rgba(37,99,235,0.20), rgba(2,6,23,1) 60%)",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.25,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          zIndex: 2,
          fontWeight: 800,
          color: "#fff",
        }}
      >
        🌍 WOI Ops Globe
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Drag to rotate the world view • desktop-friendly map/globe layer
        </div>
      </div>

      {plotted.map((p) => (
        <div
          key={p.id || p.event_id || `${p.title}-${p.lat}-${p.lon}`}
          title={`${p.title} • ${p.region || ""}`}
          style={{
            position: "absolute",
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background:
                p.urgency === "critical"
                  ? "#ef4444"
                  : p.urgency === "high"
                  ? "#f97316"
                  : p.urgency === "medium"
                  ? "#facc15"
                  : "#22c55e",
              boxShadow: "0 0 18px rgba(255,255,255,0.35)",
            }}
          />
        </div>
      ))}
    </div>
  );
}