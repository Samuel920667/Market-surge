import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApi } from '../hooks/useApi';
import { fetchEconomics } from '../api/endpoints';

const INDICATOR_META = [
  {
    key: 'inflation',
    label: 'INFLATION (CPI)',
    explain: 'Inflation = how fast prices are rising. The Fed targets 2%. Currently above target.',
    ai: 'Rising inflation reduces expectations for interest rate cuts. Bank stocks may benefit from higher rates. Growth stocks (like tech) may slow down as future profits are worth less.',
    color: '#b03030',
    unit: '%',
  },
  {
    key: 'gdp',
    label: 'GDP GROWTH',
    explain: 'GDP = total value of everything the US produces. Growing GDP = healthy economy.',
    ai: 'GDP growth remains healthy. Consumer spending is the primary driver. No recession signals are present. A slowdown from recent highs is normal and not alarming.',
    color: '#2d7a3a',
    unit: '%',
  },
  {
    key: 'fed_rate',
    label: 'INTEREST RATE',
    explain: 'The Fed sets this rate. High rates = expensive borrowing. Low rates = cheap borrowing.',
    ai: 'Rate-sensitive sectors like real estate and utilities may rally on cut expectations. Rate cuts are generally good for growth stocks and bad for bank profits.',
    color: '#8a6010',
    unit: '%',
  },
  {
    key: 'unemployment',
    label: 'UNEMPLOYMENT',
    explain: "Percentage of people who want a job but don't have one. Lower = healthier economy.",
    ai: 'Near historic lows. The labor market is still tight, which supports consumer spending. This level is considered "full employment" by economists.',
    color: '#5a3a8a',
    unit: '%',
  },
];

export default function Economics() {
  const navigate = useNavigate();
  const { data, loading } = useApi(() => fetchEconomics());

  return (
    <div>
      <div className="page-title">ECONOMIC INDICATORS</div>
      <div className="page-subtitle">
        Key economic data from the Federal Reserve (FRED API) that drives the stock market.
        {loading ? ' Loading live data...' : ' Live data loaded.'}
      </div>

      <div className="grid-2">
        {INDICATOR_META.map(ind => {
          const series: number[] = data?.[ind.key] ?? [];
          const current  = series[series.length - 1];
          const previous = series[series.length - 2];
          const rising   = current > previous;
          const chartData = series.map((v, i) => ({ q: `Q${i + 1}`, v }));

          return (
            <div key={ind.key} className="pixel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>{ind.label}</div>
                  <div style={{ fontSize: 18, color: 'var(--text)' }}>
                    {loading ? '...' : current != null ? `${current.toFixed(2)}${ind.unit}` : 'N/A'}
                  </div>
                </div>
                {previous != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>PREVIOUS</div>
                    <div style={{ fontSize: 10, color: rising ? 'var(--down)' : 'var(--up)' }}>
                      {rising ? '▲' : '▼'} {previous.toFixed(2)}{ind.unit}
                    </div>
                  </div>
                )}
              </div>

              <div className="explain-box">{ind.explain}</div>

              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="q" tick={{ fontSize: 6, fill: '#8a6070', fontFamily: 'Press Start 2P' }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 6, fill: '#8a6070', fontFamily: 'Press Start 2P' }} />
                    <Tooltip contentStyle={{ background: '#fff', border: '2px solid #c9a0b0', fontFamily: 'Press Start 2P', fontSize: 7, color: '#2d1a22' }} />
                    <Line type="stepAfter" dataKey="v" stroke={ind.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              <div className="pixel-divider" />

              <div className="oni-bubble">
                <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU EXPLAINS</div>
                <div style={{ fontSize: 8, lineHeight: 2.2, color: 'var(--text)' }}>{ind.ai}</div>
              </div>
              <button className="pixel-btn" style={{ marginTop: 12, fontSize: 7, width: '100%' }} onClick={() => navigate('/screener')}>
                Find stocks affected by this indicator →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
