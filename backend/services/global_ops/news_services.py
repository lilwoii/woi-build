from datetime import datetime

def get_news():
    now = datetime.utcnow().isoformat()
    return [
        {
            "id": "news_1",
            "type": "news_event",
            "title": "Global tensions rise in Middle East",
            "lat": 33.8,
            "lng": 35.5,
            "region": "Middle East",
            "severity": "high",
            "source": "aljazeera",
            "timestamp": now,
            "tags": ["conflict"],
            "metadata": {
                "channel": "Al Jazeera",
                "headline": "Escalation reported across multiple fronts",
                "summary": "WOI summary: military and energy markets are both reacting to renewed regional risk.",
                "embed_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop",
            },
        },
        {
            "id": "news_2",
            "type": "news_event",
            "title": "US macro outlook shifts after fresh data",
            "lat": 40.7,
            "lng": -74.0,
            "region": "United States",
            "severity": "medium",
            "source": "bloomberg",
            "timestamp": now,
            "tags": ["macro", "rates"],
            "metadata": {
                "channel": "Bloomberg",
                "headline": "Treasury and equity desks reprice growth expectations",
                "summary": "WOI summary: US macro repricing may pressure risk assets short term while boosting volatility watchlists.",
                "embed_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
            },
        },
        {
            "id": "news_3",
            "type": "news_event",
            "title": "European airspace congestion climbs",
            "lat": 50.1,
            "lng": 8.6,
            "region": "Europe",
            "severity": "medium",
            "source": "skynews",
            "timestamp": now,
            "tags": ["aviation"],
            "metadata": {
                "channel": "Sky News",
                "headline": "Flight reroutes increase over central corridors",
                "summary": "WOI summary: air route congestion and rerouting are clustering over major European corridors.",
                "embed_url": "",
                "thumbnail": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop",
            },
        },
    ]