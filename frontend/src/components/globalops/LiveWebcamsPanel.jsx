import { useMemo, useState } from "react";

export default function LiveWebcamsPanel({ webcams, onSelectEntity, onFocusRegion }) {
  const [region, setRegion] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  const regions = useMemo(() => {
    const unique = Array.from(new Set(webcams.map((w) => w.region || "Unknown")));
    return ["ALL", ...unique];
  }, [webcams]);

  const filtered = useMemo(() => {
    return region === "ALL" ? webcams : webcams.filter((w) => w.region === region);
  }, [webcams, region]);

  const selected = filtered.find((w) => w.id === selectedId) || filtered[0];

  function handleSelect(cam) {
    setSelectedId(cam.id);
    onSelectEntity?.(cam);
    onFocusRegion?.(cam.region);
  }

  return (
    <div className="panel webcams-panel">
      <div className="webcams-header">
        <h3>LIVE WEBCAMS</h3>
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="webcams-main">
        <div className="webcam-focus">
          <div
            className="webcam-screen"
            style={
              selected?.metadata?.thumbnail
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(15, 28, 40, 0.2), rgba(0, 0, 0, 0.5)), url(${selected.metadata.thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className="webcam-overlay">
              <strong>{selected?.title || "No camera selected"}</strong>
              <span>{selected?.region || "Unknown region"}</span>
            </div>
          </div>
        </div>

        <div className="webcams-grid">
          {filtered.map((cam) => (
            <div
              key={cam.id}
              className={`webcam-card ${selected?.id === cam.id ? "selected" : ""}`}
              onClick={() => handleSelect(cam)}
            >
              <div
                className="webcam-thumb"
                style={
                  cam.metadata?.thumbnail
                    ? {
                        backgroundImage: `url(${cam.metadata.thumbnail})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <div className="webcam-meta">
                <strong>{cam.title}</strong>
                <span>{cam.region}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}