'use client';
// app/components/ChatPanel.jsx
import { useState, useRef, useEffect } from 'react';

const QUICK_CHIPS = [
  'Should I buy this stock?',
  'What are the key risks?',
  'Analyze the fundamentals',
  'Compare to sector',
  'Entry price recommendation',
];

export default function ChatPanel({ stockContext }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: null,
      parsed: {
        short: 'Welcome to AlphaLens AI. Search a stock above and I\'ll provide real-time analysis, risk assessment, and trade recommendations.',
        context: ['I analyze NSE, BSE, NYSE, and NASDAQ stocks', 'My insights combine real market data with AI reasoning'],
        signals: [],
        risks: [],
        action: 'Search for a stock to get started.',
        confidence: 95,
      },
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const history = useRef([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || busy) return;
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    // Add typing indicator
    setMessages(prev => [...prev, { role: 'ai', content: null, typing: true, timestamp: new Date().toISOString() }]);

    try {
      history.current.push({ role: 'user', content: text });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          stockContext: stockContext || null,
          history: history.current.slice(-6),
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      history.current.push({ role: 'assistant', content: data.raw });

      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        { role: 'ai', content: data.raw, parsed: data.parsed, timestamp: data.timestamp },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.typing),
        {
          role: 'ai',
          content: null,
          parsed: {
            short: err.message?.includes('GEMINI_API_KEY') || err.message?.includes('NO_KEY') || err.message?.includes('not configured')
              ? 'Gemini API key not set. Get your free key at aistudio.google.com/app/apikey'
              : `AI error: ${err.message}`,
            context: ['Open app/lib/config.js and paste your GEMINI_API_KEY', 'Get a free key at aistudio.google.com/app/apikey — no credit card needed'],
            signals: [], risks: [],
            action: 'Add your Gemini key to config.js, save and restart the dev server.',
            confidence: 0,
          },
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Stock context banner */}
      {stockContext && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 16px',
          background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Context:</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '2px', border: '1px solid var(--border-soft)' }}>
            {stockContext.displaySymbol}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)' }}>
            {stockContext.currencySymbol}{stockContext.price?.toFixed(2)}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: (stockContext.changePercent || 0) >= 0 ? 'var(--green)' : 'var(--red)', marginLeft: '2px' }}>
            {(stockContext.changePercent || 0) >= 0 ? '+' : ''}{stockContext.changePercent?.toFixed(2)}%
          </span>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-raised)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={stockContext ? `Ask about ${stockContext.displaySymbol}...` : 'Ask anything about markets...'}
            rows={1}
            style={{
              flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-soft)',
              borderRadius: 'var(--r-sm)', color: 'var(--off-white)', fontFamily: 'var(--sans)',
              fontSize: '12.5px', padding: '9px 12px', resize: 'none', outline: 'none',
              maxHeight: '80px', minHeight: '36px', lineHeight: 1.5, caretColor: 'var(--beige)',
            }}
            disabled={busy}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={busy || !input.trim()}
            style={{
              width: '36px', height: '36px', background: busy ? 'var(--bg-elevated)' : 'var(--beige)',
              border: 'none', borderRadius: 'var(--r-sm)', color: 'var(--bg)',
              cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0, transition: 'background 0.12s',
            }}
          >
            {busy ? '…' : '↑'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
          {QUICK_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => sendMessage(chip)}
              disabled={busy}
              style={{
                fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--muted)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                padding: '3px 8px', borderRadius: '2px', cursor: 'pointer',
                transition: 'color 0.12s, border-color 0.12s', letterSpacing: '0.04em',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--beige-dim)'; e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const time = new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (msg.typing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', animation: 'fadeIn 0.3s ease' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>AlphaLens</span>
        <div style={{ padding: '13px 15px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--muted)', animation: `td 1.2s ease-in-out ${delay}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', animation: 'fadeIn 0.3s ease' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>You</span>
        <div style={{ padding: '13px 15px', background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-sm)', fontSize: '12.5px', color: 'var(--beige-mid)', lineHeight: 1.65 }}>
          {msg.content}
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)' }}>{time}</span>
      </div>
    );
  }

  // AI message with parsed structure
  const p = msg.parsed;
  if (!p) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', animation: 'fadeIn 0.3s ease' }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>AlphaLens</span>
      <div style={{ padding: '13px 15px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: '12.5px', color: 'var(--beige-dim)', lineHeight: 1.65 }}>
        <div className="ai-short">{p.short}</div>
        {p.context?.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-head">Market Context</div>
            <ul className="ai-bullets">{p.context.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        )}
        {p.signals?.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-head">Key Signals</div>
            <ul className="ai-bullets">{p.signals.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
        {p.risks?.length > 0 && (
          <div className="ai-section">
            <div className="ai-section-head">Risks</div>
            <ul className="ai-bullets">{p.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
        {p.action && <div className="ai-action">→ {p.action}</div>}
        {p.confidence > 0 && (
          <div className="ai-confidence">
            <span className="conf-label">Confidence</span>
            <div className="conf-bar"><div className="conf-fill" style={{ width: `${p.confidence}%` }} /></div>
            <span className="conf-pct">{p.confidence}%</span>
          </div>
        )}
      </div>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)' }}>{time}</span>
    </div>
  );
}
