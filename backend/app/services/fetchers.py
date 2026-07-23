import os, httpx
from app.services import cache

AV   = "https://www.alphavantage.co/query"
FH   = "https://finnhub.io/api/v1"
FRED = "https://api.stlouisfed.org/fred/series/observations"

async def av(params: dict) -> dict:
    key = os.getenv("ALPHA_VANTAGE_KEY", "")
    ck  = f"av:{params}"
    hit = cache.get(ck)
    if hit: return hit
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(AV, params={**params, "apikey": key})
        data = r.json()
        cache.set(ck, data, ttl=60)
        return data
    except Exception:
        return {}

async def fh(path: str, params: dict) -> dict | list:
    key = os.getenv("FINNHUB_API_KEY", "")
    ck  = f"fh:{path}:{params}"
    hit = cache.get(ck)
    if hit: return hit
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(f"{FH}/{path}", params={**params, "token": key})
        data = r.json()
        cache.set(ck, data, ttl=60)
        return data
    except Exception:
        return {}

async def fred(series_id: str, limit: int = 8) -> list[float]:
    key = os.getenv("FRED_API_KEY", "")
    ck  = f"fred:{series_id}"
    hit = cache.get(ck)
    if hit: return hit
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(FRED, params={
                "series_id": series_id, "api_key": key,
                "file_type": "json", "sort_order": "desc", "limit": limit,
            })
        obs = r.json().get("observations", [])
        vals = [float(o["value"]) for o in reversed(obs) if o["value"] != "."]
        cache.set(ck, vals, ttl=3600)
        return vals
    except Exception:
        return []
