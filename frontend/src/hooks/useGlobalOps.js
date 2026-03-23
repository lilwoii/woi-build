import { useEffect, useMemo, useState } from "react";
import { getEntities } from "../services/globalOpsService";

export default function useGlobalOpsGlobe() {
  const [entities, setEntities] = useState({
    flights: [],
    news: [],
    webcams: [],
    polymarket: [],
    ships: [],
    heat: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await getEntities();
        setEntities({
          flights: res.data.flights || [],
          news: res.data.news || [],
          webcams: res.data.webcams || [],
          polymarket: res.data.polymarket || [],
          ships: res.data.ships || [],
          heat: res.data.heat || [],
        });
      } catch (err) {
        console.error("Failed to load global ops entities", err);
      }
    }

    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const points = useMemo(() => {
    const mapPoint = (item, type, size, colorKey) => ({
      id: item.id,
      lat: item.lat,
      lng: item.lng,
      size,
      type,
      title: item.title,
      colorKey,
      original: item,
    });

    return [
      ...entities.flights.map((f) => mapPoint(f, "flight", 0.16, "flight")),
      ...entities.news.map((n) => mapPoint(n, "news_event", 0.24, "news")),
      ...entities.webcams.map((w) => mapPoint(w, "webcam", 0.22, "webcam")),
      ...entities.polymarket.map((p) => mapPoint(p, "prediction_market", 0.26, "polymarket")),
      ...entities.ships.map((s) => mapPoint(s, "ship", 0.18, "ship")),
    ];
  }, [entities]);

  const arcs = useMemo(() => {
    return entities.flights
      .filter((f) => Array.isArray(f.metadata?.trail) && f.metadata.trail.length > 0)
      .map((f) => {
        const first = f.metadata.trail[0];
        return {
          startLat: first[1],
          startLng: first[0],
          endLat: f.lat,
          endLng: f.lng,
          flightId: f.id,
          type: "flight",
        };
      });
  }, [entities]);

  const heatPoints = useMemo(() => {
    return entities.heat.map((h) => ({
      lat: h.lat,
      lng: h.lng,
      weight: h.metadata?.intensity || 0.5,
      radius: h.metadata?.radius || 1.0,
      original: h,
    }));
  }, [entities]);

  return {
    entities,
    points,
    arcs,
    heatPoints,
  };
}