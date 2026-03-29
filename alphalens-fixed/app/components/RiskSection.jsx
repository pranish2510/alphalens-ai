'use client';
// app/components/RiskSection.jsx

export default function RiskSection({ stock, thesis }) {
  if (!stock) return null;

  const riskScore = thesis?.keyMetrics?.riskScore || calcRiskScore(stock);
  const moatScore = thesis?.keyMetrics?.moatScore || 50;

  const riskColor = riskScore >= 70 ? 'var(--red)' : riskScore >= 45 ? 'var(--amber)' : 'var(--green)';
  const riskLabel = riskScore >= 70 ? 'High Risk' : riskScore >= 45 ? 'Moderate' : 'Low Risk';

  return (
    <section>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '18px' }}>
        Risk Exposure
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Risk card */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
            Risk Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '40px', color: riskColor, lineHeight: 1 }}>
              {riskScore}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: riskColor, fontWeight: 500 }}>{riskLabel}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>/100 composite</div>
            </div>
          </div>
          <RiskBar score={riskScore} />
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <RiskFactor label="Volatility (Beta)" value={stock.beta} type="beta" />
            <RiskFactor label="Volume Anomaly" value={stock.volumeRatio} type="volume" />
            <RiskFactor label="52W Position" value={stock.rangePosition} type="range" />
            {stock.pumpFlags?.length > 0 && (
              <div style={{ padding: '8px 10px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)', fontSize: '11px', color: 'var(--red)' }}>
                ⚠️ {stock.pumpFlags[0]}
              </div>
            )}
          </div>
        </div>

        {/* Moat / Quality card */}
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>
            Business Quality
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '40px', color: moatScore >= 65 ? 'var(--green)' : 'var(--amber)', lineHeight: 1 }}>
              {moatScore}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: moatScore >= 65 ? 'var(--green)' : 'var(--amber)', fontWeight: 500 }}>
                {moatScore >= 70 ? 'Wide Moat' : moatScore >= 55 ? 'Narrow Moat' : 'No Moat'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>/100 quality score</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: stock.isIndian ? 'NSE/BSE Listed' : 'Exchange Listed', rating: 'Regulated', cls: 'buy' },
              { label: 'Sector', rating: stock.sector || 'N/A', cls: 'hold' },
              { label: 'Analyst Rec', rating: thesis?.recommendation || 'HOLD', cls: thesis?.recommendation === 'BUY' ? 'buy' : thesis?.recommendation === 'SELL' ? 'sell' : 'hold' },
              { label: 'Revenue Growth', rating: stock.revenueGrowth ? `${(stock.revenueGrowth * 100).toFixed(1)}%` : 'N/A', cls: stock.revenueGrowth > 0 ? 'buy' : 'hold' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', fontSize: '12px' }}>
                <span style={{ color: 'var(--beige-mid)' }}>{item.label}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '9px', padding: '2px 7px', borderRadius: '2px',
                  ...(item.cls === 'buy' ? { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)' } :
                    item.cls === 'sell' ? { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' } :
                    { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid var(--amber)' })
                }}>
                  {item.rating}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RiskBar({ score }) {
  const segments = Array(10).fill(0).map((_, i) => {
    const threshold = (i + 1) * 10;
    return threshold <= score;
  });
  const color = score >= 70 ? 'var(--red)' : score >= 45 ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', gap: '2px', height: '5px', borderRadius: '3px', overflow: 'hidden' }}>
      {segments.map((on, i) => (
        <div key={i} style={{ flex: 1, background: on ? color : 'var(--bg-elevated)', transition: 'background 0.5s ease' }} />
      ))}
    </div>
  );
}

function RiskFactor({ label, value, type }) {
  let display = 'N/A', color = 'var(--muted)';
  if (type === 'beta' && value) {
    display = `${value.toFixed(2)}β`;
    color = value > 1.5 ? 'var(--red)' : value > 1 ? 'var(--amber)' : 'var(--green)';
  } else if (type === 'volume' && value) {
    display = `${value}x avg`;
    color = value > 2 ? 'var(--amber)' : 'var(--muted)';
  } else if (type === 'range' && value != null) {
    display = `${value}th pct`;
    color = value > 85 ? 'var(--amber)' : value < 15 ? 'var(--red)' : 'var(--muted)';
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--mono)', color }}>{display}</span>
    </div>
  );
}

function calcRiskScore(stock) {
  let score = 40;
  if (stock.beta && stock.beta > 1.5) score += 15;
  else if (stock.beta && stock.beta > 1) score += 8;
  if (stock.volumeRatio > 2) score += 12;
  if (Math.abs(stock.changePercent || 0) > 8) score += 15;
  if (stock.rangePosition > 90) score += 8;
  if (stock.rangePosition < 10) score += 10;
  if (stock.pumpFlags?.length > 1) score += 20;
  return Math.min(95, Math.max(10, score));
}
