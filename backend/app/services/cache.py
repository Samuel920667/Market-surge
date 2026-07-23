import os, json, time
from typing import Any

try:
    import redis
    _r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
    _r.ping()
    _USE_REDIS = True
except Exception:
    _USE_REDIS = False
    _mem: dict = {}

TTL = 60  # seconds

def get(key: str) -> Any | None:
    if _USE_REDIS:
        v = _r.get(key)
        return json.loads(v) if v else None
    entry = _mem.get(key)
    if entry and time.time() < entry["exp"]:
        return entry["val"]
    return None

def set(key: str, val: Any, ttl: int = TTL):
    if _USE_REDIS:
        _r.setex(key, ttl, json.dumps(val))
    else:
        _mem[key] = {"val": val, "exp": time.time() + ttl}
