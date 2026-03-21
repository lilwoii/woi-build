from __future__ import annotations
import os, asyncio, json, time
from fastapi import APIRouter, Body, Query

from woi_core.config import WOIConfig
from woi_core.runtime import WOIRuntime
from woi_core.events import WoiEvent

router = APIRouter(prefix="/api/woi", tags=["woi"])
cfg = WOIConfig()
runtime = WOIRuntime(cfg)

# Imports from previous bundles
from woi_core.alpha.strategy_registry import StrategyRegistry, StrategySpec
from woi_core.alpha.shadow_mode import load_runtime_mode, set_mode as set_shadow_mode
from woi_core.alpha.risk_governor import RiskGovernor
_registry = StrategyRegistry()
_risk = RiskGovernor()

from woi_core.modules.polymarket.execution_entrypoint import execute_order, risk_status as exec_risk_status, risk_note_error
from woi_core.modules.polymarket.blotter import read as blotter_read, clear as blotter_clear
from woi_core.modules.casino.casino_stats import update_blackjack, update_roulette, load as load_casino_stats
from woi_core.modules.casino.casino_memory_notes import append_note as casino_note

from woi_core.modules.globe.globe_events import push as globe_push, list_events as globe_list, clear as globe_clear, tension_24h, volume_rollup
from woi_core.modules.globe.geocode import geocode_best_effort, infer_location_from_text
from woi_core.modules.globe.related_markets import find_related

# Simple watchlist store for globe->watch (local file)
_WATCH_PATH = os.getenv("WOI_GLOBE_WATCH_PATH", "./_woi_state/globe_watch.json")
def _load_watch():
    try:
        import json as _j
        if os.path.exists(_WATCH_PATH):
            return _j.loads(open(_WATCH_PATH,"r",encoding="utf-8").read() or "[]")
    except Exception:
        pass
    return []

def _save_watch(items):
    try:
        os.makedirs(os.path.dirname(_WATCH_PATH) or ".", exist_ok=True)
        open(_WATCH_PATH,"w",encoding="utf-8").write(json.dumps(items, ensure_ascii=False, indent=2))
    except Exception:
        pass

_auto_task = None
_risk_task = None
_auto_enabled = (os.getenv("POLY_AUTO_SNAPSHOTS_ENABLED", "false").lower() == "true")

async def _risk_loop():
    while True:
        try:
            await asyncio.sleep(15)
            mode = load_runtime_mode()
            if not _risk.cfg.armed:
                continue
            try:
                from woi_core.modules.polymarket.pnl_timeseries import fetch_timeseries
                series = await fetch_timeseries(runtime.structured.db_path, limit=300)
                ok, reason, stats = _risk.eval_pnl_timeseries(series)
                if not ok and mode.get("live_enabled"):
                    _risk.trip(reason)
                    set_shadow_mode(live_enabled=False)
                    await runtime.bus.emit(WoiEvent("🔴 RISK_TRIP", "Auto-disabled live due to PnL risk", {"reason": reason, **stats}))
                    try:
                        from woi_core.ops.discord_media import send_discord_text
                        send_discord_text(content=f"🔴 **WOI AUTO-DISABLED LIVE**\nReason: `{reason}`\nStats: `{stats}`")
                    except Exception:
                        pass
            except Exception as e:
                _risk.note_error()
                risk_note_error()
                await runtime.bus.emit(WoiEvent("⚠️ RISK_LOOP", "Risk loop exception", {"error": str(e)[:220]}))
        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(5)

async def _auto_loop():
    while True:
        try:
            if _auto_enabled:
                try:
                    await poly_pnl_snapshot()
                except Exception:
                    pass
            await asyncio.sleep(max(5, int(os.getenv("POLY_PNL_SNAPSHOT_EVERY_SEC", "300"))))
        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(5)

@router.on_event("startup")
async def _startup():
    global _auto_task, _risk_task
    await runtime.start()
    runtime.event_cls = WoiEvent
    _auto_task = asyncio.create_task(_auto_loop())
    _risk_task = asyncio.create_task(_risk_loop())
    await runtime.bus.emit(WoiEvent("🌍 BUNDLE_21", "Globe V2 online (geo + arcs + related markets)", {}))

@router.on_event("shutdown")
async def _shutdown():
    global _auto_task, _risk_task
    try:
        for t in (_auto_task, _risk_task):
            if t: t.cancel()
    except Exception:
        pass
    await runtime.stop()

@router.get("/health")
async def health():
    return {"ok": True, "name": "WOI", "mode": cfg.mode, "focus": cfg.focus, "poly_mode": load_runtime_mode(), "poly_executor": os.getenv("POLY_EXECUTOR","stub")}

