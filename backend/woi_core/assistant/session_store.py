from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Dict, List, Any
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ConversationTurn:
    role: str
    content: str
    ts_utc: str = field(default_factory=utc_now)


@dataclass
class ConversationSession:
    session_id: str
    title: str
    created_at: str = field(default_factory=utc_now)
    updated_at: str = field(default_factory=utc_now)
    turns: List[ConversationTurn] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)


class ConversationSessionStore:
    def __init__(self) -> None:
        self.sessions: Dict[str, ConversationSession] = {}

    def ensure(self, session_id: str | None = None, title: str = "WOI Session") -> ConversationSession:
        if session_id and session_id in self.sessions:
            return self.sessions[session_id]

        new_id = session_id or f"woi-{uuid4().hex[:10]}"
        session = ConversationSession(session_id=new_id, title=title)
        self.sessions[new_id] = session
        return session

    def append(self, session_id: str, role: str, content: str) -> Dict[str, Any]:
        session = self.ensure(session_id)
        session.turns.append(ConversationTurn(role=role, content=content))
        session.updated_at = utc_now()
        session.turns = session.turns[-100:]
        return {"ok": True, "session": asdict(session)}

    def history_for_model(self, session_id: str) -> List[Dict[str, str]]:
        session = self.ensure(session_id)
        return [{"role": x.role, "content": x.content} for x in session.turns[-20:]]

    def list_sessions(self) -> Dict[str, Any]:
        items = sorted(self.sessions.values(), key=lambda x: x.updated_at, reverse=True)
        return {"ok": True, "items": [asdict(x) for x in items]}

    def get_session(self, session_id: str) -> Dict[str, Any]:
        session = self.ensure(session_id)
        return {"ok": True, "item": asdict(session)}