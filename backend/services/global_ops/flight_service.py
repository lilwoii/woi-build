import random
from datetime import datetime

def get_flights():
    flights = []
    for i in range(20):
        lat = 25 + random.random() * 25
        lng = -130 + random.random() * 70
        trail_lng = lng - (0.8 + random.random() * 2.2)
        trail_lat = lat - (0.2 + random.random() * 1.1)

        flights.append({
            "id": f"FLIGHT_{i}",
            "type": "flight",
            "title": f"FLIGHT_{i}",
            "lat": lat,
            "lng": lng,
            "region": "North America",
            "severity": "low",
            "source": "mock_flight_feed",
            "timestamp": datetime.utcnow().isoformat(),
            "tags": ["commercial"],
            "metadata": {
                "altitude": random.randint(20000, 40000),
                "speed": random.randint(400, 550),
                "trail": [
                    [trail_lng, trail_lat]
                ]
            }
        })
    return flights