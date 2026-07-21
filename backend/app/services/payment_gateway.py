"""Select checkout gateway based on traveler locale and preference."""


def select_gateway(
    *,
    country: str,
    payment_method: str | None,
    is_foreign: bool,
) -> str:
    if is_foreign or country not in ("PK",):
        return "stripe"
    if payment_method == "easypaisa":
        return "easypaisa"
    if payment_method == "jazzcash":
        return "jazzcash"
    if payment_method == "card":
        return "stripe"
    if country == "PK":
        return "jazzcash"
    return "stripe"


def gateway_options(amount_pkr: int, usd_pkr_rate: float) -> list[dict]:
    usd = round(amount_pkr / usd_pkr_rate, 2)
    return [
        {"id": "jazzcash", "label": "JazzCash", "currency": "PKR", "amount_pkr": amount_pkr, "amount_usd": usd},
        {"id": "easypaisa", "label": "EasyPaisa", "currency": "PKR", "amount_pkr": amount_pkr, "amount_usd": usd},
        {
            "id": "card",
            "label": "Credit / debit card (Stripe)",
            "currency": "USD",
            "amount_pkr": amount_pkr,
            "amount_usd": usd,
        },
    ]
