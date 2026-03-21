from __future__ import annotations
import os, io, re, base64, time, json, hashlib
from typing import Any, Dict, Optional, Tuple

import requests

_LAST_SENT_AT: float = 0.0
_LAST_HASHES: Dict[str, float] = {}

def _webhook_url() -> Optional[str]:
    return os.getenv("WOI_DISCORD_WEBHOOK_URL") or os.getenv("DISCORD_WEBHOOK_URL") or os.getenv("WOI_DISCORD_WEBHOOK")

def _strip_data_url(b64: str) -> str:
    if not b64:
        return ""
    m = re.match(r"^data:image\/png;base64,(.*)$", b64.strip())
    return m.group(1) if m else b64.strip()

def _rate_limit_ok(payload_hash: str) -> Tuple[bool, str]:
    global _LAST_SENT_AT, _LAST_HASHES
    now = time.time()
    rate_sec = float(os.getenv("WOI_DISCORD_RATE_LIMIT_SEC", "3"))
    dedupe_win = float(os.getenv("WOI_DISCORD_DEDUPE_WINDOW_SEC", "30"))

    # Dedupe window
    last = _LAST_HASHES.get(payload_hash)
    if last is not None and (now - last) < dedupe_win:
        return False, "dedupe"
    # Rate limit
    if (now - _LAST_SENT_AT) < rate_sec:
        return False, "rate_limit"
    _LAST_SENT_AT = now
    _LAST_HASHES[payload_hash] = now
    # prune old
    for k, t in list(_LAST_HASHES.items()):
        if (now - t) > max(60, dedupe_win * 2):
            _LAST_HASHES.pop(k, None)
    return True, "ok"

def send_discord_text(*, content: str) -> Dict[str, Any]:
    url = _webhook_url()
    if not url:
        return {"ok": False, "error": "Missing WOI_DISCORD_WEBHOOK_URL (or DISCORD_WEBHOOK_URL)"}
    payload = {"content": content[:1900]}
    h = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()
    ok, why = _rate_limit_ok(h)
    if not ok:
        return {"ok": True, "skipped": why}

    r = requests.post(url, json=payload, timeout=20)
    if r.status_code >= 300:
        return {"ok": False, "status": r.status_code, "text": r.text[:500]}
    return {"ok": True}

def send_discord_png(*, title: str, png_base64: str, meta: Optional[Dict[str, Any]] = None, filename: str = "woi_snapshot.png") -> Dict[str, Any]:
    url = _webhook_url()
    if not url:
        return {"ok": False, "error": "Missing WOI_DISCORD_WEBHOOK_URL (or DISCORD_WEBHOOK_URL)"}

    raw = base64.b64decode(_strip_data_url(png_base64))
    file_obj = io.BytesIO(raw)
    file_obj.name = filename

    content_lines = [title]
    if meta:
        try:
            pairs = []
            for k, v in list(meta.items())[:12]:
                pairs.append(f"{k}={v}")
            if pairs:
                content_lines.append("`" + " | ".join(pairs) + "`")
        except Exception:
            pass

    payload = {"content": "\n".join(content_lines)}
    h = hashlib.sha256((payload["content"] + str(len(raw))).encode("utf-8")).hexdigest()
    ok, why = _rate_limit_ok(h)
    if not ok:
        return {"ok": True, "skipped": why}

    files = {"file": (filename, file_obj, "image/png")}
    r = requests.post(url, data={"payload_json": json.dumps(payload)}, files=files, timeout=25)
    if r.status_code >= 300:
        return {"ok": False, "status": r.status_code, "text": r.text[:500]}
    return {"ok": True}
