from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import news, sentiment, company, screener, economics, ai, predictions, ticker

app = FastAPI(title="MarketSurge API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [news, sentiment, company, screener, economics, ai, predictions, ticker]:
    app.include_router(router.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "marketsurge", "auth": "supabase", "db": "supabase"}
