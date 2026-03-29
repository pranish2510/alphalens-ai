'use client';
// app/components/AlertsPanel.jsx
import { useState, useEffect } from 'react';

export default function AlertsPanel({ symbol, alerts: propAlerts = [] }) {
  const [alerts, setAlerts] = useState(propAlerts);
  const [loading, setLoading] = useState(false);
  const [scanSymbol, setScanSymbol] = useState(symbol || '');

  useEffect(() => {
    if (propAlerts.length > 0) setAlerts(propAlerts);
  }, [propAlerts]);

  const scanForAlerts = async (sym) => {
    const s = sym || scanSymbol;
    if (!s) return;
    setLoading(true);
    try {
      const [stockRes, newsRes] = await Promise.all([
        fetch(`/api/stock?symbol=${encodeURIComponent(s)}`),
        fetch(`/api/news?symbol=${encodeURIComponent(s)}`),
      ]);
      const stockData = await stockRes.json();
      const newsData = await newsRes.json();

      const alertsRes = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: stockData.data, newsData }),
      });
      const alertsData = await alertsRes.json();
      setAlerts(alertsData.alerts || []);
    } catch (err) {
      console.error('Alert scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = {
    critical: { bg: 'var(--red-dim)', border: 'var(--red)', color: 'var(--red)', label: 'CRITICAL' },
    warning:  { bg: 'var(--amber-dim)', border: 'var(--amber)', color: 'var(--amber)', label: 'WARNING' },
    info:     { bg: 'var(--blue-dim)', border: 'var(--blue)', color: 'var(--blue)', label: 'INFO' },
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 40px', borderRight: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
        Real-time Detection
      </div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--beige)', fontStyle: 'italic', marginBottom: '20px' }}>
        Smart Alerts
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        <input
          value={scanSymbol}
          onChange={e => setScanSymbol(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && scanForAlerts()}
          placeholder="Stock symbol to scan..."
          style={{
            flex: 1, maxWidth: '220px', background: 'var(--bg-surface)',
            border: '1px solid var(--border-soft)', color: 'var(--off-white)',
            fontFamily: 'var(--mono)', fontSize: '12px', padding: '8px 12px',
            borderRadius: 'var(--r-sm)', outline: 'none',
          }}
        />
        <button
          onClick={() => scanForAlerts()}
          disabled={loading || !scanSymbol}
          style={{
            background: loading ? 'var(--bg-elevated)' : 'var(--beige)',
            color: 'var(--bg)', border: 'none', fontFamily: 'var(--mono)',
            fontSize: '10px', letterSpacing: '0.08em', fontWeight: 600,
            padding: '8px 18px', borderRadius: 'var(--r-sm)',
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.12s',
          }}
        >
          {loading ? 'Scanning...' : '◎ Scan'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', marginBottom: '16px' }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--beige-mid)', animation: `td 1.2s ease-in-out ${d}s infinite` }} />
          ))}
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--beige-dim)' }}>
            Scanning price, volume, and news signals...
          </span>
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '36px', marginBottom: '14px', opacity: 0.35 }}>◎</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', color: 'var(--beige-dim)', fontStyle: 'italic', marginBottom: '8px' }}>No active signals</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', letterSpacing: '0.1em', color: 'var(--muted)' }}>
            Enter a stock symbol above or search from the top bar
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            {['critical', 'warning', 'info'].map(sev => {
              const count = alerts.filter(a => a.severity === sev).length;
              if (!count) return null;
              const s = severityStyle[sev];
              return (
                <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 'var(--r-sm)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: s.color, fontWeight: 700, lineHeight: 1 }}>{count}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: s.color, letterSpacing: '0.1em' }}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {alerts.map((alert, i) => {
            const s = severityStyle[alert.severity] || severityStyle.info;
            return (
              <div key={alert.id || i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 'var(--r-md)', padding: '16px 18px', animation: `fadeIn 0.3s ease ${i * 0.07}s both` }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.2 }}>{alert.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: s.color, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                        {alert.title}
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '8px', padding: '2px 7px', borderRadius: '2px', border: `1px solid ${s.border}`, color: s.color, background: 'rgba(0,0,0,0.15)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--beige-dim)', lineHeight: 1.65 }}>{alert.message}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', marginTop: '8px' }}>
                      {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '32px', padding: '14px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '10px' }}>Alert Types</div>
        {[
          { icon: '📊', label: 'Volume', desc: 'Unusual trading activity vs 3-month average' },
          { icon: '📈', label: 'Price Move', desc: 'Significant single-day price movements (>5%)' },
          { icon: '🔝', label: 'Technical', desc: '52-week high/low proximity signals' },
          { icon: '🟢', label: 'Sentiment', desc: 'AI-detected news sentiment shifts' },
          { icon: '🚨', label: 'Fraud Risk', desc: 'Potential pump-and-dump indicators' },
          { icon: '🔄', label: 'Divergence', desc: 'AI thesis vs price action conflicts' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '7px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-dim)' }}>{item.label}</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>— {item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
