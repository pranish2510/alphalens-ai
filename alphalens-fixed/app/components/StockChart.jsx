'use client';
// app/components/StockChart.jsx
// SVG price chart — no external chart libraries required
import { useState, useEffect, useRef } from 'react';

const RANGES = [
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y',  interval: '1wk' },
];

export default function StockChart({ symbol, currencySymbol = '$', isIndian = false }) {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRange, setActiveRange] = useState(1); // 3M default
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    loadChart(RANGES[activeRange]);
  }, [symbol, activeRange]);

  async function loadChart({ range, interval }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Chart fetch failed');
      setCandles(data.candles || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Build SVG path from candles
  const W = 600, H = 160, PAD = { top: 12, right: 12, bottom: 28, left: 52 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  let chartContent = null;

  if (candles.length > 1) {
    const prices = candles.map(c => c.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const xScale = (i) => (i / (candles.length - 1)) * innerW;
    const yScale = (p) => innerH - ((p - minP) / range) * innerH;

    // Line path
    const pathD = candles.map((c, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(c.close).toFixed(1)}`
    ).join(' ');

    // Area fill path
    const areaD = pathD + ` L${innerW.toFixed(1)},${innerH} L0,${innerH} Z`;

    const isPositive = candles[candles.length - 1].close >= candles[0].close;
    const lineColor = isPositive ? 'var(--green)' : 'var(--red)';
    const gradId = `grad-${symbol}`;

    // Y-axis labels
    const yTicks = 4;
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
      const val = minP + (range * i) / yTicks;
      const y = yScale(val);
      return { val, y };
    });

    // X-axis labels (pick ~4 evenly spaced dates)
    const xStep = Math.floor(candles.length / 4);
    const xLabels = [0, xStep, xStep * 2, xStep * 3, candles.length - 1]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .map(i => ({ i, date: candles[i].date.slice(5) })); // MM-DD

    chartContent = (
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
          </linearGradient>
          <clipPath id={`clip-${symbol}`}>
            <rect x="0" y="0" width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {yLabels.map(({ y }, i) => (
          <line key={i} x1="0" y1={y.toFixed(1)} x2={innerW} y2={y.toFixed(1)}
            stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,4" />
        ))}

        {/* Area fill */}
        <path d={areaD} fill={`url(#${gradId})`} clipPath={`url(#clip-${symbol})`} />

        {/* Price line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5"
          clipPath={`url(#clip-${symbol})`} />

        {/* Y labels */}
        {yLabels.map(({ val, y }, i) => (
          <text key={i} x="-6" y={y.toFixed(1)} textAnchor="end"
            style={{ fontSize: '8px', fill: 'var(--muted)', fontFamily: 'var(--mono)' }}
            dominantBaseline="middle">
            {currencySymbol}{val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(val >= 100 ? 0 : 1)}
          </text>
        ))}

        {/* X labels */}
        {xLabels.map(({ i, date }) => (
          <text key={i} x={xScale(i).toFixed(1)} y={innerH + 14} textAnchor="middle"
            style={{ fontSize: '8px', fill: 'var(--muted)', fontFamily: 'var(--mono)' }}>
            {date}
          </text>
        ))}

        {/* Tooltip overlay */}
        <rect x="0" y="0" width={innerW} height={innerH} fill="transparent"
          onMouseMove={(e) => {
            const rect = e.currentTarget.closest('svg').getBoundingClientRect();
            const x = e.clientX - rect.left - PAD.left;
            const idx = Math.round((x / innerW) * (candles.length - 1));
            const clamped = Math.max(0, Math.min(candles.length - 1, idx));
            const c = candles[clamped];
            setTooltip({ x: xScale(clamped), y: yScale(c.close), c });
          }}
          onMouseLeave={() => setTooltip(null)}
        />

        {/* Tooltip */}
        {tooltip && (() => {
          const c = tooltip.c;
          const isUp = c.close >= c.open;
          const bx = Math.min(tooltip.x, innerW - 100);
          const by = Math.max(0, tooltip.y - 56);
          return (
            <g>
              <line x1={tooltip.x.toFixed(1)} y1="0" x2={tooltip.x.toFixed(1)} y2={innerH}
                stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={tooltip.x.toFixed(1)} cy={tooltip.y.toFixed(1)} r="3"
                fill={isUp ? 'var(--green)' : 'var(--red)'} />
              <rect x={bx} y={by} width="98" height="50" rx="3"
                fill="var(--bg-raised)" stroke="var(--border)" strokeWidth="0.5" />
              <text x={bx + 6} y={by + 12}
                style={{ fontSize: '8.5px', fill: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                {c.date}
              </text>
              <text x={bx + 6} y={by + 26}
                style={{ fontSize: '11px', fill: 'var(--beige)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                {currencySymbol}{c.close?.toFixed(2)}
              </text>
              <text x={bx + 6} y={by + 40}
                style={{ fontSize: '8.5px', fill: isUp ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' }}>
                H:{currencySymbol}{c.high?.toFixed(2)}  L:{currencySymbol}{c.low?.toFixed(2)}
              </text>
            </g>
          );
        })()}
      </g>
    );
  }

  return (
    <section>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Price Chart
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setActiveRange(i)}
              style={{
                fontFamily: 'var(--mono)', fontSize: '9px', padding: '3px 9px',
                borderRadius: '2px', border: '1px solid',
                cursor: 'pointer', transition: 'all 0.12s',
                borderColor: activeRange === i ? 'var(--beige-mid)' : 'var(--border)',
                background: activeRange === i ? 'var(--bg-elevated)' : 'transparent',
                color: activeRange === i ? 'var(--beige)' : 'var(--muted)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{
        background: 'var(--bg-raised)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', overflow: 'hidden',
        position: 'relative', minHeight: '190px',
      }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>Loading chart…</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--red)' }}>Chart unavailable</span>
          </div>
        )}
        {!loading && !error && candles.length > 1 && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
          >
            {chartContent}
          </svg>
        )}
      </div>
    </section>
  );
}
