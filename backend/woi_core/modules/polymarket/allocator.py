from __future__ import annotations
import os, time
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple, Optional

@dataclass
class AllocationDecision:
    approved: bool
    approved_size: float
    reason: str
    meta: Dict[str, Any]

class PortfolioAllocator:
    def __init__(self):
        self.enabled = os.getenv("ALLOC_ENABLED","true").lower() == "true"
        self.risk_budget_per_hour = float(os.getenv("ALLOC_RISK_BUDGET_USD_PER_HOUR","50"))
        self.max_open_positions = int(os.getenv("ALLOC_MAX_OPEN_POSITIONS","25"))
        self.max_usd_per_token = float(os.getenv("ALLOC_MAX_USD_PER_TOKEN","15"))
        self.min_edge = float(os.getenv("ALLOC_MIN_EDGE","0.005"))

        self.kelly_enabled = os.getenv("ALLOC_KELLY_ENABLED","false").lower() == "true"
        self.kelly_fraction = float(os.getenv("ALLOC_KELLY_FRACTION","0.25"))

        self.liq_pen_enabled = os.getenv("ALLOC_LIQUIDITY_PENALTY_ENABLED","false").lower() == "true"
        self.spread_pen = float(os.getenv("ALLOC_LIQUIDITY_SPREAD_PENALTY","1.0"))
        self.depth_pen = float(os.getenv("ALLOC_LIQUIDITY_DEPTH_PENALTY","0.5"))

        self._hour_window: List[Tuple[float,float]] = []

    def _spent_last_hour(self) -> float:
        now = time.time()
        self._hour_window = [(t,usd) for (t,usd) in self._hour_window if now - t < 3600]
        return sum(usd for _,usd in self._hour_window)

    def _kelly_usd(self, edge: float, price: float, bankroll_usd: float) -> float:
        p = min(0.999, max(0.001, float(price)))
        var = p * (1 - p)
        raw = (float(edge) / max(1e-9, var)) * float(bankroll_usd)
        raw = max(0.0, min(raw, float(bankroll_usd)))
        return raw * self.kelly_fraction

    def _liquidity_penalty(self, spread: Optional[float], depth_proxy: Optional[float]) -> float:
        mult = 1.0
        if spread is not None:
            mult *= 1.0 / (1.0 + self.spread_pen * max(0.0, float(spread)))
        if depth_proxy is not None:
            mult *= 1.0 / (1.0 + self.depth_pen * max(0.0, 1.0 - float(depth_proxy)))
        return max(0.10, min(1.0, mult))

    def approve(
        self,
        token_id: str,
        side: str,
        price: float,
        requested_size: float,
        edge: float,
        open_positions_count: int,
        current_token_exposure_usd: float,
        *,
        liq_spread: Optional[float] = None,
        liq_depth_proxy: Optional[float] = None,
        bankroll_usd_est: Optional[float] = None,
    ) -> AllocationDecision:
        if not self.enabled:
            return AllocationDecision(True, requested_size, "allocator disabled", {})

        if edge < self.min_edge:
            return AllocationDecision(False, 0.0, f"edge below min ({edge:.4f} < {self.min_edge:.4f})", {"edge": edge})

        if open_positions_count >= self.max_open_positions:
            return AllocationDecision(False, 0.0, "max open positions reached", {"open_positions": open_positions_count})

        spent = self._spent_last_hour()
        if spent >= self.risk_budget_per_hour:
            return AllocationDecision(False, 0.0, "risk budget spent for hour", {"spent": spent, "budget": self.risk_budget_per_hour})

        requested_usd = float(price) * float(requested_size)
        kelly_usd = None

        if self.kelly_enabled and bankroll_usd_est is not None:
            kelly_usd = self._kelly_usd(edge=edge, price=price, bankroll_usd=float(bankroll_usd_est))
            requested_usd = min(requested_usd, kelly_usd)

        liq_mult = 1.0
        if self.liq_pen_enabled:
            liq_mult = self._liquidity_penalty(liq_spread, liq_depth_proxy)
            requested_usd *= liq_mult

        remaining_token = max(0.0, self.max_usd_per_token - current_token_exposure_usd)
        approved_usd = min(requested_usd, remaining_token, max(0.0, self.risk_budget_per_hour - spent))

        if approved_usd <= 0:
            return AllocationDecision(False, 0.0, "token/hour cap blocks", {"remaining_token": remaining_token, "spent": spent})

        approved_size = approved_usd / max(1e-9, float(price))
        self._hour_window.append((time.time(), approved_usd))
        return AllocationDecision(True, float(approved_size), "approved", {"approved_usd": approved_usd, "spent_after": spent + approved_usd, "liq_mult": liq_mult, "kelly_usd": kelly_usd})
