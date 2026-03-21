export function normKey(s) {
  return String(s||"").trim().toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\./g,"")
    .replace(/,/g,"");
}

export function volumeToIntensity(v) {
  const x = Number(v || 0);
  if (!isFinite(x) || x <= 0) return 0;
  const l = Math.log10(1 + x);
  return Math.max(0, Math.min(1, l / 6));
}

export function shadeRGBA(intensity) {
  const a = 0.06 + intensity * 0.44;
  return `rgba(120,255,210,${a.toFixed(3)})`;
}

export function buildRegionMap(byRegion) {
  const m = new Map();
  if (!byRegion) return m;
  for (const [k,v] of Object.entries(byRegion)) {
    m.set(normKey(k), Number(v||0));
  }
  return m;
}

export function findVolumeForRegion(regionMap, name) {
  if (!name) return 0;
  const key = normKey(name);
  if (regionMap.has(key)) return regionMap.get(key);
  const alias = {
    "united states of america": "united states",
    "usa": "united states",
    "u s a": "united states",
    "russian federation": "russia",
    "iran (islamic republic of)": "iran",
    "korea, republic of": "south korea",
    "korea (republic of)": "south korea",
  };
  if (alias[key] && regionMap.has(alias[key])) return regionMap.get(alias[key]);
  return 0;
}

export function volumeTier(v){
  const x = Number(v||0);
  if (!isFinite(x) || x <= 0) return "LOW";
  if (x >= 1_000_000) return "HIGH";
  if (x >= 100_000) return "MID";
  return "LOW";
}

// On-globe label centroids (fallback)
export const REGION_CENTROIDS = {
  "united states": { lat: 39.8283, lng: -98.5795 },
  "california": { lat: 36.7783, lng: -119.4179 },
  "texas": { lat: 31.0, lng: -100.0 },
  "new york": { lat: 43.0, lng: -75.0 },
  "florida": { lat: 28.0, lng: -82.0 },
  "poland": { lat: 52.2370, lng: 21.0175 },
  "ukraine": { lat: 48.3794, lng: 31.1656 },
  "germany": { lat: 51.1657, lng: 10.4515 },
  "france": { lat: 46.2276, lng: 2.2137 },
  "united kingdom": { lat: 55.3781, lng: -3.4360 },
  "uk": { lat: 55.3781, lng: -3.4360 },
  "russia": { lat: 61.5240, lng: 105.3188 },
  "iran": { lat: 32.4279, lng: 53.6880 },
  "china": { lat: 35.8617, lng: 104.1954 },
  "israel": { lat: 31.0461, lng: 34.8516 },
  "gaza": { lat: 31.3547, lng: 34.3088 },
  "taiwan": { lat: 23.6978, lng: 120.9605 },
  "north korea": { lat: 40.3399, lng: 127.5101 },
  "south korea": { lat: 35.9078, lng: 127.7669 },
  "japan": { lat: 36.2048, lng: 138.2529 },
  "canada": { lat: 56.1304, lng: -106.3468 },
  "mexico": { lat: 23.6345, lng: -102.5528 },
};

export function centroidFor(regionName) {
  const k = normKey(regionName);
  return REGION_CENTROIDS[k] || null;
}

// Minimal US FIPS -> state name for us-atlas states-10m
export const US_FIPS_TO_NAME = {
  "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California","08":"Colorado","09":"Connecticut",
  "10":"Delaware","11":"District of Columbia","12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois",
  "18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland","25":"Massachusetts",
  "26":"Michigan","27":"Minnesota","28":"Mississippi","29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire",
  "34":"New Jersey","35":"New Mexico","36":"New York","37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon",
  "42":"Pennsylvania","44":"Rhode Island","45":"South Carolina","46":"South Dakota","47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont",
  "51":"Virginia","53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"
};

export function stateNameFromId(id){
  const s = String(id||"").padStart(2,"0");
  return US_FIPS_TO_NAME[s] || null;
}

// Polygon centroid for GeoJSON Polygon/MultiPolygon (rough but good for label placement)
export function polygonCentroid(feature){
  try{
    const geom = feature?.geometry;
    if (!geom) return null;
    const coords = geom.coordinates;
    let pts = [];
    if (geom.type === "Polygon"){
      pts = coords?.[0] || [];
    } else if (geom.type === "MultiPolygon"){
      pts = coords?.[0]?.[0] || [];
    } else return null;

    if (!pts.length) return null;
    let x=0, y=0;
    for (const p of pts){
      x += p[0]; y += p[1];
    }
    return { lng: x/pts.length, lat: y/pts.length };
  }catch{
    return null;
  }
}

// Parse location string to best-known region key
export function extractRegionFromLocation(loc){
  const s = normKey(loc);
  if (!s) return "";
  // exact centroid keys
  for (const k of Object.keys(REGION_CENTROIDS)){
    if (s.includes(k)) return k;
  }
  // US states by name
  for (const st of Object.values(US_FIPS_TO_NAME)){
    const k = normKey(st);
    if (s.includes(k)) return st;
  }
  // common abbreviations
  const ab = { "ca":"California","tx":"Texas","ny":"New York","fl":"Florida","wa":"Washington","or":"Oregon","il":"Illinois","pa":"Pennsylvania" };
  const m = s.match(/\b([a-z]{2})\b/);
  if (m && ab[m[1]]) return ab[m[1]];
  return "";
}

// Best-effort keyword inference when location missing.
// This is intentionally conservative (pins are better than none), but won't pretend to be perfect.
export const KEYWORD_GEO = [
  { k: ["kyiv","kiev"], r: "ukraine" },
  { k: ["moscow","kremlin","st petersburg","saint petersburg"], r: "russia" },
  { k: ["tehran"], r: "iran" },
  { k: ["tel aviv","jerusalem"], r: "israel" },
  { k: ["gaza"], r: "gaza" },
  { k: ["beijing","shanghai","hong kong"], r: "china" },
  { k: ["taipei"], r: "taiwan" },
  { k: ["seoul"], r: "south korea" },
  { k: ["pyongyang"], r: "north korea" },
  { k: ["tokyo","osaka"], r: "japan" },
  { k: ["washington dc","capitol hill"], r: "united states" },
  { k: ["new york","nyc","manhattan"], r: "new york" },
  { k: ["los angeles","la"], r: "california" },
  { k: ["san francisco","sf"], r: "california" },
  { k: ["austin","houston","dallas"], r: "texas" },
  { k: ["miami"], r: "florida" },
  // Countries:
  { k: ["london","westminster"], r: "united kingdom" },
  { k: ["paris"], r: "france" },
  { k: ["berlin"], r: "germany" },
];

export function inferRegionFromText(text){
  const s = normKey(text);
  if (!s) return "";
  // First try direct state/country names present in text.
  const direct = extractRegionFromLocation(s);
  if (direct) return direct;

  for (const row of KEYWORD_GEO){
    for (const kk of row.k){
      if (s.includes(normKey(kk))) return row.r;
    }
  }
  return "";
}
