'use client';
// app/components/ScamScanner.jsx
import { useState, useEffect } from 'react';

export default function ScamScanner({ symbol: initialSymbol, stock: initialStock }) {
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async (sym) => {
    const s = sym || symbol;
    if (!s) return;
    setLoading(true);
    setResult(null);

    try {
      // Fetch stock data
      const stockRes = await fetch(`/api/stock?symbol=${encodeURIComponent(s)}`);
      const stockData = await stockRes.json();

      // Fetch news
      const newsRes = await fetch(`/api/news?symbol=${encodeURIComponent(s)}`);
      const newsData = await newsRes.json();

      const stock = stockData.data || initialStock;

      // Build risk assessment
      const flags = [];
      let riskScore = 10;

      if (stock?.volumeRatio >= 2) { flags.push(`Volume spike: ${stock.volumeRatio}x average`); riskScore += 25; }
      if (Math.abs(stock?.changePercent || 0) > 8) { flags.push(`Price move: ${stock?.changePercent?.toFixed(1)}% in one day`); riskScore += 20; }
      if (stock?.rangePosition > 88) { flags.push('Near 52-week high — possible distribution phase'); riskScore += 15; }
      if (newsData?.articles?.length > 5) { flags.push(`High news frequency: ${newsData.articles.length} articles in 7 days`); riskScore += 15; }

      const overallSentiment = newsData?.sentiment?.overallSentiment;
      if (overallSentiment === 'Positive' && newsData?.sentiment?.sentimentScore > 80) {
        flags.push('Overwhelmingly positive news sentiment — potential hype'); riskScore += 15;
      }

      riskScore = Math.min(95, riskScore);
      const riskLevel = riskScore >= 65 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';
      const verdict = riskScore >= 65 ? 'High Risk' : riskScore >= 40 ? 'Suspicious' : 'Clean';

      setResult({
        symbol: s.toUpperCase(),
        riskScore,
        riskLevel,
        flags,
        verdict,
        warning: riskScore >= 65 ? `⚠️ ${s.toUpperCase()} shows potential pump-and-dump behavior. Multiple manipulation signals detected.` : null,
        recommendation: riskScore >= 65
          ? 'Avoid new positions. If holding, consider setting tight stop-loss and monitoring closely.'
          : riskScore >= 40
          ? 'Proceed with caution. Verify news sources and avoid chasing momentum blindly.'
          : 'No major manipulation signals detected. Normal due diligence still required.',
        newsCount: newsData?.articles?.length || 0,
        stock,
      });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Auto-scan if initial symbol + stock provided
  useEffect(() => {
    if (initialSymbol && initialStock) scan(initialSymbol);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const riskColor = result?.riskLevel === 'Low' ? 'var(--green)' : result?.riskLevel === 'High' ? 'var(--red)' : 'var(--amber)';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 40px', borderRight: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
        Fraud Detection
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--beige)', fontStyle: 'italic', marginBottom: '20px' }}>
        Risk Scanner
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && scan()}
          placeholder="Enter stock symbol..."
          style={{
            flex: 1, maxWidth: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
            color: 'var(--off-white)', fontFamily: 'var(--mono)', fontSize: '13px',
            padding: '9px 12px', borderRadius: 'var(--r-sm)', outline: 'none',
          }}
        />
        <button
          onClick={() => scan()}
          disabled={loading || !symbol}
          style={{
            background: 'var(--beige)', color: 'var(--bg)', border: 'none',
            fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.08em',
            padding: '9px 18px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
            fontWeight: 600, transition: 'background 0.12s',
          }}
        >
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '14px' }}>
          {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--beige-mid)', animation: `td 1.2s ease-in-out ${d}s infinite` }} />)}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--beige-dim)', marginLeft: '8px' }}>Analyzing market data and news patterns...</span>
        </div>
      )}

      {result && !result.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease' }}>
          {/* Verdict banner */}
          {result.warning ? (
            <div style={{ padding: '16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--red)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Warning Detected</div>
              <div style={{ fontSize: '13px', color: 'var(--red)', lineHeight: 1.6, fontWeight: 500 }}>{result.warning}</div>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--green)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>Clean Signal</div>
              <div style={{ fontSize: '12.5px', color: 'var(--green)' }}>No major manipulation indicators detected for {result.symbol}.</div>
            </div>
          )}

          {/* Risk score */}
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Risk Score</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '48px', color: riskColor, lineHeight: 1 }}>{result.riskScore}</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', color: riskColor, fontWeight: 600 }}>{result.riskLevel} Risk</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{result.verdict}</div>
              </div>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${result.riskScore}%`, background: riskColor, borderRadius: '3px', transition: 'width 1s ease' }} />
            </div>
          </div>

          {/* Flags */}
          {result.flags?.length > 0 && (
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Detected Flags</div>
              {result.flags.map((flag, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--amber)', fontSize: '10px', marginTop: '2px', flexShrink: 0 }}>⚑</span>
                  <span style={{ fontSize: '12px', color: 'var(--beige-dim)' }}>{flag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          <div style={{ padding: '14px', borderLeft: '2px solid var(--beige-mid)', background: 'var(--bg-elevated)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Recommendation</div>
            <div style={{ fontSize: '12.5px', color: 'var(--beige-mid)', lineHeight: 1.6 }}>{result.recommendation}</div>
          </div>
        </div>
      )}
    </div>
  );
}
