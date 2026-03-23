export default function EntityDetailCard({ entity }) {
  if (!entity) {
    return (
      <div className="panel entity-detail">
        <h3>ENTITY DETAIL</h3>
        <p>Select a point on the globe.</p>
      </div>
    );
  }

  const item = entity.original || entity;
  const md = item.metadata || {};

  return (
    <div className="panel entity-detail">
      <h3>ENTITY DETAIL</h3>
      <div className="entity-detail-head">
        <strong>{item.title}</strong>
        <span className={`severity severity-${item.severity || "low"}`}>{item.severity || "low"}</span>
      </div>

      <p>Type: {item.type}</p>
      <p>Region: {item.region || "Unknown"}</p>
      <p>Source: {item.source || "Unknown"}</p>

      {md.channel && <p>Channel: {md.channel}</p>}
      {md.headline && <p>Headline: {md.headline}</p>}
      {md.summary && <p>Summary: {md.summary}</p>}
      {md.altitude && <p>Altitude: {md.altitude}</p>}
      {md.speed && <p>Speed: {md.speed}</p>}
      {md.question && <p>Market: {md.question}</p>}
      {typeof md.yes_price === "number" && <p>Yes Price: {md.yes_price}</p>}
      {typeof md.no_price === "number" && <p>No Price: {md.no_price}</p>}
      {md.class && <p>Class: {md.class}</p>}
    </div>
  );
}