@router.post("/chat")
async def chat(payload: dict = Body(...)):
    msg = payload.get("message", "")
    tier = payload.get("tier", "deep")
    mode = payload.get("mode", "assistant")
    return await runtime.router.chat(user_message=msg, tier=tier, mode=mode)

# --- Polymarket mode & guarded execution ---
@router.get("/polymarket/mode")
async def poly_mode_get():
    return {"ok": True, "mode": load_runtime_mode()}

@router.post("/polymarket/mode")
async def poly_mode_set(payload: dict = Body(...)):
    live_enabled = payload.get("live_enabled", None)
    shadow_enabled = payload.get("shadow_enabled", None)
    res = set_shadow_mode(live_enabled=live_enabled, shadow_enabled=shadow_enabled)
    await runtime.bus.emit(WoiEvent("🧪🟢 MODE_SET", "Polymarket mode updated", res.get("mode", {})))
    return res

@router.post("/polymarket/execute_guarded")
async def poly_execute_guarded(payload: dict = Body(...)):
    order = payload.get("order") or {}
    expected_mid = payload.get("expected_mid", None)
    res = await execute_order(runtime, order=order, expected_mid=expected_mid)
    await runtime.bus.emit(WoiEvent("🧾 EXEC_GUARDED", "Guarded execution invoked", {"ok": res.get("ok"), "executed": res.get("executed"), "reason": res.get("reason"), "slippage": res.get("slippage")}))
    return res

@router.get("/polymarket/blotter")
async def poly_blotter(limit: int = Query(200, ge=10, le=2000)):
    return {"ok": True, "items": blotter_read(limit=int(limit))}

@router.delete("/polymarket/blotter")
async def poly_blotter_clear():
    blotter_clear()
    await runtime.bus.emit(WoiEvent("🧾🧹 BLOTTER_CLEAR", "Polymarket blotter cleared", {}))
    return {"ok": True}

# --- Risk governor ---
@router.get("/alpha/risk/status")
async def risk_status():
    return {"ok": True, "router_risk": _risk.status(), "exec_risk": exec_risk_status(), "tension_24h": tension_24h()}

# --- Casino stats + memory notes ---
@router.post("/casino/log")
async def casino_log(payload: dict = Body(...)):
    game = str(payload.get("game","")).strip()
    action = str(payload.get("action","")).strip()
    meta = payload.get("meta", {}) or {}
    await runtime.bus.emit(WoiEvent("🎰 CASINO", f"{game}: {action}", meta))
    try:
        from woi_core.ops.discord_media import send_discord_text
        send_discord_text(content=f"🎰 **CASINO** — {game} {action}\n`{json.dumps(meta)[:900]}`")
    except Exception:
        pass
    return {"ok": True}

@router.post("/casino/blackjack/result")
async def casino_blackjack_result(payload: dict = Body(...)):
    result = str(payload.get("result","")).strip()
    bet = float(payload.get("bet", 0))
    delta = float(payload.get("delta", 0))
    stats = update_blackjack(result=result, bet=bet, delta=delta)
    await runtime.bus.emit(WoiEvent("♠️ BJ_STATS", "Blackjack stats updated", stats))
    casino_note("♠️ BJ_NOTE", f"Blackjack update: {result} (Δ {delta:.2f})", stats)
    return {"ok": True, "stats": stats}

@router.post("/casino/roulette/result")
async def casino_roulette_result(payload: dict = Body(...)):
    win = bool(payload.get("win", False))
    bet = float(payload.get("bet", 0))
    delta = float(payload.get("delta", 0))
    bet_type = str(payload.get("bet_type","")).strip()
    stats = update_roulette(win=win, bet=bet, delta=delta, bet_type=bet_type)
    await runtime.bus.emit(WoiEvent("🎡 ROU_STATS", "Roulette stats updated", stats))
    casino_note("🎡 ROU_NOTE", f"Roulette update: {'win' if win else 'loss'} (Δ {delta:.2f})", stats)
    return {"ok": True, "stats": stats}

@router.get("/casino/stats")
async def casino_stats():
    return {"ok": True, "stats": load_casino_stats()}

# --- Globe intel endpoints ---
@router.get("/globe/events")
async def globe_events(limit: int = Query(600, ge=10, le=2000), type: str | None = Query(None)):
    return {"ok": True, "items": globe_list(limit=int(limit), type=type), "tension_24h": tension_24h(), "volume": volume_rollup()}

