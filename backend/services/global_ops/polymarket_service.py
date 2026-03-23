from datetime import datetime

def get_polymarket_markets():
    now = datetime.utcnow().isoformat()
    return [
        {
            "id": "pm_iran_1",
            "type": "prediction_market",
            "title": "Will tensions escalate in the Gulf this month?",
            "lat": 26.0,
            "lng": 50.5,
            "region": "Middle East",
            "severity": "high",
            "source": "polymarket",
            "timestamp": now,
            "tags": ["geopolitics", "energy"],
            "metadata": {
                "question": "Will tensions escalate in the Gulf this month?",
                "yes_price": 0.64,
                "no_price": 0.36,
                "volume": 1820044,
                "category": "geopolitics",
            },
        },
        {
            "id": "pm_us_election_1",
            "type": "prediction_market",
            "title": "US election odds movement",
            "lat": 38.9,
            "lng": -77.0,
            "region": "United States",
            "severity": "medium",
            "source": "polymarket",
            "timestamp": now,
            "tags": ["politics", "election"],
            "metadata": {
                "question": "Who will win the next major election event?",
                "yes_price": 0.52,
                "no_price": 0.48,
                "volume": 3312500,
                "category": "politics",
            },
        },
    ]