def normalize_entity(raw, entity_type):
    return {
        "id": raw.get("id"),
        "type": entity_type,
        "title": raw.get("title"),
        "lat": raw.get("lat"),
        "lng": raw.get("lng"),
        "region": raw.get("region"),
        "severity": raw.get("severity", "low"),
        "source": raw.get("source"),
        "timestamp": raw.get("timestamp"),
        "tags": raw.get("tags", []),
        "metadata": raw.get("metadata", {})
    }