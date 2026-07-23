import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { fetchNews, fetchMarketSentiment, fetchCompany } from '../api/endpoints';
import { STOCKS } from '../data';

const SYMBOLS = Object.keys(STOCKS);

function heatColor(chg: number) {
  if (chg > 3)  return '#1a5c1a';
  if (chg > 1)  return '#2d7a2d';
  if (chg > 0)  return '#4a9a4a';
  if (chg > -1) return '#c04040';
  return '#8a2020';
}

function timeAgo(ts: number) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: newsData,  loading: newsLoading  } = useApi(() => fetchNews('general', 4));
  const { data: sentData                          } = useApi(() => fetchMarketSentiment());

  const { data: heatData } = useApi(() =>
    Promise.all(SYMBOLS.map(s => fetchCompany(s).then(d => ({
      sym: s,
      chg: d.change_pct ? parseFloat(d.change_pct.replace('%', '')) : 0,
    })).catch(() => ({ sym: s, chg: 0 }))))
  );

  const articles  = newsData?.articles ?? [];
  const bullish   = sentData?.bullish  ?? 0;
  const heatmap   = heatData ?? SYMBOLS.map(s => ({ sym: s, chg: 0 }));

  return (
    <div>
      <div className="page-title">DASHBOARD</div>
      <div className="page-subtitle">
        Welcome to MarketSurge. Not sure what something means? Click the ★ Onyilokwu AI button — it explains everything in plain English.
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="pixel-card">
          <div className="card-label">MARKET MOOD TODAY</div>
          {bullish > 0 ? (
            <>
              <div className="sentiment-wrap">
                <span className="sentiment-label text-up">BULLISH</span>
                <div className="pixel-bar-wrap" style={{ flex: 1 }}>
                  <div className="pixel-bar-fill" style={{ width: `${bullish}%`, background: 'var(--up)' }} />
                </div>
                <span className="text-up" style={{ minWidth: 32 }}>{bullish}%</span>
              </div>
              <div className="sentiment-wrap">
                <span className="sentiment-label text-down">BEARISH</span>
                <div className="pixel-bar-wrap" style={{ flex: 1 }}>
                  <div className="pixel-bar-fill" style={{ width: `${100 - bullish}%`, background: 'var(--down)' }} />
                </div>
                <span className="text-down" style={{ minWidth: 32 }}>{100 - bullish}%</span>
              </div>
              <div style={{ fontSize: 7, color: 'var(--text-3)', marginTop: 8 }}>
                Live sentiment from Finnhub news analysis across all 8 stocks.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 8, color: 'var(--text-3)', padding: '20px 0' }}>Loading live sentiment...</div>
          )}
        </div>

        <div className="pixel-card">
          <div className="card-label">★ ONYILOKWU — DAILY SUMMARY</div>
          <div className="oni-bubble">
            <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU SAYS</div>
            <div style={{ fontSize: 9, lineHeight: 2, color: 'var(--text)' }}>
              {bullish > 60
                ? `Market sentiment is ${bullish}% bullish today. Technology stocks are leading gains. Click any stock in the heatmap below to get a full AI analysis.`
                : bullish > 0
                ? `Market sentiment is ${bullish}% bullish today. Mixed signals across sectors. Use the Screener to find stocks that match your strategy.`
                : 'Loading live market data... Ask me anything about stocks or investing using the ★ button below.'
              }
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="pixel-card">
          <div className="card-label">MARKET HEATMAP — LIVE</div>
          <div className="explain-box">
            Each block = one stock. <strong>Green = price went up today.</strong> Red = price went down.
            Click any stock to analyse it.
          </div>
          <div className="heatmap-grid">
            {heatmap.map((h: any) => (
              <div
                key={h.sym}
                className="heatmap-cell"
                style={{ background: heatColor(h.chg), cursor: 'pointer' }}
                onClick={() => navigate(`/company?sym=${h.sym}`)}
                title={`Click to analyse ${h.sym}`}
              >
                <span className="sym">{h.sym}</span>
                <span className="chg" style={{ color: h.chg >= 0 ? '#a8e6a0' : '#f09090' }}>
                  {h.chg > 0 ? '+' : ''}{h.chg.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pixel-card">
          <div className="card-label">TODAY'S HEADLINES — LIVE</div>
          <div className="explain-box">
            <strong>Live news from Finnhub.</strong> Click any headline to read the full article.
          </div>
          {newsLoading && (
            <div style={{ fontSize: 8, color: 'var(--text-3)', padding: '20px 0' }}>Loading live news...</div>
          )}
          {articles.map((n: any, i: number) => (
            <div
              key={i}
              style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 7, cursor: 'pointer' }}
              onClick={() => n.url && window.open(n.url, '_blank', 'noopener,noreferrer')}
            >
              <div style={{ fontSize: 9, color: 'var(--text)', lineHeight: 1.8 }}>{n.title}</div>
              <div style={{ fontSize: 7, color: 'var(--text-3)', display: 'flex', gap: 12 }}>
                <span>{n.source}</span>
                <span>{timeAgo(n.time)}</span>
              </div>
            </div>
          ))}
          <button className="pixel-btn" style={{ marginTop: 12, fontSize: 7, width: '100%' }} onClick={() => navigate('/news')}>
            VIEW ALL NEWS →
          </button>
        </div>
      </div>
    </div>
  );
}
