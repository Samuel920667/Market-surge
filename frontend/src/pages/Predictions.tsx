import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useApi } from '../hooks/useApi';
import { fetchPrediction } from '../api/endpoints';
import { STOCKS } from '../data';

const SYMBOLS = Object.keys(STOCKS);

export default function Predictions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sym, setSym] = useState('NVDA');

  useEffect(() => {
    const urlSym = searchParams.get('sym')?.toUpperCase();
    if (urlSym && SYMBOLS.includes(urlSym)) setSym(urlSym);
  }, [searchParams]);

  const { data, loading, error } = useApi(() => fetchPrediction(sym), [sym]);

  const history  = data?.history  ?? [];
  const forecast = data?.forecast ?? [];
  const current  = data?.current  ?? 0;

  // Build chart: history labelled D-N..D-0, forecast D+1..D+7
  const chartData = [
    ...history.map((v: number, i: number) => ({ d: `D-${history.length - i}`, v, type: 'history' })),
    { d: 'TODAY', v: current, type: 'today' },
    ...forecast.map((v: number, i: number) => ({ d: `D+${i + 1}`, v: undefined, f: v, type: 'forecast' })),
  ];

  const trendColor = data?.trend === 'BULLISH' ? 'var(--up)' : data?.trend === 'BEARISH' ? 'var(--down)' : 'var(--gold)';
  const riskColor  = (data?.risk_score ?? 0) > 70 ? 'var(--down)' : (data?.risk_score ?? 0) > 40 ? 'var(--gold)' : 'var(--up)';

  const staticData = STOCKS[sym];

  return (
    <div>
      <div className="page-title">ML PREDICTIONS</div>
      <div className="page-subtitle">
        Real price history from Alpha Vantage + linear regression forecast.
        These are educational forecasts — not financial advice.
      </div>

      <div className="explain-box">
        <strong>How to read this:</strong> The chart shows past prices (left of TODAY) and predicted prices (right of TODAY).
        Confidence % = how certain the model is. Risk score = how volatile the stock is expected to be.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {SYMBOLS.map(s => (
          <button key={s} className={`pixel-btn ${sym === s ? 'active-btn' : ''}`} onClick={() => setSym(s)}>{s}</button>
        ))}
      </div>

      {loading && <div style={{ fontSize: 8, color: 'var(--text-3)', marginBottom: 16 }}>Loading live price data...</div>}
      {error   && <div className="explain-box" style={{ borderLeftColor: 'var(--down)', marginBottom: 16 }}>Could not load live data. Showing demo forecast.</div>}

      <div className="stat-row" style={{ marginBottom: 16 }}>
        {[
          { label: 'CURRENT PRICE', value: current ? `$${current}` : 'N/A',                  color: 'var(--text)' },
          { label: 'TOMORROW',      value: forecast[0] ? `$${forecast[0]}` : 'N/A',           color: forecast[0] > current ? 'var(--up)' : 'var(--down)' },
          { label: 'NEXT WEEK',     value: forecast[6] ? `$${forecast[6]}` : 'N/A',           color: forecast[6] > current ? 'var(--up)' : 'var(--down)' },
          { label: 'RISK SCORE',    value: data?.risk_score != null ? `${data.risk_score}/100` : 'N/A', color: riskColor },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div style={{ fontSize: 14, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="pixel-card">
          <div className="card-label">PRICE FORECAST — {sym}</div>
          <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 12 }}>
            Left of TODAY = actual history. Right = AI prediction.
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="d" tick={{ fontSize: 6, fill: '#8a6070', fontFamily: 'Press Start 2P' }} interval={4} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 6, fill: '#8a6070', fontFamily: 'Press Start 2P' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid #c9a0b0', fontFamily: 'Press Start 2P', fontSize: 7, color: '#2d1a22' }} />
              <ReferenceLine x="TODAY" stroke="#c9a0b0" strokeDasharray="4 4" label={{ value: 'TODAY', fontSize: 6, fill: 'var(--text-3)', fontFamily: 'Press Start 2P' }} />
              <Line type="monotone" dataKey="v" stroke="var(--pink)" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="f" stroke="var(--gold)" strokeWidth={2} dot={false} strokeDasharray="4 4" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 7, color: 'var(--text-3)', marginTop: 8, display: 'flex', gap: 16 }}>
            <span style={{ color: 'var(--pink)' }}>— Actual price</span>
            <span style={{ color: 'var(--gold)' }}>- - Forecast</span>
          </div>
        </div>

        <div className="pixel-card">
          <div className="card-label">MODEL DETAILS</div>
          {[
            { k: 'ALGORITHM',  v: data?.model ?? 'Loading...',  c: 'var(--text-2)' },
            { k: 'TREND',      v: data?.trend ?? 'N/A',         c: trendColor },
            { k: 'VOLATILITY', v: data?.volatility ?? 'N/A',    c: (data?.risk_score ?? 0) > 70 ? 'var(--down)' : 'var(--up)' },
            { k: 'CONFIDENCE', v: data?.confidence != null ? `${data.confidence}%` : 'N/A', c: 'var(--text-2)' },
          ].map(r => (
            <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 7, color: 'var(--text-3)' }}>{r.k}</span>
              <span style={{ fontSize: 8, color: r.c }}>{r.v}</span>
            </div>
          ))}

          {staticData && (
            <div style={{ marginTop: 16 }} className="oni-bubble">
              <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU EXPLAINS</div>
              <div style={{ fontSize: 8, lineHeight: 2.2, color: 'var(--text)' }}>{staticData.ai}</div>
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 7, color: 'var(--text-3)', lineHeight: 2, borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
            NOTE: Predictions are for educational purposes only. Past performance does not guarantee future results.
          </div>
          <button className="pixel-btn" style={{ marginTop: 12, fontSize: 7 }} onClick={() => navigate(`/company?sym=${sym}`)}>Full Analysis for {sym} →</button>
          <button className="pixel-btn" style={{ marginTop: 8, fontSize: 7 }} onClick={() => navigate('/portfolio')}>Add {sym} to Portfolio →</button>
        </div>
      </div>
    </div>
  );
}
