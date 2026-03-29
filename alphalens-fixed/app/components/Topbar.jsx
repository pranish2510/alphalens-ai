'use client';
// app/components/Topbar.jsx
import { useState, useRef, useEffect, useCallback } from 'react';

export default function Topbar({ onSearch, onOpenRecommendations, currentSymbol }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim()) {
      debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    } else {
      setSuggestions([]);
    }
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  const handleSelect = (symbol) => {
    setQuery(symbol);
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch(symbol);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelect(query.trim().toUpperCase());
    }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const QUICK_SEARCHES = ['RELIANCE', 'INFY', 'HDFCBANK', 'TCS', 'NVDA', 'AAPL'];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '13px 28px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-raised)', flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: '440px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '12px', pointerEvents: 'none' }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => { query && setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search stocks — NSE, BSE, NYSE, NASDAQ..."
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-soft)',
            color: 'var(--off-white)',
            fontFamily: 'var(--sans)',
            fontSize: '12.5px',
            padding: '8.5px 38px 8.5px 30px',
            borderRadius: 'var(--r-sm)',
            outline: 'none',
            caretColor: 'var(--beige)',
            transition: 'border-color 0.15s',
          }}
        />
        <span style={{
          position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)',
          fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          padding: '2px 6px', borderRadius: '2px',
        }}>/</span>

        {/* Autocomplete dropdown */}
        {showSuggestions && (suggestions.length > 0 || loading) && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)',
            borderRadius: 'var(--r-md)', zIndex: 100, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {loading && (
              <div style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)' }}>
                Searching...
              </div>
            )}
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={() => handleSelect(s.symbol)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '9px 12px', background: 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--beige)', minWidth: '80px' }}>{s.symbol}</span>
                <span style={{ fontSize: '12px', color: 'var(--beige-dim)', flex: 1 }}>{s.name}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)',
                  background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '2px',
                }}>{s.exchange}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick searches */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {QUICK_SEARCHES.map(s => (
          <button
            key={s}
            onClick={() => handleSelect(s)}
            style={{
              background: s === currentSymbol ? 'var(--bg-elevated)' : 'transparent',
              border: '1px solid var(--border-soft)',
              color: s === currentSymbol ? 'var(--beige)' : 'var(--muted)',
              fontFamily: 'var(--mono)',
              fontSize: '9.5px', letterSpacing: '0.05em',
              padding: '5px 10px', borderRadius: 'var(--r-sm)',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { if (s !== currentSymbol) { e.currentTarget.style.color = 'var(--beige-dim)'; e.currentTarget.style.background = 'var(--bg-surface)'; } }}
            onMouseLeave={e => { if (s !== currentSymbol) { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; } }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        <button
          onClick={onOpenRecommendations}
          style={{
            background: 'var(--beige)', color: 'var(--bg)',
            border: '1px solid var(--beige)', fontFamily: 'var(--mono)',
            fontSize: '9.5px', letterSpacing: '0.07em', fontWeight: 600,
            padding: '7px 13px', borderRadius: 'var(--r-sm)', cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--off-white)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--beige)'}
        >
          ✦ Get Picks
        </button>
      </div>
    </div>
  );
}
