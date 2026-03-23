import { useCallback, useMemo, useState } from "react";
import { normalizeRegionKey } from "../components/globalops/globeRegions";

export default function useGlobalOpsController() {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [focusedRegionKey, setFocusedRegionKey] = useState("world");
  const [tickerItems, setTickerItems] = useState([]);

  const focusRegionFromName = useCallback((regionName) => {
    setFocusedRegionKey(normalizeRegionKey(regionName));
  }, []);

  const selectEntity = useCallback((entity) => {
    setSelectedEntity(entity || null);
    if (entity?.original?.region || entity?.region) {
      focusRegionFromName(entity.original?.region || entity.region);
    }
  }, [focusRegionFromName]);

  const pushTickerItems = useCallback((items) => {
    setTickerItems(Array.isArray(items) ? items : []);
  }, []);

  return useMemo(() => ({
    selectedEntity,
    setSelectedEntity,
    focusedRegionKey,
    setFocusedRegionKey,
    focusRegionFromName,
    selectEntity,
    tickerItems,
    pushTickerItems,
  }), [
    selectedEntity,
    focusedRegionKey,
    focusRegionFromName,
    selectEntity,
    tickerItems,
    pushTickerItems,
  ]);
}