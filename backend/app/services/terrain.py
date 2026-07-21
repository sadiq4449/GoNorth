OFFROAD_DESTINATIONS = frozenset({"deosai", "basho"})


def requires_4x4(destination: str) -> bool:
    d = destination.lower()
    return any(off in d for off in OFFROAD_DESTINATIONS)


def vehicle_compatible(destination: str, is_4x4: bool) -> bool:
    if requires_4x4(destination):
        return is_4x4
    return True
