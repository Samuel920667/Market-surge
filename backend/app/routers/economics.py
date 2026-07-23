import asyncio
from fastapi import APIRouter
from app.services.fetchers import fred

router = APIRouter(prefix="/api/economics", tags=["economics"])

SERIES = {
    "inflation":    "CPIAUCSL",
    "gdp":          "A191RL1Q225SBEA",
    "unemployment": "UNRATE",
    "fed_rate":     "FEDFUNDS",
}

@router.get("/indicators")
async def get_indicators():
    try:
        vals = await asyncio.gather(*[fred(sid) for sid in SERIES.values()], return_exceptions=True)
        result = {k: (v if isinstance(v, list) else []) for k, v in zip(SERIES.keys(), vals)}
        return result
    except Exception:
        return {k: [] for k in SERIES}
