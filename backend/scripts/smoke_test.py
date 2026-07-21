"""End-to-end smoke test against running API (default http://127.0.0.1:8000)."""
import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def req(method: str, path: str, body: dict | None = None, token: str | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=30) as resp:
        return json.loads(resp.read().decode())


def main():
    failures = []

    def check(name, fn):
        try:
            fn()
            print(f"[OK] {name}")
        except Exception as e:
            failures.append(f"{name}: {e}")
            print(f"[FAIL] {name}: {e}")

    def test_health():
        h = req("GET", "/health")
        assert h["status"] == "ok", h
        assert h.get("version"), "missing version"

    def test_search_and_quote():
        s = req("GET", "/api/search?destination=Skardu&nights=5&guests=2")
        assert s["rooms"] and s["vehicles"]
        q = req(
            "POST",
            "/api/cart/quote",
            {
                "room_id": s["rooms"][0]["id"],
                "vehicle_id": s["vehicles"][0]["id"],
                "guide_ids": [],
                "nights": 5,
                "guests": 2,
                "destination": "Skardu",
                "email": "audit@test.com",
                "redeem_points": 0,
            },
        )
        assert q["points_earn_estimate"] > 0

    def test_payment_flow():
        s = req("GET", "/api/search?destination=Skardu&nights=5&guests=2")
        pay = req(
            "POST",
            "/api/payments/init",
            {
                "destination": "Skardu",
                "nights": 5,
                "guests": 2,
                "room_id": s["rooms"][0]["id"],
                "vehicle_id": s["vehicles"][0]["id"],
                "guide_ids": [],
                "redeem_points": 0,
                "country": "PK",
                "payment_method": "jazzcash",
                "is_foreign": False,
                "safety_profile": {
                    "traveler_name": "Audit User",
                    "email": "audit@test.com",
                    "phone": "+923001234567",
                    "emergency_contact": None,
                    "blood_group": "O+",
                },
            },
        )
        assert pay["status"] == "pending"
        done = req("POST", f"/api/payments/sandbox/complete/{pay['id']}")
        assert done["status"] == "paid"
        bk = req("GET", f"/api/bookings/{done['booking_reference']}")
        assert bk["status"] == "confirmed"
        assert bk.get("voucher_token")

    def test_points():
        p = req("GET", "/api/points/balance?email=audit@test.com&subtotal=50000")
        assert "balance" in p

    def test_pools():
        req("GET", "/api/pools/active")

    def test_admin():
        login = req("POST", "/api/auth/login", {"email": "admin@baltitour.com", "password": "admin123"})
        token = login["access_token"]
        req("GET", "/api/admin/pricing", token=token)
        req("GET", "/api/admin/bookings", token=token)
        req("GET", "/api/admin/disputes", token=token)
        req("GET", "/api/admin/payouts", token=token)

    check("health", test_health)
    check("search + cart quote", test_search_and_quote)
    check("payment init + sandbox + booking", test_payment_flow)
    check("points balance", test_points)
    check("pools", test_pools)
    check("admin endpoints", test_admin)

    if failures:
        print("\nFAILED:")
        for f in failures:
            print(" -", f)
        sys.exit(1)
    print("\nAll live checks passed.")


if __name__ == "__main__":
    main()
