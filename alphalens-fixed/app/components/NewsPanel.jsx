'use client';
// app/components/NewsPanel.jsx
import { useState, useEffect } from 'react';

export default function NewsPanel({ symbol, standalone }) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputSymbol, setInputSymbol] = useState(symbol || '');

  const fetchNews = async (sym) => {
    if (!sym) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/news?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      setNews(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (symbol) fetchNews(symbol); }, [symbol]);

  const sentIcon = (s) => s === 'Positive' ? '🟢' : s === 'Negative' ? '🔴' : '⚪';
  const sentColor = (s) => s === 'Positive' ? 'var(--green)' : s === 'Negative' ? 'var(--red)' : 'var(--amber)';
  const sentBg = (s) => s === 'Positive' ? 'var(--green-dim)' : s === 'Negative' ? 'var(--red-dim)' : 'var(--amber-dim)';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px 40px', borderRight: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>Sentiment Engine</div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: '26px', color: 'var(--beige)', fontStyle: 'italic', marginBottom: '20px' }}>News Feed</div>

      {standalone && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input
            value={inputSymbol}
            onChange={e => setInputSymbol(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && fetchNews(inputSymbol)}
            placeholder="Stock symbol..."
            style={{ flex: 1, maxWidth: '200px', background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--off-white)', fontFamily: 'var(--mono)', fontSize: '13px', padding: '8px 12px', borderRadius: 'var(--r-sm)', outline: 'none' }}
          />
          <button onClick={() => fetchNews(inputSymbol)} style={{ background: 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--mono)', fontSize: '10px', padding: '8px 16px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 600 }}>
            Fetch
          </button>
        </div>
      )}

      {loading && <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>Loading news...</div>}

      {news?.sentiment && (
        <div style={{ display: 'flex', gap: '14px', padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Overall Sentiment</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: sentColor(news.sentiment.overallSentiment) }}>{news.sentiment.overallSentiment}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Score</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '20px', color: 'var(--beige)' }}>{news.sentiment.sentimentScore}/100</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>Sentiment Bar</div>
            <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${news.sentiment.sentimentScore}%`, background: sentColor(news.sentiment.overallSentiment), borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      )}

      {news?.articles?.length === 0 && !loading && (
        <div style={{ padding: '20px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '12px', color: 'var(--muted)' }}>
          No recent news found. Configure FINNHUB_API_KEY or NEWS_API_KEY for live data.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(news?.articles || []).map((article, i) => (
          <a
            key={i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '16px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-soft)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ padding: '2px 8px', borderRadius: '2px', fontFamily: 'var(--mono)', fontSize: '9px', background: sentBg(article.sentiment), color: sentColor(article.sentiment), border: `1px solid ${sentColor(article.sentiment)}` }}>
                {sentIcon(article.sentiment)} {article.sentiment || 'Neutral'}
              </span>
              {article.magnitude && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)' }}>{article.magnitude} Impact</span>
              )}
              <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', marginLeft: 'auto' }}>{article.source}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--beige-mid)', lineHeight: 1.45, marginBottom: '6px' }}>{article.headline}</div>
            {article.impact && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', lineHeight: 1.5, paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                → {article.impact}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
