import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { STOCKS } from '../data';
import { useApi } from '../hooks/useApi';
import { fetchCompany, fetchSymbolSentiment, fetchSymbolNews } from '../api/endpoints';

const SUPPORTED = Object.keys(STOCKS);

export default function CompanyAnalysis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setSym_q] = useState('');
  const [sym, setSym]     = useState('AAPL');

  useEffect(() => {
    const urlSym = searchParams.get('sym')?.toUpperCase();
    if (urlSym) { setSym(urlSym); setSym_q(urlSym); }
  }, [searchParams]);

  const { data: company, loading: cLoading, error: cError } = useApi(() => fetchCompany(sym), [sym]);
  const { data: sentiment }  = useApi(() => fetchSymbolSentiment(sym), [sym]);
  const { data: newsData }   = useApi(() => fetchSymbolNews(sym, 5), [sym]);

  // Fallback to static data for chart / bull/bear/verdict/ai
  const staticData = STOCKS[sym];
  const chartData  = staticData?.chart.map((v, i) => ({ w: `W${i + 1}`, v })) ?? [];

  const price    = company?.price;
  const chgPct   = company?.change_pct;
  const isUp     = company?.change ? parseFloat(company.change) >= 0 : true;
  const pe       = company?.pe       ?? staticData?.pe;
  const div      = company?.dividend_yield ?? `${staticData?.div}%`;
  const cap      = company?.market_cap;
  const name     = company?.name     ?? staticData?.name ?? sym;
  const sector   = company?.sector   ?? staticData?.sector;
  const sentScore= sentiment?.score  ?? staticData?.sentiment ?? 50;

  const RISK_COLOR    = { LOW: 'var(--up)', MEDIUM: 'var(--gold)', HIGH: 'var(--down)' };
  const VERDICT_COLOR = { BUY: 'var(--up)', HOLD: 'var(--gold)', AVOID: 'var(--down)' };
  const verdict = staticData?.verdict ?? 'HOLD';
  const risk    = staticData?.risk    ?? 'MEDIUM';

  const articles = newsData?.articles ?? [];

  return (
    <div>
      <div className="page-title">COMPANY ANALYSIS</div>
      <div className="page-subtitle">
        Search any stock to see live financial data, price history, and an AI explanation of what the numbers mean.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {SUPPORTED.map(s => (
          <button
            key={s}
            className={`pixel-btn${sym === s ? ' active-btn' : ''}`}
            style={{ fontSize: 7 }}
            onClick={() => navigate(`/company?sym=${s}`)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          className="pixel-input"
          style={{ maxWidth: 220 }}
          placeholder="Type a symbol e.g. NVDA"
          value={query}
          onChange={e => setSym_q(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && navigate(`/company?sym=${query.toUpperCase().trim()}`)}
        />
        <button className="pixel-btn active-btn" onClick={() => navigate(`/company?sym=${query.toUpperCase().trim()}`)}>SEARCH</button>
      </div>

      {cError && (
        <div className="explain-box" style={{ borderLeftColor: 'var(--down)' }}>
          Could not load live data for {sym}. Showing cached data.
        </div>
      )}

      {/* Company header */}
      <div className="pixel-card" style={{ marginBottom: 16 }}>
        {cLoading ? (
          <div style={{ fontSize: 8, color: 'var(--text-3)', padding: '20px 0' }}>Loading live data for {sym}...</div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>COMPANY</div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>{name}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`tag ${risk === 'LOW' ? 'up' : risk === 'MEDIUM' ? 'neutral' : 'down'}`}>{risk} RISK</span>
                <span className={`tag ${verdict === 'BUY' ? 'up' : verdict === 'HOLD' ? 'neutral' : 'down'}`}>{verdict}</span>
                {sector && <span className="tag info">{sector}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>CURRENT PRICE</div>
              <div style={{ fontSize: 18, color: 'var(--text)' }}>{price ? `$${price}` : 'N/A'}</div>
              {chgPct && <div className={isUp ? 'text-up' : 'text-down'} style={{ fontSize: 10, marginTop: 4 }}>{chgPct} today</div>}
            </div>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* Live stats */}
        <div className="pixel-card">
          <div className="card-label">LIVE FINANCIAL DATA</div>
          <div className="explain-box">These numbers come directly from Alpha Vantage and Finnhub APIs.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['P/E Ratio',      pe],
              ['Dividend Yield', div],
              ['Market Cap',     cap ? `$${(Number(cap)/1e9).toFixed(0)}B` : null],
              ['52W High',       company?.['52w_high']],
              ['52W Low',        company?.['52w_low']],
              ['EPS',            company?.eps],
              ['Revenue',        company?.revenue ? `$${(Number(company.revenue)/1e9).toFixed(0)}B` : null],
              ['Net Income',     company?.net_income ? `$${(Number(company.net_income)/1e9).toFixed(0)}B` : null],
              ['Beta',           company?.beta],
              ['ROE',            company?.roe],
            ].map(([k, v]) => v != null && (
              <div key={k as string} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 10 }}>
                <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 5 }}>{k}</div>
                <div style={{ fontSize: 10, color: 'var(--text)' }}>{v as string}</div>
              </div>
            ))}
            {/* Fallback static stats if no live data */}
            {!company && staticData && Object.entries(staticData.stats).map(([k, v]) => (
              <div key={k} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: 10 }}>
                <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 5 }}>{k}</div>
                <div style={{ fontSize: 10, color: 'var(--text)' }}>{v as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart + sentiment */}
        <div className="pixel-card">
          <div className="card-label">PRICE HISTORY — 10 WEEKS</div>
          <div className="explain-box">Each point = the stock price at the end of that week.</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="w" tick={{ fontSize: 7, fill: '#8a6070', fontFamily: 'Press Start 2P' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 7, fill: '#8a6070', fontFamily: 'Press Start 2P' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid #c9a0b0', fontFamily: 'Press Start 2P', fontSize: 8, color: '#2d1a22' }} />
              <Line type="stepAfter" dataKey="v" stroke={isUp ? '#2d7a3a' : '#b03030'} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>
              MARKET SENTIMENT {sentiment?.articles ? `(${sentiment.articles} articles this week)` : ''}
            </div>
            <div className="sentiment-wrap">
              <div className="pixel-bar-wrap" style={{ flex: 1 }}>
                <div className="pixel-bar-fill" style={{
                  width: `${sentScore}%`,
                  background: sentScore >= 60 ? 'var(--up)' : sentScore >= 40 ? 'var(--gold)' : 'var(--down)',
                }} />
              </div>
              <span style={{ fontSize: 8, minWidth: 36, color: sentScore >= 60 ? 'var(--up)' : sentScore >= 40 ? 'var(--gold)' : 'var(--down)' }}>
                {sentScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI analysis */}
      {staticData && (
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <div className="card-label">★ ONYILOKWU AI ANALYSIS</div>
          <div className="oni-bubble">
            <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU EXPLAINS</div>
            <div style={{ fontSize: 9, lineHeight: 2.2, color: 'var(--text)', whiteSpace: 'pre-line', marginBottom: 16 }}>{staticData.ai}</div>

            <div className="grid-2" style={{ gap: 14 }}>
              <div>
                <div style={{ fontSize: 7, color: 'var(--up)', marginBottom: 8 }}>▲ REASONS TO BUY</div>
                {staticData.bullish.map((b, i) => (
                  <div key={i} style={{ fontSize: 8, color: 'var(--text)', lineHeight: 2, marginBottom: 4 }}>▲ {b}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 7, color: 'var(--down)', marginBottom: 8 }}>▼ REASONS TO BE CAREFUL</div>
                {staticData.bearish.map((b, i) => (
                  <div key={i} style={{ fontSize: 8, color: 'var(--text)', lineHeight: 2, marginBottom: 4 }}>▼ {b}</div>
                ))}
              </div>
            </div>

            <div className="pixel-divider" />

            <div style={{
              padding: '12px 14px', marginTop: 4,
              background: verdict === 'BUY' ? 'var(--up-bg)' : verdict === 'HOLD' ? 'var(--gold-bg)' : 'var(--down-bg)',
              border: `2px solid ${VERDICT_COLOR[verdict]}`,
            }}>
              <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>VERDICT</div>
              <div style={{ fontSize: 10, color: VERDICT_COLOR[verdict] }}>
                {verdict === 'BUY'   && '▲ RECOMMENDED — Good entry point based on current data.'}
                {verdict === 'HOLD'  && '◆ NEUTRAL — Not a bad stock but wait for a better price.'}
                {verdict === 'AVOID' && '▼ CAUTION — High risk. Only buy if you fully understand it.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live news for this symbol */}
      {articles.length > 0 && (
        <div className="pixel-card" style={{ marginBottom: 16 }}>
          <div className="card-label">LATEST NEWS — {sym}</div>
          {articles.map((a: any, i: number) => (
            <div
              key={i}
              style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
              onClick={() => a.url && window.open(a.url, '_blank', 'noopener,noreferrer')}
            >
              <div style={{ fontSize: 8, color: 'var(--text)', lineHeight: 1.8, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 7, color: 'var(--text-3)' }}>{a.source}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="pixel-btn" style={{ fontSize: 7 }} onClick={() => navigate('/portfolio')}>
          Add {sym} to Portfolio →
        </button>
        <button className="pixel-btn" style={{ fontSize: 7 }} onClick={() => navigate(`/predict?sym=${sym}`)}>
          See {sym} Prediction →
        </button>
        <button className="pixel-btn" style={{ fontSize: 7 }} onClick={() => navigate('/screener')}>
          Find Similar Stocks →
        </button>
      </div>
    </div>
  );
}
