import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPortfolioWithPrices, addHolding, removeHolding, fetchCompany } from '../api/endpoints';
import { STOCKS } from '../data';

const STOCK_DB = STOCKS;

const SECTOR_COLORS: Record<string, string> = {
  Technology: '#c0607a', Finance: '#8a6010',
  Healthcare: '#2d7a3a', Energy: '#b03030', Other: '#5a3a8a',
};

type Stage = 'idle' | 'analysing' | 'analysed' | 'bought';

const WARN_MESSAGES: Record<string, string> = {
  HIGH:   'HIGH RISK STOCK — Only invest money you can afford to lose completely. High-risk stocks can drop 50%+ quickly.',
  MEDIUM: 'MEDIUM RISK — This stock has moderate volatility. Ensure it fits your overall risk tolerance.',
  LOW:    'LOWER RISK STOCK — Still monitor regularly. All investments carry some risk.',
};

export default function Portfolio() {
  const navigate  = useNavigate();

  const [portData, setPortData]   = useState<any>(null);
  const [portLoading, setPortLoading] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const [searchSym, setSearchSym]       = useState('');
  const [searchShares, setSearchShares] = useState('');
  const [stage, setStage]               = useState<Stage>('idle');
  const [analysed, setAnalysed]         = useState<typeof STOCK_DB[string] & { sym: string } | null>(null);
  const [searchErr, setSearchErr]       = useState('');
  const [showSellWarn, setShowSellWarn] = useState<string | null>(null);

  const loadPortfolio = useCallback(async () => {
    setPortLoading(true);
    try {
      const data = await fetchPortfolioWithPrices('guest');
      setPortData(data);
    } catch (e: any) {
      console.error(e);
    }
    setPortLoading(false);
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  async function analyse() {
    const s = searchSym.toUpperCase().trim();
    if (!STOCK_DB[s]) {
      setSearchErr(`"${s}" not found. Try: ${Object.keys(STOCK_DB).join(', ')}`);
      return;
    }
    if (!searchShares || Number(searchShares) <= 0) {
      setSearchErr('Enter how many shares you want to buy.');
      return;
    }
    setSearchErr('');
    setStage('analysing');
    try {
      const company = await fetchCompany(s);
      const price   = company.price ?? null;
      setLivePrice(price);
      setAnalysed({ ...STOCK_DB[s], sym: s });
    } catch {
      setLivePrice(null);
      setAnalysed({ ...STOCK_DB[s], sym: s });
    }
    setStage('analysed');
  }

  async function buy() {
    if (!analysed || !livePrice) return;
    await addHolding({
      user_id:  'guest',
      symbol:   analysed.sym,
      shares:   Number(searchShares),
      avg_cost: livePrice,
    });
    setStage('bought');
    loadPortfolio();
    setTimeout(() => { setStage('idle'); setAnalysed(null); setSearchSym(''); setSearchShares(''); }, 2500);
  }

  async function confirmSell(symbol: string) {
    await removeHolding('guest', symbol);
    setShowSellWarn(null);
    loadPortfolio();
  }

  const holdings: any[] = portData?.holdings ?? [];
  const total      = portData?.total_value   ?? 0;
  const totalGain  = portData?.total_gain    ?? 0;
  const gainPct    = portData?.total_gain_pct ?? 0;

  const sectorMap: Record<string, number> = {};
  holdings.forEach((h: any) => {
    const sec = STOCK_DB[h.symbol]?.sector ?? 'Other';
    sectorMap[sec] = (sectorMap[sec] || 0) + h.value;
  });
  const pieData  = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));
  const techPct  = total > 0 ? Math.round(((sectorMap['Technology'] || 0) / total) * 100) : 0;
  const portRisk = techPct > 60 ? 'HIGH' : techPct > 40 ? 'MEDIUM' : 'LOW';
  const riskColor = portRisk === 'HIGH' ? 'var(--down)' : portRisk === 'MEDIUM' ? 'var(--gold)' : 'var(--up)';

  const tooltipStyle = { background: '#fff', border: '2px solid #c9a0b0', fontFamily: 'Press Start 2P', fontSize: 7, color: '#2d1a22' };

  return (
    <div>
      <div className="page-title">PORTFOLIO</div>
      <div className="page-subtitle">
        Track your holdings and live P&amp;L.
      </div>

      {/* Step 1 — Research */}
      <div className="pixel-card" style={{ marginBottom: 16 }}>
        <div className="card-label">★ STEP 1 — RESEARCH A STOCK</div>
        <div className="explain-box">
          Type a stock symbol and how many shares you are thinking of buying.
          Onyilokwu will analyse it before you commit.
          <strong> Supported: {Object.keys(STOCK_DB).join(' · ')}</strong>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <input
            className="pixel-input" style={{ maxWidth: 140 }}
            placeholder="SYMBOL e.g. NVDA"
            value={searchSym}
            onChange={e => { setSearchSym(e.target.value); setStage('idle'); setAnalysed(null); setLivePrice(null); }}
          />
          <input
            className="pixel-input" style={{ maxWidth: 120 }}
            placeholder="NO. OF SHARES"
            type="number" min="1"
            value={searchShares}
            onChange={e => setSearchShares(e.target.value)}
          />
          <button className="pixel-btn active-btn" onClick={analyse} disabled={stage === 'analysing'}>
            {stage === 'analysing' ? 'ANALYSING...' : '★ ANALYSE'}
          </button>
        </div>

        {searchErr && <div style={{ fontSize: 7, color: 'var(--down)', marginTop: 6 }}>{searchErr}</div>}

        {stage === 'analysed' && analysed && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4 }}>{analysed.sym}</div>
                <div style={{ fontSize: 16, color: 'var(--text)' }}>
                  {livePrice ? `$${livePrice}` : 'Loading price...'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="tag info">P/E {analysed.pe}</span>
                <span className="tag info">DIV {analysed.div}%</span>
                <span className="tag info">REV {analysed.revGrowth > 0 ? '+' : ''}{analysed.revGrowth}%</span>
                <span className={`tag ${analysed.risk === 'LOW' ? 'up' : analysed.risk === 'MEDIUM' ? 'neutral' : 'down'}`}>{analysed.risk} RISK</span>
                <span className={`tag ${analysed.verdict === 'BUY' ? 'up' : analysed.verdict === 'HOLD' ? 'neutral' : 'down'}`}>{analysed.verdict}</span>
              </div>
            </div>

            <div style={{ fontSize: 8, color: 'var(--text-2)', marginBottom: 14, padding: '10px 14px', background: 'var(--card-2)', border: '2px solid var(--border-light)' }}>
              {livePrice
                ? <>{searchShares} shares × ${livePrice} = <strong style={{ color: 'var(--text)' }}>${(Number(searchShares) * livePrice).toFixed(2)}</strong> total cost (live price)</>  
                : 'Fetching live price...'}
            </div>

            <div className="oni-bubble" style={{ marginBottom: 14 }}>
              <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU SAYS</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 7, color: 'var(--up)', marginBottom: 8 }}>▲ REASONS TO BUY</div>
                {analysed.bullish.map((b, i) => <div key={i} style={{ fontSize: 8, color: 'var(--text)', lineHeight: 2, marginBottom: 4 }}>▲ {b}</div>)}
              </div>
              <div className="pixel-divider" />
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 7, color: 'var(--down)', marginBottom: 8 }}>▼ REASONS TO BE CAREFUL</div>
                {analysed.bearish.map((b, i) => <div key={i} style={{ fontSize: 8, color: 'var(--text)', lineHeight: 2, marginBottom: 4 }}>▼ {b}</div>)}
              </div>
              <div className="pixel-divider" />
              <div style={{
                padding: '12px 14px',
                background: analysed.verdict === 'BUY' ? 'var(--up-bg)' : analysed.verdict === 'HOLD' ? 'var(--gold-bg)' : 'var(--down-bg)',
                border: `2px solid ${analysed.verdict === 'BUY' ? 'var(--up)' : analysed.verdict === 'HOLD' ? 'var(--gold)' : 'var(--down)'}`,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 7, color: 'var(--text-3)', marginBottom: 6 }}>ONYILOKWU VERDICT</div>
                <div style={{ fontSize: 10, color: analysed.verdict === 'BUY' ? 'var(--up)' : analysed.verdict === 'HOLD' ? 'var(--gold)' : 'var(--down)' }}>
                  {analysed.verdict === 'BUY'   && '▲ RECOMMENDED — Good entry point based on current data.'}
                  {analysed.verdict === 'HOLD'  && '◆ NEUTRAL — Not a bad stock but wait for a better price.'}
                  {analysed.verdict === 'AVOID' && '▼ CAUTION — High risk. Only buy if you fully understand it.'}
                </div>
              </div>
              <div style={{ padding: '10px 14px', fontSize: 7, lineHeight: 2, background: analysed.risk === 'HIGH' ? 'var(--down-bg)' : 'var(--card-2)', border: `2px solid ${analysed.risk === 'HIGH' ? 'var(--down)' : 'var(--border-light)'}`, color: analysed.risk === 'HIGH' ? 'var(--down)' : 'var(--text-3)' }}>
                {WARN_MESSAGES[analysed.risk]}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="pixel-btn active-btn" style={{ flex: 1, fontSize: 9 }} onClick={buy}>
                ▲ BUY {searchShares} SHARES OF {analysed.sym}
              </button>
              <button className="pixel-btn" style={{ flex: 1, fontSize: 9 }} onClick={() => { setStage('idle'); setAnalysed(null); setSearchSym(''); setSearchShares(''); }}>
                ✕ NOT NOW
              </button>
            </div>
          </div>
        )}

        {stage === 'bought' && (
          <div style={{ marginTop: 14, padding: '14px', background: 'var(--up-bg)', border: '2px solid var(--up)', fontSize: 8, color: 'var(--up)', lineHeight: 2 }}>
            ▲ PURCHASE SAVED TO YOUR PORTFOLIO!
          </div>
        )}
      </div>

      {/* Step 2 — Holdings */}
      {portLoading && <div style={{ fontSize: 8, color: 'var(--text-3)', marginBottom: 16 }}>Loading your portfolio...</div>}

      {!portLoading && holdings.length > 0 && (
        <>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="pixel-card">
              <div className="card-label">YOUR HOLDINGS — LIVE P&L</div>
              <div className="pixel-table-wrap">
                <table className="pixel-table">
                  <thead>
                    <tr><th>STOCK</th><th>SHARES</th><th>LIVE PRICE</th><th>VALUE</th><th>GAIN/LOSS</th><th></th></tr>
                  </thead>
                  <tbody>
                    {holdings.map((h: any, i: number) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--pink)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/company?sym=${h.symbol}`)}>{h.symbol}</td>
                        <td>{h.shares}</td>
                        <td style={{ color: 'var(--up)' }}>{h.price ? `$${h.price}` : '—'}</td>
                        <td>${h.value?.toFixed(0) ?? '—'}</td>
                        <td className={h.gain >= 0 ? 'text-up' : 'text-down'}>
                          {h.gain >= 0 ? '+' : ''}${h.gain?.toFixed(0)} ({h.gain_pct?.toFixed(1)}%)
                        </td>
                        <td>
                          <button className="pixel-btn" style={{ fontSize: 6, padding: '4px 8px', borderColor: 'var(--down)', color: 'var(--down)' }} onClick={() => setShowSellWarn(h.symbol)}>SELL</button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ fontSize: 7, color: 'var(--text-3)' }}>TOTAL</td>
                      <td style={{ color: 'var(--text)', fontSize: 10 }}>${total.toFixed(0)}</td>
                      <td className={totalGain >= 0 ? 'text-up' : 'text-down'} style={{ fontSize: 9 }}>
                        {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(0)} ({gainPct.toFixed(1)}%)
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pixel-card">
              <div className="card-label">SECTOR BREAKDOWN</div>
              <div className="explain-box">A healthy portfolio is spread across multiple sectors — not just one.</div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} strokeWidth={2} stroke="#f2dde4">
                    {pieData.map((d, i) => <Cell key={i} fill={SECTOR_COLORS[d.name] || '#5a3a8a'} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `$${Number(v).toFixed(0)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {pieData.map(d => (
                  <span key={d.name} style={{ fontSize: 7, color: SECTOR_COLORS[d.name] || '#5a3a8a' }}>
                    ■ {d.name} {Math.round((d.value / total) * 100)}%
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pixel-card">
            <div className="card-label">★ ONYILOKWU PORTFOLIO REVIEW</div>
            <div className="grid-3" style={{ marginBottom: 14 }}>
              {[
                { label: 'PORTFOLIO RISK',     value: portRisk,                                                color: riskColor },
                { label: 'TOTAL GAIN / LOSS',  value: `${totalGain >= 0 ? '+' : ''}$${totalGain.toFixed(0)}`, color: totalGain >= 0 ? 'var(--up)' : 'var(--down)' },
                { label: 'TECH CONCENTRATION', value: `${techPct}%`,                                          color: techPct > 60 ? 'var(--down)' : 'var(--up)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div style={{ fontSize: 14, color: s.color, marginTop: 6 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="oni-bubble">
              <div className="oni-header"><div className="oni-avatar">★</div>ONYILOKWU SAYS</div>
              <div style={{ fontSize: 8, lineHeight: 2.2, color: 'var(--text)' }}>
                {techPct > 60
                  ? `Your technology concentration is ${techPct}% — above the recommended 40% maximum. Consider adding Healthcare (JNJ), Finance (JPM), or Energy (XOM) to balance things out. Current risk: ${portRisk}.`
                  : `Your portfolio is spread across ${Object.keys(sectorMap).length} sectors. Technology at ${techPct}% is within a healthy range. Overall risk is ${portRisk}. Keep researching new stocks and reviewing your holdings regularly.`
                }
              </div>
            </div>
          </div>
        </>
      )}

      {!portLoading && holdings.length === 0 && (
        <div className="pixel-card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 8, color: 'var(--text-3)', lineHeight: 2 }}>
            Your portfolio is empty. Use the research tool above to add your first stock.
          </div>
        </div>
      )}

      {/* Sell warning modal */}
      {showSellWarn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,26,34,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
          <div className="pixel-card" style={{ maxWidth: 400, width: '90%' }}>
            <div className="card-label" style={{ color: 'var(--down)' }}>SELL WARNING</div>
            <div style={{ fontSize: 8, color: 'var(--text)', lineHeight: 2.2, marginBottom: 16 }}>
              You are about to sell all your <strong style={{ color: 'var(--pink)' }}>{showSellWarn}</strong> shares.
            </div>
            <div style={{ padding: '12px 14px', background: 'var(--down-bg)', border: '2px solid var(--down)', fontSize: 7, color: 'var(--down)', lineHeight: 2, marginBottom: 16 }}>
              WARNING: Selling locks in your current gain or loss permanently.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="pixel-btn" style={{ flex: 1, fontSize: 8, borderColor: 'var(--down)', color: 'var(--down)' }} onClick={() => confirmSell(showSellWarn)}>
                ▼ YES, SELL {showSellWarn}
              </button>
              <button className="pixel-btn active-btn" style={{ flex: 1, fontSize: 8 }} onClick={() => setShowSellWarn(null)}>
                ✕ CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
