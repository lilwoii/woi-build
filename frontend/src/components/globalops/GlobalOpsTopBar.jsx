export default function GlobalOpsTopBar({
  selectedRegion,
  setSelectedRegion,
  entityFilter,
  setEntityFilter,
  newsSource,
  setNewsSource,
}) {
  return (
    <div className="panel global-ops-topbar">
      <div className="toolbar-group">
        <span>REGION</span>
        <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
          <option value="ALL">All</option>
          <option value="United States">United States</option>
          <option value="Europe">Europe</option>
          <option value="Middle East">Middle East</option>
          <option value="Asia">Asia</option>
          <option value="Red Sea">Red Sea</option>
        </select>
      </div>

      <div className="toolbar-group">
        <span>ENTITY</span>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="flight">Flights</option>
          <option value="news_event">News</option>
          <option value="webcam">Webcams</option>
          <option value="prediction_market">Polymarket</option>
          <option value="ship">Ships</option>
        </select>
      </div>

      <div className="toolbar-group">
        <span>NEWS SOURCE</span>
        <select value={newsSource} onChange={(e) => setNewsSource(e.target.value)}>
          <option value="ALL">All</option>
          <option value="bloomberg">Bloomberg</option>
          <option value="cnbc">CNBC</option>
          <option value="aljazeera">Al Jazeera</option>
          <option value="cnn">CNN</option>
          <option value="skynews">Sky News</option>
        </select>
      </div>
    </div>
  );
}