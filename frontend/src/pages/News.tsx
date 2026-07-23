import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { fetchNews } from '../api/endpoints';

const CATS = ['general', 'technology', 'forex', 'crypto', 'merger'];
const CAT_LABELS: Record<string, string> = {
  general: 'All', technology: 'Technology', forex: 'Forex', crypto: 'Crypto', merger: 'M&A',
};

function timeAgo(ts: number) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STOCK_SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'JPM', 'JNJ', 'XOM', 'META'];
function detectSym(title: string): string | null {
  return STOCK_SYMBOLS.find(s => title.toUpperCase().includes(s)) ?? null;
}

export default function News() {
  const [cat, setCat]         = useState('general');
  const [expanded, setExpanded] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data, loading } = useApi(() => fetchNews(cat, 20), [cat]);
  const articles: any[] = data?.articles ?? [];

  function toggle(i: number) {
    setExpanded(prev => prev === i ? null : i);
  }

  return (
    <div>
      <div className="page-title">NEWS FEED</div>
      <div className="page-subtitle">
        Live financial headlines from Finnhub.
        {loading ? ' Loading...' : ` ${articles.length} articles loaded.`}
        {' '}Click any headline to read the summary.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATS.map(c => (
          <button key={c} className={`pixel-btn ${cat === c ? 'active-btn' : ''}`} onClick={() => { setCat(c); setExpanded(null); }}>
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ fontSize: 8, color: 'var(--text-3)', padding: '40px 0', textAlign: 'center' }}>
          Loading live news from Finnhub...
        </div>
      )}

      {/* Featured article */}
      {articles.length > 0 && (() => {
        const a = articles[0];
        const sym = detectSym(a.title);
        const isOpen = expanded === 0;
        return (
          <div className="pixel-card" style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => toggle(0)}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 7, color: 'var(--pink)', textTransform: 'uppercase', letterSpacing: 1 }}>★ FEATURED</span>
              {a.image && <img src={a.image} alt="" style={{ width: 60, height: 40, objectFit: 'cover', border: '2px solid var(--border)' }} />}
              {sym && (
                <span className="tag info" style={{ cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); navigate(`/company?sym=${sym}`); }}>
                  Analyse {sym} →
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, marginBottom: 8 }}>{a.title}</div>
            {isOpen && (
              <div style={{ marginTop: 10 }}>
                {a.summary && (
                  <div style={{ fontSize: 8, color: 'var(--text-2)', lineHeight: 2.2, marginBottom: 14, padding: '10px 14px', background: 'var(--card-2)', border: '2px solid var(--border-light)' }}>
                    {a.summary}
                  </div>
                )}
                <a
                  href={a.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 8, color: 'var(--pink)', textDecoration: 'underline' }}
                  onClick={e => e.stopPropagation()}
                >
                  Read full article on {a.source} →
                </a>
              </div>
            )}
            <div style={{ fontSize: 7, color: 'var(--text-3)', display: 'flex', gap: 16, marginTop: 10 }}>
              <span>{a.source}</span>
              <span>{timeAgo(a.time)}</span>
              <span style={{ color: 'var(--pink)', marginLeft: 'auto' }}>{isOpen ? '▲ COLLAPSE' : '▼ READ SUMMARY'}</span>
            </div>
          </div>
        );
      })()}

      {/* Article list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {articles.slice(1).map((a: any, i: number) => {
          const idx = i + 1;
          const sym = detectSym(a.title);
          const isOpen = expanded === idx;
          return (
            <div
              key={idx}
              className="pixel-card"
              style={{ cursor: 'pointer', padding: '14px 18px' }}
              onClick={() => toggle(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, color: 'var(--text)', lineHeight: 1.9, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 7, color: 'var(--text-3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>{a.source}</span>
                    <span>{timeAgo(a.time)}</span>
                    {sym && (
                      <span
                        style={{ color: 'var(--pink)', textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); navigate(`/company?sym=${sym}`); }}
                      >
                        Analyse {sym} →
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 7, color: 'var(--pink)', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div style={{ marginTop: 12 }}>
                  {a.summary ? (
                    <div style={{ fontSize: 8, color: 'var(--text-2)', lineHeight: 2.2, marginBottom: 12, padding: '10px 14px', background: 'var(--card-2)', border: '2px solid var(--border-light)' }}>
                      {a.summary}
                    </div>
                  ) : (
                    <div style={{ fontSize: 8, color: 'var(--text-3)', marginBottom: 12 }}>No summary available.</div>
                  )}
                  <a
                    href={a.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 8, color: 'var(--pink)', textDecoration: 'underline' }}
                    onClick={e => e.stopPropagation()}
                  >
                    Read full article on {a.source} →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
