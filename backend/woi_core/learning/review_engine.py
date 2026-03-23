from __future__ import annotations

from typing import Dict, Any, List


class StrategyReviewEngine:
    def review(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        win_rate = float(payload.get("win_rate") or 0.0)
        pnl = float(payload.get("pnl_pct") or 0.0)
        drawdown = float(payload.get("drawdown_pct") or 0.0)
        trades = int(payload.get("trades") or 0)

        verdict = "observe"
        next_action = "continue-shadow"

        if trades >= 10 and win_rate >= 0.58 and pnl > 0 and drawdown < 5:
            verdict = "promote"
            next_action = "guarded-live-candidate"
        elif drawdown >= 8 or win_rate < 0.4:
            verdict = "deprioritize"
            next_action = "pause-or-retune"

        summary = (
            f"WOI review: trades={trades}, win_rate={win_rate}, pnl={pnl}, drawdown={drawdown}. "
            f"Verdict={verdict}, next_action={next_action}."
        )

        return {
            "ok": True,
            "verdict": verdict,
            "next_action": next_action,
            "summary": summary,
        }


class AgentReviewEngine:
    def compare(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        agents = list(payload.get("agents") or [])
        ranked = sorted(
            agents,
            key=lambda x: (float(x.get("score", 0.0)), float(x.get("consistency", 0.0))),
            reverse=True,
        )
        return {"ok": True, "items": ranked[:20]}