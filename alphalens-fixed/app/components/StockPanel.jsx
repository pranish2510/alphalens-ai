'use client';
// app/components/StockPanel.jsx
import { useEffect, useState, useRef } from 'react';
import ThesisBlock from './ThesisBlock';
import RiskSection from './RiskSection';
import StockChart from './StockChart';

export default function StockPanel({ symbol, onStockLoad, onAlertsLoad }) {
  const [stock, setStock] = useState(null);
  const [news, setNews] = useState(null);
  const [thesis, setThesis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    fetchAll(symbol);
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [symbol]);

  async function fetchAll(sym) {
    // Cancel any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setLoading(true);
    setError(null);
    setStock(null);
    setNews(null);
    setThesis(null);

    try {
      // ── Stage 1: Stock data ──────────────────────────────────────────────
      setStage('Fetching market data...');
      const stockRes = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`, { signal });
      const stockData = await stockRes.json();
      if (signal.aborted) return;
      if (!stockData.success) throw new Error(stockData.error || 'Stock not found');

      setStock(stockData.data);
      onStockLoad?.(stockData.data);

      // ── Stage 2: News ────────────────────────────────────────────────────
      setStage('Analyzing news sentiment...');
      const newsRes = await fetch(`/api/news?symbol=${encodeURIComponent(sym)}`, { signal });
      const newsData = await newsRes.json();
      if (signal.aborted) return;
      setNews(newsData);

      // ── Stage 3: AI Thesis ───────────────────────────────────────────────
      setStage('Generating AI investment thesis...');
      const thesisRes = await fetch('/api/analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: stockData.data, newsItems: newsData.articles }),
        signal,
      });
      const thesisData = await thesisRes.json();
      if (signal.aborted) return;
      setThesis(thesisData);

      // ── Stage 4: Alerts ──────────────────────────────────────────────────
      setStage('Scanning for signals...');
      const alertsRes = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: stockData.data, newsData, thesisData }),
        signal,
      });
      const alertsData = await alertsRes.json();
      if (signal.aborted) return;
      onAlertsLoad?.(alertsData.alerts || []);

    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setLoading(false);
        setStage('');
      }
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid var(--border)' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', gap: '36px' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <LoadingStage stage={stage} />
            <SkeletonBlock height={130} />
            <SkeletonBlock height={240} />
            <SkeletonBlock height={160} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: '20px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-md)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--red)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Data Error
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--beige-dim)', marginBottom: '8px' }}>{error}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>
              Try: RELIANCE · INFY · TCS · HDFCBANK (NSE) &nbsp;|&nbsp; AAPL · NVDA · MSFT · GOOGL (US)
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !stock && <EmptyState />}

        {/* Research content */}
        {stock && !loading && (
          <>
            <MarketPosition stock={stock} />
            <StockChart
              symbol={stock.displaySymbol}
              currencySymbol={stock.currencySymbol}
              isIndian={stock.isIndian}
            />
            {thesis && (
              <ThesisBlock
                thesis={thesis.thesis}
                analystConsensus={thesis.analystConsensus}
              />
            )}
            <RiskSection stock={stock} thesis={thesis?.thesis} />
            {news?.articles?.length > 0 && <NewsSection news={news} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Market Position ─────────────────────────────────────────────────────── */
function MarketPosition({ stock }) {
  const isUp = (stock.changePercent || 0) >= 0;
  const fmt = (n, dec = 2) => (n != null ? n.toFixed(dec) : 'N/A');
  const fmtVol = (n) => {
    if (!n) return 'N/A';
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    return n.toLocaleString('en-IN');
  };

  return (
    <section>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '18px' }}>
        Market Position
      </div>

      {/* Price header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'start', gap: '24px', paddingBottom: '28px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
            {stock.exchange} · {stock.sector !== 'N/A' ? stock.sector : 'Equity'}
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '34px', color: 'var(--beige)', letterSpacing: '-0.02em', lineHeight: 1.05, fontWeight: 500 }}>
            {stock.name}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '5px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>{stock.displaySymbol}</span>
            {stock.industry && stock.industry !== 'N/A' && (
              <><span style={{ color: 'var(--border-soft)' }}>|</span><span>{stock.industry}</span></>
            )}
            <span style={{ color: 'var(--border-soft)' }}>|</span>
            <span>{stock.currency}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '42px', color: 'var(--off-white)', letterSpacing: '-0.03em', lineHeight: 1, fontWeight: 400 }}>
            {stock.currencySymbol}{fmt(stock.price)}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontFamily: 'var(--mono)', fontSize: '11.5px', color: isUp ? 'var(--green)' : 'var(--red)' }}>
            <span>{isUp ? '↑' : '↓'} {stock.currencySymbol}{Math.abs(stock.change || 0).toFixed(2)}</span>
            <span style={{
              padding: '2px 8px', borderRadius: '2px', fontSize: '10px',
              background: isUp ? 'var(--green-dim)' : 'var(--red-dim)',
              border: `1px solid ${isUp ? 'var(--green)' : 'var(--red)'}`,
              color: isUp ? 'var(--green)' : 'var(--red)',
            }}>
              {isUp ? '+' : ''}{fmt(stock.changePercent)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pump/dump warning banner */}
      {stock.pumpFlags?.length >= 2 && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)', marginTop: '16px' }}>
          <span style={{ color: 'var(--red)', fontSize: '13px', flexShrink: 0 }}>⚑</span>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--red)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Risk Alert</div>
            <div style={{ fontSize: '12px', color: 'var(--red)', lineHeight: 1.55 }}>
              {stock.pumpFlags.join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* Key metrics row */}
      <div style={{ display: 'flex', gap: '0', marginTop: '22px', paddingTop: '22px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { label: '52W High', value: `${stock.currencySymbol}${fmt(stock.week52High)}` },
          { label: '52W Low', value: `${stock.currencySymbol}${fmt(stock.week52Low)}` },
          { label: 'Volume', value: fmtVol(stock.volume), sub: stock.volumeRatio > 1.5 ? `${stock.volumeRatio}x avg ⚡` : `${stock.volumeRatio}x avg`, subAlert: stock.volumeRatio > 2 },
          { label: 'P/E Ratio', value: stock.peRatio ? fmt(stock.peRatio) : 'N/A' },
          { label: 'Market Cap', value: stock.marketCap ? `${stock.currencySymbol}${(stock.marketCap / 1e9).toFixed(1)}B` : 'N/A' },
          { label: 'Beta', value: stock.beta ? fmt(stock.beta) : 'N/A' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '28px', minWidth: '90px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>{item.label}</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '18px', color: 'var(--beige)', lineHeight: 1 }}>{item.value}</span>
            {item.sub && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: item.subAlert ? 'var(--amber)' : 'var(--muted)' }}>{item.sub}</span>
            )}
          </div>
        ))}

        {/* 52W range bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '28px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>52W Range</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div style={{ width: '100px', height: '3px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, height: '100%', width: `${stock.rangePosition || 50}%`, background: 'var(--beige-mid)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--beige-dim)' }}>{stock.rangePosition}%</span>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)' }}>
            {stock.rangePosition >= 80 ? 'Near high' : stock.rangePosition <= 20 ? 'Near low' : 'Mid-range'}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── News Section ────────────────────────────────────────────────────────── */
function NewsSection({ news }) {
  const sentColor = (s) => s === 'Positive' ? 'var(--green)' : s === 'Negative' ? 'var(--red)' : 'var(--amber)';
  const sentBg   = (s) => s === 'Positive' ? 'var(--green-dim)' : s === 'Negative' ? 'var(--red-dim)' : 'var(--amber-dim)';
  const sentIcon = (s) => s === 'Positive' ? '🟢' : s === 'Negative' ? '🔴' : '⚪';

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          News & Sentiment
        </div>
        {news.sentiment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)' }}>Overall:</span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '9px', padding: '2px 8px', borderRadius: '2px',
              background: sentBg(news.sentiment.overallSentiment),
              color: sentColor(news.sentiment.overallSentiment),
              border: `1px solid ${sentColor(news.sentiment.overallSentiment)}`,
            }}>
              {sentIcon(news.sentiment.overallSentiment)} {news.sentiment.overallSentiment} · {news.sentiment.sentimentScore}/100
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {news.articles.slice(0, 6).map((article, i) => (
          <a
            key={i}
            href={article.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '14px', display: 'flex',
              flexDirection: 'column', gap: '8px', textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                padding: '2px 7px', borderRadius: '2px', fontSize: '9px', fontFamily: 'var(--mono)',
                background: sentBg(article.sentiment), color: sentColor(article.sentiment),
                border: `1px solid ${sentColor(article.sentiment)}`,
              }}>
                {sentIcon(article.sentiment)} {article.sentiment || 'Neutral'}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', marginLeft: 'auto' }}>
                {article.source}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--beige-mid)', lineHeight: 1.4 }}>
              {(article.headline || '').slice(0, 85)}{(article.headline || '').length > 85 ? '…' : ''}
            </div>
            {article.impact && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--muted)', lineHeight: 1.5, paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                → {article.impact}
              </div>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

/* ─── Loading & Skeleton ──────────────────────────────────────────────────── */
function LoadingStage({ stage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[0, 0.2, 0.4].map((d, i) => (
          <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--beige-mid)', animation: `td 1.2s ease-in-out ${d}s infinite` }} />
        ))}
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--beige-dim)', letterSpacing: '0.05em' }}>{stage}</span>
    </div>
  );
}

function SkeletonBlock({ height }) {
  return (
    <div className="skeleton" style={{ height, borderRadius: 'var(--r-md)', opacity: 0.4 }} />
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '65vh', gap: '16px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '64px', color: 'var(--beige-ghost)', fontStyle: 'italic', lineHeight: 1 }}>α</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '22px', color: 'var(--beige-dim)', fontStyle: 'italic' }}>Search any stock to begin</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em', lineHeight: 2 }}>
        NSE: RELIANCE · INFY · HDFCBANK · TCS · TATAMOTORS · ZOMATO<br />
        US:&nbsp;&nbsp; AAPL · NVDA · MSFT · GOOGL · TSLA · META
      </div>
      <div style={{ marginTop: '8px', fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--beige-ghost)', letterSpacing: '0.15em' }}>
        PRESS <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '2px' }}>/</span> TO FOCUS SEARCH
      </div>
    </div>
  );
}
