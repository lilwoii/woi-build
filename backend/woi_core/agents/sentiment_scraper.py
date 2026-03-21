from __future__ import annotations
from .base import Agent, AgentResult

class SentimentScraper(Agent):
    name = "sentiment_scraper"
    role = "Collect sentiment/news signals from feeds/scrapes."

    async def run(self, ctx):
        s = ctx.signals.get("sentiment") or {}
        return AgentResult(self.name, True, {"sentiment": "scaffold", "sample": s})
