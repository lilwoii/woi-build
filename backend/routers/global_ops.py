from services.global_ops.flight_service import get_flights
from services.global_ops.news_service import get_news
from services.global_ops.webcam_service import get_webcams
from services.global_ops.summary_service import get_summary
from services.global_ops.polymarket_service import get_polymarket_markets
from services.global_ops.ship_service import get_ships
from services.global_ops.heat_service import get_heat_points

@router.get("/polymarket")
def polymarket():
    return get_polymarket_markets()

@router.get("/ships")
def ships():
    return get_ships()

@router.get("/heat")
def heat():
    return get_heat_points()

@router.get("/entities")
def entities():
    return {
        "flights": get_flights(),
        "news": get_news(),
        "webcams": get_webcams(),
        "polymarket": get_polymarket_markets(),
        "ships": get_ships(),
        "heat": get_heat_points(),
    }