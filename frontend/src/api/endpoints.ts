import api from './client';
import { supabase } from '../lib/supabase';
import { fetchPrediction as _fetchPrediction } from './endpoints';

// ── Ticker ───────────────────────────────────────────────────────────────────
export const fetchTicker = () =>
  api.get('/api/ticker').then(r => r.data);

// ── Company ──────────────────────────────────────────────────────────────────
export const fetchCompany = (sym: string) =>
  api.get(`/api/company/${sym}`).then(r => r.data);

// ── News ─────────────────────────────────────────────────────────────────────
export const fetchNews = (category = 'general', limit = 20) =>
  api.get('/api/news/', { params: { category, limit } }).then(r => r.data);

export const fetchSymbolNews = (sym: string, limit = 10) =>
  api.get(`/api/news/symbol/${sym}`, { params: { limit } }).then(r => r.data);

// ── Screener ─────────────────────────────────────────────────────────────────
export const fetchUniverse = () =>
  api.get('/api/screener/universe').then(r => r.data);

export const screenStocks = (filters: Record<string, number>) =>
  api.post('/api/screener/screen', filters).then(r => r.data);

// ── Sentiment ────────────────────────────────────────────────────────────────
export const fetchMarketSentiment = () =>
  api.get('/api/sentiment/market').then(r => r.data);

export const fetchSymbolSentiment = (sym: string) =>
  api.get(`/api/sentiment/symbol/${sym}`).then(r => r.data);

export const analyzeText = (text: string) =>
  api.post('/api/sentiment/analyze', { text }).then(r => r.data);

// ── Predictions ──────────────────────────────────────────────────────────────
export const fetchPrediction = (sym: string) =>
  api.get(`/api/predictions/${sym}`).then(r => r.data);

// ── Economics ────────────────────────────────────────────────────────────────
export const fetchEconomics = () =>
  api.get('/api/economics/indicators').then(r => r.data);

// ── AI ───────────────────────────────────────────────────────────────────────
export const askAI = (question: string, context = '') =>
  api.post('/api/ai/ask', { question, context }).then(r => r.data);

export const askAIStream = async (
  question: string,
  context = '',
  onChunk: (text: string) => void,
  onDone: () => void,
) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(
    `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/ai/ask/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, context }),
    },
  );
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') { onDone(); return; }
      onChunk(payload);
    }
  }
  onDone();
};

export const summarizeNews = (articles: string[]) =>
  api.post('/api/ai/summarize', { articles }).then(r => r.data);

// ── Portfolio — Supabase direct ───────────────────────────────────────────────

export type Holding = {
  id?: string;
  user_id: string;
  symbol: string;
  shares: number;
  avg_cost: number;
};

export async function fetchHoldings(userId: string): Promise<Holding[]> {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addHolding(holding: Omit<Holding, 'id'>): Promise<void> {
  // If symbol already exists for this user, increment shares
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, shares')
    .eq('user_id', holding.user_id)
    .eq('symbol', holding.symbol)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('holdings')
      .update({ shares: existing.shares + holding.shares })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('holdings').insert(holding);
    if (error) throw new Error(error.message);
  }
}

export async function removeHolding(userId: string, symbol: string): Promise<void> {
  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol);
  if (error) throw new Error(error.message);
}

// ── Live P&L enrichment (still uses FastAPI for Alpha Vantage prices) ─────────
export async function fetchPortfolioWithPrices(userId: string) {
  const holdings = await fetchHoldings(userId);
  if (!holdings.length) return { holdings: [], total_value: 0, total_gain: 0, total_gain_pct: 0 };

  // Fetch live prices from backend for each unique symbol
  const symbols = [...new Set(holdings.map(h => h.symbol))];
  const priceMap: Record<string, number | null> = {};
  await Promise.all(
    symbols.map(async sym => {
      try {
        const d = await fetchCompany(sym);
        priceMap[sym] = d.price ?? null;
      } catch {
        priceMap[sym] = null;
      }
    })
  );

  let total_value = 0;
  let total_cost  = 0;

  const enriched = holdings.map(h => {
    const price = priceMap[h.symbol] ?? h.avg_cost;
    const cost  = h.shares * h.avg_cost;
    const value = h.shares * price;
    const gain  = value - cost;
    total_value += value;
    total_cost  += cost;
    return {
      ...h,
      price,
      value:    round2(value),
      gain:     round2(gain),
      gain_pct: cost > 0 ? round2((gain / cost) * 100) : 0,
    };
  });

  const total_gain = round2(total_value - total_cost);
  return {
    holdings:       enriched,
    total_value:    round2(total_value),
    total_gain,
    total_gain_pct: total_cost > 0 ? round2((total_gain / total_cost) * 100) : 0,
  };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
