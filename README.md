# ▣ MARKET SURGE

> Minecraft pixel-style AI-powered financial intelligence platform

---

## Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React + TypeScript                |
| Backend    | FastAPI (Python)                  |
| Database   | PostgreSQL + SQLAlchemy           |
| ML         | Scikit-learn, XGBoost, LSTM       |
| NLP        | FinBERT (ProsusAI/finbert)        |
| AI         | OpenAI GPT-4o-mini / Llama 3      |
| Cache      | Redis                             |
| Auth       | JWT                               |
| Deploy     | Docker + AWS                      |

---

## Modules

| # | Module              | Status |
|---|---------------------|--------|
| 1 | News Aggregation    | ✅     |
| 2 | AI Summarization    | ✅     |
| 3 | Sentiment Analysis  | ✅     |
| 4 | Company Analysis    | ✅     |
| 5 | Stock Screener      | ✅     |
| 6 | Economic Indicators | ✅     |
| 7 | AI Investment Chat  | ✅     |
| 8 | ML Predictions      | ✅     |
| 9 | Dashboard           | ✅     |
|10 | Portfolio Analysis  | ✅     |

---

## Quick Start

### 1. Clone & configure

```bash
cd Marketsurge/backend
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Docker (recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 3. Manual

**Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

---

## API Keys Needed

| Service        | Used For              | Free Tier |
|----------------|-----------------------|-----------|
| OpenAI         | AI chat + summaries   | No        |
| Finnhub        | News + stock data     | Yes       |
| Alpha Vantage  | Company financials    | Yes       |
| MarketAux      | Financial news        | Yes       |

---

## Design

- Font: `Press Start 2P` (Google Fonts)
- Color scheme: Dark (#0a0a0a) + Grey borders (#3a3a3a) + White text
- Style: 10px pixel / Minecraft-inspired
- Charts: Recharts with pixel-step rendering
