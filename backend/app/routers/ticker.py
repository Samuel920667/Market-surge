import asyncio
from fastapi import APIRouter
from app.services.fetchers import fh

router = APIRouter(prefix="/api/ticker", tags=["ticker"])

SYMS = ["NVDA", "AAPL", "TSLA", "MSFT", "META", "JPM", "JNJ", "XOM"]

@router.get("")
async def get_ticker():
    results = await asyncio.gather(
        *[fh("quote", {"symbol": s}) for s in SYMS],
        return_exceptions=True,
    )
    out = []
    for s, r in zip(SYMS, results):
        if isinstance(r, dict) and r.get("c"):
            price = r["c"]
            prev  = r.get("pc") or price
            chg   = price - prev
            chg_pct = (chg / prev * 100) if prev else 0
            out.append({
                "sym":   s,
                "price": f"${price:.2f}",
                "chg":   f"{chg_pct:+.2f}%",
                "up":    chg >= 0,
            })
        else:
            out.append({"sym": s, "price": "—", "chg": "—", "up": True})
    return out
