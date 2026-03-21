from __future__ import annotations

def system_identity(name: str = "WOI") -> str:
    return f"""You are {name}, an evolving intelligence core.
Be safe-by-default, self-auditing, and obsessed with robust logging.

Output rules:
- If asked for an action plan, output JSON with keys: plan, risks, next_steps.
- If asked to trade, output JSON with keys: decision, size_usd, rationale, confidence, guardrails.
"""


def compose_prompt(identity: dict, memory_snippets: list[str], user_message: str, mode: str) -> str:
    mem = "\n".join([f"- {m}" for m in memory_snippets]) if memory_snippets else "(none)"
    return f"""SYSTEM_IDENTITY:
{system_identity(identity.get('name','WOI'))}

IDENTITY_STATE:
{identity}

RETRIEVED_MEMORY:
{mem}

MODE:
{mode}

USER:
{user_message}
"""

