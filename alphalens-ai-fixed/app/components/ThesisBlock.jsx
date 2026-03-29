'use client';
// app/components/ThesisBlock.jsx

export default function ThesisBlock({ thesis, analystConsensus }) {
  if (!thesis) return null;

  const recColor = {
    BUY: 'var(--green)', HOLD: 'var(--amber)', SELL: 'var(--red)',
    AVOID: 'var(--red)', STRONG_BUY: 'var(--green)',
  }[thesis.recommendation] || 'var(--beige-mid)';

  const recBg = {
    BUY: 'var(--green-dim)', HOLD: 'var(--amber-dim)', SELL: 'var(--red-dim)',
    AVOID: 'var(--red-dim)', STRONG_BUY: 'var(--green-dim)',
  }[thesis.recommendation] || 'var(--bg-elevated)';

  const sentimentColor = thesis.sentiment === 'Bullish' ? 'var(--green)' : thesis.sentiment === 'Bearish' ? 'var(--red)' : 'var(--amber)';

  // Analyst bar percentages
  const totalAnalysts = analystConsensus
    ? (analystConsensus.strongBuy || 0) + (analystConsensus.buy || 0) + (analystConsensus.hold || 0) + (analystConsensus.sell || 0) + (analystConsensus.strongSell || 0)
    : 0;

  return (
    <section>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '18px' }}>
        AI Investment Thesis
      </div>

      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '26px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--beige)', fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              Investment Analysis
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: sentimentColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '4px' }}>
              {thesis.sentiment} · {thesis.timeHorizon}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <span style={{
              padding: '4px 12px', borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.08em', background: recBg, color: recColor,
              border: `1px solid ${recColor}`,
            }}>
              {thesis.recommendation}
            </span>
            {thesis.targetPrice && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)' }}>
                Target: {thesis.targetPrice}
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        <div style={{ fontFamily: 'var(--sans)', fontSize: '13px', color: 'var(--beige-mid)', lineHeight: 1.85, fontWeight: 300, marginBottom: '24px', paddingBottom: '22px', borderBottom: '1px solid var(--border)' }}>
          {thesis.summary}
        </div>

        {/* Opportunities + Risks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Opportunities
            </div>
            {(thesis.opportunities || []).map((point, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '11px', alignItems: 'flex-start' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: '7px' }} />
                <span style={{ fontSize: '12px', color: 'var(--beige-dim)', lineHeight: 1.6 }}>{point}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Key Risks
            </div>
            {(thesis.risks || []).map((risk, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '11px', alignItems: 'flex-start' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: '7px' }} />
                <span style={{ fontSize: '12px', color: 'var(--beige-dim)', lineHeight: 1.6 }}>{risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics radar */}
        {thesis.keyMetrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            {Object.entries(thesis.keyMetrics).map(([key, val]) => {
              const label = { moatScore: 'Moat', growthScore: 'Growth', riskScore: 'Risk', valuationScore: 'Valuation' }[key] || key;
              const color = val >= 70 ? 'var(--green)' : val >= 50 ? 'var(--beige-mid)' : 'var(--red)';
              return (
                <div key={key}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', color, lineHeight: 1 }}>{val}</div>
                  <div style={{ marginTop: '5px', height: '2px', background: 'var(--bg-elevated)', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${val}%`, background: color, transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Analyst Consensus */}
        {analystConsensus && totalAnalysts > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Analyst Consensus</span>
              <span style={{ color: analystConsensus.source === 'AI Generated' ? 'var(--amber)' : 'var(--green)' }}>
                {analystConsensus.source} · {totalAnalysts} analysts
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              {[
                { key: 'strongBuy', color: '#4a9f55' },
                { key: 'buy', color: 'var(--green)' },
                { key: 'hold', color: 'var(--amber)' },
                { key: 'sell', color: 'var(--red)' },
                { key: 'strongSell', color: '#7a2020' },
              ].map(({ key, color }) => {
                const pct = totalAnalysts > 0 ? ((analystConsensus[key] || 0) / totalAnalysts) * 100 : 0;
                return pct > 0 ? <div key={key} style={{ flex: `0 0 ${pct}%`, background: color }} /> : null;
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '10px', fontFamily: 'var(--mono)' }}>
              <span style={{ color: 'var(--green)' }}>Buy: {(analystConsensus.strongBuy || 0) + (analystConsensus.buy || 0)}</span>
              <span style={{ color: 'var(--amber)' }}>Hold: {analystConsensus.hold || 0}</span>
              <span style={{ color: 'var(--red)' }}>Sell: {(analystConsensus.sell || 0) + (analystConsensus.strongSell || 0)}</span>
            </div>
          </div>
        )}

        {/* Catalysts */}
        {thesis.catalysts?.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Key Catalysts</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {thesis.catalysts.map((c, i) => (
                <span key={i} style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-dim)', background: 'var(--bg-elevated)', padding: '3px 10px', borderRadius: '2px', border: '1px solid var(--border-soft)' }}>
                  ◆ {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
