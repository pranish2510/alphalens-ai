'use client';
// app/components/PortfolioTab.jsx — Full manual portfolio manager
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'alphalens_portfolio';
function loadPortfolio() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function savePortfolio(h) { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); }

export default function PortfolioTab() {
  const [holdings, setHoldings] = useState([]);
  const [liveData, setLiveData] = useState({});
  const [rating, setRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [addForm, setAddForm] = useState({ symbol: '', buyPrice: '', qty: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editVals, setEditVals] = useState({});
  const [fetchingLive, setFetchingLive] = useState(false);

  useEffect(() => { setHoldings(loadPortfolio()); }, []);

  useEffect(() => {
    if (holdings.length > 0) fetchLivePrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings.length]);

  async function fetchLivePrices() {
    setFetchingLive(true);
    const results = {};
    await Promise.allSettled(holdings.map(async (h) => {
      try {
        const res = await fetch(`/api/stock?symbol=${encodeURIComponent(h.symbol)}`);
        const data = await res.json();
        if (data.success) results[h.symbol] = data.data;
      } catch {}
    }));
    setLiveData(results);
    setFetchingLive(false);
  }

  async function addHolding() {
    const sym = addForm.symbol.trim().toUpperCase();
    const price = parseFloat(addForm.buyPrice);
    const qty = parseFloat(addForm.qty);
    if (!sym) { setAddError('Enter a symbol'); return; }
    if (!price || price <= 0) { setAddError('Enter a valid buy price'); return; }
    if (!qty || qty <= 0) { setAddError('Enter a valid quantity'); return; }
    if (holdings.find(h => h.symbol === sym)) { setAddError(`${sym} already in portfolio`); return; }
    setAddLoading(true); setAddError('');
    try {
      const res = await fetch(`/api/stock?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json();
      if (!data.success) { setAddError(data.error || 'Symbol not found'); return; }
      const newH = { id: Date.now(), symbol: sym, name: data.data.name, buyPrice: price, qty, addedAt: new Date().toISOString(), currencySymbol: data.data.currencySymbol, exchange: data.data.exchange };
      const updated = [...holdings, newH];
      setHoldings(updated); savePortfolio(updated);
      setLiveData(prev => ({ ...prev, [sym]: data.data }));
      setAddForm({ symbol: '', buyPrice: '', qty: '' }); setRating(null);
    } catch (err) { setAddError(err.message); }
    finally { setAddLoading(false); }
  }

  function removeHolding(id) {
    const updated = holdings.filter(h => h.id !== id);
    setHoldings(updated); savePortfolio(updated); setRating(null);
  }

  function startEdit(h) { setEditingId(h.id); setEditVals({ buyPrice: h.buyPrice, qty: h.qty }); }

  function saveEdit(id) {
    const updated = holdings.map(h => h.id === id ? { ...h, buyPrice: parseFloat(editVals.buyPrice) || h.buyPrice, qty: parseFloat(editVals.qty) || h.qty } : h);
    setHoldings(updated); savePortfolio(updated); setEditingId(null); setRating(null);
  }

  async function ratePortfolio() {
    if (holdings.length === 0) return;
    setRatingLoading(true); setRating(null);
    const holdingsWithData = holdings.map(h => {
      const live = liveData[h.symbol];
      const currentPrice = live?.price || h.buyPrice;
      const pnlPct = ((currentPrice - h.buyPrice) / h.buyPrice) * 100;
      return { symbol: h.symbol, name: h.name, exchange: h.exchange, buyPrice: h.buyPrice, currentPrice, qty: h.qty, pnlPct: pnlPct.toFixed(2), value: (currentPrice * h.qty).toFixed(2), sector: live?.sector || 'N/A', currencySymbol: h.currencySymbol };
    });
    try {
      const res = await fetch('/api/portfolio-rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ holdings: holdingsWithData }) });
      const data = await res.json();
      setRating(data);
    } catch (err) { setRating({ error: err.message }); }
    finally { setRatingLoading(false); }
  }

  const totalInvested = holdings.reduce((s, h) => s + h.buyPrice * h.qty, 0);
  const totalCurrent = holdings.reduce((s, h) => s + (liveData[h.symbol]?.price || h.buyPrice) * h.qty, 0);
  const totalPnL = totalCurrent - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPnLUp = totalPnL >= 0;

  const inp = (style = {}) => ({ background: 'var(--bg-surface)', border: '1px solid var(--border-soft)', color: 'var(--off-white)', fontFamily: 'var(--mono)', fontSize: '12px', padding: '7px 8px', borderRadius: 'var(--r-sm)', outline: 'none', ...style });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '8.5px', color: 'var(--muted)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>My Portfolio</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button onClick={fetchLivePrices} disabled={fetchingLive || holdings.length === 0} style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '2px', cursor: 'pointer' }}>
            {fetchingLive ? '…' : '↻'}
          </button>
          <button onClick={ratePortfolio} disabled={ratingLoading || holdings.length === 0} style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--beige)', background: 'var(--bg-elevated)', border: '1px solid var(--beige-ghost)', padding: '3px 10px', borderRadius: '2px', cursor: 'pointer' }}>
            {ratingLoading ? 'Rating…' : '✦ Rate /10'}
          </button>
        </div>
      </div>

      {/* P&L Summary */}
      {holdings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {[
            { label: 'Invested', value: `₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
            { label: 'Current', value: `₹${totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
            { label: 'P&L', value: `${isPnLUp ? '+' : ''}${totalPnLPct.toFixed(2)}%`, color: isPnLUp ? 'var(--green)' : 'var(--red)' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '10.5px', color: item.color || 'var(--beige)', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Rating */}
      {rating && !rating.error && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)', borderRadius: 'var(--r-md)', padding: '14px', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '7.5px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>AI Rating</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '36px', color: rating.score >= 7 ? 'var(--green)' : rating.score >= 5 ? 'var(--amber)' : 'var(--red)', lineHeight: 1 }}>{rating.score}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--muted)' }}>/10</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden', marginBottom: '5px' }}>
                <div style={{ height: '100%', width: `${rating.score * 10}%`, background: rating.score >= 7 ? 'var(--green)' : rating.score >= 5 ? 'var(--amber)' : 'var(--red)', transition: 'width 1s ease' }} />
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: rating.score >= 7 ? 'var(--green)' : rating.score >= 5 ? 'var(--amber)' : 'var(--red)' }}>{rating.grade}</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--beige-dim)', lineHeight: 1.65, marginBottom: '8px' }}>{rating.summary}</div>
          {rating.suggestions?.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
              <span style={{ color: 'var(--beige-ghost)', flexShrink: 0 }}>→</span>{s}
            </div>
          ))}
        </div>
      )}
      {rating?.error && <div style={{ padding: '10px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)', fontSize: '11.5px', color: 'var(--red)' }}>{rating.error}</div>}

      {/* Holdings */}
      {holdings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '7.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Holdings ({holdings.length})</div>
          {holdings.map(h => {
            const live = liveData[h.symbol];
            const currentPrice = live?.price || null;
            const pnl = currentPrice ? ((currentPrice - h.buyPrice) / h.buyPrice * 100) : null;
            const isEditing = editingId === h.id;
            const isUp = pnl !== null && pnl >= 0;
            return (
              <div key={h.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--beige)', fontWeight: 600 }}>{h.symbol}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '7.5px', color: 'var(--muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '2px' }}>{h.exchange}</span>
                      {pnl !== null && <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: isUp ? 'var(--green)' : 'var(--red)', marginLeft: 'auto' }}>{isUp ? '+' : ''}{pnl.toFixed(2)}%</span>}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)', marginBottom: '6px' }}>{h.name?.slice(0, 28)}</div>

                    {!isEditing && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {[
                          { label: 'Bought', val: `${h.currencySymbol}${h.buyPrice}` },
                          { label: 'Qty', val: h.qty },
                          currentPrice && { label: 'Live', val: `${h.currencySymbol}${currentPrice.toFixed(2)}` },
                          currentPrice && { label: 'Value', val: `${h.currencySymbol}${(currentPrice * h.qty).toFixed(0)}` },
                        ].filter(Boolean).map((m, i) => (
                          <div key={i}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1px' }}>{m.label}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--beige-dim)' }}>{m.val}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEditing && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', marginTop: '6px' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Buy Price</div>
                          <input value={editVals.buyPrice} onChange={e => setEditVals(v => ({ ...v, buyPrice: e.target.value }))} style={{ ...inp(), width: '80px', fontSize: '11px', padding: '5px 7px' }} />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Qty</div>
                          <input value={editVals.qty} onChange={e => setEditVals(v => ({ ...v, qty: e.target.value }))} style={{ ...inp(), width: '55px', fontSize: '11px', padding: '5px 7px' }} />
                        </div>
                        <button onClick={() => saveEdit(h.id)} style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--bg)', background: 'var(--beige)', border: 'none', padding: '5px 10px', borderRadius: '2px', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', background: 'transparent', border: '1px solid var(--border)', padding: '5px 8px', borderRadius: '2px', cursor: 'pointer' }}>✕</button>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                      <button onClick={() => startEdit(h)} style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 7px', borderRadius: '2px', cursor: 'pointer' }}>✎</button>
                      <button onClick={() => removeHolding(h.id)} style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid var(--red)', padding: '3px 7px', borderRadius: '2px', cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add stock form */}
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '7.5px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>+ Add Holding</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Symbol</div>
            <input value={addForm.symbol} onChange={e => { setAddForm(f => ({ ...f, symbol: e.target.value.toUpperCase() })); setAddError(''); }} onKeyDown={e => e.key === 'Enter' && addHolding()} placeholder="AAPL" style={{ ...inp(), width: '72px' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Buy Price</div>
            <input value={addForm.buyPrice} onChange={e => { setAddForm(f => ({ ...f, buyPrice: e.target.value })); setAddError(''); }} placeholder="248.50" type="number" style={{ ...inp(), width: '85px' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Qty</div>
            <input value={addForm.qty} onChange={e => { setAddForm(f => ({ ...f, qty: e.target.value })); setAddError(''); }} placeholder="10" type="number" style={{ ...inp(), width: '52px' }} />
          </div>
          <button onClick={addHolding} disabled={addLoading} style={{ background: addLoading ? 'var(--bg-elevated)' : 'var(--beige)', color: 'var(--bg)', border: 'none', fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, padding: '7px 12px', borderRadius: 'var(--r-sm)', cursor: addLoading ? 'not-allowed' : 'pointer' }}>
            {addLoading ? '…' : '+Add'}
          </button>
        </div>
        {addError && <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--red)' }}>{addError}</div>}
      </div>

      {holdings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.35 }}>⊞</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.08em' }}>Add holdings to track your portfolio</div>
        </div>
      )}
    </div>
  );
}
