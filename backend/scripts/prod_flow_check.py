"""Production flow check: Plan Trip, checkout, vendor login, Vercel proxy."""
import json
import sys
import urllib.error
import urllib.request

BASE = "https://gonorth-production-acd7.up.railway.app"
VERCEL = "https://gonorth.vercel.app"


def req(method, path, body=None, token=None, base=BASE):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f"{base}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=30) as resp:
        return resp.status, json.loads(resp.read().decode())


def check_url(label, url):
    with urllib.request.urlopen(url, timeout=30) as resp:
        print(f"{label}: OK status={resp.status}")
        return resp.status


def main():
    failures = []
    room = vehicle = None

    try:
        _, search = req("GET", "/api/search?destination=Skardu&nights=5&guests=2&budget=60000&vibe=backpacker")
        assert search["rooms"] and search["vehicles"], "empty listings"
        room, vehicle = search["rooms"][0]["id"], search["vehicles"][0]["id"]
        _, quote = req(
            "POST",
            "/api/cart/quote",
            {
                "room_id": room,
                "vehicle_id": vehicle,
                "guide_ids": [],
                "nights": 5,
                "guests": 2,
                "destination": "Skardu",
            },
        )
        assert quote["total"] > 0
        print(
            f"PLAN_TRIP: OK rooms={len(search['rooms'])} vehicles={len(search['vehicles'])} "
            f"guides={len(search['guides'])} total=PKR {quote['total']:,}"
        )
    except Exception as e:
        failures.append(f"plan_trip: {e}")
        print(f"PLAN_TRIP: FAIL {e}")

    try:
        _, pay = req(
            "POST",
            "/api/payments/init",
            {
                "destination": "Skardu",
                "nights": 5,
                "guests": 2,
                "room_id": room,
                "vehicle_id": vehicle,
                "guide_ids": [],
                "redeem_points": 0,
                "country": "PK",
                "payment_method": "jazzcash",
                "is_foreign": False,
                "safety_profile": {
                    "traveler_name": "Test User",
                    "email": "test@example.com",
                    "phone": "+923001234567",
                    "emergency_contact": None,
                    "blood_group": "O+",
                },
            },
        )
        assert pay["status"] == "pending"
        _, done = req("POST", f"/api/payments/sandbox/complete/{pay['id']}")
        assert done["status"] == "paid"
        _, booking = req("GET", f"/api/bookings/{done['booking_reference']}")
        assert booking["status"] == "confirmed" and booking.get("voucher_token")
        print(f"CHECKOUT: OK ref={done['booking_reference']} gateway={pay.get('gateway', '?')}")
    except Exception as e:
        failures.append(f"checkout: {e}")
        print(f"CHECKOUT: FAIL {e}")

    try:
        _, login = req("POST", "/api/auth/login", {"email": "hostel@skardu.com", "password": "vendor123"})
        assert login["user"]["role"] == "vendor"
        token = login["access_token"]
        _, dash = req("GET", "/api/vendor/dashboard", token=token)
        _, kyc = req("GET", "/api/vendor/kyc", token=token)
        print(
            f"VENDOR_LOGIN: OK role={login['user']['role']} "
            f"dashboard_rooms={dash.get('rooms_count', '?')} kyc={kyc.get('status', '?')}"
        )
    except Exception as e:
        failures.append(f"vendor: {e}")
        print(f"VENDOR_LOGIN: FAIL {e}")

    for label, url in [
        ("HEALTH_PROXY", f"{VERCEL}/health"),
        ("PLAN_PAGE", f"{VERCEL}/plan"),
        ("VENDOR_PAGE", f"{VERCEL}/vendor/login"),
        ("SEARCH_PROXY", f"{VERCEL}/api/search?destination=Skardu&nights=5&guests=2"),
    ]:
        try:
            check_url(label, url)
        except Exception as e:
            failures.append(f"{label}: {e}")
            print(f"{label}: FAIL {e}")

    if failures:
        print("\nFAILED:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("\nALL_CHECKS_PASSED")


if __name__ == "__main__":
    main()
