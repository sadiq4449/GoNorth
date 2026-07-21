from datetime import datetime

from pydantic import BaseModel, Field


class PoolMemberOut(BaseModel):
    id: str
    guest_name: str
    guest_phone: str
    joined_at: datetime


class PoolOut(BaseModel):
    id: str
    origin: str
    destination: str
    departure_time: str
    vehicle_model: str
    driver_name: str
    private_fare: int
    shared_fare: int
    max_seats: int
    occupied_seats: int
    seats_left: int
    per_seat: int
    per_seat_if_join: int | None
    driver_net: int
    status: str
    members: list[PoolMemberOut]
    joined: bool = False
    my_member_id: str | None = None


class PoolJoinRequest(BaseModel):
    guest_name: str = Field(min_length=2, max_length=255)
    guest_phone: str = Field(min_length=6, max_length=32)


class PoolJoinResponse(BaseModel):
    pool: PoolOut
    member_id: str