@router.post("/globe/event")
async def globe_event(payload: dict = Body(...)):
    evt = payload or {}
    # Auto-geocode if missing
    if evt.get("lat") is None or evt.get("lng") is None:
        loc = evt.get("location") or infer_location_from_text(evt.get("title",""), evt.get("summary",""))
        if loc:
            geo = geocode_best_effort(str(loc))
            if geo:
                evt["lat"], evt["lng"], evt["location_resolved"] = geo[0], geo[1], geo[2]
                (evt.setdefault("meta", {}) or {}).setdefault("region", geo[2])
    pushed = globe_push(evt)
    # Discord optional: critical
    try:
        sev = str(pushed.get("severity","")).lower()
        if sev == "critical":
            from woi_core.ops.discord_media import send_discord_text
            send_discord_text(content=f"🛰️🌍 **GLOBE CRITICAL** — {pushed.get('title','(no title)')}\n{pushed.get('url','')}")
    except Exception:
        pass
    await runtime.bus.emit(WoiEvent("🛰️🌍 GLOBE_EVENT", "Globe event ingested", {"type": pushed.get("type"), "severity": pushed.get("severity"), "title": pushed.get("title")}))
    return {"ok": True, "event": pushed}

@router.delete("/globe/events")
async def globe_events_clear():
    globe_clear()
    await runtime.bus.emit(WoiEvent("🛰️🌍 GLOBE_CLEAR", "Globe events cleared", {}))
    return {"ok": True}

@router.get("/globe/related_markets")
async def globe_related_markets(q: str = Query("", min_length=0), limit: int = Query(8, ge=1, le=20)):
    items = await find_related(runtime, query=q, limit=int(limit))
    return {"ok": True, "items": items}

@router.get("/globe/watch")
async def globe_watch_get():
    return {"ok": True, "items": _load_watch()}

@router.post("/globe/watch")
async def globe_watch_add(payload: dict = Body(...)):
    items = _load_watch()
    items.append(payload or {})
    items = items[-250:]
    _save_watch(items)
    await runtime.bus.emit(WoiEvent("👁️🌍 WATCH_ADD", "Globe watch added", payload or {}))
    return {"ok": True, "items": items}

# --- Polymarket PnL snapshots (kept minimal; existing bundles provide full) ---
async def _get_ledger_rows():
    from woi_core.modules.polymarket.pnl_recon import _fetch_journal, _normalize_user_trade
    journal = await _fetch_journal(runtime.structured.db_path, limit=int(os.getenv("LEDGER_MAX_ROWS","2500")))
    remote = []
    ut = getattr(getattr(runtime.modules, "polymarket", object()), "user_trades", None)
    if ut is not None and getattr(ut, "configured", lambda: False)():
        try:
            raw = await ut.trades(limit=2000)
            remote = [_normalize_user_trade(t) for t in raw]
        except Exception:
            remote = []
    from woi_core.modules.polymarket.ledger import reconcile
    ledger = reconcile(journal=journal, remote=remote)
    return ledger, ("clob" if remote else "journal")

async def _mark_prices(ledger):
    md = getattr(getattr(runtime.modules, "polymarket", object()), "market_data", None)
    st = getattr(getattr(runtime.modules, "polymarket", object()), "settlement", None)
    if not md:
        return {}
    mark = {}
    tokens = sorted({r.token_id for r in ledger if r.token_id})[:200]
    for tok in tokens:
        settle = None
        try:
            settle = await st.resolve_token_settlement_price(tok) if st else None
        except Exception:
            settle = None
        if settle is not None:
            mark[tok] = float(settle)
            continue
        try:
            _, _, mid = await md.best_bid_ask_mid(tok)
            mark[tok] = float(mid) if mid is not None else None
        except Exception:
            mark[tok] = None
    return mark

@router.post("/polymarket/pnl_snapshot")
async def poly_pnl_snapshot():
    ledger, src = await _get_ledger_rows()
    mark = await _mark_prices(ledger)
    from woi_core.modules.polymarket.pnl_grouped import grouped_pnl
    res = grouped_pnl(ledger, mark)
    from woi_core.modules.polymarket.pnl_timeseries import write_snapshot
    snap = await write_snapshot(runtime.structured.db_path, source=src, overall=res.get("overall", {}), by_strategy=res.get("by_strategy", {}))
    await runtime.bus.emit(WoiEvent("🧾📈 POLY_PNL_SNAPSHOT", "Snapshot stored", {"source": src, "ts_utc": snap.get("ts_utc")}))
    return {"ok": True, "snapshot": snap, "grouped": res}
