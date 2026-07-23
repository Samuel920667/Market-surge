import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from app.services.rag import build_context, retrieve

load_dotenv()
router = APIRouter(prefix="/api/ai", tags=["ai"])

DEEPSEEK_BASE  = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"

SYSTEM_PROMPT = """You are Onyilokwu, a friendly AI financial guide for MarketSurge.
"Onyilokwu" is an Idoma name meaning "one who knows the way".

Your rules:
- Answer in plain English — no jargon unless you explain it immediately after.
- Be concise: under 200 words unless the question genuinely needs more.
- Use bullet points (▲ for positive, ▼ for negative, ◆ for neutral).
- Never give specific buy/sell financial advice. Say "this is educational, not financial advice."
- If the question is about a stock in the knowledge base, use the provided context.
- If you don't know something, say so honestly.
- Do not mention DeepSeek or any other AI company. You are Onyilokwu.
"""

def _client():
    key = os.getenv("DEEPSEEK_API_KEY", "")
    if not key:
        raise HTTPException(503, "AI service not configured")
    from openai import AsyncOpenAI
    return AsyncOpenAI(api_key=key, base_url=DEEPSEEK_BASE)

NO_CREDITS_MSG = "Onyilokwu is taking a short break and will be back soon. Please try again later."

class Query(BaseModel):
    question: str
    context:  str = ""

@router.post("/ask")
async def ask(body: Query):
    try:
        client      = _client()
        rag_context = build_context(body.question, k=3)
        full_context = f"{rag_context}\n\nAdditional context:\n{body.context}" if body.context else rag_context
        resp = await client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "system", "content": f"KNOWLEDGE BASE CONTEXT:\n{full_context}"},
                {"role": "user",   "content": body.question},
            ],
            max_tokens=300,
            temperature=0.4,
        )
        return {"answer": resp.choices[0].message.content}
    except Exception as e:
        if "402" in str(e) or "Insufficient Balance" in str(e):
            return {"answer": NO_CREDITS_MSG}
        raise HTTPException(503, str(e))

@router.post("/ask/stream")
async def ask_stream(body: Query):
    client      = _client()
    rag_context = build_context(body.question, k=3)
    full_context = f"{rag_context}\n\nAdditional context:\n{body.context}" if body.context else rag_context
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"KNOWLEDGE BASE CONTEXT:\n{full_context}"},
        {"role": "user",   "content": body.question},
    ]
    async def _stream():
        try:
            stream = await client.chat.completions.create(
                model=DEEPSEEK_MODEL, messages=messages,
                max_tokens=300, temperature=0.4, stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {delta}\n\n"
        except Exception as e:
            msg = NO_CREDITS_MSG if ("402" in str(e) or "Insufficient Balance" in str(e)) else "Onyilokwu is temporarily unavailable. Please try again in a moment."
            yield f"data: {msg}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(_stream(), media_type="text/event-stream")

@router.post("/summarize")
async def summarize(body: dict):
    client  = _client()
    articles = body.get("articles", [])
    text    = "\n".join(f"- {a}" for a in articles[:10])
    resp = await client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": (
                "Summarize today's financial news for beginner investors in under 150 words. "
                "Highlight: overall market trend, biggest winners, biggest losers, key economic news. "
                "Use plain English. Use bullet points.\n\n" + text
            )},
        ],
        max_tokens=250,
        temperature=0.3,
    )
    return {"summary": resp.choices[0].message.content}

@router.get("/rag/search")
def rag_search(q: str, k: int = 3):
    chunks = retrieve(q, k)
    return {"query": q, "chunks": [{"id": c["id"], "tags": c["tags"]} for c in chunks]}
