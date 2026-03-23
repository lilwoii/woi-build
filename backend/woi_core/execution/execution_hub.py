from __future__ import annotations

from typing import Dict, Any

from woi_core.execution.controls import ExecutionControls
from woi_core.execution.guard import ExecutionGuard
from woi_core.execution.paper_blotter import PaperBlotter
from woi_core.execution.live_gate import LiveExecutionGate
from woi_core.integrations.discord_broadcasts import DiscordBroadcasts


class ExecutionHub:
    def __init__(self) -> None:
        self.controls = ExecutionControls()
        self.guard = ExecutionGuard()
        self.paper = PaperBlotter()
        self.live = LiveExecutionGate()
        self.discord = DiscordBroadcasts()

    def preview(self, order: Dict[str, Any]) -> Dict[str, Any]:
        controls = self.controls.get()["controls"]
        guard_result = self.guard.evaluate(controls, order)
        return {"ok": True, "controls": controls, "guard": guard_result, "order": order}

    def submit(self, order: Dict[str, Any]) -> Dict[str, Any]:
        controls = self.controls.get()["controls"]
        guard_result = self.guard.evaluate(controls, order)

        mode = str(order.get("mode") or "paper").lower()

        if not guard_result["approved"]:
            self.discord.emit(
                title="🛑 WOI Execution Rejected",
                body=f"{order.get('symbol', '')} {mode} order rejected.",
                level="warn",
                fields=[
                    {"name": "reasons", "value": ", ".join(guard_result["reasons"]) or "-"},
                    {"name": "asset", "value": str(order.get("asset_class") or "stocks")},
                ],
            )
            return {"ok": True, "submitted": False, "guard": guard_result}

        if mode == "paper":
            result = self.paper.submit(order)
            self.discord.emit(
                title="📄 WOI Paper Order Filled",
                body=f"{order.get('symbol', '')} paper order filled.",
                level="info",
                fields=[
                    {"name": "asset", "value": str(order.get("asset_class") or "stocks")},
                    {"name": "notional", "value": str(order.get('notional_usd') or 0)},
                ],
            )
            return {"ok": True, "submitted": True, "mode": "paper", "result": result, "guard": guard_result}

        if mode == "live":
            result = self.live.queue_order(order, guard_result)
            self.discord.emit(
                title="🟡 WOI Live Order Queued",
                body=f"{order.get('symbol', '')} live order queued for approval.",
                level="warn",
                fields=[
                    {"name": "asset", "value": str(order.get("asset_class") or "stocks")},
                    {"name": "manual_guard", "value": str(guard_result.get("requires_manual_guard"))},
                ],
            )
            return {"ok": True, "submitted": True, "mode": "live", "result": result, "guard": guard_result}

        if mode == "shadow":
            self.discord.emit(
                title="👻 WOI Shadow Order Logged",
                body=f"{order.get('symbol', '')} shadow order accepted.",
                level="info",
                fields=[
                    {"name": "asset", "value": str(order.get("asset_class") or "stocks")},
                ],
            )
            return {"ok": True, "submitted": True, "mode": "shadow", "result": {"ok": True, "shadow": order}, "guard": guard_result}

        return {"ok": False, "error": "Unknown mode"}