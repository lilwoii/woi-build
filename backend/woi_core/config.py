from __future__ import annotations
import os
from dataclasses import dataclass

@dataclass
class WOIConfig:
    mode: str = os.getenv("WOI_MODE", "prod")
    focus: str = os.getenv("WOI_FOCUS", "agi")  # agi | trading

    data_dir: str = os.getenv("WOI_DATA_DIR", os.path.join(os.getcwd(), "data"))
    log_dir: str = os.getenv("WOI_LOG_DIR", os.path.join(os.getcwd(), "logs"))

    # Ollama models (keeps your light vs deep toggles)
    model_light: str = os.getenv("OLLAMA_MODEL_LIGHT", "llama3")
    model_deep: str = os.getenv("OLLAMA_MODEL_DEEP", "mixtral:8x7b")

    # Discord logs
    discord_webhook_url: str | None = os.getenv("DISCORD_WEBHOOK_URL")
    discord_log_level: str = os.getenv("DISCORD_LOG_LEVEL", "INFO")

    # Memory DB paths
    memory_db_path: str = os.getenv("WOI_MEMORY_DB", os.path.join(os.getcwd(), "data", "woi_memory.sqlite"))
    vector_db_path: str = os.getenv("WOI_VECTOR_DB", os.path.join(os.getcwd(), "data", "woi_chroma"))

    # Polymarket base flags (can be overridden by SettingsStore)
    polymarket_enabled: bool = (os.getenv("POLYMARKET_ENABLED", "false").lower() == "true")
    polymarket_dry_run: bool = (os.getenv("POLYMARKET_DRY_RUN", "true").lower() == "true")
    polymarket_max_usd_per_trade: float = float(os.getenv("POLYMARKET_MAX_USD_PER_TRADE", "10"))
    polymarket_max_trades_per_hour: int = int(os.getenv("POLYMARKET_MAX_TRADES_PER_HOUR", "60"))

    # Scraper
    scraper_enabled: bool = (os.getenv("SCRAPER_ENABLED", "true").lower() == "true")
