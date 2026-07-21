from sqlalchemy.orm import Session, joinedload

from app.db.models import PoolMember, RidePool, Vehicle


POOL_PREMIUM = 1.2


def shared_fare(private_fare: int) -> int:
    return int(private_fare * POOL_PREMIUM)


def fare_breakdown(private_fare: int, occupied: int, max_seats: int) -> dict:
    """120% model: shared total is fixed; per-seat drops as pool fills."""
    total = shared_fare(private_fare)
    projected = total // max(max_seats, 1)
    if occupied <= 0:
        return {
            "shared_fare": total,
            "per_seat": projected,
            "per_seat_if_join": total,
            "driver_net": int(total * 0.9),
        }
    per_seat = total // occupied
    seats_left = max(max_seats - occupied, 0)
    per_seat_if_join = total // (occupied + 1) if seats_left > 0 else None
    return {
        "shared_fare": total,
        "per_seat": per_seat,
        "per_seat_if_join": per_seat_if_join,
        "driver_net": int(total * 0.9),
    }


def pool_to_dict(
    pool: RidePool,
    *,
    user_id: str | None = None,
    member_ids: list[str] | None = None,
) -> dict:
    vehicle = pool.vehicle
    occupied = len(pool.members)
    fares = fare_breakdown(pool.private_fare, occupied, pool.max_seats)

    my_member = None
    if user_id:
        my_member = next((m for m in pool.members if m.user_id == user_id), None)
    if not my_member and member_ids:
        my_member = next((m for m in pool.members if m.id in member_ids), None)

    return {
        "id": pool.id,
        "origin": pool.origin,
        "destination": pool.destination,
        "departure_time": pool.departure_time,
        "vehicle_model": vehicle.model if vehicle else "Vehicle",
        "driver_name": vehicle.driver_name if vehicle else "Driver",
        "private_fare": pool.private_fare,
        "shared_fare": fares["shared_fare"],
        "max_seats": pool.max_seats,
        "occupied_seats": occupied,
        "seats_left": max(pool.max_seats - occupied, 0),
        "per_seat": fares["per_seat"],
        "per_seat_if_join": fares["per_seat_if_join"],
        "driver_net": fares["driver_net"],
        "status": pool.status,
        "members": [
            {
                "id": m.id,
                "guest_name": m.guest_name,
                "guest_phone": m.guest_phone,
                "joined_at": m.joined_at,
            }
            for m in pool.members
        ],
        "joined": my_member is not None,
        "my_member_id": my_member.id if my_member else None,
    }


def list_active_pools(
    db: Session,
    *,
    user_id: str | None = None,
    member_ids: list[str] | None = None,
) -> list[dict]:
    pools = (
        db.query(RidePool)
        .options(joinedload(RidePool.members), joinedload(RidePool.vehicle))
        .filter(RidePool.status.in_(["open", "full"]))
        .order_by(RidePool.departure_time)
        .all()
    )
    return [pool_to_dict(p, user_id=user_id, member_ids=member_ids) for p in pools]


def join_pool(
    db: Session,
    pool_id: str,
    *,
    guest_name: str,
    guest_phone: str,
    user_id: str | None = None,
) -> tuple[RidePool, PoolMember]:
    pool = (
        db.query(RidePool)
        .options(joinedload(RidePool.members), joinedload(RidePool.vehicle))
        .filter(RidePool.id == pool_id)
        .first()
    )
    if not pool:
        raise ValueError("Pool not found")
    if pool.status not in ("open", "full"):
        raise ValueError("Pool is no longer accepting passengers")

    if user_id and any(m.user_id == user_id for m in pool.members):
        raise ValueError("You already joined this pool")

    if len(pool.members) >= pool.max_seats:
        raise ValueError("Pool is full")

    member = PoolMember(
        pool_id=pool.id,
        user_id=user_id,
        guest_name=guest_name,
        guest_phone=guest_phone,
    )
    db.add(member)
    db.flush()

    occupied_after = len(pool.members)
    if occupied_after >= pool.max_seats:
        pool.status = "full"
    db.commit()
    db.refresh(pool)
    db.refresh(member)
    return pool, member


def leave_pool(db: Session, pool_id: str, member_id: str) -> RidePool:
    pool = (
        db.query(RidePool)
        .options(joinedload(RidePool.members), joinedload(RidePool.vehicle))
        .filter(RidePool.id == pool_id)
        .first()
    )
    if not pool:
        raise ValueError("Pool not found")

    member = db.get(PoolMember, member_id)
    if not member or member.pool_id != pool.id:
        raise ValueError("Membership not found")

    db.delete(member)
    if pool.status == "full":
        pool.status = "open"
    db.commit()
    db.refresh(pool)
    return pool


def auto_pool_for_booking(db: Session, booking) -> RidePool | None:
    """Create or join a ride pool when checkout opted into seat pooling."""
    if not booking.enable_pooling or not booking.vehicle_id:
        return None

    vehicle = db.get(Vehicle, booking.vehicle_id)
    if not vehicle:
        return None

    import json

    stops = []
    if booking.stops_json:
        try:
            stops = json.loads(booking.stops_json)
        except json.JSONDecodeError:
            stops = []
    final_dest = stops[-1] if stops else booking.destination
    origin = booking.destination

    pool = (
        db.query(RidePool)
        .filter(
            RidePool.vehicle_id == vehicle.id,
            RidePool.destination.ilike(f"%{final_dest}%"),
            RidePool.status.in_(["open", "full"]),
        )
        .first()
    )
    if not pool:
        pool = RidePool(
            vehicle_id=vehicle.id,
            origin=f"{origin} Center",
            destination=final_dest,
            departure_time="08:00",
            max_seats=4 if vehicle.is_4x4 else 7,
            private_fare=vehicle.daily_rate,
            status="open",
        )
        db.add(pool)
        db.flush()

    try:
        join_pool(
            db,
            pool.id,
            guest_name=booking.traveler_name,
            guest_phone=booking.phone or booking.email,
            user_id=booking.user_id,
        )
    except ValueError:
        pass
    return pool


def ensure_demo_pools(db: Session) -> None:
    if db.query(RidePool).first():
        return

    vehicles = {v.driver_name: v for v in db.query(Vehicle).all()}
    demos = [
        ("Ali Murad", "Skardu Center", "Deosai Plains", "07:30", 4, 15000),
        ("Junaid Khan", "Skardu Center", "Shigar Cold Desert", "09:00", 7, 12000),
        ("Karim Shah", "Gilgit", "Hunza Valley", "06:00", 4, 16000),
    ]
    for driver, origin, dest, dep, seats, fare in demos:
        vehicle = vehicles.get(driver)
        if not vehicle:
            continue
        db.add(
            RidePool(
                vehicle_id=vehicle.id,
                origin=origin,
                destination=dest,
                departure_time=dep,
                max_seats=seats,
                private_fare=fare,
                status="open",
            )
        )
    db.commit()
