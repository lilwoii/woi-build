def get_heat_points():
    return [
        {
            "id": "heat_me_1",
            "type": "alert",
            "title": "Middle East heat",
            "lat": 33.0,
            "lng": 44.0,
            "region": "Middle East",
            "severity": "high",
            "source": "woi_fusion",
            "tags": ["conflict", "macro"],
            "metadata": {
                "intensity": 0.92,
                "radius": 1.8,
            },
        },
        {
            "id": "heat_eu_1",
            "type": "alert",
            "title": "Europe airspace pressure",
            "lat": 50.0,
            "lng": 10.0,
            "region": "Europe",
            "severity": "medium",
            "source": "woi_fusion",
            "tags": ["aviation"],
            "metadata": {
                "intensity": 0.55,
                "radius": 1.2,
            },
        },
    ]