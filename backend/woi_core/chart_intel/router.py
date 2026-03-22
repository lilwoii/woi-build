from __future__ import annotations

from typing import Dict, Any, List


class SymbolAnalysisRouter:
    def build_targets(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        symbol = analysis.get("symbol", "")
        trend = analysis.get("trend", "")
        confluence = float(analysis.get("confluence_score") or 0.0)

        actions: List[str] = []
        if confluence >= 0.7:
            actions.append("route_shadow_candidate")
        if trend == "uptrend":
            actions.append("watch_breakout_or_pullback")
        else:
            actions.append("watch_reclaim_or_breakdown")

        return {
            "ok": True,
            "symbol": symbol,
            "actions": actions,
            "summary": f"Automated symbol routing prepared for {symbol} with confluence {confluence}.",
        }