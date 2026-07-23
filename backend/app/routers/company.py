import os, asyncio
from fastapi import APIRouter
from app.services.fetchers import av, fh

router = APIRouter(prefix="/api/company", tags=["company"])

@router.get("/{symbol}")
async def get_company(symbol: str):
    sym = symbol.upper()
    av_key = os.getenv("ALPHA_VANTAGE_KEY", "")
    fh_key = os.getenv("FINNHUB_API_KEY", "")

    overview, quote, profile, metric = {}, {}, {}, {}

    av_tasks = [
        av({"function": "OVERVIEW",     "symbol": sym}) if av_key else asyncio.sleep(0),
        av({"function": "GLOBAL_QUOTE", "symbol": sym}) if av_key else asyncio.sleep(0),
    ]
    fh_tasks = [
        fh("stock/profile2", {"symbol": sym})              if fh_key else asyncio.sleep(0),
        fh("stock/metric",   {"symbol": sym, "metric": "all"}) if fh_key else asyncio.sleep(0),
    ]

    results = await asyncio.gather(*av_tasks, *fh_tasks, return_exceptions=True)
    overview = results[0] if isinstance(results[0], dict) else {}
    quote    = results[1] if isinstance(results[1], dict) else {}
    profile  = results[2] if isinstance(results[2], dict) else {}
    metric   = results[3] if isinstance(results[3], dict) else {}

    q = quote.get("Global Quote", {})
    m = metric.get("metric", {})

    return {
        "symbol":        sym,
        "name":          overview.get("Name")          or profile.get("name", sym),
        "price":         float(q.get("05. price", 0))  or None,
        "change":        q.get("09. change"),
        "change_pct":    q.get("10. change percent"),
        "open":          q.get("02. open"),
        "high":          q.get("03. high"),
        "low":           q.get("04. low"),
        "volume":        q.get("06. volume"),
        "pe":            overview.get("PERatio")        or m.get("peNormalizedAnnual"),
        "eps":           overview.get("EPS")            or m.get("epsNormalizedAnnual"),
        "market_cap":    overview.get("MarketCapitalization"),
        "dividend_yield":overview.get("DividendYield")  or m.get("dividendYieldIndicatedAnnual"),
        "52w_high":      overview.get("52WeekHigh")     or m.get("52WeekHigh"),
        "52w_low":       overview.get("52WeekLow")      or m.get("52WeekLow"),
        "revenue":       overview.get("RevenueTTM"),
        "net_income":    overview.get("NetIncomeTTM"),
        "roe":           overview.get("ReturnOnEquityTTM"),
        "sector":        overview.get("Sector")         or profile.get("finnhubIndustry"),
        "description":   overview.get("Description"),
        "logo":          profile.get("logo"),
        "website":       profile.get("weburl"),
        "beta":          overview.get("Beta")           or m.get("beta"),
    }
