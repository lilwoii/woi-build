from datetime import datetime

def get_webcams():
    now = datetime.utcnow().isoformat()
    return [
        {
            "id": "cam_1",
            "type": "webcam",
            "title": "Tel Aviv Downtown",
            "lat": 32.08,
            "lng": 34.78,
            "region": "Middle East",
            "severity": "medium",
            "source": "webcam_feed",
            "timestamp": now,
            "tags": ["city", "conflict"],
            "metadata": {
                "stream_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop",
                "city": "Tel Aviv",
                "country": "Israel",
                "is_live": True,
            },
        },
        {
            "id": "cam_2",
            "type": "webcam",
            "title": "Frankfurt Air Corridor",
            "lat": 50.11,
            "lng": 8.68,
            "region": "Europe",
            "severity": "low",
            "source": "webcam_feed",
            "timestamp": now,
            "tags": ["airport", "aviation"],
            "metadata": {
                "stream_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop",
                "city": "Frankfurt",
                "country": "Germany",
                "is_live": True,
            },
        },
        {
            "id": "cam_3",
            "type": "webcam",
            "title": "New York Financial District",
            "lat": 40.71,
            "lng": -74.00,
            "region": "United States",
            "severity": "low",
            "source": "webcam_feed",
            "timestamp": now,
            "tags": ["finance", "city"],
            "metadata": {
                "stream_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1534430480872-3498386e7856?q=80&w=1200&auto=format&fit=crop",
                "city": "New York",
                "country": "United States",
                "is_live": True,
            },
        },
    ]