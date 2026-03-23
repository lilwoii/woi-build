import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import useGlobalOpsGlobe from "../../hooks/useGlobalOpsGlobe";
import GlobeControls from "./GlobeControls";
import EntityDetailCard from "./EntityDetailCard";
import GlobalOpsTopBar from "./GlobalOpsTopBar";
import { REGION_VIEWS, normalizeRegionKey } from "./globeRegions";

function getPointColor(point) {
  if (point.colorKey === "flight") return "#66d9ff";
  if (point.colorKey === "news") return "#ff6b6b";
  if (point.colorKey === "webcam") return "#ffd166";
  if (point.colorKey === "polymarket") return "#b892ff";
  if (point.colorKey === "ship") return "#7ee081";
  return "#ffffff";
}

export default function GlobalOpsGlobe({
  externallySelectedEntity,
  onSelectEntity,
  forcedRegionKey,
}) {
  const globeRef = useRef();
  const containerRef = useRef();
  const { points, arcs, heatPoints } = useGlobalOpsGlobe();

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showFlights, setShowFlights] = useState(true);
  const [showNews, setShowNews] = useState(true);
  const [showWebcams, setShowWebcams] = useState(true);
  const [showPolymarket, setShowPolymarket] = useState(true);
  const [showShips, setShowShips] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [newsSource, setNewsSource] = useState("ALL");

  const [dimensions, setDimensions] = useState({ width: 900, height: 700 });

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = Math.max(640, window.innerHeight * 0.68);
      setDimensions({ width, height });
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.35;
    controls.enablePan = false;
    controls.minDistance = 140;
    controls.maxDistance = 420;
  }, [autoRotate]);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (p.type === "flight" && !showFlights) return false;
      if (p.type === "news_event" && !showNews) return false;
      if (p.type === "webcam" && !showWebcams) return false;
      if (p.type === "prediction_market" && !showPolymarket) return false;
      if (p.type === "ship" && !showShips) return false;

      if (selectedRegion !== "ALL" && p.original?.region !== selectedRegion) return false;
      if (entityFilter !== "ALL" && p.type !== entityFilter) return false;

      if (
        newsSource !== "ALL" &&
        p.type === "news_event" &&
        (p.original?.source || "").toLowerCase() !== newsSource.toLowerCase()
      ) return false;

      return true;
    });
  }, [
    points,
    showFlights,
    showNews,
    showWebcams,
    showPolymarket,
    showShips,
    selectedRegion,
    entityFilter,
    newsSource,
  ]);

  const filteredArcs = useMemo(() => {
    if (!showFlights) return [];
    return arcs.filter((a) => {
      if (selectedRegion === "ALL") return true;
      const flight = points.find((p) => p.id === a.flightId);
      return flight?.original?.region === selectedRegion;
    });
  }, [arcs, showFlights, selectedRegion, points]);

  const ringsData = useMemo(() => {
    return filteredPoints.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      color: getPointColor(p),
      maxR: p.type === "news_event" || p.type === "prediction_market" ? 4.8 : 3.2,
      propagationSpeed: 1.6,
      repeatPeriod: 1400,
    }));
  }, [filteredPoints]);

  const filteredHeat = useMemo(() => {
    if (!showHeat) return [];
    if (selectedRegion === "ALL") return heatPoints;
    return heatPoints.filter((h) => h.original?.region === selectedRegion);
  }, [heatPoints, showHeat, selectedRegion]);

  function focusRegion(regionKey) {
    const pov = REGION_VIEWS[regionKey] || REGION_VIEWS.world;
    if (globeRef.current) {
      globeRef.current.pointOfView(pov, 1200);
    }
  }

  function handlePointClick(point) {
    setSelectedEntity(point);
    onSelectEntity?.(point);
  }

  useEffect(() => {
    focusRegion("world");
  }, []);

  useEffect(() => {
    if (!forcedRegionKey) return;
    focusRegion(forcedRegionKey);
  }, [forcedRegionKey]);

  useEffect(() => {
    if (!externallySelectedEntity) return;

    const matched = filteredPoints.find((p) => {
      const item = p.original || p;
      const external = externallySelectedEntity.original || externallySelectedEntity;
      return item.id === external.id;
    });

    setSelectedEntity(matched || externallySelectedEntity);

    const regionName =
      externallySelectedEntity.original?.region || externallySelectedEntity.region;

    if (regionName) {
      focusRegion(normalizeRegionKey(regionName));
    }
  }, [externallySelectedEntity, filteredPoints]);

  return (
    <div className="global-ops-globe-wrapper">
      <GlobalOpsTopBar
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        entityFilter={entityFilter}
        setEntityFilter={setEntityFilter}
        newsSource={newsSource}
        setNewsSource={setNewsSource}
      />

      <div className="global-ops-globe-shell">
        <div className="global-ops-globe-main" ref={containerRef}>
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor="#4da3ff"
            atmosphereAltitude={0.18}
            pointsData={filteredPoints}
            pointLat={(d) => d.lat}
            pointLng={(d) => d.lng}
            pointAltitude={(d) => d.size}
            pointRadius={0.32}
            pointColor={getPointColor}
            pointLabel={(d) => `${d.title} (${d.type})`}
            onPointClick={handlePointClick}
            arcsData={filteredArcs}
            arcStartLat={(d) => d.startLat}
            arcStartLng={(d) => d.startLng}
            arcEndLat={(d) => d.endLat}
            arcEndLng={(d) => d.endLng}
            arcAltitude={0.18}
            arcStroke={0.45}
            arcDashLength={0.5}
            arcDashGap={0.25}
            arcDashAnimateTime={1800}
            ringsData={ringsData}
            ringLat={(d) => d.lat}
            ringLng={(d) => d.lng}
            ringColor={(d) => d.color}
            ringMaxRadius={(d) => d.maxR}
            ringPropagationSpeed={(d) => d.propagationSpeed}
            ringRepeatPeriod={(d) => d.repeatPeriod}
            labelsData={filteredHeat}
            labelLat={(d) => d.lat}
            labelLng={(d) => d.lng}
            labelText={() => "●"}
            labelSize={(d) => 0.9 + d.weight * 1.6}
            labelDotRadius={(d) => 0.3 + d.weight * 0.35}
            labelColor={() => "rgba(255,90,90,0.75)"}
          />
        </div>

        <div className="global-ops-globe-side">
          <GlobeControls
            showFlights={showFlights}
            setShowFlights={setShowFlights}
            showNews={showNews}
            setShowNews={setShowNews}
            showWebcams={showWebcams}
            setShowWebcams={setShowWebcams}
            showPolymarket={showPolymarket}
            setShowPolymarket={setShowPolymarket}
            showShips={showShips}
            setShowShips={setShowShips}
            showHeat={showHeat}
            setShowHeat={setShowHeat}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
            focusRegion={focusRegion}
          />
          <EntityDetailCard entity={selectedEntity} />
        </div>
      </div>
    </div>
  );
}