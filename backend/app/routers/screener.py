import os, asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.fetchers import av, fh

router = APIRouter(prefix="/api/screener", tags=["screener"])

SYMBOLS = ["NVDA", "MSFT", "AAPL", "TSLA", "META", "JPM", "JNJ", "XOM"]

# Static fundamentals (AV free tier doesn't support bulk overview)
_FUNDAMENTALS = {
    "NVDA": {"name": "NVIDIA",         "cap": 2100, "pe": 65,  "div": 0.03, "rev_growth": 122, "roe": 91,  "sector": "Technology", "risk": "HIGH"},
    "MSFT": {"name": "Microsoft",      "cap": 3100, "pe": 35,  "div": 0.7,  "rev_growth": 17,  "roe": 38,  "sector": "Technology", "risk": "LOW"},
    "AAPL": {"name": "Apple",          "cap": 2900, "pe": 29,  "div": 0.5,  "rev_growth": 2,   "roe": 147, "sector": "Technology", "risk": "LOW"},
    "TSLA": {"name": "Tesla",          "cap": 790,  "pe": 48,  "div": 0,    "rev_growth": -5,  "roe": 22,  "sector": "Technology", "risk": "HIGH"},
    "META": {"name": "Meta Platforms", "cap": 1300, "pe": 28,  "div": 0,    "rev_growth": 27,  "roe": 35,  "sector": "Technology", "risk": "MEDIUM"},
    "JPM":  {"name": "JPMorgan",       "cap": 580,  "pe": 12,  "div": 2.3,  "rev_growth": 22,  "roe": 16,  "sector": "Finance",    "risk": "LOW"},
    "JNJ":  {"name": "J&J",            "cap": 380,  "pe": 15,  "div": 3.1,  "rev_growth": 6,   "roe": 22,  "sector": "Healthcare", "risk": "LOW"},
    "XOM":  {"name": "ExxonMobil",     "cap": 450,  "pe": 14,  "div": 3.4,  "rev_growth": -5,  "roe": 18,  "sector": "Energy",     "risk": "MEDIUM"},
}

async def _live_price(sym: str) -> float | None:
    key = os.getenv("ALPHA_VANTAGE_KEY", "")
    if not key:
        return None
    data = await av({"function": "GLOBAL_QUOTE", "symbol": sym})
    q = data.get("Global Quote", {})
    try:
        return float(q.get("05. price", 0)) or None
    except Exception:
        return None

class Filters(BaseModel):
    min_cap:        Optional[float] = 0
    max_pe:         Optional[float] = 999
    min_div:        Optional[float] = 0
    min_rev_growth: Optional[float] = -999
    min_roe:        Optional[float] = 0

@router.post("/screen")
async def screen(f: Filters):
    prices = await asyncio.gather(*[_live_price(s) for s in SYMBOLS])
    results = []
    for sym, price in zip(SYMBOLS, prices):
        fd = _FUNDAMENTALS[sym]
        if (fd["cap"] >= f.min_cap and fd["pe"] <= f.max_pe and
                fd["div"] >= f.min_div and fd["rev_growth"] >= f.min_rev_growth and
                fd["roe"] >= f.min_roe):
            results.append({**fd, "sym": sym, "price": price})
    return {"count": len(results), "results": results}

@router.get("/universe")
async def universe():
    prices = await asyncio.gather(*[_live_price(s) for s in SYMBOLS])
    return {"results": [
        {**_FUNDAMENTALS[sym], "sym": sym, "price": price}
        for sym, price in zip(SYMBOLS, prices)
    ]}
