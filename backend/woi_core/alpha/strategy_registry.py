from __future__ import annotations
import os, json, time
from dataclasses import dataclass, asdict
from typing import Any, Dict, List

def _path() -> str:
    return os.getenv("WOI_STRATEGY_REGISTRY_PATH", "./_woi_state/strategies.json")

def _events_path() -> str:
    return os.getenv("WOI_STRATEGY_EVENTS_PATH", "./_woi_state/strategy_events.jsonl")

def _ensure_parent(p: str):
    os.makedirs(os.path.dirname(p) or ".", exist_ok=True)

def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

@dataclass
class StrategySpec:
    name: str
    version: str
    params: Dict[str, Any]
    description: str = ""
    tags: List[str] = None
    created_utc: str = ""
    updated_utc: str = ""
    metrics: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["tags"] = d["tags"] or []
        d["metrics"] = d["metrics"] or {}
        return d

class StrategyRegistry:
    def __init__(self):
        self.path = _path()
        self.active = {"name": "", "version": ""}
        self.items: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if not os.path.exists(self.path):
            return
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.items = data.get("items", []) or []
            self.active = data.get("active", self.active) or self.active
        except Exception:
            self.items = []
            self.active = {"name":"", "version":""}

    def _save(self):
        _ensure_parent(self.path)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump({"items": self.items, "active": self.active, "saved_utc": _now()}, f, indent=2)

    def _append_event(self, kind: str, payload: Dict[str, Any]):
        p = _events_path()
        try:
            _ensure_parent(p)
            with open(p, "a", encoding="utf-8") as f:
                f.write(json.dumps({"ts_utc": _now(), "kind": kind, **payload}, ensure_ascii=False) + "\n")
        except Exception:
            pass

    def register(self, spec: StrategySpec) -> Dict[str, Any]:
        now = _now()
        spec.created_utc = spec.created_utc or now
        spec.updated_utc = now
        replaced = False
        for i, it in enumerate(self.items):
            if it.get("name") == spec.name and it.get("version") == spec.version:
                self.items[i] = spec.to_dict()
                replaced = True
                break
        if not replaced:
            self.items.append(spec.to_dict())
        self.items.sort(key=lambda x: (x.get("name",""), x.get("version","")))
        self._save()
        self._append_event("update" if replaced else "register", {"name": spec.name, "version": spec.version})
        return {"ok": True, "replaced": replaced, "strategy": spec.to_dict()}

    def list(self) -> List[Dict[str, Any]]:
        return list(self.items)

    def set_active(self, name: str, version: str) -> Dict[str, Any]:
        found = any(it.get("name")==name and it.get("version")==version for it in self.items)
        if not found:
            return {"ok": False, "error": "strategy_not_found", "name": name, "version": version}
        self.active = {"name": name, "version": version}
        self._save()
        self._append_event("activate", {"name": name, "version": version})
        return {"ok": True, "active": self.active}

    def get_active(self) -> Dict[str, Any]:
        name = self.active.get("name","")
        version = self.active.get("version","")
        spec = None
        for it in self.items:
            if it.get("name")==name and it.get("version")==version:
                spec = it
                break
        return {"ok": True, "active": self.active, "spec": spec}
