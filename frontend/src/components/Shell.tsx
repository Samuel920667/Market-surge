import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import OnyilokwuFloat from './OnyilokwuFloat';
import { useApi } from '../hooks/useApi';
import { fetchMarketSentiment, fetchTicker } from '../api/endpoints';

const NAV = [
  { to: '/',          icon: '▦', label: 'Dashboard',   desc: 'Market overview'   },
  { to: '/news',      icon: '◈', label: 'News Feed',   desc: 'Latest headlines'  },
  { to: '/sentiment', icon: '◉', label: 'Sentiment',   desc: 'Market mood'       },
  { to: '/company',   icon: '◎', label: 'Company',     desc: 'Stock deep-dive'   },
  { to: '/screener',  icon: '▤', label: 'Screener',    desc: 'Filter stocks'     },
  { to: '/economics', icon: '◆', label: 'Economics',   desc: 'GDP, inflation...' },
  { to: '/ai',        icon: '★', label: 'AI Insights', desc: 'Ask Onyilokwu'     },
  { to: '/predict',   icon: '▲', label: 'Predictions', desc: 'ML forecasts'      },
  { to: '/portfolio', icon: '◇', label: 'Portfolio',   desc: 'Your holdings'     },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sideOpen, setSideOpen]   = useState(false);
  const navigate  = useNavigate();

  const { data: sentData } = useApi(() => fetchMarketSentiment());
  const { data: tickerData } = useApi(() => fetchTicker());

  const bullish = sentData?.bullish ?? 0;
  const bearish  = sentData?.bearish ?? 0;
  const tickers  = (tickerData ?? ['NVDA','AAPL','TSLA','MSFT','META','JPM','JNJ','XOM'].map(s => ({ sym: s, price: '—', chg: '—', up: true })));

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="logo">
          <span className="logo-block">▣ </span>MARKET<span className="logo-surge"> SURGE</span>
        </div>
        <div className="topbar-pills">
          <span className={`market-pill ${bullish >= 50 ? 'up' : bullish > 0 ? 'down' : 'gold'}`}>
            {bullish > 0 ? `BULLISH ${bullish}%` : 'LOADING...'}
          </span>
          {bearish > 0 && <span className="market-pill down">BEARISH {bearish}%</span>}
        </div>
      </header>

      {/* ── Ticker tape ── */}
      <div className="ticker-tape">
        <div className="ticker-inner">
          {[...tickers, ...tickers].map((t: any, i: number) => (
            <span key={i} className="ticker-item">
              <span className="ticker-sym">{t.sym}</span>
              <span style={{ color: '#e0e0e0' }}>{t.price}</span>
              <span style={{ color: t.up ? '#00ff88' : '#ff4d4d' }}>{t.chg}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Mobile: dim overlay ── */}
      {sideOpen && <div className="sidebar-overlay" onClick={() => setSideOpen(false)} />}

      {/* ── Mobile: MENU tab on left edge (only when drawer closed) ── */}
      {!sideOpen && (
        <button className="sidebar-tab" onClick={() => setSideOpen(true)}>MENU</button>
      )}

      {/* ── Sidebar ── */}
      <nav className={`sidebar${sideOpen ? ' sidebar-mobile-open' : ''}`}>

        {/* Desktop: collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(o => !o)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>

        {/* Mobile: ✕ close button inside drawer */}
        <button className="sidebar-close-btn" onClick={() => setSideOpen(false)}>✕</button>

        <div className="nav-section">{!collapsed && 'MODULES'}</div>


        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={() => setSideOpen(false)}
            title={collapsed ? n.label : ''}
          >
            <span className="nav-icon">{n.icon}</span>
            {(!collapsed || sideOpen) && (
              <span className="nav-label">
                {n.label}
                <span className="nav-desc">{n.desc}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Main content ── */}
      <main className="main-content">
        {children}
      </main>

      <OnyilokwuFloat />
    </div>
  );
}
