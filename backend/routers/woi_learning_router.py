from __future__ import annotations

from fastapi import APIRouter, Body, Query

from woi_core.learning.regime_engine import RegimeEngine
from woi_core.learning.pattern_memory import PatternMemory
from woi_core.learning.lesson_loop import LessonLoop
from woi_core.learning.review_engine import StrategyReviewEngine, AgentReviewEngine

router = APIRouter(prefix="/api/woi/learning", tags=["WOI Learning"])

REGIME = RegimeEngine()
PATTERNS = PatternMemory()
LESSONS = LessonLoop()
STRATEGY_REVIEW = StrategyReviewEngine()
AGENT_REVIEW = AgentReviewEngine()


@router.post("/regime/detect")
def learning_regime_detect(payload: dict = Body(...)):
    return REGIME.detect(payload)


@router.get("/regime/similar")
def learning_regime_similar(regime: str = Query(...)):
    return REGIME.similar_conditions(regime=regime, lessons=LESSONS.list()["items"])


@router.post("/patterns/observe")
def learning_patterns_observe(payload: dict = Body(...)):
    return PATTERNS.observe(payload)


@router.get("/patterns/recurring")
def learning_patterns_recurring():
    return PATTERNS.recurring()


@router.post("/lessons/promote")
def learning_lessons_promote(payload: dict = Body(...)):
    return LESSONS.promote(payload)


@router.post("/lessons/decay")
def learning_lessons_decay():
    return LESSONS.decay()


@router.get("/lessons")
def learning_lessons():
    return LESSONS.list()


@router.post("/strategy/review")
def learning_strategy_review(payload: dict = Body(...)):
    return STRATEGY_REVIEW.review(payload)


@router.post("/agents/review")
def learning_agents_review(payload: dict = Body(...)):
    return AGENT_REVIEW.compare(payload)