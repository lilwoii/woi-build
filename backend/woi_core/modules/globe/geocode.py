from __future__ import annotations
import os, re, requests
from typing import Any, Dict, Optional, Tuple

# Minimal offline gazetteer: countries + US states (centroids)
US_STATES = {
  "california": (36.7783, -119.4179),
  "new york": (43.0000, -75.0000),
  "texas": (31.0000, -100.0000),
  "florida": (28.0000, -82.0000),
  "washington": (47.5000, -120.5000),
  "illinois": (40.0000, -89.0000),
  "poland": (52.2370, 21.0175),
  "ukraine": (48.3794, 31.1656),
  "russia": (61.5240, 105.3188),
  "israel": (31.0461, 34.8516),
  "iran": (32.4279, 53.6880),
  "china": (35.8617, 104.1954),
  "united states": (39.8283, -98.5795),
  "usa": (39.8283, -98.5795),
  "united kingdom": (55.3781, -3.4360),
  "uk": (55.3781, -3.4360),
  "germany": (51.1657, 10.4515),
  "france": (46.2276, 2.2137),
  "japan": (36.2048, 138.2529),
}

def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())

def offline_geocode(query: str) -> Optional[Tuple[float,float,str]]:
    q = _clean(query)
    if not q:
        return None
    if q in US_STATES:
        lat, lng = US_STATES[q]
        return (lat, lng, query)
    # partial match
    for k,(lat,lng) in US_STATES.items():
        if k in q:
            return (lat, lng, k.title())
    return None

def nominatim_geocode(query: str) -> Optional[Tuple[float,float,str]]:
    endpoint = os.getenv("WOI_GEO_NOMINATIM_ENDPOINT", "https://nominatim.openstreetmap.org/search")
    try:
        r = requests.get(endpoint, params={"q": query, "format":"json", "limit":1}, headers={"User-Agent":"WOI/1.0"}, timeout=8)
        if r.status_code != 200:
            return None
        data = r.json()
        if not data:
            return None
        it = data[0]
        return (float(it["lat"]), float(it["lon"]), str(it.get("display_name","")))
    except Exception:
        return None

def opencage_geocode(query: str) -> Optional[Tuple[float,float,str]]:
    key = os.getenv("OPENCAGE_API_KEY","").strip()
    if not key:
        return None
    try:
        r = requests.get("https://api.opencagedata.com/geocode/v1/json", params={"q": query, "key": key, "limit": 1}, timeout=8)
        if r.status_code != 200:
            return None
        data = r.json()
        res = (data.get("results") or [])
        if not res:
            return None
        g = res[0].get("geometry") or {}
        return (float(g.get("lat")), float(g.get("lng")), str(res[0].get("formatted","")))
    except Exception:
        return None

def geocode_best_effort(query: str) -> Optional[Tuple[float,float,str]]:
    provider = os.getenv("WOI_GEO_PROVIDER","offline").lower().strip()
    # always try offline first (fast)
    off = offline_geocode(query)
    if off:
        return off
    if provider == "nominatim":
        return nominatim_geocode(query)
    if provider == "opencage":
        return opencage_geocode(query)
    return None

def infer_location_from_text(title: str, summary: str) -> Optional[str]:
    text = f"{title or ''} {summary or ''}".lower()
    # tiny heuristic: look for known names
    for k in US_STATES.keys():
        if k in text:
            return k
    return None
