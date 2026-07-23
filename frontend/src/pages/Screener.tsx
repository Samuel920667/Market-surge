import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { fetchUniverse } from '../api/endpoints';

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'USD — US Dollar',      rate: 1 },
  { code: 'NGN', symbol: '₦',  label: 'NGN — Nigerian Naira', rate: 1600 },
  { code: 'GBP', symbol: '£',  label: 'GBP — British Pound',  rate: 0.79 },
];

const PRESETS = [
  { label: 'Safe & Steady',   desc: 'Low risk, pays dividends. Good for beginners.',              vals: { minCap: 300, maxPE: 30,  minDiv: 1, minRev: 0,  minROE: 0 } },
  { label: 'High Growth',     desc: 'Fast growing companies. Higher risk, higher reward.',        vals: { minCap: 0,   maxPE: 100, minDiv: 0, minRev: 15, minROE: 0 } },
  { label: 'Dividend Hunter', desc: 'Stocks that pay you cash regularly just for holding them.', vals: { minCap: 0,   maxPE: 100, minDiv: 2, minRev: 0,  minROE: 0 } },
  { label: 'Value Pick',      desc: 'Cheap stocks that may be undervalued by the market.',       vals: { minCap: 0,   maxPE: 20,  minDiv: 0, minRev: 0,  minROE: 0 } },
];

const RISK_COLOR: Record<string, string> = { LOW: 'var(--up)', MEDIUM: 'var(--gold)', HIGH: 'var(--down)' };

const FILTERS = [
  { key: 'minCap', label: 'Min Company Size',    unit: '($B)', hint: 'Think of this as how big the company is. Bigger = usually safer. Try 300 for large companies.' },
  { key: 'maxPE',  label: 'Max Price Tag (P/E)', unit: '',     hint: 'P/E = how much you pay for every $1 the company earns. Under 20 = cheap. Over 50 = expensive.' },
  { key: 'minDiv', label: 'Min Dividend Payout', unit: '(%)',  hint: 'Dividend = cash paid to you just for holding the stock. 2% means $20/year per $1000 invested.' },
  { key: 'minRev', label: 'Min Revenue Growth',  unit: '(%)',  hint: 'How fast the company is making more money each year. 10%+ is solid growth.' },
  { key: 'minROE', label: 'Min Efficiency (ROE)', unit: '(%)', hint: 'ROE = how good the company is at turning your money into profit. Higher = better managed.' },
];

