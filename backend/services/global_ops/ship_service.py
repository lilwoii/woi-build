from datetime import datetime

def get_ships():
    now = datetime.utcnow().isoformat()
    return [
        {
            "id": "ship_001",
            "type": "ship",
            "title": "Red Sea Cargo Route",
            "lat": 20.2,
            "lng": 38.9,
            "region": "Red Sea",
            "severity": "medium",
            "source": "mock_ship_feed",
            "timestamp": now,
            "tags": ["cargo"],
            "metadata": {
                "class": "cargo",
                "speed": 18,
                "heading": 141,
            },
        },
        {
            "id": "ship_002",
            "type": "ship",
            "title": "Singapore Strait Traffic",
            "lat": 1.2,
            "lng": 103.8,
            "region": "Singapore Strait",
            "severity": "low",
            "source": "mock_ship_feed",
            "timestamp": now,
            "tags": ["tanker"],
            "metadata": {
                "class": "tanker",
                "speed": 14,
                "heading": 88,
            },
        },
    ]