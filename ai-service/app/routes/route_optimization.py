from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class Waypoint(BaseModel):
    lat: float
    lng: float
    label: str
    order_id: Optional[str] = None
    quantity: Optional[float] = 0

class RouteRequest(BaseModel):
    origin: Waypoint
    destinations: list[Waypoint]
    vehicle_capacity: Optional[float] = 700

class RouteStop(BaseModel):
    sequence: int
    waypoint: Waypoint
    distance_from_previous: float
    cumulative_distance: float

class RouteResponse(BaseModel):
    optimized_stops: list[RouteStop]
    total_distance_km: float
    estimated_time_minutes: int
    total_load_kg: float
    within_capacity: bool
    savings_vs_separate: float
    disclaimer: str

def haversine(lat1, lng1, lat2, lng2):
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@router.post("/optimize", response_model=RouteResponse)
async def optimize_route(req: RouteRequest):
    # Nearest neighbor TSP heuristic
    remaining = list(enumerate(req.destinations))
    current = (req.origin.lat, req.origin.lng)
    stops = []
    cumulative = 0.0
    seq = 1

    while remaining:
        best_idx = 0
        best_dist = float('inf')
        for i, (_, wp) in enumerate(remaining):
            d = haversine(current[0], current[1], wp.lat, wp.lng)
            if d < best_dist:
                best_dist = d
                best_idx = i
        _, wp = remaining.pop(best_idx)
        cumulative += best_dist
        stops.append(RouteStop(
            sequence=seq, waypoint=wp,
            distance_from_previous=round(best_dist, 1),
            cumulative_distance=round(cumulative, 1),
        ))
        current = (wp.lat, wp.lng)
        seq += 1

    total_qty = sum(d.quantity or 0 for d in req.destinations)
    time_est = round(cumulative * 2)  # ~30km/h avg

    # Separate cost estimate
    separate_dist = sum(
        haversine(req.origin.lat, req.origin.lng, d.lat, d.lng) * 2
        for d in req.destinations
    )
    separate_cost = round(separate_dist * 15 + len(req.destinations) * 100)
    clubbed_cost = round(cumulative * 15 + 200)

    return RouteResponse(
        optimized_stops=stops,
        total_distance_km=round(cumulative, 1),
        estimated_time_minutes=time_est,
        total_load_kg=total_qty,
        within_capacity=total_qty <= req.vehicle_capacity,
        savings_vs_separate=max(0, separate_cost - clubbed_cost),
        disclaimer="DEMO MODE: Estimated route using nearest-neighbor heuristic. Real implementation would use OSRM or Google Directions API.",
    )
