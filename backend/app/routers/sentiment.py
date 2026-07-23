import asyncio, time
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.fetchers import fh
from app.services import cache

router = APIRouter(prefix="/api/sentiment", tags=["sentiment"])

SYMBOLS = ["AAPL", "NVDA", "TSLA", "MSFT", "JPM", "JNJ", "XOM", "META"]
SENTIMENT_TTL = 3600  # 1 hour

class TextIn(BaseModel):
    text: str

@router.post("/analyze")
def analyze(body: TextIn):
    try:
        from transformers import pipeline
        pipe = pipeline("text-classification", model="ProsusAI/finbert")
        result = pipe(body.text[:512])[0]
        return {"label": result["label"].upper(), "score": round(result["score"] * 100, 1)}
    except Exception:
        # Keyword scoring fallback when FinBERT model not installed
        pos = ["beat", "surge", "growth", "profit", "strong", "bullish", "record", "rally"]
        neg = ["miss", "fall", "loss", "decline", "weak", "bearish", "lawsuit", "cut", "drop"]
        t = body.text.lower()
        p = sum(1 for w in pos if w in t)
        n = sum(1 for w in neg if w in t)
        if p > n:   return {"label": "POSITIVE", "score": min(99, 60 + p * 8)}
        if n > p:   return {"label": "NEGATIVE", "score": min(99, 60 + n * 8)}
        return {"label": "NEUTRAL", "score": 50}

POS_WORDS = ["beat","surge","growth","profit","strong","bullish","record","rally","gain","rise","up","high","positive","upgrade","buy"]
NEG_WORDS = ["miss","fall","loss","decline","weak","bearish","lawsuit","cut","drop","down","low","negative","downgrade","sell","risk"]

def _score_headlines(articles: list) -> dict:
    p = n = 0
    for a in articles:
        text = (a.get("headline", "") + " " + a.get("summary", "")).lower()
        p += sum(1 for w in POS_WORDS if w in text)
        n += sum(1 for w in NEG_WORDS if w in text)
    total = p + n or 1
    bull = round((p / total) * 100)
    score = min(99, max(1, bull))
    return {"score": score, "bullish": bull, "bearish": 100 - bull, "articles": len(articles)}

@router.get("/symbol/{symbol}")
async def symbol_sentiment(symbol: str):
    sym = symbol.upper()
    ck  = f"sentiment:{sym}"
    hit = cache.get(ck)
    if hit: return hit
    try:
        now  = int(time.time())
        week = now - 7 * 86400
        data = await fh("company-news", {"symbol": sym, "from": time.strftime("%Y-%m-%d", time.gmtime(week)), "to": time.strftime("%Y-%m-%d", time.gmtime(now))})
        if not isinstance(data, list):
            return {"symbol": sym, "score": 50, "bullish": 50, "bearish": 50, "articles": 0, "buzz": 0, "sector_avg_bullish": 50}
        result = _score_headlines(data[:30])
        out = {"symbol": sym, **result, "buzz": round(len(data) / 7, 2), "sector_avg_bullish": result["bullish"]}
        cache.set(ck, out, ttl=SENTIMENT_TTL)
        return out
    except Exception:
        return {"symbol": sym, "score": 50, "bullish": 50, "bearish": 50, "articles": 0, "buzz": 0, "sector_avg_bullish": 50}

@router.get("/market")
async def market_sentiment():
    ck  = "sentiment:market"
    hit = cache.get(ck)
    if hit: return hit
    try:
        results = await asyncio.gather(
            *[symbol_sentiment(s) for s in SYMBOLS],
            return_exceptions=True,
        )
        valid = [r for r in results if isinstance(r, dict)]
        if not valid:
            return {"bullish": 50, "bearish": 50, "label": "NEUTRAL", "fear_greed": 50, "by_symbol": {}}
        avg_bull = round(sum(r["bullish"] for r in valid) / len(valid))
        out = {
            "bullish":    avg_bull,
            "bearish":    100 - avg_bull,
            "label":      "BULLISH" if avg_bull > 50 else "BEARISH",
            "fear_greed": avg_bull,
            "by_symbol":  {r["symbol"]: r["score"] for r in valid},
        }
        cache.set(ck, out, ttl=SENTIMENT_TTL)
        return out
    except Exception:
        return {"bullish": 50, "bearish": 50, "label": "NEUTRAL", "fear_greed": 50, "by_symbol": {}}
