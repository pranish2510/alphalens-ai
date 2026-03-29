'use client';
// app/components/LandingPage.jsx
import { useState } from 'react';

export default function LandingPage({ onEnter }) {
  const [hovered, setHovered] = useState(null);

  const FEATURES = [
    { icon: '◈', title: 'AI Investment Thesis', desc: 'Deep research reports generated in seconds. Opportunities, risks, catalysts — all synthesized by AI trained on institutional research.' },
    { icon: '⊞', title: 'Portfolio Analyser', desc: 'Upload your holdings or build one manually. Get a quality score, diversification grade, and actionable rebalancing suggestions.' },
    { icon: '✦', title: 'Personalised Picks', desc: 'Tell us your risk appetite, budget, and goal. We generate 4–5 conviction picks with entry, target, and stop-loss levels.' },
    { icon: '⚑', title: 'Scam & Risk Scanner', desc: 'Detects pump-and-dump patterns, volume anomalies, and hype spikes before you lose money.' },
    { icon: '≡', title: 'News Sentiment Engine', desc: 'Every headline tagged Positive / Negative / Neutral with an AI explanation of price impact.' },
    { icon: '⇄', title: 'Stock Comparator', desc: 'Side-by-side comparison of any two stocks. Analyst forecasts, fundamentals, and a clear buy recommendation.' },
  ];

  const STATS = [
    { value: '50K+', label: 'Stocks Covered' },
    { value: '< 3s', label: 'AI Analysis Time' },
    { value: '15+', label: 'Data Points Per Stock' },
    { value: '24/7', label: 'Market Monitoring' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 50, backdropFilter: 'blur(8px)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontStyle: 'italic', color: 'var(--beige)', letterSpacing: '-0.01em' }}>
          AlphaLens <span style={{ fontStyle: 'normal', color: 'var(--beige-mid)', fontSize: '16px' }}>AI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Institutional Research Terminal
          </span>
          <button
            onClick={onEnter}
            style={{ background: 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', padding: '9px 20px', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}
          >
            Sign In →
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 60px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--amber)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '24px', height: '1px', background: 'var(--amber)', display: 'inline-block' }} />
          AI-Powered Equity Research
        </div>

        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(42px, 6vw, 80px)', color: 'var(--off-white)', lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 400, marginBottom: '28px', maxWidth: '800px' }}>
          Research smarter.<br />
          <span style={{ color: 'var(--beige-mid)', fontStyle: 'italic' }}>Invest with conviction.</span>
        </h1>

        <p style={{ fontFamily: 'var(--sans)', fontSize: '16px', color: 'var(--beige-dim)', lineHeight: 1.8, maxWidth: '560px', fontWeight: 300, marginBottom: '44px' }}>
          AlphaLens AI is an institutional-grade research terminal that combines real-time market data, AI investment thesis generation, and personalized stock recommendations — built for Indian and US equity markets.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onEnter}
            style={{ background: 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, padding: '14px 32px', borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--off-white)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--beige)'}
          >
            Start Researching Free →
          </button>
          <button
            onClick={onEnter}
            style={{ background: 'transparent', color: 'var(--beige-dim)', border: '1px solid var(--border-soft)', fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.08em', padding: '14px 24px', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}
          >
            Use Demo Account
          </button>
        </div>

        {/* Demo credentials pill */}
        <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Demo login:</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-mid)' }}>demo@alphalens.ai</span>
          <span style={{ color: 'var(--border-soft)' }}>·</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-mid)' }}>Alpha@2025</span>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section style={{ padding: '0 60px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-raised)', padding: '28px 24px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', color: 'var(--beige)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section style={{ padding: '0 60px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '40px' }}>
          What's inside
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ background: hovered === i ? 'var(--bg-elevated)' : 'var(--bg-raised)', padding: '28px 26px', transition: 'background 0.15s', cursor: 'default' }}
            >
              <div style={{ fontSize: '20px', marginBottom: '14px', color: 'var(--beige-mid)' }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '17px', color: 'var(--beige)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: '12.5px', color: 'var(--beige-dim)', lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Markets ───────────────────────────────────────────────── */}
      <section style={{ padding: '0 60px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { flag: '🇮🇳', market: 'NSE / BSE', desc: 'RELIANCE · TCS · INFY · HDFCBANK · TATAMOTORS · ZOMATO and 5,000+ Indian equities', color: 'var(--amber)' },
            { flag: '🇺🇸', market: 'NYSE / NASDAQ', desc: 'AAPL · NVDA · MSFT · META · GOOGL · TSLA and all major US stocks via Finnhub', color: 'var(--blue)' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '28px' }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{m.flag}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--beige)', marginBottom: '8px' }}>{m.market}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', lineHeight: 1.7 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: '60px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-lg)', padding: '60px 40px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '36px', color: 'var(--beige)', fontStyle: 'italic', marginBottom: '12px' }}>
            Ready to see the market clearly?
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--beige-dim)', marginBottom: '28px' }}>
            No credit card needed. Use the demo account to explore every feature.
          </div>
          <button
            onClick={onEnter}
            style={{ background: 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--sans)', fontSize: '14px', fontWeight: 600, padding: '14px 40px', borderRadius: 'var(--r-sm)', cursor: 'pointer' }}
          >
            Launch AlphaLens AI →
          </button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '16px', fontStyle: 'italic', color: 'var(--beige-dim)' }}>AlphaLens AI</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
          For informational purposes only. Not financial advice.
        </div>
      </footer>
    </div>
  );
}
