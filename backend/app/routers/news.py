import os
from datetime import date, timedelta
from fastapi import APIRouter
from app.services.fetchers import fh

router = APIRouter(prefix="/api/news", tags=["news"])

@router.get("/")
async def get_news(category: str = "general", limit: int = 20):
    try:
        data = await fh("news", {"category": category})
        if not isinstance(data, list) or len(data) == 0:
            return {"articles": []}
        return {"articles": [
            {
                "title":    a.get("headline", ""),
                "source":   a.get("source", ""),
                "url":      a.get("url", ""),
                "summary":  a.get("summary", ""),
                "image":    a.get("image", ""),
                "time":     a.get("datetime", 0),
                "category": a.get("category", category),
            }
            for a in data[:limit]
        ]}
    except Exception:
        return {"articles": []}

@router.get("/symbol/{symbol}")
async def get_symbol_news(symbol: str, limit: int = 10):
    try:
        today     = date.today().isoformat()
        month_ago = (date.today() - timedelta(days=30)).isoformat()
        data = await fh("company-news", {"symbol": symbol.upper(), "from": month_ago, "to": today})
        if not isinstance(data, list):
            return {"articles": []}
        return {"articles": [
            {
                "title":   a.get("headline", ""),
                "source":  a.get("source", ""),
                "url":     a.get("url", ""),
                "summary": a.get("summary", ""),
                "time":    a.get("datetime", 0),
            }
            for a in data[:limit]
        ]}
    except Exception:
        return {"articles": []}
