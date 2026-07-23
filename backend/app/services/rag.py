"""
Onyilokwu RAG — Retrieval-Augmented Generation knowledge base.

Architecture:
  - CHUNKS: list of {id, tags, text} documents covering all 8 stocks,
    financial concepts, market mechanics, and platform features.
  - retrieve(query, k): returns the top-k most relevant chunks using
    keyword overlap scoring (no external vector DB needed).
  - build_context(query): returns a formatted string ready to inject
    into the DeepSeek system prompt.
"""

from __future__ import annotations
import re
from typing import List

# ─── Knowledge Chunks ────────────────────────────────────────────────────────

CHUNKS: List[dict] = [

    # ── Stock profiles ────────────────────────────────────────────────────────
    {
        "id": "stock_aapl",
        "tags": ["aapl", "apple", "stock", "technology"],
        "text": (
            "APPLE INC (AAPL) — Technology sector. "
            "Price: $189.45. P/E: 29. Dividend yield: 0.5%. Revenue growth: +2% YoY. "
            "Market cap: $2.9 Trillion. ROE: 147%. Risk: LOW. Verdict: BUY. "
            "Revenue: $383B. Net income: $97B. EPS: $6.13. "
            "52-week high: $199.62. 52-week low: $164.08. "
            "Bullish reasons: Strong brand loyalty and ecosystem lock-in, "
            "Services revenue growing 16% YoY, Massive $90B share buyback programme, "
            "Consistent dividend growth for 10+ years. "
            "Bearish reasons: iPhone sales growth slowing, High valuation vs revenue growth, "
            "EU regulatory pressure on App Store fees. "
            "AI analysis: Apple's P/E of 29 is moderate for a mega-cap tech company. "
            "Strong cash flow and share buybacks support the stock price. "
            "Services revenue is growing 16% per year, reducing dependency on iPhone hardware."
        ),
    },
    {
        "id": "stock_nvda",
        "tags": ["nvda", "nvidia", "stock", "technology", "ai", "gpu", "chips"],
        "text": (
            "NVIDIA CORP (NVDA) — Technology sector. "
            "Price: $875.20. P/E: 65. Dividend yield: 0.03%. Revenue growth: +122% YoY. "
            "Market cap: $2.1 Trillion. ROE: 91%. Risk: HIGH. Verdict: BUY. "
            "Revenue: $60B. Net income: $30B. EPS: $12.96. "
            "52-week high: $974.00. 52-week low: $277.77. "
            "Bullish reasons: AI chip demand growing exponentially, "
            "Data center revenue up 409% YoY, Dominant GPU market position hard to replicate, "
            "Every major AI company depends on NVIDIA. "
            "Bearish reasons: P/E of 65 is very expensive, "
            "Stock could drop sharply if AI spending slows, "
            "Competition from AMD and custom chips growing. "
            "AI analysis: NVIDIA's P/E of 65 reflects massive AI growth expectations. "
            "Data center revenue grew 409% year-over-year. "
            "NVIDIA has a dominant market position in GPU computing that is very difficult to replicate."
        ),
    },
    {
        "id": "stock_tsla",
        "tags": ["tsla", "tesla", "stock", "ev", "electric vehicle", "technology"],
        "text": (
            "TESLA INC (TSLA) — Technology/Auto sector. "
            "Price: $248.10. P/E: 48. Dividend yield: 0%. Revenue growth: -5% YoY. "
            "Market cap: $790B. ROE: 22%. Risk: HIGH. Verdict: HOLD. "
            "Revenue: $97B. Net income: $15B. EPS: $4.73. "
            "52-week high: $299.29. 52-week low: $138.80. "
            "Bullish reasons: Full Self-Driving (FSD) could be transformative, "
            "Energy storage business growing fast, Strong brand and loyal customer base. "
            "Bearish reasons: Q1 deliveries missed estimates badly, "
            "Margins shrinking due to aggressive price cuts, "
            "Chinese EV competition intensifying, CEO distraction risk. "
            "AI analysis: Tesla's P/E of 48 is very high for an automaker. "
            "The Q1 delivery miss raised concerns about demand. "
            "Margin compression from price cuts is a key risk. "
            "Full Self-Driving progress remains the biggest potential catalyst."
        ),
    },
    {
        "id": "stock_msft",
        "tags": ["msft", "microsoft", "stock", "technology", "cloud", "azure", "ai"],
        "text": (
            "MICROSOFT CORP (MSFT) — Technology sector. "
            "Price: $415.60. P/E: 35. Dividend yield: 0.7%. Revenue growth: +17% YoY. "
            "Market cap: $3.1 Trillion. ROE: 38%. Risk: LOW. Verdict: BUY. "
            "Revenue: $212B. Net income: $72B. EPS: $9.72. "
            "52-week high: $430.82. 52-week low: $309.45. "
            "Bullish reasons: Azure cloud growing 28% YoY, "
            "$13B investment in OpenAI gives AI edge, "
            "Copilot embedded in all Office products, Consistent dividend payer. "
            "Bearish reasons: High valuation at P/E 35, "
            "Cloud growth may slow as market matures, "
            "Regulatory scrutiny on AI and acquisitions. "
            "AI analysis: Microsoft's P/E of 35 is justified by consistent double-digit revenue growth. "
            "Azure cloud is growing 28% per year. "
            "The $13B investment in OpenAI gives Microsoft a massive AI advantage."
        ),
    },
    {
        "id": "stock_jpm",
        "tags": ["jpm", "jpmorgan", "jp morgan", "stock", "finance", "bank", "banking"],
        "text": (
            "JPMORGAN CHASE (JPM) — Finance sector. "
            "Price: $198.30. P/E: 12. Dividend yield: 2.3%. Revenue growth: +22% YoY. "
            "Market cap: $580B. ROE: 16%. Risk: LOW. Verdict: BUY. "
            "Revenue: $158B. Net income: $49B. EPS: $16.23. "
            "52-week high: $200.94. 52-week low: $135.19. "
            "Bullish reasons: Cheap valuation P/E of only 12, "
            "High interest rates boosting net interest income, "
            "Strong dividend of 2.3%, Best-managed bank in the US. "
            "Bearish reasons: Banks suffer when interest rates fall, "
            "Recession risk could increase loan defaults, Heavy regulation limits growth. "
            "AI analysis: JPMorgan's P/E of 12 makes it one of the cheapest large-cap stocks. "
            "High interest rates are boosting profits significantly. "
            "The 2.3% dividend provides steady income."
        ),
    },
    {
        "id": "stock_jnj",
        "tags": ["jnj", "johnson", "j&j", "stock", "healthcare", "pharma", "dividend"],
        "text": (
            "JOHNSON & JOHNSON (JNJ) — Healthcare sector. "
            "Price: $152.40. P/E: 15. Dividend yield: 3.1%. Revenue growth: +6% YoY. "
            "Market cap: $380B. ROE: 22%. Risk: LOW. Verdict: BUY. "
            "Revenue: $85B. Net income: $14B. EPS: $5.76. "
            "52-week high: $168.00. 52-week low: $143.13. "
            "Bullish reasons: Defensive stock people always need medicine, "
            "High dividend of 3.1% great for income, "
            "Diversified across pharma and medical devices, "
            "60+ years of consecutive dividend increases. "
            "Bearish reasons: Talc litigation overhang, "
            "Slow revenue growth of 6%, Patent cliffs on key drugs approaching. "
            "AI analysis: J&J is a classic defensive stock. "
            "The 3.1% dividend is one of the most reliable in the market. "
            "Ideal for conservative income-focused investors."
        ),
    },
    {
        "id": "stock_xom",
        "tags": ["xom", "exxon", "exxonmobil", "stock", "energy", "oil", "dividend"],
        "text": (
            "EXXONMOBIL (XOM) — Energy sector. "
            "Price: $118.20. P/E: 14. Dividend yield: 3.4%. Revenue growth: -5% YoY. "
            "Market cap: $450B. ROE: 18%. Risk: MEDIUM. Verdict: HOLD. "
            "Revenue: $398B. Net income: $36B. EPS: $8.89. "
            "52-week high: $123.75. 52-week low: $95.77. "
            "Bullish reasons: High dividend of 3.4% excellent income, "
            "Cheap valuation at P/E 14, "
            "Benefits from geopolitical oil supply disruptions, "
            "Strong balance sheet and cash flow. "
            "Bearish reasons: Revenue declining as oil prices fall, "
            "Long-term risk from energy transition to renewables, "
            "Highly sensitive to oil price swings. "
            "AI analysis: ExxonMobil offers one of the highest dividends in the S&P 500 at 3.4%. "
            "Good for income investors but carries energy transition risk over the next decade."
        ),
    },
    {
        "id": "stock_meta",
        "tags": ["meta", "facebook", "instagram", "whatsapp", "stock", "technology", "social media", "advertising"],
        "text": (
            "META PLATFORMS (META) — Technology sector. "
            "Price: $505.80. P/E: 28. Dividend yield: 0%. Revenue growth: +27% YoY. "
            "Market cap: $1.3 Trillion. ROE: 35%. Risk: MEDIUM. Verdict: BUY. "
            "Revenue: $134B. Net income: $39B. EPS: $14.87. "
            "52-week high: $531.49. 52-week low: $274.38. "
            "Bullish reasons: Ad revenue rebounding strongly, "
            "AI investments paying off in engagement, "
            "WhatsApp and Instagram monetisation growing, "
            "Reasonable P/E of 28 for growth rate. "
            "Bearish reasons: Reality Labs metaverse losing billions, "
            "Regulatory risk in EU and US, Dependence on advertising revenue. "
            "AI analysis: Meta's turnaround has been remarkable. "
            "Ad revenue is growing 27% year-over-year and the P/E of 28 is reasonable. "
            "The metaverse division is still a drag but the core social media business is very strong."
        ),
    },

    # ── Financial concepts ────────────────────────────────────────────────────
    {
        "id": "concept_pe",
        "tags": ["pe", "p/e", "price to earnings", "valuation", "ratio", "expensive", "cheap"],
        "text": (
            "P/E RATIO (Price-to-Earnings): "
            "P/E = Stock Price divided by Earnings Per Share. "
            "It tells you how much investors pay for every $1 of profit the company makes. "
            "Under 15 = possibly cheap or slow-growth company. "
            "15 to 25 = fairly valued for most companies. "
            "25 to 40 = growth premium, investors expect fast earnings growth. "
            "Above 50 = very expensive, high risk if growth disappoints. "
            "Example: Apple at P/E 29 means you pay $29 for every $1 Apple earns. "
            "NVIDIA at P/E 65 means investors expect massive future growth to justify the price. "
            "Low P/E stocks: JPM (12), XOM (14), JNJ (15). "
            "High P/E stocks: NVDA (65), TSLA (48), MSFT (35)."
        ),
    },
    {
        "id": "concept_dividend",
        "tags": ["dividend", "yield", "income", "payout", "cash", "passive income"],
        "text": (
            "DIVIDENDS: Cash paid to shareholders just for owning the stock. "
            "Dividend yield = annual dividend divided by stock price, expressed as a percentage. "
            "Example: JNJ pays 3.1% dividend. If you own $10,000 of JNJ, you receive $310/year in cash. "
            "High dividend stocks in our universe: XOM 3.4%, JNJ 3.1%, JPM 2.3%, MSFT 0.7%, AAPL 0.5%. "
            "No dividend stocks: TSLA 0%, META 0%, NVDA 0.03%. "
            "Rule: Want regular income? Choose high dividend stocks. "
            "Want maximum growth? Growth companies reinvest profits instead of paying dividends. "
            "Dividend aristocrats are companies that have raised dividends for 25+ consecutive years."
        ),
    },
    {
        "id": "concept_market_cap",
        "tags": ["market cap", "capitalization", "size", "large cap", "mega cap", "small cap"],
        "text": (
            "MARKET CAPITALISATION (Market Cap): "
            "Formula: Share Price multiplied by Total Shares Outstanding. "
            "It represents the total value of a company as priced by the stock market. "
            "Mega Cap (over $200B): MSFT $3.1T, AAPL $2.9T, NVDA $2.1T, META $1.3T, TSLA $790B. "
            "Large Cap ($10B-$200B): JPM $580B, XOM $450B, JNJ $380B. "
            "Bigger companies are generally safer but grow more slowly. "
            "Smaller companies can grow faster but carry more risk."
        ),
    },
    {
        "id": "concept_roe",
        "tags": ["roe", "return on equity", "efficiency", "profitability"],
        "text": (
            "RETURN ON EQUITY (ROE): "
            "ROE = Net Income divided by Shareholders Equity, expressed as a percentage. "
            "It measures how efficiently a company uses shareholder money to generate profit. "
            "Above 20% is generally considered good. Above 50% is exceptional. "
            "ROE in our universe: AAPL 147% (exceptional), NVDA 91%, META 35%, MSFT 38%, "
            "TSLA 22%, JNJ 22%, XOM 18%, JPM 16%. "
            "Apple's very high ROE is partly because it buys back so many shares, "
            "reducing equity while maintaining high profits."
        ),
    },
    {
        "id": "concept_revenue_growth",
        "tags": ["revenue", "growth", "sales", "top line", "earnings growth"],
        "text": (
            "REVENUE GROWTH: How fast a company's sales are increasing year over year. "
            "High growth companies in our universe: NVDA +122%, META +27%, JPM +22%, MSFT +17%. "
            "Moderate growth: JNJ +6%, AAPL +2%. "
            "Declining revenue: TSLA -5%, XOM -5%. "
            "Fast revenue growth usually justifies a higher P/E ratio. "
            "Declining revenue is a warning sign unless the company is cutting costs to improve margins."
        ),
    },
    {
        "id": "concept_risk",
        "tags": ["risk", "volatility", "beta", "safe", "risky", "high risk", "low risk"],
        "text": (
            "INVESTMENT RISK LEVELS: "
            "LOW RISK stocks: AAPL, MSFT, JPM, JNJ — stable earnings, strong balance sheets, "
            "lower volatility, often pay dividends. Good for conservative investors. "
            "MEDIUM RISK stocks: META, XOM — some volatility, sector-specific risks. "
            "HIGH RISK stocks: NVDA, TSLA — high volatility, can move 10%+ in a single day, "
            "high valuations that depend on future growth being delivered. "
            "Risk is not just about losing money — it is also about how much the price swings. "
            "A high-risk stock can double or halve in value within a year."
        ),
    },
    {
        "id": "concept_inflation",
        "tags": ["inflation", "cpi", "prices", "purchasing power", "fed", "interest rate"],
        "text": (
            "INFLATION: The rate at which prices rise over time. "
            "Measured by the Consumer Price Index (CPI). "
            "Current US inflation: approximately 2.7%. Fed target: 2.0%. "
            "Impact on stocks: High inflation forces the Fed to raise interest rates. "
            "Higher rates hurt growth stocks (NVDA, TSLA, META) because future profits are worth less. "
            "Higher rates help banks (JPM) because they earn more on loans. "
            "Defensive stocks (JNJ, XOM) tend to hold up better during high inflation. "
            "Moderate inflation of 2-3% is normal and healthy for the economy."
        ),
    },
    {
        "id": "concept_interest_rates",
        "tags": ["interest rate", "fed rate", "federal reserve", "fed", "rate cut", "rate hike", "monetary policy"],
        "text": (
            "INTEREST RATES: Set by the Federal Reserve (the Fed). "
            "Current Fed Funds Rate: 5.25%. "
            "High rates: expensive borrowing, slows economy, hurts growth stocks, helps banks. "
            "Low rates: cheap borrowing, stimulates economy, boosts growth stocks, hurts banks. "
            "Rate cuts are generally positive for the stock market overall. "
            "Rate hikes are generally negative for growth stocks but positive for financial stocks. "
            "The Fed meets 8 times per year to decide on rates. "
            "Markets are currently pricing in 2 rate cuts by year-end."
        ),
    },
    {
        "id": "concept_gdp",
        "tags": ["gdp", "gross domestic product", "economy", "recession", "growth"],
        "text": (
            "GDP (Gross Domestic Product): The total value of all goods and services produced in a country. "
            "Current US GDP growth: 2.8% annually. "
            "GDP above 2% = healthy economy. "
            "GDP below 0% for two consecutive quarters = recession. "
            "Strong GDP growth is generally positive for stocks. "
            "A recession causes most stocks to fall as company earnings decline. "
            "Defensive stocks like JNJ and JPM tend to hold up better in recessions."
        ),
    },
    {
        "id": "concept_sentiment",
        "tags": ["sentiment", "bullish", "bearish", "market mood", "fear", "greed"],
        "text": (
            "MARKET SENTIMENT: The overall attitude of investors toward the market. "
            "Bullish = investors expect prices to rise. Bearish = investors expect prices to fall. "
            "Fear and Greed Index: 0 = extreme fear, 100 = extreme greed. "
            "Current market sentiment: 82% bullish, 18% bearish. Fear/Greed index: 72 (Greed). "
            "Sentiment by stock: NVDA 94% bullish, MSFT 82%, META 78%, AAPL 71%, "
            "JPM 68%, JNJ 60%, XOM 45%, TSLA 38%. "
            "Contrarian investors buy when sentiment is very negative (fear) and sell when very positive (greed)."
        ),
    },
    {
        "id": "concept_beginner",
        "tags": ["beginner", "start", "new", "learn", "invest", "how to", "basics", "introduction"],
        "text": (
            "BEGINNER INVESTING GUIDE: "
            "Step 1: A stock is a tiny piece of ownership in a real company. "
            "Step 2: When the company makes money, your stock goes up in value. "
            "Step 3: Start with index funds like SPY or VOO — they own 500 companies at once, "
            "spreading your risk automatically. "
            "Step 4: Think long-term. The S&P 500 has averaged +10% per year historically. "
            "Step 5: Never invest money you cannot afford to lose. "
            "Step 6: Diversify — do not put all your money in one stock or one sector. "
            "Step 7: Understand what you own before you buy it. "
            "Key terms to learn: P/E ratio, dividend, market cap, revenue growth, ROE."
        ),
    },
    {
        "id": "concept_portfolio",
        "tags": ["portfolio", "diversification", "allocation", "holdings", "balance"],
        "text": (
            "PORTFOLIO MANAGEMENT: "
            "A portfolio is your collection of investments. "
            "Diversification means spreading money across different stocks and sectors. "
            "Recommended maximum tech concentration: 40% of portfolio. "
            "Sectors in our universe: Technology (AAPL, NVDA, TSLA, MSFT, META), "
            "Finance (JPM), Healthcare (JNJ), Energy (XOM). "
            "A balanced portfolio might include: 2-3 tech stocks, 1 bank, 1 healthcare, 1 energy. "
            "Rebalance your portfolio periodically to maintain your target allocation. "
            "Risk levels: HIGH risk portfolio = over 60% tech. MEDIUM = 40-60% tech. LOW = under 40% tech."
        ),
    },
    {
        "id": "concept_screener",
        "tags": ["screener", "filter", "screen", "find stocks", "criteria"],
        "text": (
            "STOCK SCREENER: A tool to filter stocks based on financial criteria. "
            "Key filters: Market Cap (company size), P/E ratio (valuation), "
            "Dividend yield (income), Revenue growth (momentum), ROE (efficiency). "
            "Preset strategies: "
            "Safe and Steady: min cap $300B, max P/E 30, min dividend 1%. Good for beginners. "
            "High Growth: min revenue growth 15%. For investors who want fast-growing companies. "
            "Dividend Hunter: min dividend 2%. For investors who want regular income. "
            "Value Pick: max P/E 20. For investors looking for cheap, undervalued stocks."
        ),
    },
    {
        "id": "concept_predictions",
        "tags": ["prediction", "forecast", "ml", "machine learning", "price target", "future price"],
        "text": (
            "ML PRICE PREDICTIONS: "
            "MarketSurge uses real 60-day price history from Alpha Vantage "
            "combined with linear regression to forecast the next 7 days. "
            "Confidence score: how certain the model is (40-85%). "
            "Volatility: HIGH means the stock moves a lot. LOW means it is stable. "
            "Risk score: 0-100, higher = more volatile and unpredictable. "
            "IMPORTANT: These are educational forecasts, not financial advice. "
            "No model can reliably predict stock prices. Past performance does not guarantee future results."
        ),
    },
    {
        "id": "platform_onyilokwu",
        "tags": ["onyilokwu", "ai", "who are you", "about", "marketsurge"],
        "text": (
            "ONYILOKWU AI: Your personal financial guide on MarketSurge. "
            "Onyilokwu is an Idoma name meaning 'one who knows the way'. "
            "The Idoma people are from Benue State, Nigeria. "
            "Onyilokwu can help with: stock analysis for AAPL, NVDA, TSLA, MSFT, JPM, JNJ, XOM, META, "
            "financial term explanations, market updates, beginner investing advice, "
            "portfolio guidance, and economic indicator analysis. "
            "Powered by DeepSeek AI with a custom financial knowledge base (RAG system). "
            "MarketSurge is a beginner-friendly stock market platform with pixel art design."
        ),
    },
]

# ─── Retriever ────────────────────────────────────────────────────────────────

def _tokenise(text: str) -> set[str]:
    """Lowercase words, 3+ chars, no punctuation."""
    return set(re.findall(r"[a-z]{3,}", text.lower()))

# Pre-tokenise all chunks once at import time
_CHUNK_TOKENS = [
    _tokenise(c["text"] + " " + " ".join(c["tags"]))
    for c in CHUNKS
]

def retrieve(query: str, k: int = 3) -> List[dict]:
    """Return the top-k chunks most relevant to the query."""
    q_tokens = _tokenise(query)
    if not q_tokens:
        return CHUNKS[:k]

    scores = [
        len(q_tokens & chunk_tokens)
        for chunk_tokens in _CHUNK_TOKENS
    ]
    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    return [CHUNKS[i] for i in top_indices if scores[i] > 0] or CHUNKS[:k]

def build_context(query: str, k: int = 3) -> str:
    """Return formatted context string for injection into the LLM prompt."""
    chunks = retrieve(query, k)
    return "\n\n---\n\n".join(c["text"] for c in chunks)
