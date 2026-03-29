'use client';
// app/components/ComparePanel.jsx
import { useState } from 'react';

export default function ComparePanel() {
  const [symbolA, setSymbolA] = useState('');
  const [symbolB, setSymbolB] = useState('');
  const [stockA, setStockA] = useState(null);
  const [stockB, setStockB] = useState(null);
  const [analysisA, setAnalysisA] = useState(null);
  const [analysisB, setAnalysisB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verdict, setVerdict] = useState(null);

  const fetchStock = async (sym) => {
    const [stockRes, analystRes] = await Promise.all([
      fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`).then(r => r.json()),
      fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: { displaySymbol: sym, name: sym, price: 0, changePercent: 0, sector: 'N/A', exchange: 'N/A', currencySymbol: '$', volumeRatio: 1, rangePosition: 50, pumpFlags: [] } }),
      }).then(r => r.json()),
    ]);
    return { stock: stockRes.data, analysis: analystRes };
  };

  const compare = async () => {
    if (!symbolA.trim() || !symbolB.trim()) { setError('Enter both stock symbols'); return; }
    if (symbolA.toUpperCase() === symbolB.toUpperCase()) { setError('Please enter two different stocks'); return; }
    setLoading(true); setError(''); setVerdict(null);
    setStockA(null); setStockB(null); setAnalysisA(null); setAnalysisB(null);

    try {
      const [resA, resB] = await Promise.all([
        fetchStock(symbolA.trim()),
        fetchStock(symbolB.trim()),
      ]);

      if (!resA.stock) throw new Error(`Could not fetch data for ${symbolA}`);
      if (!resB.stock) throw new Error(`Could not fetch data for ${symbolB}`);

      // Now re-fetch analyst with real stock data
      const [analystA, analystB] = await Promise.all([
        fetch('/api/analyst', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stockData: resA.stock }) }).then(r => r.json()),
        fetch('/api/analyst', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stockData: resB.stock }) }).then(r => r.json()),
      ]);

      setStockA(resA.stock);
      setStockB(resB.stock);
      setAnalysisA(analystA);
      setAnalysisB(analystB);
      setVerdict(generateVerdict(resA.stock, resB.stock, analystA, analystB));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 40px', borderRight: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>Side-by-Side Analysis</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--beige)', fontStyle: 'italic', marginBottom: '6px' }}>Stock Comparator</div>
      <div style={{ fontSize: '12.5px', color: 'var(--beige-dim)', marginBottom: '28px' }}>Compare any two stocks — analyst forecasts, fundamentals, and a clear buy recommendation.</div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Stock A</label>
          <input value={symbolA} onChange={e => setSymbolA(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && compare()} placeholder="e.g. AAPL" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--off-white)', fontFamily: 'var(--mono)', fontSize: '14px', padding: '10px 14px', borderRadius: 'var(--r-sm)', outline: 'none', width: '140px' }} />
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--beige-ghost)', paddingBottom: '4px' }}>⇄</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Stock B</label>
          <input value={symbolB} onChange={e => setSymbolB(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && compare()} placeholder="e.g. NVDA" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--off-white)', fontFamily: 'var(--mono)', fontSize: '14px', padding: '10px 14px', borderRadius: 'var(--r-sm)', outline: 'none', width: '140px' }} />
        </div>
        <button onClick={compare} disabled={loading} style={{ background: loading ? 'var(--bg-elevated)' : 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '11px 22px', borderRadius: 'var(--r-sm)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.12s' }}>
          {loading ? 'Comparing...' : 'Compare →'}
        </button>
      </div>

      {/* Quick pairs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {[['AAPL','MSFT'],['NVDA','AMD'],['META','GOOGL'],['TSLA','RIVN'],['TCS','INFY']].map(([a,b]) => (
          <button key={`${a}-${b}`} onClick={() => { setSymbolA(a); setSymbolB(b); }} style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '2px', cursor: 'pointer', letterSpacing: '0.04em' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--beige-dim)'; e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {a} vs {b}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: '12px 14px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)', fontSize: '12.5px', color: 'var(--red)', marginBottom: '20px' }}>{error}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
          {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--beige-mid)', animation: `td 1.2s ease-in-out ${d}s infinite` }} />)}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--beige-dim)' }}>Fetching data and generating AI analysis...</span>
        </div>
      )}

      {/* Verdict banner */}
      {verdict && (
        <div style={{ padding: '20px 24px', background: verdict.winner === 'A' ? 'var(--green-dim)' : 'var(--blue-dim)', border: `1px solid ${verdict.winner === 'A' ? 'var(--green)' : 'var(--blue)'}`, borderRadius: 'var(--r-md)', marginBottom: '24px', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: verdict.winner === 'A' ? 'var(--green)' : 'var(--blue)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
            AI Recommendation
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', color: 'var(--off-white)', marginBottom: '6px' }}>
            {verdict.winner === 'A' ? stockA?.displaySymbol : stockB?.displaySymbol} is the better buy
          </div>
          <div style={{ fontSize: '13px', color: 'var(--beige-dim)', lineHeight: 1.65 }}>{verdict.reason}</div>
        </div>
      )}

      {/* Side by side comparison */}
      {stockA && stockB && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <StockCard stock={stockA} analysis={analysisA} label="A" isWinner={verdict?.winner === 'A'} />
          <StockCard stock={stockB} analysis={analysisB} label="B" isWinner={verdict?.winner === 'B'} />
        </div>
      )}

      {/* Metrics table */}
      {stockA && stockB && (
        <div style={{ marginTop: '24px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Head-to-Head Metrics
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 18px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.1em', fontWeight: 400 }}>Metric</th>
                <th style={{ padding: '10px 18px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige)', letterSpacing: '0.05em', fontWeight: 600 }}>{stockA.displaySymbol}</th>
                <th style={{ padding: '10px 18px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige)', letterSpacing: '0.05em', fontWeight: 600 }}>{stockB.displaySymbol}</th>
              </tr>
            </thead>
            <tbody>
              {getMetricRows(stockA, stockB, analysisA, analysisB).map((row, i) => (
                <tr key={i} style={{ borderBottom: i < getMetricRows(stockA, stockB, analysisA, analysisB).length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '10px 18px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em' }}>{row.label}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '11px', color: row.winnerA ? 'var(--green)' : 'var(--beige-dim)', fontWeight: row.winnerA ? 600 : 400 }}>{row.valA}</td>
                  <td style={{ padding: '10px 18px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '11px', color: row.winnerB ? 'var(--green)' : 'var(--beige-dim)', fontWeight: row.winnerB ? 600 : 400 }}>{row.valB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StockCard({ stock, analysis, label, isWinner }) {
  const thesis = analysis?.thesis;
  const rec = thesis?.recommendation || 'HOLD';
  const recColor = rec === 'BUY' ? 'var(--green)' : rec === 'SELL' || rec === 'AVOID' ? 'var(--red)' : 'var(--amber)';
  const isUp = (stock.changePercent || 0) >= 0;

  // Upside potential
  const upside = thesis?.targetPrice && stock.price
    ? (((thesis.targetPrice - stock.price) / stock.price) * 100).toFixed(1)
    : null;

  return (
    <div style={{ background: 'var(--bg-raised)', border: `1px solid ${isWinner ? 'var(--beige-dim)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', padding: '20px', position: 'relative', animation: 'fadeIn 0.4s ease' }}>
      {isWinner && (
        <div style={{ position: 'absolute', top: '-1px', right: '16px', background: 'var(--beige)', color: 'var(--bg)', fontFamily: 'var(--mono)', fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', padding: '3px 10px', borderRadius: '0 0 4px 4px' }}>
          RECOMMENDED
        </div>
      )}
      <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: '4px' }}>STOCK {label}</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--beige)', marginBottom: '2px' }}>{stock.name}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--muted)', marginBottom: '14px' }}>{stock.displaySymbol} · {stock.exchange}</div>

      <div style={{ fontFamily: 'var(--serif)', fontSize: '30px', color: 'var(--off-white)', lineHeight: 1, marginBottom: '4px' }}>
        {stock.currencySymbol}{stock.price?.toFixed(2)}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: isUp ? 'var(--green)' : 'var(--red)', marginBottom: '16px' }}>
        {isUp ? '+' : ''}{stock.changePercent?.toFixed(2)}% today
      </div>

      {/* AI rec */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '2px', background: rec === 'BUY' ? 'var(--green-dim)' : rec === 'SELL' ? 'var(--red-dim)' : 'var(--amber-dim)', color: recColor, border: `1px solid ${recColor}` }}>{rec}</span>
        {upside && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: parseFloat(upside) > 0 ? 'var(--green)' : 'var(--red)' }}>
            {parseFloat(upside) > 0 ? '↑' : '↓'} {Math.abs(upside)}% upside
          </span>
        )}
      </div>

      {thesis?.targetPrice && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', marginBottom: '12px' }}>
          Target: <span style={{ color: 'var(--beige-mid)' }}>{stock.currencySymbol}{thesis.targetPrice}</span>
          <span style={{ marginLeft: '8px' }}>Horizon: {thesis.timeHorizon}</span>
        </div>
      )}

      {/* Mini metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'P/E', val: stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A' },
          { label: 'Beta', val: stock.beta ? stock.beta.toFixed(2) : 'N/A' },
          { label: '52W Pos', val: `${stock.rangePosition}%` },
          { label: 'Sector', val: (stock.sector || 'N/A').slice(0, 12) },
        ].map((m, i) => (
          <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--beige-mid)' }}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {thesis?.summary && (
        <div style={{ marginTop: '12px', fontSize: '11.5px', color: 'var(--beige-dim)', lineHeight: 1.65, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          {thesis.summary.slice(0, 160)}…
        </div>
      )}
    </div>
  );
}

function getMetricRows(a, b, analA, analB) {
  const fmt = (v, dec = 2) => v != null ? v.toFixed(dec) : 'N/A';
  const fmtPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : 'N/A';
  const fmtCap = (v, sym) => v ? `${sym}${(v / 1e9).toFixed(1)}B` : 'N/A';

  const targA = analA?.thesis?.targetPrice;
  const targB = analB?.thesis?.targetPrice;
  const upsideA = targA && a.price ? ((targA - a.price) / a.price * 100) : null;
  const upsideB = targB && b.price ? ((targB - b.price) / b.price * 100) : null;

  const rows = [
    { label: 'Current Price', valA: `${a.currencySymbol}${fmt(a.price)}`, valB: `${b.currencySymbol}${fmt(b.price)}`, winnerA: false, winnerB: false },
    { label: 'Analyst Target', valA: targA ? `${a.currencySymbol}${targA}` : 'N/A', valB: targB ? `${b.currencySymbol}${targB}` : 'N/A', winnerA: upsideA != null && (upsideB == null || upsideA > upsideB), winnerB: upsideB != null && (upsideA == null || upsideB > upsideA) },
    { label: 'Upside Potential', valA: upsideA != null ? `${upsideA.toFixed(1)}%` : 'N/A', valB: upsideB != null ? `${upsideB.toFixed(1)}%` : 'N/A', winnerA: upsideA != null && (upsideB == null || upsideA > upsideB), winnerB: upsideB != null && (upsideA == null || upsideB > upsideA) },
    { label: 'AI Recommendation', valA: analA?.thesis?.recommendation || 'N/A', valB: analB?.thesis?.recommendation || 'N/A', winnerA: analA?.thesis?.recommendation === 'BUY', winnerB: analB?.thesis?.recommendation === 'BUY' },
    { label: 'P/E Ratio', valA: fmt(a.peRatio), valB: fmt(b.peRatio), winnerA: a.peRatio != null && b.peRatio != null && a.peRatio < b.peRatio, winnerB: a.peRatio != null && b.peRatio != null && b.peRatio < a.peRatio },
    { label: 'Beta (Volatility)', valA: fmt(a.beta), valB: fmt(b.beta), winnerA: a.beta != null && b.beta != null && a.beta < b.beta, winnerB: a.beta != null && b.beta != null && b.beta < a.beta },
    { label: 'Market Cap', valA: fmtCap(a.marketCap, a.currencySymbol), valB: fmtCap(b.marketCap, b.currencySymbol), winnerA: false, winnerB: false },
    { label: 'Revenue Growth', valA: fmtPct(a.revenueGrowth), valB: fmtPct(b.revenueGrowth), winnerA: a.revenueGrowth != null && b.revenueGrowth != null && a.revenueGrowth > b.revenueGrowth, winnerB: a.revenueGrowth != null && b.revenueGrowth != null && b.revenueGrowth > a.revenueGrowth },
    { label: '52W Range Position', valA: `${a.rangePosition}%`, valB: `${b.rangePosition}%`, winnerA: false, winnerB: false },
    { label: 'Volume vs Avg', valA: `${a.volumeRatio}x`, valB: `${b.volumeRatio}x`, winnerA: false, winnerB: false },
    { label: 'Sentiment', valA: analA?.thesis?.sentiment || 'N/A', valB: analB?.thesis?.sentiment || 'N/A', winnerA: analA?.thesis?.sentiment === 'Bullish', winnerB: analB?.thesis?.sentiment === 'Bullish' },
  ];
  return rows;
}

function generateVerdict(stockA, stockB, analA, analB) {
  let scoreA = 0, scoreB = 0;

  const tA = analA?.thesis;
  const tB = analB?.thesis;

  if (tA?.recommendation === 'BUY') scoreA += 3;
  if (tB?.recommendation === 'BUY') scoreB += 3;
  if (tA?.recommendation === 'SELL' || tA?.recommendation === 'AVOID') scoreA -= 2;
  if (tB?.recommendation === 'SELL' || tB?.recommendation === 'AVOID') scoreB -= 2;

  const uA = tA?.targetPrice && stockA.price ? ((tA.targetPrice - stockA.price) / stockA.price * 100) : 0;
  const uB = tB?.targetPrice && stockB.price ? ((tB.targetPrice - stockB.price) / stockB.price * 100) : 0;
  if (uA > uB) scoreA += 2; else scoreB += 2;

  if (tA?.sentimentScore > (tB?.sentimentScore || 50)) scoreA += 1; else scoreB += 1;
  if ((stockA.revenueGrowth || 0) > (stockB.revenueGrowth || 0)) scoreA += 1; else scoreB += 1;
  if ((stockA.rangePosition || 50) < 60) scoreA += 1;
  if ((stockB.rangePosition || 50) < 60) scoreB += 1;
  if ((stockA.beta || 1) < (stockB.beta || 1)) scoreA += 1; else scoreB += 1;

  const winner = scoreA >= scoreB ? 'A' : 'B';
  const winnerStock = winner === 'A' ? stockA : stockB;
  const winnerAnalysis = winner === 'A' ? tA : tB;
  const loserStock = winner === 'A' ? stockB : stockA;
  const upside = winner === 'A' ? uA : uB;

  const reason = `${winnerStock.displaySymbol} scores higher across ${Math.abs(scoreA - scoreB) + 1} key indicators. ` +
    (winnerAnalysis?.recommendation === 'BUY' ? `Analysts rate it a BUY ` : '') +
    (upside > 0 ? `with ${upside.toFixed(1)}% upside to the AI price target. ` : '') +
    (winnerAnalysis?.summary ? winnerAnalysis.summary.slice(0, 120) + '…' : '');

  return { winner, reason };
}
