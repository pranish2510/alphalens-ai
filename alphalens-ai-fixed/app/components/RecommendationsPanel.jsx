'use client';
// app/components/RecommendationsPanel.jsx
import { useState } from 'react';

export default function RecommendationsPanel() {
  const [form, setForm] = useState({ riskTolerance: 'medium', budget: '', goal: 'growth', preferIndian: true, preferUS: false });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!form.budget) { setError('Please enter your investment budget'); return; }
    setLoading(true); setError(null); setResults(null);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', gap: '28px', borderRight: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
          Hyper-Personalized
        </div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '28px', color: 'var(--beige)', fontStyle: 'italic' }}>
          Stock Picks for You
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--beige-dim)', marginTop: '6px' }}>
          Tell us your profile. We'll generate 4–5 tailored recommendations with allocation strategy.
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '580px' }}>
        {/* Risk */}
        <FormGroup label="Risk Tolerance">
          <div style={{ display: 'flex', gap: '8px' }}>
            {['low', 'medium', 'high'].map(r => (
              <ToggleBtn key={r} active={form.riskTolerance === r} onClick={() => setForm(f => ({ ...f, riskTolerance: r }))}>
                {r === 'low' ? '🛡️ Low' : r === 'medium' ? '⚖️ Medium' : '🚀 High'}
              </ToggleBtn>
            ))}
          </div>
        </FormGroup>

        {/* Budget */}
        <FormGroup label="Investment Budget (₹)">
          <input
            value={form.budget}
            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
            placeholder="e.g. 50000"
            type="number"
            style={{
              width: '100%', maxWidth: '200px', background: 'var(--bg-surface)',
              border: '1px solid var(--border-soft)', color: 'var(--off-white)',
              fontFamily: 'var(--mono)', fontSize: '13px', padding: '9px 12px',
              borderRadius: 'var(--r-sm)', outline: 'none',
            }}
          />
        </FormGroup>

        {/* Goal */}
        <FormGroup label="Investment Goal">
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'growth', label: '📈 Growth' },
              { id: 'income', label: '💰 Income' },
              { id: 'swing', label: '⚡ Swing Trade' },
            ].map(g => (
              <ToggleBtn key={g.id} active={form.goal === g.id} onClick={() => setForm(f => ({ ...f, goal: g.id }))}>
                {g.label}
              </ToggleBtn>
            ))}
          </div>
        </FormGroup>

        {/* Market */}
        <FormGroup label="Market Preference">
          <div style={{ display: 'flex', gap: '8px' }}>
            <ToggleBtn active={form.preferIndian} onClick={() => setForm(f => ({ ...f, preferIndian: !f.preferIndian }))}>
              🇮🇳 India (NSE/BSE)
            </ToggleBtn>
            <ToggleBtn active={form.preferUS} onClick={() => setForm(f => ({ ...f, preferUS: !f.preferUS }))}>
              🇺🇸 US Stocks
            </ToggleBtn>
          </div>
        </FormGroup>

        {error && <div style={{ padding: '10px 12px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)', fontSize: '12px', color: 'var(--red)' }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? 'var(--bg-elevated)' : 'var(--beige)', color: 'var(--bg)',
            border: 'none', fontFamily: 'var(--sans)', fontSize: '13px', fontWeight: 600,
            padding: '11px 24px', borderRadius: 'var(--r-sm)', cursor: loading ? 'not-allowed' : 'pointer',
            width: 'fit-content', transition: 'background 0.12s',
          }}
        >
          {loading ? 'Generating Picks...' : '✦ Generate My Picks'}
        </button>
      </div>

      {/* Results */}
      {results && <RecommendationsResults data={results} />}
    </div>
  );
}

function RecommendationsResults({ data }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', borderLeft: '2px solid var(--beige-mid)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Portfolio Strategy</div>
        <div style={{ fontSize: '12.5px', color: 'var(--beige-mid)', lineHeight: 1.65 }}>{data.portfolioStrategy}</div>
      </div>

      {(data.recommendations || []).map((rec, i) => {
        const riskColor = rec.riskLevel === 'Low' ? 'var(--green)' : rec.riskLevel === 'High' ? 'var(--red)' : 'var(--amber)';
        return (
          <div key={i} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px', animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--beige)', letterSpacing: '0.05em' }}>{rec.ticker}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--beige-mid)', marginTop: '2px' }}>{rec.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)', marginTop: '3px' }}>{rec.exchange} · {rec.timeHorizon}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '28px', color: 'var(--beige)', lineHeight: 1 }}>{rec.allocation}%</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: riskColor }}>{rec.riskLevel} Risk</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--beige-dim)', lineHeight: 1.65, marginBottom: '12px' }}>{rec.rationale}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'Entry', value: rec.entryRange },
                { label: 'Target', value: rec.targetPrice },
                { label: 'Stop Loss', value: rec.stopLoss },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--beige-mid)' }}>{item.value || 'N/A'}</div>
                </div>
              ))}
            </div>
            {rec.catalyst && (
              <div style={{ marginTop: '10px', fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--muted)' }}>
                ◆ Catalyst: <span style={{ color: 'var(--beige-dim)' }}>{rec.catalyst}</span>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ padding: '10px 14px', background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: 'var(--r-sm)', fontSize: '11px', color: 'var(--amber)' }}>
        ⚠️ {data.riskWarning}
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--bg-elevated)' : 'transparent',
        border: `1px solid ${active ? 'var(--beige-dim)' : 'var(--border-soft)'}`,
        color: active ? 'var(--beige)' : 'var(--beige-dim)',
        fontFamily: 'var(--sans)', fontSize: '12px', padding: '7px 14px',
        borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}
