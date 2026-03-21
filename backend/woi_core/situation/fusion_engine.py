from __future__ import annotations

from typing import Dict, Any, List


class SituationFusionEngine:
    def summarize(
        self,
        *,
        country_items: List[Dict[str, Any]],
        state_items: List[Dict[str, Any]],
        telemetry_items: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        all_items = list(country_items) + list(state_items) + list(telemetry_items)
        top = sorted(all_items, key=lambda x: float(x.get("score", 0.0)), reverse=True)[:5]

        summary_lines = []
        for item in top:
            name = item.get("name") or item.get("zone") or item.get("region") or "Unknown"
            summary_lines.append(
                f"- {name}: {item.get('summary', '')}"
            )

        what_matters = (
            "🌍 Situation Room Summary:\n"
            "Highest-priority areas are where macro stress, geopolitical signals, "
            "and public telemetry overlap. Watch energy/logistics, rates/policy, "
            "and any route anomalies that connect to liquid symbols or prediction themes.\n\n"
            + "\n".join(summary_lines)
        )

        return {
            "ok": True,
            "top_items": top,
            "summary": what_matters,
        }