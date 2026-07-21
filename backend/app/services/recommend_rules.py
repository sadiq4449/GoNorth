from app.services.terrain import requires_4x4, vehicle_compatible


def _pick_by_vibe(rooms, vehicles, guides, vibe: str, budget: int, nights: int, destination: str):
    """Rules-based package selection from live catalog."""
    compat_vehicles = [v for v in vehicles if vehicle_compatible(destination, v.is_4x4)]
    if not compat_vehicles and requires_4x4(destination):
        compat_vehicles = [v for v in vehicles if v.is_4x4]
    if not compat_vehicles:
        compat_vehicles = list(vehicles)
    if not rooms or not compat_vehicles:
        raise ValueError("Insufficient listings")

    vibe = vibe.lower()
    if vibe == "luxury":
        sorted_rooms = sorted(rooms, key=lambda r: r.price_per_night, reverse=True)
        sorted_vehicles = sorted(compat_vehicles, key=lambda v: v.daily_rate, reverse=True)
    else:
        sorted_rooms = sorted(rooms, key=lambda r: r.price_per_night)
        sorted_vehicles = sorted(compat_vehicles, key=lambda v: v.daily_rate)

    guide_ids: list[str] = []
    if vibe == "adventure" and guides:
        guide_ids = [min(guides, key=lambda g: g.daily_rate).id]

    def total_for(room, vehicle, g_ids):
        stay = room.price_per_night * nights
        transport = vehicle.daily_rate * nights
        guides_cost = sum(g.daily_rate for g in guides if g.id in g_ids) * nights
        subtotal = stay + transport + guides_cost
        return subtotal + round(subtotal * 0.10)

    if vibe == "backpacker":
        for room in sorted_rooms:
            for vehicle in sorted_vehicles:
                if total_for(room, vehicle, guide_ids) <= budget:
                    return room, vehicle, guide_ids

    best = None
    for room in sorted_rooms:
        for vehicle in sorted_vehicles:
            t = total_for(room, vehicle, guide_ids)
            if t <= budget:
                best = (room, vehicle, guide_ids)
                break
        if best:
            break

    if best:
        return best

    return sorted_rooms[0], sorted_vehicles[0], guide_ids