export default function Screener() {
  const navigate = useNavigate();
  const [currency, setCurrency]     = useState(CURRENCIES[0]);
  const [vals, setVals]             = useState<Record<string, number>>({ minCap: 0, maxPE: 100, minDiv: 0, minRev: 0, minROE: 0 });
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { data, loading } = useApi(() => fetchUniverse());
  const universe: any[] = data?.results ?? [];

  function applyPreset(p: typeof PRESETS[0]) { setVals(p.vals); setActivePreset(p.label); }
  function reset() { setVals({ minCap: 0, maxPE: 100, minDiv: 0, minRev: 0, minROE: 0 }); setActivePreset(null); }

  const results = universe.filter(s =>
    s.cap >= vals.minCap && s.pe <= vals.maxPE && s.div >= vals.minDiv &&
    s.rev_growth >= vals.minRev && s.roe >= vals.minROE
  );

  function formatCap(capUSD: number) {
    const c = capUSD * currency.rate;
    if (currency.code === 'NGN') return `${currency.symbol}${(c / 1000).toFixed(0)}T`;
    return `${currency.symbol}${c.toFixed(0)}B`;
  }

  return (
    <div>
      <div className="page-title">STOCK SCREENER</div>
      <div className="page-subtitle">
        Find stocks that match what YOU want. {loading ? 'Loading live prices...' : 'Live prices from Alpha Vantage.'}
        Click any result to analyse it.
      </div>

      <div className="pixel-card" style={{ marginBottom: 16 }}>
        <div className="card-label">YOUR CURRENCY</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CURRENCIES.map(c => (
            <button key={c.code} className={`pixel-btn${currency.code === c.code ? ' active-btn' : ''}`} style={{ fontSize: 8 }} onClick={() => setCurrency(c)}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 7, color: 'var(--text-3)', marginTop: 10 }}>
          Market caps are shown in your selected currency. All percentage values stay the same worldwide.
        </div>
      </div>

      <div className="pixel-card" style={{ marginBottom: 16 }}>
        <div className="card-label">QUICK START — PICK A STYLE</div>
        <div style={{ fontSize: 7, color: 'var(--text-2)', marginBottom: 14, lineHeight: 2 }}>
          Not sure where to start? Click one of these to auto-fill the filters for you.
        </div>
        <div className="grid-2" style={{ gap: 10 }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)} className="pixel-btn" style={{
              textAlign: 'left', padding: '12px 14px',
              background: activePreset === p.label ? 'var(--pink)' : 'var(--card-2)',
              color: activePreset === p.label ? '#fff' : 'var(--text)',
              borderColor: activePreset === p.label ? 'var(--pink-dark)' : 'var(--border)',
            }}>
              <div style={{ fontSize: 8, marginBottom: 5 }}>{p.label}</div>
              <div style={{ fontSize: 6, opacity: 0.85, lineHeight: 1.8 }}>{p.desc}</div>
            </button>
          ))}
        </div>
        {activePreset && <button className="pixel-btn" style={{ marginTop: 12, fontSize: 7 }} onClick={reset}>x Clear Preset</button>}
      </div>

      <div className="pixel-card" style={{ marginBottom: 16 }}>
        <div className="card-label">CUSTOM FILTERS</div>
        <div className="explain-box">Leave any filter at <strong>0</strong> to ignore it. Results update instantly as you type.</div>
        <div className="grid-3" style={{ gap: 20 }}>
          {FILTERS.map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 7, color: 'var(--pink)', marginBottom: 6, letterSpacing: 1 }}>{f.label} {f.unit}</div>
              <input type="number" className="pixel-input" value={vals[f.key]}
                onChange={e => { setActivePreset(null); setVals(v => ({ ...v, [f.key]: Number(e.target.value) })); }}
              />
              <div style={{ fontSize: 6, color: 'var(--text-3)', marginTop: 8, lineHeight: 2, background: 'var(--card-2)', padding: '6px 8px', borderLeft: '3px solid var(--pink-light)' }}>
                {f.hint}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pixel-card">
        <div className="card-label">
          {loading ? 'LOADING...' : results.length === 0 ? '0 STOCKS FOUND' : `${results.length} STOCK${results.length > 1 ? 'S' : ''} MATCH YOUR FILTERS`}
        </div>

        {results.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 8, color: 'var(--text-3)', lineHeight: 2 }}>
              No stocks match — try relaxing your filters or use a Quick Start preset above.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              {[{ color: 'var(--up)', label: 'LOW RISK' }, { color: 'var(--gold)', label: 'MEDIUM RISK' }, { color: 'var(--down)', label: 'HIGH RISK' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 6, color: 'var(--text-3)' }}>
                  <div style={{ width: 8, height: 8, background: l.color }} />{l.label}
                </div>
              ))}
            </div>

            <div className="pixel-table-wrap">
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th>STOCK</th><th>COMPANY</th><th>SECTOR</th><th>SIZE ({currency.code})</th>
                    <th>LIVE PRICE</th><th>P/E</th><th>DIVIDEND</th><th>GROWTH</th><th>ROE</th><th>RISK</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((s: any) => (
                    <tr key={s.sym} style={{ cursor: 'pointer' }} onClick={() => navigate(`/company?sym=${s.sym}`)}>
                      <td style={{ color: 'var(--pink)', fontWeight: 'bold' }}>{s.sym}</td>
                      <td style={{ color: 'var(--text)' }}>{s.name}</td>
                      <td style={{ color: 'var(--text-3)' }}>{s.sector}</td>
                      <td>{formatCap(s.cap)}</td>
                      <td style={{ color: 'var(--up)' }}>{s.price ? `$${s.price}` : '—'}</td>
                      <td style={{ color: s.pe < 20 ? 'var(--up)' : s.pe > 40 ? 'var(--down)' : 'var(--text-2)' }}>
                        {s.pe}<span style={{ fontSize: 6, color: 'var(--text-3)', marginLeft: 4 }}>{s.pe < 20 ? '(cheap)' : s.pe > 40 ? '(pricey)' : '(fair)'}</span>
                      </td>
                      <td className={s.div >= 2 ? 'text-up' : s.div > 0 ? 'text-muted' : 'text-down'}>{s.div > 0 ? `${s.div}%` : 'None'}</td>
                      <td className={s.rev_growth > 0 ? 'text-up' : 'text-down'}>{s.rev_growth > 0 ? '+' : ''}{s.rev_growth}%</td>
                      <td className="text-gold">{s.roe}%</td>
                      <td style={{ color: RISK_COLOR[s.risk], fontWeight: 'bold', fontSize: 7 }}>{s.risk}</td>
                      <td><button className="pixel-btn" style={{ fontSize: 6, padding: '4px 8px' }} onClick={e => { e.stopPropagation(); navigate(`/company?sym=${s.sym}`); }}>ANALYSE →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="explain-box" style={{ marginTop: 16, marginBottom: 0 }}>
              <strong>How to read this table:</strong> Click any row to open the full company analysis.{' '}
              <strong>SIZE</strong> = company size in {currency.code} · <strong>P/E</strong> = how expensive the stock is ·{' '}
              <strong>DIVIDEND</strong> = cash paid to you yearly · <strong>GROWTH</strong> = revenue growth ·{' '}
              <strong>ROE</strong> = how well the company uses money · <strong>RISK</strong> = volatility level
            </div>
          </>
        )}
      </div>
    </div>
  );
}
