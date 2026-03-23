export default function GlobeControls({
  showFlights,
  setShowFlights,
  showNews,
  setShowNews,
  showWebcams,
  setShowWebcams,
  showPolymarket,
  setShowPolymarket,
  showShips,
  setShowShips,
  showHeat,
  setShowHeat,
  autoRotate,
  setAutoRotate,
  focusRegion,
}) {
  return (
    <div className="panel globe-controls">
      <h3>GLOBE LAYERS</h3>

      <label><input type="checkbox" checked={showFlights} onChange={(e) => setShowFlights(e.target.checked)} /> Flights</label>
      <label><input type="checkbox" checked={showNews} onChange={(e) => setShowNews(e.target.checked)} /> News</label>
      <label><input type="checkbox" checked={showWebcams} onChange={(e) => setShowWebcams(e.target.checked)} /> Webcams</label>
      <label><input type="checkbox" checked={showPolymarket} onChange={(e) => setShowPolymarket(e.target.checked)} /> Polymarket</label>
      <label><input type="checkbox" checked={showShips} onChange={(e) => setShowShips(e.target.checked)} /> Ships</label>
      <label><input type="checkbox" checked={showHeat} onChange={(e) => setShowHeat(e.target.checked)} /> Threat Heat</label>
      <label><input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} /> Auto Rotate</label>

      <div className="region-focus-buttons">
        <button onClick={() => focusRegion("world")}>World</button>
        <button onClick={() => focusRegion("us")}>US</button>
        <button onClick={() => focusRegion("europe")}>Europe</button>
        <button onClick={() => focusRegion("middle_east")}>Middle East</button>
        <button onClick={() => focusRegion("asia")}>Asia</button>
      </div>
    </div>
  );
}