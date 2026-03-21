from __future__ import annotations
import math, random, asyncio
from typing import List, Dict, Any

from .scorecards import StrategyScorecards

class StrategyEvolution:
    """Lightweight strategy evolution via UCB (upper confidence bound) selection.

    - chooses strategies balancing exploitation/exploration
    - periodically prunes extremely poor strategies (scaffold)
    - can mutate/duplicate strategies (stub hook)
    """

    def __init__(self, scorecards: StrategyScorecards):
        self.scorecards = scorecards
        self._priors: Dict[str, float] = {}  # reward prior
        self._counts: Dict[str, int] = {}

    def reseed(self, strategies: List[Any]):
        self._priors = {s.name: 0.01 for s in strategies}
        self._counts = {s.name: 0 for s in strategies}

    def choose(self, strategies: List[Any]):
        # UCB1: avg + sqrt(2 ln N / n)
        names = [s.name for s in strategies]
        for n in names:
            self._priors.setdefault(n, 0.01)
            self._counts.setdefault(n, 0)

        N = max(1, sum(self._counts.values()))
        best = None
        best_score = -1e9
        for s in strategies:
            n = self._counts[s.name]
            avg = self._priors[s.name]
            bonus = 1.5 * math.sqrt(math.log(N + 1) / (n + 1))
            score = avg + bonus
            if score > best_score:
                best_score = score
                best = s

        # update stored ucb asynchronously (fire-and-forget safe)
        try:
            import asyncio
            asyncio.create_task(self.scorecards.set_ucb(best.name, float(best_score)))
        except Exception:
            pass

        self._counts[best.name] += 1
        return best

    def update_after_trade(self, strategy_name: str, reward: float):
        # exponential moving average update
        prev = self._priors.get(strategy_name, 0.01)
        self._priors[strategy_name] = (0.92 * prev) + (0.08 * float(reward))

    def maybe_prune_or_mutate(self, strategies: List[Any]):
        # Scaffold: we don't auto-delete code strategies; we just lower their weight if poor.
        # Future: dynamic strategy generation via LLM and backtesting.
        return
