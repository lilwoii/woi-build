export const REGION_VIEWS = {
  world: { lat: 20, lng: 0, altitude: 2.2 },
  us: { lat: 38, lng: -97, altitude: 1.5 },
  europe: { lat: 50, lng: 10, altitude: 1.45 },
  middle_east: { lat: 29, lng: 45, altitude: 1.35 },
  asia: { lat: 20, lng: 105, altitude: 1.55 },
  red_sea: { lat: 20, lng: 40, altitude: 1.8 },
};

export function normalizeRegionKey(region) {
  if (!region) return "world";
  const value = region.toLowerCase();

  if (value.includes("united states") || value === "us") return "us";
  if (value.includes("europe")) return "europe";
  if (value.includes("middle east")) return "middle_east";
  if (value.includes("asia")) return "asia";
  if (value.includes("red sea")) return "red_sea";

  return "world";
}